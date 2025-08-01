// components/LoginPage.js - 簡化版登入頁面（移除Google登入）
import React, { useState, useRef } from 'react';
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

export default function LoginPage({ onLogin, onBack, onNavigateToSignUp, onNavigateToForgotPassword, onNavigate, getText }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const passwordInputRef = useRef(null);

  // 處理鍵盤收回功能
  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  // 🔥 處理真正的Email登入
  const handleEmailLogin = async () => {
    // 驗證輸入
    if (!email.trim()) {
      Alert.alert(
        getText ? getText('login.inputError') : '輸入錯誤', 
        getText ? getText('login.pleaseEnterEmail') : '請輸入您的電子郵件地址'
      );
      return;
    }

    if (!password.trim()) {
      Alert.alert(
        getText ? getText('login.inputError') : '輸入錯誤', 
        getText ? getText('login.pleaseEnterPassword') : '請輸入您的密碼'
      );
      return;
    }

    // 簡單的電子郵件格式驗證
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert(
        getText ? getText('login.formatError') : '格式錯誤', 
        getText ? getText('login.pleaseEnterValidEmail') : '請輸入有效的電子郵件地址'
      );
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await authService.signInWithEmail(email, password);
      
      if (result.success) {
        // 登入成功
        const userData = {
          email: result.user.email,
          name: result.userData.username || email.split('@')[0],
          uid: result.user.uid,
          loginMethod: 'email',
          isLoggedIn: true,
          emailVerified: true
        };
        
        console.log('✅ Email登入成功:', userData.email);
        
        if (onLogin && typeof onLogin === 'function') {
          onLogin(userData);
        }
      } else if (result.needsVerification) {
        // 需要驗證郵件
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
            {
              text: '確定',
              style: 'cancel'
            }
          ]
        );
      } else {
        // 登入失敗
        Alert.alert(
          getText ? getText('login.loginError') : '登入錯誤',
          result.error || '登入失敗，請檢查您的電子郵件和密碼'
        );
      }
    } catch (error) {
      console.error('Email登入錯誤:', error);
      Alert.alert(
        getText ? getText('login.loginError') : '登入錯誤',
        '登入過程中發生錯誤，請稍後再試'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // 🔥 處理忘記密碼導航
  const handleForgotPasswordNavigation = () => {
    if (onNavigateToForgotPassword && typeof onNavigateToForgotPassword === 'function') {
      onNavigateToForgotPassword();
    }
  };

  // 處理註冊跳轉
  const handleSignUpNavigation = () => {
    if (onNavigateToSignUp && typeof onNavigateToSignUp === 'function') {
      onNavigateToSignUp();
    }
  };

  // 處理返回按鈕
  const handleBackPress = () => {
    if (onBack && typeof onBack === 'function') {
      onBack();
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
              <Text style={styles.appTitle}>
                {getText ? getText('login.title') : 'CardReminder'}
              </Text>
              <Text style={styles.welcomeText}>
                {getText ? getText('login.welcome') : '歡迎回來！請登入您的帳戶'}
              </Text>
            </View>

            {/* 郵件輸入區域 */}
            <View style={styles.inputSection}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  {getText ? getText('login.email') : 'Email'}
                </Text>
                <TextInput
                  style={styles.textInput}
                  placeholder={getText ? getText('login.enterEmail') : 'Enter your email'}
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
                  {getText ? getText('login.password') : 'Password'}
                </Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    ref={passwordInputRef}
                    style={styles.passwordInput}
                    placeholder={getText ? getText('login.enterPassword') : 'Enter your password'}
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
            </View>

            {/* 🔥 忘記密碼連結 */}
            <View style={styles.forgotPasswordSection}>
              <TouchableOpacity onPress={handleForgotPasswordNavigation}>
                <Text style={styles.forgotPasswordText}>
                  {getText ? getText('forgotPassword.title') : '忘記密碼？'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* 登入按鈕 */}
            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
              onPress={handleEmailLogin}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <View style={styles.loginButtonContent}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.loginButtonText}>
                    {getText ? getText('login.loggingIn') : '登入中...'}
                  </Text>
                </View>
              ) : (
                <View style={styles.loginButtonContent}>
                  <MaterialIcons name="login" size={20} color="#FFFFFF" />
                  <Text style={styles.loginButtonText}>
                    {getText ? getText('login.loginButton') : '登入'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

{/* 🔥 新增：電話登入選項 */}
<View style={styles.phoneLoginSection}>
  <View style={styles.dividerContainer}>
    <View style={styles.dividerLine} />
    <Text style={styles.dividerText}>或</Text>
    <View style={styles.dividerLine} />
  </View>
  
  <TouchableOpacity
    style={styles.phoneLoginButton}
    onPress={() => {
      // 這裡需要通過props傳遞導航函數
      if (typeof onNavigate === 'function') {
        onNavigate('PhoneLogin');
      }
    }}
    activeOpacity={0.8}
  >
    <View style={styles.phoneLoginButtonContent}>
      <MaterialIcons name="phone-android" size={20} color="#4A90E2" />
      <Text style={styles.phoneLoginButtonText}>
        使用手機號碼登入
      </Text>
    </View>
  </TouchableOpacity>
</View>

            {/* 註冊連結 */}
            <View style={styles.signUpSection}>
              <Text style={styles.signUpText}>
                {getText ? getText('login.noAccount') : "還沒有帳戶？"}{' '}
                <Text style={styles.signUpLink} onPress={handleSignUpNavigation}>
                  {getText ? getText('login.signUpNow') : '立即註冊'}
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
  illustration: {
    width: 280,
    height: 200,
    marginBottom: 24,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 16,
  },
  inputSection: {
    marginBottom: 16,
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
  forgotPasswordSection: {
    alignItems: 'flex-end',
    marginBottom: 32,
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
    marginBottom: 32,
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
  signUpSection: {
    alignItems: 'center',
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
  phoneLoginSection: {
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
phoneLoginButton: {
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
phoneLoginButtonContent: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
},
phoneLoginButtonText: {
  marginLeft: 12,
  fontSize: 16,
  fontWeight: '600',
  color: '#2C3E50',
},
});