// components/IntegratedLoginPage.js - 整合的登入頁面（新增語言切換功能和完整國際化支援）
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
  ActivityIndicator,
  Modal
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { authService } from '../firebase';

export default function IntegratedLoginPage({ 
  onLogin, 
  onBack, 
  onNavigateToSignUp, 
  onNavigateToForgotPassword, 
  getText,
  currentLanguage = 'en',
  onLanguageChange
}) {
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
  
  // 🔥 新增：語言切換相關狀態
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  
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

  // 🔥 新增：語言切換處理函數
  const handleLanguageSelect = (languageCode) => {
    if (onLanguageChange && typeof onLanguageChange === 'function') {
      onLanguageChange(languageCode);
    }
    setShowLanguageModal(false);
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

  // 🔥 改進的電話號碼輸入處理 - 支援自由編輯和刪除
const handlePhoneNumberChange = (text) => {
  // 移除所有非數字字符
  const cleanedText = text.replace(/\D/g, '');
  
  // 限制最大長度為8位數字
  if (cleanedText.length <= 8) {
    // 格式化顯示：前4位 + 空格 + 後4位
    let formattedText = cleanedText;
    if (cleanedText.length > 4) {
      formattedText = cleanedText.slice(0, 4) + ' ' + cleanedText.slice(4);
    }
    
    setPhoneNumber(formattedText);
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
      Alert.alert(getText('integratedLogin.inputError'), getText('integratedLogin.emailRequired'));
      return;
    }

    if (!password.trim()) {
      Alert.alert(getText('integratedLogin.inputError'), getText('integratedLogin.passwordRequired'));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert(getText('integratedLogin.formatError'), getText('integratedLogin.invalidEmail'));
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
          getText('common.error'),
          result.error,
          [
            {
              text: getText('integratedLogin.didNotReceiveEmail'),
              onPress: async () => {
                const resendResult = await authService.resendVerificationEmail();
                if (resendResult.success) {
                  Alert.alert(getText('common.success'), getText('integratedLogin.resendEmailSuccess'));
                }
              }
            },
            { text: getText('common.ok'), style: 'cancel' }
          ]
        );
      } else {
        Alert.alert(getText('integratedLogin.loginError'), result.error || getText('integratedLogin.loginFailed'));
      }
    } catch (error) {
      console.error('Email登入錯誤:', error);
      Alert.alert(getText('integratedLogin.loginError'), getText('integratedLogin.networkError'));
    } finally {
      setIsLoading(false);
    }
  };

  // 🔥 處理發送電話驗證碼
  const handleSendPhoneCode = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert(getText('integratedLogin.inputError'), getText('integratedLogin.phoneRequired'));
      return;
    }

    const validation = authService.validateHongKongPhoneNumber(phoneNumber);
    if (!validation.isValid) {
      Alert.alert(getText('integratedLogin.formatError'), validation.error);
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
            getText('integratedLogin.devModeTitle'),
            getText('integratedLogin.devModeMessage').replace('{phone}', result.phoneNumber)
          );
        } else {
          Alert.alert(
            getText('integratedLogin.codeSent'), 
            getText('integratedLogin.codeSentMessage').replace('{phone}', result.phoneNumber)
          );
        }
        
        // 自動聚焦到驗證碼輸入框
        setTimeout(() => {
          otpInputRef.current?.focus();
        }, 500);
      } else {
        Alert.alert(getText('integratedLogin.sendFailed'), result.error || getText('integratedLogin.codeSendFailed'));
      }
    } catch (error) {
      console.error('發送驗證碼錯誤:', error);
      Alert.alert(getText('integratedLogin.sendFailed'), getText('integratedLogin.networkError'));
    } finally {
      setIsLoading(false);
    }
  };

  // 🔥 處理電話驗證碼確認
  const handleVerifyPhoneCode = async () => {
    if (!verificationCode.trim()) {
      Alert.alert(getText('integratedLogin.inputError'), getText('integratedLogin.codeRequired'));
      return;
    }

    if (verificationCode.length !== 6) {
      Alert.alert(getText('integratedLogin.formatError'), getText('integratedLogin.invalidCode'));
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
          getText('integratedLogin.loginSuccess'),
          getText('integratedLogin.welcomeBack').replace('{name}', userData.name),
          [
            {
              text: getText('integratedLogin.getStarted'),
              onPress: () => {
                if (onLogin && typeof onLogin === 'function') {
                  onLogin(userData);
                }
              }
            }
          ]
        );
      } else {
        Alert.alert(getText('integratedLogin.verificationFailed'), result.error || getText('integratedLogin.codeVerifyFailed'));
      }
    } catch (error) {
      console.error('驗證碼確認錯誤:', error);
      Alert.alert(getText('integratedLogin.verificationFailed'), getText('integratedLogin.networkError'));
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
        
        Alert.alert(getText('integratedSignUp.resendSuccess'), getText('integratedSignUp.newCodeSent'));
      } else {
        Alert.alert(getText('integratedLogin.sendFailed'), result.error || getText('integratedLogin.codeSendFailed'));
      }
    } catch (error) {
      console.error('重新發送驗證碼錯誤:', error);
      Alert.alert(getText('integratedLogin.sendFailed'), getText('integratedLogin.networkError'));
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
            {/* 🔥 導航欄 - 包含返回按鈕和語言切換按鈕 */}
            <View style={styles.headerNav}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={handleBackPress}
                activeOpacity={0.7}
              >
                <MaterialIcons name="arrow-back" size={24} color="#666666" />
              </TouchableOpacity>

              {/* 🔥 新增：語言切換按鈕 */}
              <TouchableOpacity 
                style={styles.languageButton}
                onPress={() => setShowLanguageModal(true)}
                activeOpacity={0.7}
              >
                <MaterialIcons name="language" size={24} color="#666666" />
                <Text style={styles.languageButtonText}>
                  {currentLanguage === 'en' ? 'EN' : '中'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* 插圖和標題區域 */}
            <View style={styles.headerSection}>
              <Image
                source={require('../assets/login_illustration.png')}
                style={styles.illustration}
                resizeMode="contain"
              />
              <Text style={styles.appTitle}>{getText('integratedLogin.title')}</Text>
              <Text style={styles.welcomeText}>{getText('integratedLogin.welcomeText')}</Text>
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
                  {getText('integratedLogin.emailMethod')}
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
                  {getText('integratedLogin.phoneMethod')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* 🔥 動態輸入區域 */}
            <View style={styles.inputSection}>
              {loginMethod === 'email' ? (
                // 電子郵件登入表單
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>{getText('integratedLogin.email')}</Text>
                    <TextInput
                      style={[styles.textInput, { letterSpacing: 0 }]} // 🔥 修復字距問題
                      placeholder={getText('integratedLogin.enterEmail')}
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
                    <Text style={styles.inputLabel}>{getText('integratedLogin.password')}</Text>
                    <View style={styles.passwordContainer}>
                      <TextInput
                        ref={passwordInputRef}
                        style={[styles.passwordInput, { letterSpacing: 0 }]} // 🔥 修復字距問題
                        placeholder={getText('integratedLogin.enterPassword')}
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
                      <Text style={styles.forgotPasswordText}>{getText('integratedLogin.forgotPassword')}</Text>
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
                        <Text style={styles.loginButtonText}>{getText('integratedLogin.signingIn')}</Text>
                      </View>
                    ) : (
                      <View style={styles.loginButtonContent}>
                        <MaterialIcons name="login" size={20} color="#FFFFFF" />
                        <Text style={styles.loginButtonText}>{getText('integratedLogin.signInButton')}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                // 電話登入表單
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>{getText('integratedLogin.phoneNumber')}</Text>
                    <View style={styles.phoneContainer}>
                      <View style={styles.countryCodeContainer}>
                        <Text style={styles.countryCode}>🇭🇰 +852</Text>
                      </View>
                      <TextInput
                        ref={phoneInputRef}
                        style={[styles.phoneInput, { letterSpacing: 0 }]} // 🔥 修復字距問題
                        placeholder={getText('integratedLogin.enterPhoneNumber')}
                        placeholderTextColor="#999999"
                        value={phoneNumber}
                        onChangeText={handlePhoneNumberChange}
                        keyboardType="phone-pad"
                        returnKeyType="done"
                        onSubmitEditing={handleSendPhoneCode}
                        editable={!isLoading}
                      />
                    </View>
                    <Text style={styles.phoneHint}>{getText('integratedLogin.phoneHint')}</Text>
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
                          <Text style={styles.sendCodeButtonText}>{getText('integratedLogin.sendingCode')}</Text>
                        </View>
                      ) : (
                        <View style={styles.sendCodeButtonContent}>
                          <MaterialIcons name="sms" size={20} color="#FFFFFF" />
                          <Text style={styles.sendCodeButtonText}>{getText('integratedLogin.sendCodeButton')}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  )}

                  {/* 🔥 驗證碼輸入區域 - 在同一頁面中顯示 */}
                  {showOTPInput && (
                    <>
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>{getText('integratedLogin.verificationCode')}</Text>
                        <TextInput
                          ref={otpInputRef}
                          style={[styles.otpInput, { letterSpacing: 4 }]} // 🔥 只有驗證碼需要字距
                          placeholder={getText('integratedLogin.enterVerificationCode')}
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
                        <Text style={styles.otpHint}>{getText('integratedLogin.otpHint')}</Text>
                      </View>

                      {/* 重新發送區域 */}
                      <View style={styles.resendSection}>
                        <Text style={styles.resendText}>{getText('integratedLogin.noCodeReceived')}</Text>
                        <TouchableOpacity
                          style={[styles.resendButton, !canResend && styles.resendButtonDisabled]}
                          onPress={handleResendCode}
                          disabled={!canResend || isLoading}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.resendButtonText, !canResend && styles.resendButtonTextDisabled]}>
                            {canResend ? getText('integratedLogin.resendCode') : `${resendCooldown} ${getText('integratedLogin.resendCodeIn')}`}
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
                            <Text style={styles.verifyButtonText}>{getText('integratedLogin.verifying')}</Text>
                          </View>
                        ) : (
                          <View style={styles.verifyButtonContent}>
                            <MaterialIcons name="verified-user" size={20} color="#FFFFFF" />
                            <Text style={styles.verifyButtonText}>{getText('integratedLogin.verifyCodeButton')}</Text>
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
                {getText('integratedLogin.noAccount')}{' '}
                <Text style={styles.signUpLink} onPress={handleSignUpNavigation}>
                  {getText('integratedLogin.signUpNow')}
                </Text>
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* 🔥 新增：語言選擇Modal */}
        <Modal
          visible={showLanguageModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowLanguageModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{getText('languageSelector.title')}</Text>
              
              <View style={styles.languageOptionsContainer}>
                <TouchableOpacity 
                  style={[
                    styles.languageOption,
                    currentLanguage === 'en' && styles.selectedLanguageOption
                  ]}
                  onPress={() => handleLanguageSelect('en')}
                  activeOpacity={0.7}
                >
                  <View style={styles.languageOptionContent}>
                    <View>
                      <Text style={[
                        styles.languageOptionTitle,
                        currentLanguage === 'en' && styles.selectedLanguageTitle
                      ]}>
                        {getText('languageSelector.english')}
                      </Text>
                      <Text style={styles.languageOptionSubtitle}>English</Text>
                    </View>
                    {currentLanguage === 'en' && (
                      <MaterialIcons name="check" size={24} color="#4A90E2" />
                    )}
                  </View>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[
                    styles.languageOption,
                    currentLanguage === 'zh-TW' && styles.selectedLanguageOption
                  ]}
                  onPress={() => handleLanguageSelect('zh-TW')}
                  activeOpacity={0.7}
                >
                  <View style={styles.languageOptionContent}>
                    <View>
                      <Text style={[
                        styles.languageOptionTitle,
                        currentLanguage === 'zh-TW' && styles.selectedLanguageTitle
                      ]}>
                        {getText('languageSelector.traditionalChinese')}
                      </Text>
                      <Text style={styles.languageOptionSubtitle}>繁體中文</Text>
                    </View>
                    {currentLanguage === 'zh-TW' && (
                      <MaterialIcons name="check" size={24} color="#4A90E2" />
                    )}
                  </View>
                </TouchableOpacity>
              </View>

              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowLanguageModal(false)}
              >
                <Text style={styles.modalCloseText}>{getText('languageSelector.cancel')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
  // 🔥 新增：導航欄樣式
  headerNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  // 🔥 新增：語言切換按鈕樣式
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  languageButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
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
  // 🔥 新增：語言選擇Modal樣式
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 20,
    textAlign: 'center',
  },
  languageOptionsContainer: {
    marginBottom: 16,
  },
  languageOption: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectedLanguageOption: {
    borderColor: '#4A90E2',
    backgroundColor: '#F3F9FF',
  },
  languageOptionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  languageOptionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 2,
  },
  selectedLanguageTitle: {
    color: '#4A90E2',
  },
  languageOptionSubtitle: {
    fontSize: 14,
    color: '#666666',
  },
  modalCloseButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  modalCloseText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
});