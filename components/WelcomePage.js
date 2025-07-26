// components/WelcomePage.js - 重新設計版本，符合附圖要求
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Image
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function WelcomePage({ onStartNow }) {
  
  const handleStartPress = () => {
    console.log('Start Now pressed');
    if (onStartNow && typeof onStartNow === 'function') {
      onStartNow();
    } else {
      console.error('onStartNow function not provided or not a function');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* 頭部 - 應用程式圖標和名稱 */}
        <View style={styles.header}>
          <View style={styles.appIconContainer}>
            <MaterialIcons name="credit-card" size={24} color="#FFFFFF" />
          </View>
          <Text style={styles.appName}>CardReminder</Text>
        </View>

        {/* 主要插圖區域 - 使用您提供的圖片 */}
        <View style={styles.illustrationSection}>
          <Image 
            source={require('../assets/welcome_page_photo.png')}
            style={styles.illustrationImage}
            resizeMode="contain"
          />
        </View>

        {/* 主標題和描述 */}
        <View style={styles.contentSection}>
          <Text style={styles.mainTitle}>Manage Your Payments</Text>
          <Text style={styles.description}>
            Stay on top of your credit card payments with timely reminders and easy tracking.
          </Text>
        </View>

        {/* 底部開始按鈕 */}
        <View style={styles.bottomSection}>
          <TouchableOpacity 
            style={styles.startButton}
            onPress={handleStartPress}
            activeOpacity={0.8}
          >
            <Text style={styles.startButtonText}>Start Now</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // 白色背景，符合附圖要求
  },
  scrollView: {
    flex: 1,
  },
  // 頭部樣式 - 左上角圖標和應用程式名稱
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    marginBottom: 40,
  },
  appIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#4A4A4A', // 深色背景，類似附圖中的圖標
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#4A4A4A',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  appName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2C3E50',
  },
  // 插圖區域 - 使用您提供的圖片
  illustrationSection: {
    paddingHorizontal: 24,
    marginBottom: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationImage: {
    width: '100%',
    height: 400, // 根據您的圖片調整高度
    maxWidth: 500, // 限制最大寬度
  },
  // 內容區域
  contentSection: {
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 60,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  // 底部按鈕區域
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#2C3E50', // 深色按鈕，符合附圖設計
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 80,
    shadowColor: '#2C3E50',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    width: '100%',
    maxWidth: 300,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
});