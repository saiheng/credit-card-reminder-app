// components/ForgotPasswordPage.js - 忘記密碼頁面
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

export default function ForgotPasswordPage({ onBack, getText }) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  
  const emailInputRef = useRef(null);

  // 處理鍵盤收回功能
  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  // 處理密碼重置請求
  const handlePasswordReset = async () => {
    // 驗證Email格式
    if (!email.trim()) {
      Alert.alert(
        getText ? getText('forgotPassword.inputError') : '輸入錯誤',
        getText ? getText('forgotPassword.pleaseEnterEmail') : '請輸入您註冊時使用的電子郵件地址'
      );
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert(
        getText ? getText('forgotPassword.formatError') : '格式錯誤',
        getText ? getText('forgotPassword.pleaseEnterValidEmail') : '請輸入有效的電子郵件地址'
      );
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await authService.sendPasswordReset(email);
      
      if (result.success) {
        setEmailSent(true);
        Alert.alert(
          '📧 重置郵件已發送！',
          `我們已將密碼重置連結發送到：${email}\n\n請檢查：\n✅ 收件箱\n✅ 垃圾郵件文件夾\n✅ 促銷文件夾\n\n點擊郵件中的連結即可重設密碼。`,
          [
            {
              text: '好的，我去檢查',
              onPress: () => {
                if (onBack && typeof onBack === 'function') {
                  onBack();
                }
              }
            }
          ]
        );
      } else {
        Alert.alert(
          getText ? getText('forgotPassword.sendError') : '發送失敗',
          result.error || '無法發送密碼重置郵件，請稍後再試'
        );
      }
    } catch (error) {
      console.error('密碼重置錯誤:', error);
      Alert.alert(
        getText ? getText('forgotPassword.sendError') : '發送失敗',
        '發送密碼重置郵件時發生錯誤，請稍後再試'
      );
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
              <MaterialIcons name="lock-reset" size={80} color="#4A90E2" />
              <Text style={styles.title}>
                {getText ? getText('forgotPassword.title') : '忘記密碼？'}
              </Text>
              <Text style={styles.subtitle}>
                {getText ? getText('forgotPassword.subtitle') : '沒關係！輸入您的電子郵件地址，我們會發送重置密碼的連結給您。'}
              </Text>
            </View>

            {!emailSent ? (
              <>
                {/* Email 輸入區域 */}
                <View style={styles.inputSection}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>
                      {getText ? getText('forgotPassword.emailLabel') : '電子郵件地址'}
                    </Text>
                    <TextInput
                      ref={emailInputRef}
                      style={styles.textInput}
                      placeholder={getText ? getText('forgotPassword.emailPlaceholder') : '輸入您註冊時使用的電子郵件'}
                      placeholderTextColor="#999999"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      returnKeyType="done"
                      onSubmitEditing={handlePasswordReset}
                      editable={!isLoading}
                      autoFocus={true}
                    />
                  </View>
                </View>

                {/* 發送重置郵件按鈕 */}
                <TouchableOpacity
                  style={[styles.resetButton, isLoading && styles.resetButtonDisabled]}
                  onPress={handlePasswordReset}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  {isLoading ? (
                    <View style={styles.resetButtonContent}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text style={styles.resetButtonText}>
                        {getText ? getText('forgotPassword.sending') : '發送中...'}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.resetButtonContent}>
                      <MaterialIcons name="email" size={20} color="#FFFFFF" />
                      <Text style={styles.resetButtonText}>
                        {getText ? getText('forgotPassword.sendButton') : '發送重置郵件'}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              /* 郵件已發送的狀態 */
              <View style={styles.successSection}>
                <MaterialIcons name="mark-email-read" size={100} color="#4CAF50" />
                <Text style={styles.successTitle}>
                  {getText ? getText('forgotPassword.emailSent') : '郵件已發送！'}
                </Text>
                <Text style={styles.successMessage}>
                  {getText ? getText('forgotPassword.checkEmail') : `我們已經向 ${email} 發送了密碼重置連結。請檢查您的郵箱，包括垃圾郵件文件夾。`}
                </Text>
                
                <TouchableOpacity
                  style={styles.backToLoginButton}
                  onPress={handleBackPress}
                  activeOpacity={0.8}
                >
                  <Text style={styles.backToLoginText}>
                    {getText ? getText('forgotPassword.backToLogin') : '返回登入頁面'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* 幫助信息 */}
            <View style={styles.helpSection}>
              <Text style={styles.helpTitle}>
                {getText ? getText('forgotPassword.needHelp') : '需要幫助？'}
              </Text>
              <Text style={styles.helpText}>
                {getText ? getText('forgotPassword.helpText') : 
                '• 請確保輸入的電子郵件地址是您註冊時使用的地址\n' +
                '• 重置郵件可能需要幾分鐘才能送達\n' +
                '• 請檢查垃圾郵件或促銷郵件文件夾\n' +
                '• 如果仍有問題，請聯繫客服支援'
                }
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginTop: 20,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
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
  resetButton: {
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
  resetButtonDisabled: {
    backgroundColor: '#999999',
    elevation: 1,
  },
  resetButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  successSection: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: 20,
    marginBottom: 16,
  },
  successMessage: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  backToLoginButton: {
    backgroundColor: '#2C3E50',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  backToLoginText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  helpSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  helpTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 12,
  },
  helpText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
});