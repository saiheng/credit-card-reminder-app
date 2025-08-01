// components/IntegratedSignUpPage.js - 整合的註冊頁面
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

export default function IntegratedSignUpPage({ onSignUp, onBack, onNavigateToLogin, onNavigateToTerms, onNavigateToPrivacy, getText }) {
  // 主要狀態管理
  const [signUpMethod, setSignUpMethod] = useState('email'); // 'email' 或 'phone'
  const [isLoading, setIsLoading] = useState(false);
  
  // 電子郵件註冊相關狀態
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  
  // 電話註冊相關狀態
  const [phoneUsername, setPhoneUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showOTPInput, setShowOTPInput] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [canResend, setCanResend] = useState(true);
  
  // 引用管理
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const confirmPasswordInputRef = useRef(null);
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

  // 切換註冊方式
  const switchSignUpMethod = (method) => {
    setSignUpMethod(method);
    // 重置所有狀態
    setUsername('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setPhoneUsername('');
    setPhoneNumber('');
    setVerificationCode('');
    setShowOTPInput(false);
    setConfirmationResult(null);
    setIsPasswordVisible(false);
    setIsConfirmPasswordVisible(false);
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

  // 驗證電子郵件註冊輸入
  const validateEmailSignUp = () => {
    if (!username.trim()) {
      Alert.alert('輸入錯誤', '請輸入您的用戶名');
      return false;
    }

    if (username.trim().length < 3) {
      Alert.alert('格式錯誤', '用戶名至少需要 3 個字符');
      return false;
    }

    if (!email.trim()) {
      Alert.alert('輸入錯誤', '請輸入您的電子郵件地址');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('格式錯誤', '請輸入有效的電子郵件地址');
      return false;
    }

    if (!password.trim()) {
      Alert.alert('輸入錯誤', '請輸入您的密碼');
      return false;
    }

    if (password.length < 6) {
      Alert.alert('密碼太短', '密碼至少需要 6 個字符');
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert('密碼不匹配', '兩次輸入的密碼不一致，請重新確認');
      return false;
    }

    return true;
  };

  // 🔥 處理電子郵件註冊
  const handleEmailSignUp = async () => {
    if (!validateEmailSignUp()) {
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await authService.registerWithEmail(email, password, username);
      
      if (result.success) {
        Alert.alert(
          '📧 註冊成功！請驗證您的郵件',
          `我們已將驗證郵件發送至：${email}\n\n重要提醒：\n✅ 檢查「收件箱」\n✅ 檢查「垃圾郵件」文件夾\n✅ 檢查「促銷」文件夾\n✅ 搜尋「CardReminder」\n\n💡 小貼士：將 noreply@credit-card-manager-barry.firebaseapp.com 加入聯絡人，避免未來郵件被過濾。`,
          [
            {
              text: '我沒收到郵件',
              onPress: async () => {
                const resendResult = await authService.resendVerificationEmail();
                if (resendResult.success) {
                  Alert.alert('已重新發送', '驗證郵件已重新發送，請再次檢查郵箱');
                } else {
                  Alert.alert('發送失敗', '請稍後再試或聯繫支援');
                }
              }
            },
            {
              text: '好的，我去檢查',
              onPress: () => {
                if (onNavigateToLogin && typeof onNavigateToLogin === 'function') {
                  onNavigateToLogin();
                }
              }
            }
          ]
        );
      } else {
        Alert.alert('註冊失敗', result.error || '註冊過程中發生錯誤');
      }
    } catch (error) {
      console.error('Email註冊錯誤:', error);
      Alert.alert('註冊錯誤', '註冊過程中發生錯誤，請稍後再試');
    } finally {
      setIsLoading(false);
    }
  };

  // 🔥 處理發送電話驗證碼
  const handleSendPhoneCode = async () => {
    if (!phoneUsername.trim()) {
      Alert.alert('輸入錯誤', '請輸入您的用戶名');
      return;
    }

    if (phoneUsername.trim().length < 2) {
      Alert.alert('格式錯誤', '用戶名至少需要 2 個字符');
      return;
    }

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
      // 準備用戶資料
      const userData = {
        username: phoneUsername.trim(),
        phoneNumber: phoneNumber
      };

      const result = await authService.verifyPhoneCode(confirmationResult, verificationCode, userData);
      
      if (result.success) {
        const finalUserData = {
          email: result.userData.email || null,
          name: result.userData.username || phoneUsername.trim(),
          uid: result.user.uid,
          phoneNumber: result.user.phoneNumber,
          loginMethod: 'phone',
          isLoggedIn: true,
          phoneVerified: true,
          emailVerified: result.userData.emailVerified || false
        };
        
        Alert.alert(
          '註冊成功',
          `🎉 歡迎加入CardReminder，${finalUserData.name}！`,
          [
            {
              text: '開始使用',
              onPress: () => {
                if (onSignUp && typeof onSignUp === 'function') {
                  onSignUp(finalUserData);
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

  // 處理登入跳轉
  const handleLoginNavigation = () => {
    if (onNavigateToLogin && typeof onNavigateToLogin === 'function') {
      onNavigateToLogin();
    }
  };

  // 處理服務條款
  const handleTermsNavigation = () => {
    if (onNavigateToTerms && typeof onNavigateToTerms === 'function') {
      onNavigateToTerms();
    }
  };

  // 處理隱私政策
  const handlePrivacyNavigation = () => {
    if (onNavigateToPrivacy && typeof onNavigateToPrivacy === 'function') {
      onNavigateToPrivacy();
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
                source={require('../assets/signup_illustration.png')}
                style={styles.illustration}
                resizeMode="contain"
              />
              <Text style={styles.appTitle}>CardReminder</Text>
              <Text style={styles.welcomeText}>加入我們！請選擇註冊方式</Text>
            </View>

            {/* 🔥 註冊方式選擇按鈕 */}
            <View style={styles.methodSelection}>
              <TouchableOpacity
                style={[
                  styles.methodButton,
                  signUpMethod === 'email' && styles.methodButtonActive
                ]}
                onPress={() => switchSignUpMethod('email')}
                activeOpacity={0.8}
              >
                <MaterialIcons 
                  name="email" 
                  size={20} 
                  color={signUpMethod === 'email' ? '#FFFFFF' : '#4A90E2'} 
                />
                <Text 
                  style={[
                    styles.methodButtonText,
                    signUpMethod === 'email' && styles.methodButtonTextActive
                  ]}
                >
                  使用電子郵件註冊
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.methodButton,
                  signUpMethod === 'phone' && styles.methodButtonActive
                ]}
                onPress={() => switchSignUpMethod('phone')}
                activeOpacity={0.8}
              >
                <MaterialIcons 
                  name="phone-android" 
                  size={20} 
                  color={signUpMethod === 'phone' ? '#FFFFFF' : '#4A90E2'} 
                />
                <Text 
                  style={[
                    styles.methodButtonText,
                    signUpMethod === 'phone' && styles.methodButtonTextActive
                  ]}
                >
                  使用手機號碼註冊
                </Text>
              </TouchableOpacity>
            </View>

            {/* 🔥 動態輸入區域 */}
            <View style={styles.inputSection}>
              {signUpMethod === 'email' ? (
                // 電子郵件註冊表單
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>用戶名</Text>
                    <TextInput
                      style={[styles.textInput, { letterSpacing: 0 }]} // 🔥 修復字距問題
                      placeholder="輸入您的用戶名"
                      placeholderTextColor="#999999"
                      value={username}
                      onChangeText={setUsername}
                      autoCapitalize="none"
                      autoCorrect={false}
                      returnKeyType="next"
                      onSubmitEditing={() => emailInputRef.current?.focus()}
                      editable={!isLoading}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>電子郵件</Text>
                    <TextInput
                      ref={emailInputRef}
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
                        returnKeyType="next"
                        onSubmitEditing={() => confirmPasswordInputRef.current?.focus()}
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

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>確認密碼</Text>
                    <View style={styles.passwordContainer}>
                      <TextInput
                        ref={confirmPasswordInputRef}
                        style={[styles.passwordInput, { letterSpacing: 0 }]} // 🔥 修復字距問題
                        placeholder="再次輸入您的密碼"
                        placeholderTextColor="#999999"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry={!isConfirmPasswordVisible}
                        returnKeyType="done"
                        onSubmitEditing={handleEmailSignUp}
                        editable={!isLoading}
                      />
                      <TouchableOpacity
                        style={styles.passwordToggle}
                        onPress={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
                        activeOpacity={0.7}
                      >
                        <MaterialIcons 
                          name={isConfirmPasswordVisible ? 'visibility' : 'visibility-off'} 
                          size={20} 
                          color="#999999" 
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* 電子郵件註冊按鈕 */}
                  <TouchableOpacity
                    style={[styles.signUpButton, isLoading && styles.signUpButtonDisabled]}
                    onPress={handleEmailSignUp}
                    disabled={isLoading}
                    activeOpacity={0.8}
                  >
                    {isLoading ? (
                      <View style={styles.signUpButtonContent}>
                        <ActivityIndicator size="small" color="#FFFFFF" />
                        <Text style={styles.signUpButtonText}>註冊中...</Text>
                      </View>
                    ) : (
                      <View style={styles.signUpButtonContent}>
                        <MaterialIcons name="person-add" size={20} color="#FFFFFF" />
                        <Text style={styles.signUpButtonText}>創建帳戶</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                // 電話註冊表單
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>用戶名</Text>
                    <TextInput
                      style={[styles.textInput, { letterSpacing: 0 }]} // 🔥 修復字距問題
                      placeholder="輸入您的用戶名"
                      placeholderTextColor="#999999"
                      value={phoneUsername}
                      onChangeText={setPhoneUsername}
                      autoCapitalize="none"
                      autoCorrect={false}
                      returnKeyType="next"
                      onSubmitEditing={() => phoneInputRef.current?.focus()}
                      editable={!isLoading}
                    />
                  </View>

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

            {/* 登入連結 */}
            <View style={styles.loginSection}>
              <Text style={styles.loginText}>
                已經有帳戶了？{' '}
                <Text style={styles.loginLink} onPress={handleLoginNavigation}>
                  立即登入
                </Text>
              </Text>
            </View>

            {/* 使用條款 */}
            <View style={styles.termsSection}>
              <Text style={styles.termsText}>
                創建帳戶即表示您同意我們的{' '}
                <Text style={styles.termsLink} onPress={handleTermsNavigation}>
                  服務條款
                </Text>
                {' '}和{' '}
                <Text style={styles.termsLink} onPress={handlePrivacyNavigation}>
                  隱私政策
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
  signUpButton: {
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
  signUpButtonDisabled: {
    backgroundColor: '#999999',
    elevation: 1,
  },
  signUpButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signUpButtonText: {
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
  loginSection: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  loginText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  loginLink: {
    color: '#4A90E2',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  termsSection: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  termsText: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: '#4A90E2',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});