// components/IntegratedLoginPage.js - 整合的登入頁面
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  ActivityIndicator
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { authService } from '../firebase';

export default function IntegratedLoginPage({ onLogin, onBack, onNavigateToSignUp, onNavigateToForgotPassword, getText }) {
  // 主要狀態管理
  const [loginMethod, setLoginMethod] = useState('email'); // 'email' 或 'phone'
  const [isLoading, setIsLoading] = useState(false);
  
  // 電子郵件登入相關狀態
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  
  // 電話登入相關狀態
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showOTPInput, setShowOTPInput] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [canResend, setCanResend] = useState(true);
  
  // 引用管理
  const passwordInputRef = useRef(null);
  const phoneInputRef = useRef(null);
  const otpInputRef = useRef(null);

  // 倒計時效果
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // 處理鍵盤收回功能
  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  // 切換登入方式
  const switchLoginMethod = (method) => {
    setLoginMethod(method);
    // 重置所有狀態
    setEmail('');
    setPassword('');
    setPhoneNumber('');
    setVerificationCode('');
    setShowOTPInput(false);
    setConfirmationResult(null);
    setIsPasswordVisible(false);
  };

  // 格式化電話號碼顯示（香港格式）
  const formatPhoneDisplay = (text) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 4) {
      return cleaned.slice(0, 4) + ' ' + cleaned.slice(4, 8);
    }
    return cleaned;
  };

  // 處理電話號碼輸入
  const handlePhoneNumberChange = (text) => {
    const formatted = formatPhoneDisplay(text);
    if (formatted.replace(/\s/g, '').length <= 8) {
      setPhoneNumber(formatted);
    }
  };

  // 🔥 改進的驗證碼輸入處理 - 解決刪除問題
  const handleVerificationCodeChange = (text) => {
    // 允許完全自由的編輯，包括刪除
    const numericText = text.replace(/[^0-9]/g, '');
    if (numericText.length <= 6) {
      setVerificationCode(numericText);
    }
  };

  // 🔥 處理電子郵件登入
  const handleEmailLogin = async () => {
    // 驗證輸入
    if (!email.trim()) {
      Alert.alert('輸入錯誤', '請輸入您的電子郵件地址');
      return;
    }

    if (!password.trim()) {
      Alert.alert('輸入錯誤', '請輸入您的密碼');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('格式錯誤', '請輸入有效的電子郵件地址');
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await authService.signInWithEmail(email, password);
      
      if (result.success) {
        const userData = {
          email: result.user.email,
          name: result.userData.username || email.split('@')[0],
          uid: result.user.uid,
          loginMethod: 'email',
          isLoggedIn: true,
          emailVerified: true
        };
        
        if (onLogin && typeof onLogin === 'function') {
          onLogin(userData);
        }
      } else if (result.needsVerification) {
        Alert.alert(
          '需要驗證',
          result.error,
          [
            {
              text: '重新發送驗證郵件',
              onPress: async () => {
                const resendResult = await authService.resendVerificationEmail();
                if (resendResult.success) {
                  Alert.alert('成功', '驗證郵件已重新發送，請檢查您的郵箱');
                }
              }
            },
            { text: '確定', style: 'cancel' }
          ]
        );
      } else {
        Alert.alert('登入錯誤', result.error || '登入失敗，請檢查您的電子郵件和密碼');
      }
    } catch (error) {
      console.error('Email登入錯誤:', error);
      Alert.alert('登入錯誤', '登入過程中發生錯誤，請稍後再試');
    } finally {
      setIsLoading(false);
    }
  };

  // 🔥 處理發送電話驗證碼
  const handleSendPhoneCode = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert('輸入錯誤', '請輸入您的手機號碼');
      return;
    }

    const validation = authService.validateHongKongPhoneNumber(phoneNumber);
    if (!validation.isValid) {
      Alert.alert('格式錯誤', validation.error);
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await authService.sendPhoneVerificationCode(validation.formattedNumber);
      
      if (result.success) {
        setConfirmationResult(result.confirmationResult);
        setShowOTPInput(true);
        setResendCooldown(60);
        setCanResend(false);
        
        if (result.isMock) {
          Alert.alert(
            '開發模式提示',
            `模擬驗證碼已"發送"至 ${result.phoneNumber}\n\n🧪 開發模式說明：\n• 您可以使用任何6位數字作為驗證碼\n• 例如：123456、888888等\n• 這僅在開發環境中有效`
          );
        } else {
          Alert.alert('驗證碼已發送', `SMS驗證碼已發送至 ${result.phoneNumber}\n請檢查您的手機短信`);
        }
        
        // 自動聚焦到驗證碼輸入框
        setTimeout(() => {
          otpInputRef.current?.focus();
        }, 500);
      } else {
        Alert.alert('發送失敗', result.error || '無法發送驗證碼，請稍後再試');
      }
    } catch (error) {
      console.error('發送驗證碼錯誤:', error);
      Alert.alert('發送失敗', '發送驗證碼時發生錯誤，請檢查網絡連接後重試');
    } finally {
      setIsLoading(false);
    }
  };

  // 🔥 處理電話驗證碼確認
  const handleVerifyPhoneCode = async () => {
    if (!verificationCode.trim()) {
      Alert.alert('輸入錯誤', '請輸入6位數驗證碼');
      return;
    }

    if (verificationCode.length !== 6) {
      Alert.alert('格式錯誤', '驗證碼必須是6位數字');
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await authService.verifyPhoneCode(confirmationResult, verificationCode, null);
      
      if (result.success) {
        const userData = {
          email: result.userData.email || null,
          name: result.userData.username || `用戶${phoneNumber.slice(-4)}`,
          uid: result.user.uid,
          phoneNumber: result.user.phoneNumber,
          loginMethod: 'phone',
          isLoggedIn: true,
          phoneVerified: true,
          emailVerified: result.userData.emailVerified || false
        };
        
        Alert.alert(
          '登入成功',
          `歡迎回來，${userData.name}！`,
          [
            {
              text: '開始使用',
              onPress: () => {
                if (onLogin && typeof onLogin === 'function') {
                  onLogin(userData);
                }
              }
            }
          ]
        );
      } else {
        Alert.alert('驗證失敗', result.error || '驗證碼錯誤，請檢查後重新輸入');
      }
    } catch (error) {
      console.error('驗證碼確認錯誤:', error);
      Alert.alert('驗證失敗', '驗證過程中發生錯誤，請稍後再試');
    } finally {
      setIsLoading(false);
    }
  };

  // 🔥 處理重新發送驗證碼
  const handleResendCode = async () => {
    if (!canResend) return;
    
    const validation = authService.validateHongKongPhoneNumber(phoneNumber);
    if (!validation.isValid) return;

    setIsLoading(true);
    
    try {
      const result = await authService.sendPhoneVerificationCode(validation.formattedNumber);
      
      if (result.success) {
        setConfirmationResult(result.confirmationResult);
        setVerificationCode('');
        setResendCooldown(60);
        setCanResend(false);
        
        Alert.alert('重新發送成功', '新的驗證碼已發送到您的手機，請查收');
      } else {
        Alert.alert('發送失敗', result.error || '無法重新發送驗證碼，請稍後再試');
      }
    } catch (error) {
      console.error('重新發送驗證碼錯誤:', error);
      Alert.alert('發送失敗', '重新發送驗證碼時發生錯誤，請稍後再試');
    } finally {
      setIsLoading(false);
    }
  };

  // 處理返回按鈕
  const handleBackPress = () => {
    if (onBack && typeof onBack === 'function') {
      onBack();
    }
  };

  // 處理註冊跳轉
  const handleSignUpNavigation = () => {
    if (onNavigateToSignUp && typeof onNavigateToSignUp === 'function') {
      onNavigateToSignUp();
    }
  };

  // 處理忘記密碼
  const handleForgotPasswordNavigation = () => {
    if (onNavigateToForgotPassword && typeof onNavigateToForgotPassword === 'function') {
      onNavigateToForgotPassword();
    }
  };

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* 返回按鈕 */}
            <TouchableOpacity 
              style={styles.backButton}
              onPress={handleBackPress}
              activeOpacity={0.7}
            >
              <MaterialIcons name="arrow-back" size={24} color="#666666" />
            </TouchableOpacity>

            {/* 插圖和標題區域 */}
            <View style={styles.headerSection}>
              <Image
                source={require('../assets/login_illustration.png')}
                style={styles.illustration}
                resizeMode="contain"
              />
              <Text style={styles.appTitle}>CardReminder</Text>
              <Text style={styles.welcomeText}>歡迎回來！請選擇登入方式</Text>
            </View>

            {/* 🔥 登入方式選擇按鈕 */}
            <View style={styles.methodSelection}>
              <TouchableOpacity
                style={[
                  styles.methodButton,
                  loginMethod === 'email' && styles.methodButtonActive
                ]}
                onPress={() => switchLoginMethod('email')}
                activeOpacity={0.8}
              >
                <MaterialIcons 
                  name="email" 
                  size={20} 
                  color={loginMethod === 'email' ? '#FFFFFF' : '#4A90E2'} 
                />
                <Text 
                  style={[
                    styles.methodButtonText,
                    loginMethod === 'email' && styles.methodButtonTextActive
                  ]}
                >
                  使用電子郵件登入
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.methodButton,
                  loginMethod === 'phone' && styles.methodButtonActive
                ]}
                onPress={() => switchLoginMethod('phone')}
                activeOpacity={0.8}
              >
                <MaterialIcons 
                  name="phone-android" 
                  size={20} 
                  color={loginMethod === 'phone' ? '#FFFFFF' : '#4A90E2'} 
                />
                <Text 
                  style={[
                    styles.methodButtonText,
                    loginMethod === 'phone' && styles.methodButtonTextActive
                  ]}
                >
                  使用手機號碼登入
                </Text>
              </TouchableOpacity>
            </View>

            {/* 🔥 動態輸入區域 */}
            <View style={styles.inputSection}>
              {loginMethod === 'email' ? (
                // 電子郵件登入表單
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>電子郵件</Text>
                    <TextInput
                      style={[styles.textInput, { letterSpacing: 0 }]} // 🔥 修復字距問題
                      placeholder="輸入您的電子郵件"
                      placeholderTextColor="#999999"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      returnKeyType="next"
                      onSubmitEditing={() => passwordInputRef.current?.focus()}
                      editable={!isLoading}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>密碼</Text>
                    <View style={styles.passwordContainer}>
                      <TextInput
                        ref={passwordInputRef}
                        style={[styles.passwordInput, { letterSpacing: 0 }]} // 🔥 修復字距問題
                        placeholder="輸入您的密碼"
                        placeholderTextColor="#999999"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!isPasswordVisible}
                        returnKeyType="done"
                        onSubmitEditing={handleEmailLogin}
                        editable={!isLoading}
                      />
                      <TouchableOpacity
                        style={styles.passwordToggle}
                        onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                        activeOpacity={0.7}
                      >
                        <MaterialIcons 
                          name={isPasswordVisible ? 'visibility' : 'visibility-off'} 
                          size={20} 
                          color="#999999" 
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* 忘記密碼連結 */}
                  <View style={styles.forgotPasswordSection}>
                    <TouchableOpacity onPress={handleForgotPasswordNavigation}>
                      <Text style={styles.forgotPasswordText}>忘記密碼？</Text>
                    </TouchableOpacity>
                  </View>

                  {/* 電子郵件登入按鈕 */}
                  <TouchableOpacity
                    style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                    onPress={handleEmailLogin}
                    disabled={isLoading}
                    activeOpacity={0.8}
                  >
                    {isLoading ? (
                      <View style={styles.loginButtonContent}>
                        <ActivityIndicator size="small" color="#FFFFFF" />
                        <Text style={styles.loginButtonText}>登入中...</Text>
                      </View>
                    ) : (
                      <View style={styles.loginButtonContent}>
                        <MaterialIcons name="login" size={20} color="#FFFFFF" />
                        <Text style={styles.loginButtonText}>登入</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                // 電話登入表單
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>手機號碼</Text>
                    <View style={styles.phoneContainer}>
                      <View style={styles.countryCodeContainer}>
                        <Text style={styles.countryCode}>🇭🇰 +852</Text>
                      </View>
                      <TextInput
                        ref={phoneInputRef}
                        style={[styles.phoneInput, { letterSpacing: 0 }]} // 🔥 修復字距問題
                        placeholder="9123 4567"
                        placeholderTextColor="#999999"
                        value={phoneNumber}
                        onChangeText={handlePhoneNumberChange}
                        keyboardType="phone-pad"
                        returnKeyType="done"
                        onSubmitEditing={handleSendPhoneCode}
                        editable={!isLoading}
                      />
                    </View>
                    <Text style={styles.phoneHint}>我們將發送驗證碼到這個號碼</Text>
                  </View>

                  {/* 發送驗證碼按鈕 */}
                  {!showOTPInput && (
                    <TouchableOpacity
                      style={[styles.sendCodeButton, isLoading && styles.sendCodeButtonDisabled]}
                      onPress={handleSendPhoneCode}
                      disabled={isLoading}
                      activeOpacity={0.8}
                    >
                      {isLoading ? (
                        <View style={styles.sendCodeButtonContent}>
                          <ActivityIndicator size="small" color="#FFFFFF" />
                          <Text style={styles.sendCodeButtonText}>發送中...</Text>
                        </View>
                      ) : (
                        <View style={styles.sendCodeButtonContent}>
                          <MaterialIcons name="sms" size={20} color="#FFFFFF" />
                          <Text style={styles.sendCodeButtonText}>發送驗證碼</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  )}

                  {/* 🔥 驗證碼輸入區域 - 在同一頁面中顯示 */}
                  {showOTPInput && (
                    <>
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>驗證碼</Text>
                        <TextInput
                          ref={otpInputRef}
                          style={[styles.otpInput, { letterSpacing: 4 }]} // 🔥 只有驗證碼需要字距
                          placeholder="000000"
                          placeholderTextColor="#CCCCCC"
                          value={verificationCode}
                          onChangeText={handleVerificationCodeChange} // 🔥 使用改進的處理函數
                          keyboardType="number-pad"
                          textAlign="center"
                          maxLength={6}
                          returnKeyType="done"
                          onSubmitEditing={handleVerifyPhoneCode}
                          editable={!isLoading}
                          autoFocus={true}
                        />
                        <Text style={styles.otpHint}>請輸入收到的6位數驗證碼</Text>
                      </View>

                      {/* 重新發送區域 */}
                      <View style={styles.resendSection}>
                        <Text style={styles.resendText}>沒有收到驗證碼？</Text>
                        <TouchableOpacity
                          style={[styles.resendButton, !canResend && styles.resendButtonDisabled]}
                          onPress={handleResendCode}
                          disabled={!canResend || isLoading}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.resendButtonText, !canResend && styles.resendButtonTextDisabled]}>
                            {canResend ? '重新發送' : `${resendCooldown}秒後可重新發送`}
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {/* 驗證按鈕 */}
                      <TouchableOpacity
                        style={[
                          styles.verifyButton, 
                          isLoading && styles.verifyButtonDisabled,
                          verificationCode.length === 6 && styles.verifyButtonActive
                        ]}
                        onPress={handleVerifyPhoneCode}
                        disabled={isLoading || verificationCode.length !== 6}
                        activeOpacity={0.8}
                      >
                        {isLoading ? (
                          <View style={styles.verifyButtonContent}>
                            <ActivityIndicator size="small" color="#FFFFFF" />
                            <Text style={styles.verifyButtonText}>驗證中...</Text>
                          </View>
                        ) : (
                          <View style={styles.verifyButtonContent}>
                            <MaterialIcons name="verified-user" size={20} color="#FFFFFF" />
                            <Text style={styles.verifyButtonText}>確認驗證碼</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    </>
                  )}
                </>
              )}
            </View>

            {/* 註冊連結 */}
            <View style={styles.signUpSection}>
              <Text style={styles.signUpText}>
                還沒有帳戶？{' '}
                <Text style={styles.signUpLink} onPress={handleSignUpNavigation}>
                  立即註冊
                </Text>
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  illustration: {
    width: 240,
    height: 160,
    marginBottom: 16,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  methodSelection: {
    flexDirection: 'row',
    marginBottom: 24,
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    padding: 4,
  },
  methodButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  methodButtonActive: {
    backgroundColor: '#4A90E2',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  methodButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#4A90E2',
  },
  methodButtonTextActive: {
    color: '#FFFFFF',
  },
  inputSection: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#2C3E50',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#2C3E50',
  },
  passwordToggle: {
    padding: 16,
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  countryCodeContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRightWidth: 1,
    borderRightColor: '#E0E0E0',
  },
  countryCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#2C3E50',
  },
  phoneHint: {
    fontSize: 12,
    color: '#999999',
    marginTop: 4,
    marginLeft: 4,
  },
  otpInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 20,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    borderWidth: 2,
    borderColor: '#4A90E2',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  otpHint: {
    fontSize: 12,
    color: '#999999',
    marginTop: 8,
    textAlign: 'center',
  },
  forgotPasswordSection: {
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#4A90E2',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  loginButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  loginButtonDisabled: {
    backgroundColor: '#999999',
    elevation: 1,
  },
  loginButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  sendCodeButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  sendCodeButtonDisabled: {
    backgroundColor: '#999999',
    elevation: 1,
  },
  sendCodeButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendCodeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  resendSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  resendText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  resendButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  resendButtonDisabled: {
    opacity: 0.5,
  },
  resendButtonText: {
    fontSize: 14,
    color: '#4A90E2',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  resendButtonTextDisabled: {
    color: '#999999',
    textDecorationLine: 'none',
  },
  verifyButton: {
    backgroundColor: '#999999',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  verifyButtonActive: {
    backgroundColor: '#4A90E2',
    elevation: 3,
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  verifyButtonDisabled: {
    backgroundColor: '#CCCCCC',
    elevation: 1,
  },
  verifyButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  signUpSection: {
    alignItems: 'center',
    marginTop: 16,
  },
  signUpText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  signUpLink: {
    color: '#4A90E2',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});