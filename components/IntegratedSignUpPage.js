// components/IntegratedSignUpPage.js - 整合的註冊頁面（新增語言切換功能和完整國際化支援）
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

export default function IntegratedSignUpPage({ 
  onSignUp, 
  onBack, 
  onNavigateToLogin, 
  onNavigateToTerms, 
  onNavigateToPrivacy, 
  getText,
  currentLanguage = 'en',
  onLanguageChange
}) {
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
  
  // 🔥 新增：語言切換相關狀態
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  
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

  // 🔥 新增：語言切換處理函數
  const handleLanguageSelect = (languageCode) => {
    if (onLanguageChange && typeof onLanguageChange === 'function') {
      onLanguageChange(languageCode);
    }
    setShowLanguageModal(false);
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

  // 驗證電子郵件註冊輸入
  const validateEmailSignUp = () => {
    if (!username.trim()) {
      Alert.alert(getText('integratedSignUp.inputError'), getText('integratedSignUp.usernameRequired'));
      return false;
    }

    if (username.trim().length < 3) {
      Alert.alert(getText('integratedSignUp.formatError'), getText('integratedSignUp.usernameMinLength'));
      return false;
    }

    if (!email.trim()) {
      Alert.alert(getText('integratedSignUp.inputError'), getText('integratedSignUp.emailRequired'));
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert(getText('integratedSignUp.formatError'), getText('integratedSignUp.invalidEmail'));
      return false;
    }

    if (!password.trim()) {
      Alert.alert(getText('integratedSignUp.inputError'), getText('integratedSignUp.passwordRequired'));
      return false;
    }

    if (password.length < 6) {
      Alert.alert(getText('integratedSignUp.formatError'), getText('integratedSignUp.passwordTooShort'));
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert(getText('integratedSignUp.formatError'), getText('integratedSignUp.passwordMismatchMessage'));
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
  getText('integratedSignUp.signUpSuccess'),
  getText('integratedSignUp.emailVerificationMessage').replace('{email}', email),
  [
    {
      text: getText('integratedSignUp.checkEmail'),
      onPress: () => {
        if (onNavigateToLogin && typeof onNavigateToLogin === 'function') {
          onNavigateToLogin();
        }
      }
    }
  ]
);
      } else {
        Alert.alert(getText('integratedSignUp.signUpError'), result.error || getText('integratedSignUp.registrationFailed'));
      }
    } catch (error) {
      console.error('Email註冊錯誤:', error);
      Alert.alert(getText('integratedSignUp.signUpError'), getText('integratedSignUp.networkError'));
    } finally {
      setIsLoading(false);
    }
  };

  // 🔥 處理發送電話驗證碼
  const handleSendPhoneCode = async () => {
    if (!phoneUsername.trim()) {
      Alert.alert(getText('integratedSignUp.inputError'), getText('integratedSignUp.phoneUsernameRequired'));
      return;
    }

    if (phoneUsername.trim().length < 2) {
      Alert.alert(getText('integratedSignUp.formatError'), getText('integratedSignUp.phoneUsernameMinLength'));
      return;
    }

    if (!phoneNumber.trim()) {
      Alert.alert(getText('integratedSignUp.inputError'), getText('integratedSignUp.phoneRequired'));
      return;
    }

    const validation = authService.validateHongKongPhoneNumber(phoneNumber);
    if (!validation.isValid) {
      Alert.alert(getText('integratedSignUp.formatError'), validation.error);
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
            getText('integratedSignUp.devModeTitle'),
            getText('integratedSignUp.devModeMessage').replace('{phone}', result.phoneNumber)
          );
        } else {
          Alert.alert(
            getText('integratedSignUp.codeSent'), 
            getText('integratedSignUp.codeSentMessage').replace('{phone}', result.phoneNumber)
          );
        }
        
        // 自動聚焦到驗證碼輸入框
        setTimeout(() => {
          otpInputRef.current?.focus();
        }, 500);
      } else {
        Alert.alert(getText('integratedSignUp.sendFailed'), result.error || getText('integratedSignUp.codeSendFailed'));
      }
    } catch (error) {
      console.error('發送驗證碼錯誤:', error);
      Alert.alert(getText('integratedSignUp.sendFailed'), getText('integratedSignUp.networkError'));
    } finally {
      setIsLoading(false);
    }
  };

  // 🔥 處理電話驗證碼確認
  const handleVerifyPhoneCode = async () => {
    if (!verificationCode.trim()) {
      Alert.alert(getText('integratedSignUp.inputError'), getText('integratedSignUp.codeRequired'));
      return;
    }

    if (verificationCode.length !== 6) {
      Alert.alert(getText('integratedSignUp.formatError'), getText('integratedSignUp.invalidCode'));
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
          getText('integratedSignUp.registrationSuccess'),
          getText('integratedSignUp.welcomeMessage').replace('{name}', finalUserData.name),
          [
            {
              text: getText('integratedSignUp.getStarted'),
              onPress: () => {
                if (onSignUp && typeof onSignUp === 'function') {
                  onSignUp(finalUserData);
                }
              }
            }
          ]
        );
      } else {
        Alert.alert(getText('integratedSignUp.verificationFailed'), result.error || getText('integratedSignUp.codeVerifyFailed'));
      }
    } catch (error) {
      console.error('驗證碼確認錯誤:', error);
      Alert.alert(getText('integratedSignUp.verificationFailed'), getText('integratedSignUp.networkError'));
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
        Alert.alert(getText('integratedSignUp.sendFailed'), result.error || getText('integratedSignUp.codeSendFailed'));
      }
    } catch (error) {
      console.error('重新發送驗證碼錯誤:', error);
      Alert.alert(getText('integratedSignUp.sendFailed'), getText('integratedSignUp.networkError'));
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
                source={require('../assets/signup_illustration.png')}
                style={styles.illustration}
                resizeMode="contain"
              />
              <Text style={styles.appTitle}>{getText('integratedSignUp.title')}</Text>
              <Text style={styles.welcomeText}>{getText('integratedSignUp.welcomeText')}</Text>
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
                  {getText('integratedSignUp.emailMethod')}
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
                  {getText('integratedSignUp.phoneMethod')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* 🔥 動態輸入區域 */}
            <View style={styles.inputSection}>
              {signUpMethod === 'email' ? (
                // 電子郵件註冊表單
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>{getText('integratedSignUp.username')}</Text>
                    <TextInput
                      style={[styles.textInput, { letterSpacing: 0 }]} // 🔥 修復字距問題
                      placeholder={getText('integratedSignUp.enterUsername')}
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
                    <Text style={styles.inputLabel}>{getText('integratedSignUp.email')}</Text>
                    <TextInput
                      ref={emailInputRef}
                      style={[styles.textInput, { letterSpacing: 0 }]} // 🔥 修復字距問題
                      placeholder={getText('integratedSignUp.enterEmail')}
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
                    <Text style={styles.inputLabel}>{getText('integratedSignUp.password')}</Text>
                    <View style={styles.passwordContainer}>
                      <TextInput
                        ref={passwordInputRef}
                        style={[styles.passwordInput, { letterSpacing: 0 }]} // 🔥 修復字距問題
                        placeholder={getText('integratedSignUp.enterPassword')}
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
                    <Text style={styles.inputLabel}>{getText('integratedSignUp.confirmPassword')}</Text>
                    <View style={styles.passwordContainer}>
                      <TextInput
                        ref={confirmPasswordInputRef}
                        style={[styles.passwordInput, { letterSpacing: 0 }]} // 🔥 修復字距問題
                        placeholder={getText('integratedSignUp.confirmYourPassword')}
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
                        <Text style={styles.signUpButtonText}>{getText('integratedSignUp.creatingAccount')}</Text>
                      </View>
                    ) : (
                      <View style={styles.signUpButtonContent}>
                        <MaterialIcons name="person-add" size={20} color="#FFFFFF" />
                        <Text style={styles.signUpButtonText}>{getText('integratedSignUp.createAccountButton')}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                // 電話註冊表單
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>{getText('integratedSignUp.username')}</Text>
                    <TextInput
                      style={[styles.textInput, { letterSpacing: 0 }]} // 🔥 修復字距問題
                      placeholder={getText('integratedSignUp.enterUsername')}
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
                    <Text style={styles.inputLabel}>{getText('integratedSignUp.phoneNumber')}</Text>
                    <View style={styles.phoneContainer}>
                      <View style={styles.countryCodeContainer}>
                        <Text style={styles.countryCode}>🇭🇰 +852</Text>
                      </View>
                      <TextInput
                        ref={phoneInputRef}
                        style={[styles.phoneInput, { letterSpacing: 0 }]} // 🔥 修復字距問題
                        placeholder={getText('integratedSignUp.enterPhoneNumber')}
                        placeholderTextColor="#999999"
                        value={phoneNumber}
                        onChangeText={handlePhoneNumberChange}
                        keyboardType="phone-pad"
                        returnKeyType="done"
                        onSubmitEditing={handleSendPhoneCode}
                        editable={!isLoading}
                      />
                    </View>
                    <Text style={styles.phoneHint}>{getText('integratedSignUp.phoneHint')}</Text>
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
                          <Text style={styles.sendCodeButtonText}>{getText('integratedSignUp.sendingCode')}</Text>
                        </View>
                      ) : (
                        <View style={styles.sendCodeButtonContent}>
                          <MaterialIcons name="sms" size={20} color="#FFFFFF" />
                          <Text style={styles.sendCodeButtonText}>{getText('integratedSignUp.sendCodeButton')}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  )}

                  {/* 🔥 驗證碼輸入區域 - 在同一頁面中顯示 */}
                  {showOTPInput && (
                    <>
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>{getText('integratedSignUp.verificationCode')}</Text>
                        <TextInput
                          ref={otpInputRef}
                          style={[styles.otpInput, { letterSpacing: 4 }]} // 🔥 只有驗證碼需要字距
                          placeholder={getText('integratedSignUp.enterVerificationCode')}
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
                        <Text style={styles.otpHint}>{getText('integratedSignUp.otpHint')}</Text>
                      </View>

                      {/* 重新發送區域 */}
                      <View style={styles.resendSection}>
                        <Text style={styles.resendText}>{getText('integratedSignUp.noCodeReceived')}</Text>
                        <TouchableOpacity
                          style={[styles.resendButton, !canResend && styles.resendButtonDisabled]}
                          onPress={handleResendCode}
                          disabled={!canResend || isLoading}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.resendButtonText, !canResend && styles.resendButtonTextDisabled]}>
                            {canResend ? getText('integratedSignUp.resendCode') : `${resendCooldown} ${getText('integratedSignUp.resendCodeIn')}`}
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
                            <Text style={styles.verifyButtonText}>{getText('integratedSignUp.verifying')}</Text>
                          </View>
                        ) : (
                          <View style={styles.verifyButtonContent}>
                            <MaterialIcons name="verified-user" size={20} color="#FFFFFF" />
                            <Text style={styles.verifyButtonText}>{getText('integratedSignUp.verifyCodeButton')}</Text>
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
                {getText('integratedSignUp.alreadyHaveAccount')}{' '}
                <Text style={styles.loginLink} onPress={handleLoginNavigation}>
                  {getText('integratedSignUp.signInNow')}
                </Text>
              </Text>
            </View>

            {/* 使用條款 */}
            <View style={styles.termsSection}>
              <Text style={styles.termsText}>
                {getText('integratedSignUp.termsAgreement')}{' '}
                <Text style={styles.termsLink} onPress={handleTermsNavigation}>
                  {getText('integratedSignUp.termsOfService')}
                </Text>
                {' '}{getText('integratedSignUp.and')}{' '}
                <Text style={styles.termsLink} onPress={handlePrivacyNavigation}>
                  {getText('integratedSignUp.privacyPolicy')}
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