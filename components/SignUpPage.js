// components/SignUpPage.js - 與 LoginPage 風格一致的註冊頁面
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
  TouchableWithoutFeedback
} from 'react-native';
import { MaterialIcons, AntDesign } from '@expo/vector-icons';

export default function SignUpPage({ onSignUp, onBack, onNavigateToLogin }) {
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

  // 處理註冊
  const handleSignUp = () => {
    if (!validateInputs()) {
      return;
    }

    setIsLoading(true);
    
    // 這裡之後可以連接真正的後端註冊 API
    // 現在先模擬註冊流程
    setTimeout(() => {
      // 模擬發送驗證郵件
      Alert.alert(
        '註冊成功！',
        `驗證郵件已發送至 ${email}，請檢查您的郵箱並點擊驗證連結完成註冊。`,
        [
          {
            text: '確定',
            onPress: () => {
              // 註冊成功後跳轉回登入頁面
              if (onNavigateToLogin && typeof onNavigateToLogin === 'function') {
                onNavigateToLogin();
              }
            }
          }
        ]
      );
      
      setIsLoading(false);
    }, 2000);
  };

  // 處理 Google 註冊
  const handleGoogleSignUp = async () => {
    setIsLoading(true);
    
    try {
      // 這裡之後可以整合真正的 Google Sign-In
      setTimeout(() => {
        const googleUserData = {
          username: 'Google User',
          email: 'user@gmail.com',
          loginMethod: 'google',
          isLoggedIn: true
        };
        
        if (onSignUp && typeof onSignUp === 'function') {
          onSignUp(googleUserData);
        }
        setIsLoading(false);
      }, 1500);
      
    } catch (error) {
      setIsLoading(false);
      Alert.alert('註冊錯誤', '無法連接到 Google 服務，請稍後再試。');
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
              <Text style={styles.appTitle}>Create Account</Text>
              <Text style={styles.subtitle}>Join CardReminder today</Text>
            </View>

            {/* Google 註冊按鈕 */}
            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleGoogleSignUp}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <View style={styles.googleButtonContent}>
                <AntDesign name="google" size={20} color="#4285F4" />
                <Text style={styles.googleButtonText}>Sign up with Google</Text>
              </View>
            </TouchableOpacity>

            {/* 分隔線 */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* 輸入區域 */}
            <View style={styles.inputSection}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Username</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter your username"
                  placeholderTextColor="#999999"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  onSubmitEditing={() => emailInputRef.current?.focus()}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  ref={emailInputRef}
                  style={styles.textInput}
                  placeholder="Enter your email"
                  placeholderTextColor="#999999"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  onSubmitEditing={() => passwordInputRef.current?.focus()}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    ref={passwordInputRef}
                    style={styles.passwordInput}
                    placeholder="Enter your password"
                    placeholderTextColor="#999999"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!isPasswordVisible}
                    returnKeyType="next"
                    onSubmitEditing={() => confirmPasswordInputRef.current?.focus()}
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
                <Text style={styles.inputLabel}>Confirm Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    ref={confirmPasswordInputRef}
                    style={styles.passwordInput}
                    placeholder="Confirm your password"
                    placeholderTextColor="#999999"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!isConfirmPasswordVisible}
                    returnKeyType="done"
                    onSubmitEditing={handleSignUp}
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
              <Text style={styles.signUpButtonText}>
                {isLoading ? 'Creating Account...' : 'Sign Up'}
              </Text>
              <MaterialIcons 
                name="arrow-forward" 
                size={20} 
                color="#FFFFFF" 
                style={styles.signUpButtonIcon}
              />
            </TouchableOpacity>

            {/* 登入連結 */}
            <View style={styles.loginSection}>
              <Text style={styles.loginText}>
                Already have an account?{' '}
                <Text style={styles.loginLink} onPress={handleLoginNavigation}>
                  Log In
                </Text>
              </Text>
            </View>

            {/* 使用條款 */}
            <View style={styles.termsSection}>
              <Text style={styles.termsText}>
                By creating an account, you agree to our{' '}
                <Text style={styles.termsLink}>Terms of Service</Text>
                {' '}and{' '}
                <Text style={styles.termsLink}>Privacy Policy</Text>
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
    marginBottom: 8,
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleButtonText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
  signUpButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  signUpButtonIcon: {
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
    textDecorationLine: 'underline',
  },
});