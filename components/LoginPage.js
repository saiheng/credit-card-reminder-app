// components/LoginPage.js - 修復版，確保正確處理登入和導航
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  StatusBar
} from 'react-native';

export default function LoginPage({ onLogin, onBack }) {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');

  const handleGmailLogin = () => {
    if (!email.trim()) {
      Alert.alert('錯誤', '請輸入電子郵件地址');
      return;
    }

    if (!name.trim()) {
      Alert.alert('錯誤', '請輸入您的姓名');
      return;
    }

    // 簡單的電子郵件格式驗證
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('錯誤', '請輸入有效的電子郵件地址');
      return;
    }

    console.log('Gmail login attempted'); // 調試用
    
    if (onLogin && typeof onLogin === 'function') {
      onLogin('gmail', {
        email: email.trim(),
        name: name.trim()
      });
    } else {
      console.error('onLogin function not provided');
    }
  };

  const handleAppleLogin = () => {
    if (!name.trim()) {
      Alert.alert('錯誤', '請輸入您的姓名');
      return;
    }

    console.log('Apple login attempted'); // 調試用
    
    if (onLogin && typeof onLogin === 'function') {
      onLogin('apple', {
        email: 'user@icloud.com', // Apple ID 模擬
        name: name.trim()
      });
    } else {
      console.error('onLogin function not provided');
    }
  };

  const handleSMSLogin = () => {
    if (!phone.trim()) {
      Alert.alert('錯誤', '請輸入手機號碼');
      return;
    }

    if (!name.trim()) {
      Alert.alert('錯誤', '請輸入您的姓名');
      return;
    }

    // 簡單的手機號碼格式驗證（香港）
    const phoneRegex = /^[5-9]\d{7}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      Alert.alert('錯誤', '請輸入有效的香港手機號碼');
      return;
    }

    console.log('SMS login attempted'); // 調試用
    
    if (onLogin && typeof onLogin === 'function') {
      onLogin('sms', {
        phone: phone.trim(),
        name: name.trim(),
        email: '' // SMS 登入不需要 email
      });
    } else {
      console.error('onLogin function not provided');
    }
  };

  const handleBackPress = () => {
    console.log('Back button pressed'); // 調試用
    if (onBack && typeof onBack === 'function') {
      onBack();
    } else {
      console.error('onBack function not provided');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={handleBackPress}
          activeOpacity={0.8}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Welcome</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {/* Welcome Message */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Let's get started</Text>
          <Text style={styles.welcomeSubtitle}>
            Choose your preferred sign-in method
          </Text>
        </View>

        {/* Input Fields */}
        <View style={styles.inputSection}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Your Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your name"
              placeholderTextColor="#666666"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email (for Gmail)</Text>
            <TextInput
              style={styles.input}
              placeholder="your.email@gmail.com"
              placeholderTextColor="#666666"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone (for SMS)</Text>
            <TextInput
              style={styles.input}
              placeholder="5xxx xxxx (Hong Kong)"
              placeholderTextColor="#666666"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* Login Options */}
        <View style={styles.loginSection}>
          <TouchableOpacity 
            style={[styles.loginButton, styles.gmailButton]}
            onPress={handleGmailLogin}
            activeOpacity={0.8}
          >
            <Text style={styles.loginIcon}>📧</Text>
            <Text style={styles.loginText}>Continue with Gmail</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.loginButton, styles.appleButton]}
            onPress={handleAppleLogin}
            activeOpacity={0.8}
          >
            <Text style={styles.loginIcon}>🍎</Text>
            <Text style={styles.loginText}>Continue with Apple ID</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.loginButton, styles.smsButton]}
            onPress={handleSMSLogin}
            activeOpacity={0.8}
          >
            <Text style={styles.loginIcon}>📱</Text>
            <Text style={styles.loginText}>Continue with SMS</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footerSection}>
          <Text style={styles.footerText}>
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  welcomeSection: {
    marginBottom: 40,
  },
  welcomeTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    color: '#999999',
    fontSize: 16,
    lineHeight: 24,
  },
  inputSection: {
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#FFFFFF',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  loginSection: {
    marginBottom: 32,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 16,
    borderWidth: 1,
  },
  gmailButton: {
    backgroundColor: '#2a2a2a',
    borderColor: '#DB4437',
  },
  appleButton: {
    backgroundColor: '#2a2a2a',
    borderColor: '#FFFFFF',
  },
  smsButton: {
    backgroundColor: '#2a2a2a',
    borderColor: '#4CAF50',
  },
  loginIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  loginText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footerSection: {
    marginTop: 'auto',
    paddingBottom: 20,
  },
  footerText: {
    color: '#666666',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});