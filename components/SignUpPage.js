// components/SignUpPage.js - 簡化版註冊頁面（移除Google註冊，添加法律條款）
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  ActivityIndicator
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { authService } from '../firebase';

export default function SignUpPage({ onSignUp, onBack, onNavigateToLogin, onNavigateToTerms, onNavigateToPrivacy, onNavigate, getText }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const confirmPasswordInputRef = useRef(null);

  // 處理鍵盤收回功能
  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  // 驗證輸入資料
  const validateInputs = () => {
    if (!username.trim()) {
      Alert.alert(
        getText ? getText('signUp.inputError') : '輸入錯誤', 
        getText ? getText('signUp.usernameRequired') : '請輸入您的用戶名'
      );
      return false;
    }

    if (username.trim().length < 3) {
      Alert.alert(
        getText ? getText('signUp.formatError') : '格式錯誤', 
        getText ? getText('signUp.usernameMinLength') : '用戶名至少需要 3 個字符'
      );
      return false;
    }

    if (!email.trim()) {
      Alert.alert(
        getText ? getText('signUp.inputError') : '輸入錯誤', 
        getText ? getText('signUp.emailRequired') : '請輸入您的電子郵件地址'
      );
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert(
        getText ? getText('signUp.formatError') : '格式錯誤', 
        getText ? getText('signUp.invalidEmail') : '請輸入有效的電子郵件地址'
      );
      return false;
    }

    if (!password.trim()) {
      Alert.alert(
        getText ? getText('signUp.inputError') : '輸入錯誤', 
        getText ? getText('signUp.passwordRequired') : '請輸入您的密碼'
      );
      return false;
    }

    if (password.length < 6) {
      Alert.alert(
        getText ? getText('signUp.passwordMismatch') : '密碼太短', 
        getText ? getText('signUp.passwordTooShort') : '密碼至少需要 6 個字符'
      );
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert(
        getText ? getText('signUp.passwordMismatch') : '密碼不匹配', 
        getText ? getText('signUp.passwordMismatchMessage') : '兩次輸入的密碼不一致，請重新確認'
      );
      return false;
    }

    return true;
  };

  // 🔥 處理真正的Email註冊
  const handleSignUp = async () => {
    if (!validateInputs()) {
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await authService.registerWithEmail(email, password, username);
      
      if (result.success) {
        console.log('📧 註冊成功，準備顯示提示訊息...');
        console.log('📧 使用者Email:', email);
        console.log('📧 使用者UID:', result.user.uid);
        
        // 顯示詳細的驗證郵件提示
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
      console.error('註冊錯誤:', error);
      Alert.alert('註冊錯誤', '註冊過程中發生錯誤，請稍後再試');
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

  // 處理已有帳號登入
  const handleLoginNavigation = () => {
    if (onNavigateToLogin && typeof onNavigateToLogin === 'function') {
      onNavigateToLogin();
    }
  };

  // 🔥 新增：處理服務條款導航
  const handleTermsNavigation = () => {
    if (onNavigateToTerms && typeof onNavigateToTerms === 'function') {
      onNavigateToTerms();
    }
  };

  // 🔥 新增：處理隱私政策導航
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

            {/* 標題區域 */}
            <View style={styles.headerSection}>
              <MaterialIcons name="person-add" size={80} color="#4A90E2" />
              <Text style={styles.appTitle}>
                {getText ? getText('signUp.title') : '創建帳戶'}
              </Text>
              <Text style={styles.subtitle}>
                {getText ? getText('signUp.subtitle') : '加入CardReminder，開始管理您的信用卡'}
              </Text>
            </View>

            {/* 輸入區域 */}
            <View style={styles.inputSection}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  {getText ? getText('signUp.username') : '用戶名'}
                </Text>
                <TextInput
                  style={styles.textInput}
                  placeholder={getText ? getText('signUp.enterUsername') : '輸入您的用戶名'}
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
                <Text style={styles.inputLabel}>
                  {getText ? getText('signUp.email') : '電子郵件'}
                </Text>
                <TextInput
                  ref={emailInputRef}
                  style={styles.textInput}
                  placeholder={getText ? getText('signUp.enterEmail') : '輸入您的電子郵件'}
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
                <Text style={styles.inputLabel}>
                  {getText ? getText('signUp.password') : '密碼'}
                </Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    ref={passwordInputRef}
                    style={styles.passwordInput}
                    placeholder={getText ? getText('signUp.enterPassword') : '輸入您的密碼'}
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
                <Text style={styles.inputLabel}>
                  {getText ? getText('signUp.confirmPassword') : '確認密碼'}
                </Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    ref={confirmPasswordInputRef}
                    style={styles.passwordInput}
                    placeholder={getText ? getText('signUp.confirmYourPassword') : '再次輸入您的密碼'}
                    placeholderTextColor="#999999"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!isConfirmPasswordVisible}
                    returnKeyType="done"
                    onSubmitEditing={handleSignUp}
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
            </View>

            {/* 註冊按鈕 */}
            <TouchableOpacity
              style={[styles.signUpButton, isLoading && styles.signUpButtonDisabled]}
              onPress={handleSignUp}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <View style={styles.signUpButtonContent}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.signUpButtonText}>
                    {getText ? getText('signUp.signingUp') : '註冊中...'}
                  </Text>
                </View>
              ) : (
                <View style={styles.signUpButtonContent}>
                  <MaterialIcons name="person-add" size={20} color="#FFFFFF" />
                  <Text style={styles.signUpButtonText}>
                    {getText ? getText('signUp.signUpButton') : '創建帳戶'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

{/* 🔥 新增：電話註冊選項 */}
<View style={styles.phoneSignUpSection}>
  <View style={styles.dividerContainer}>
    <View style={styles.dividerLine} />
    <Text style={styles.dividerText}>或</Text>
    <View style={styles.dividerLine} />
  </View>
  
  <TouchableOpacity
    style={styles.phoneSignUpButton}
    onPress={() => {
      // 這裡需要通過props傳遞導航函數
      if (typeof onNavigate === 'function') {
        onNavigate('PhoneSignUp');
      }
    }}
    activeOpacity={0.8}
  >
    <View style={styles.phoneSignUpButtonContent}>
      <MaterialIcons name="phone-android" size={20} color="#4A90E2" />
      <Text style={styles.phoneSignUpButtonText}>
        使用手機號碼註冊
      </Text>
    </View>
  </TouchableOpacity>
</View>

            {/* 登入連結 */}
            <View style={styles.loginSection}>
              <Text style={styles.loginText}>
                {getText ? getText('signUp.alreadyHaveAccount') : '已經有帳戶了？'}{' '}
                <Text style={styles.loginLink} onPress={handleLoginNavigation}>
                  {getText ? getText('signUp.logIn') : '立即登入'}
                </Text>
              </Text>
            </View>

            {/* 🔥 更新：使用條款和隱私政策（可點擊的連結） */}
            <View style={styles.termsSection}>
              <Text style={styles.termsText}>
                {getText ? getText('signUp.termsAgreement') : '創建帳戶即表示您同意我們的'}{' '}
                <Text style={styles.termsLink} onPress={handleTermsNavigation}>
                  {getText ? getText('signUp.termsOfService') : '服務條款'}
                </Text>
                {' '}{getText ? getText('signUp.and') : '和'}{' '}
                <Text style={styles.termsLink} onPress={handlePrivacyNavigation}>
                  {getText ? getText('signUp.privacyPolicy') : '隱私政策'}
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
    marginBottom: 40,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 8,
  },
  inputSection: {
    marginBottom: 32,
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
  signUpButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 24,
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
  loginSection: {
    alignItems: 'center',
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
  phoneSignUpSection: {
  marginBottom: 24,
},
dividerContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 16,
},
dividerLine: {
  flex: 1,
  height: 1,
  backgroundColor: '#E0E0E0',
},
dividerText: {
  marginHorizontal: 16,
  fontSize: 14,
  color: '#999999',
  fontWeight: '500',
},
phoneSignUpButton: {
  backgroundColor: '#FFFFFF',
  borderRadius: 12,
  paddingVertical: 16,
  paddingHorizontal: 20,
  borderWidth: 1,
  borderColor: '#E0E0E0',
  elevation: 1,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.05,
  shadowRadius: 2,
},
phoneSignUpButtonContent: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
},
phoneSignUpButtonText: {
  marginLeft: 12,
  fontSize: 16,
  fontWeight: '600',
  color: '#2C3E50',
},
});