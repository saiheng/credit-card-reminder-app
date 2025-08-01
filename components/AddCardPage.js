// components/AddCardPage.js - 具備完整多語言支持和Apple風格邊緣滑動返回功能
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
  Alert,
  PanResponder,
  Dimensions,
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MyCardsPage from './MyCardsPage';

const HONG_KONG_BANKS = [
  { value: 'hsbc', key: 'hsbc', color: '#db0011' },
  { value: 'hangseng', key: 'hangseng', color: '#0066cc' },
  { value: 'aeon', key: 'aeon', color: '#0066cc' },
  { value: 'boc', key: 'boc', color: '#8B0000' },
  { value: 'icbc', key: 'icbc', color: '#c41e3a' },
  { value: 'scb', key: 'scb', color: '#0f7ec6' },
  { value: 'dbs', key: 'dbs', color: '#e31837' },
  { value: 'citibank', key: 'citibank', color: '#1976d2' },
  { value: 'ccb', key: 'ccb', color: '#003d7a' },
  { value: 'bea', key: 'bea', color: '#0066cc' },
  { value: 'other', key: 'other', color: '#666666' }
];

export default function AddCardPage({ 
  onAddCard, 
  onBack,
  getText, // 接收多語言函數
  // 🔥 新增：邊緣滑動返回功能所需的完整props
  creditCards = [],
  paymentHistory = [],
  notificationSettings = {},
  userData = {},
  currentLanguage = 'en',
  onNavigate,
  onUpdateCard,
  onDeleteCard,
  onMarkPayment,
  onUpdateNotificationSettings
}) {
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [dueDay, setDueDay] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [errors, setErrors] = useState({});

  // 🔥 Apple風格邊緣滑動返回功能：漸進式頁面過渡（完全修復版本）
  const screenWidth = Dimensions.get('window').width;
  const edgeWidth = 20; // 左邊緣感應區域寬度
  const swipeThreshold = screenWidth * 0.3; // 30%的屏幕寬度觸發返回
  
  // 動畫值：控制頁面滑動位置
  const [slideAnimation] = useState(new Animated.Value(0));
  const [isSliding, setIsSliding] = useState(false);
  
  const panResponder = PanResponder.create({
    // 🎯 只在左邊緣區域啟動手勢識別
    onStartShouldSetPanResponder: (evt, gestureState) => {
      const startX = evt.nativeEvent.pageX;
      return startX <= edgeWidth;
    },
    
    // 🎯 持續追蹤手勢
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      const startX = evt.nativeEvent.pageX;
      const deltaX = gestureState.dx;
      return startX <= edgeWidth && deltaX > 0.5;
    },
    
    // 🎯 手勢開始時的初始化
    onPanResponderGrant: (evt, gestureState) => {
      const startX = evt.nativeEvent.pageX;
      if (startX <= edgeWidth) {
        setIsSliding(true);
        slideAnimation.setValue(0);
        console.log('🔥 新增卡片頁面Apple風格滑動開始');
      }
    },
    
    // 🎯 滑動過程中的實時更新
    onPanResponderMove: (evt, gestureState) => {
      if (!isSliding) return;
      
      const swipeDistance = Math.max(0, gestureState.dx);
      const maxSlide = screenWidth * 0.8; // 最大滑動距離為屏幕寬度的80%
      const clampedDistance = Math.min(swipeDistance, maxSlide);
      
      // 實時更新動畫值，讓頁面跟隨手指移動
      slideAnimation.setValue(clampedDistance);
      
      console.log(`➕ 新增卡片頁面滑動進度: ${Math.round((clampedDistance / swipeThreshold) * 100)}%`);
    },
    
    // 🎯 手勢結束時的判斷和動畫（修復抖動問題）
    onPanResponderRelease: (evt, gestureState) => {
      if (!isSliding) return;
      
      const swipeDistance = gestureState.dx;
      const swipeVelocity = gestureState.vx;
      
      // 判斷是否應該執行返回操作
      const shouldReturn = swipeDistance > swipeThreshold || swipeVelocity > 0.5;
      
      if (shouldReturn) {
        // 🔥 修復抖動：執行平滑的返回動畫，完成後直接切換頁面
        console.log('✅ 新增卡片頁面滑動距離足夠，執行返回動畫');
        Animated.timing(slideAnimation, {
          toValue: screenWidth,
          duration: 180, // 快速完成，避免衝突
          useNativeDriver: true, // 🔥 使用原生驅動器，提供更流暢的動畫
        }).start(({ finished }) => {
          // 🔥 關鍵修復：只有在動畫真正完成時才執行返回操作
          if (finished) {
            // 先執行返回操作，讓頁面切換開始
            handleBackPress();
            // 🔥 延遲重置動畫狀態，避免視覺抖動
            setTimeout(() => {
              setIsSliding(false);
              slideAnimation.setValue(0);
            }, 100);
          }
        });
      } else {
        // 返回原位動畫
        console.log('↩️ 新增卡片頁面滑動距離不足，返回原位');
        Animated.spring(slideAnimation, {
          toValue: 0,
          tension: 150,
          friction: 10,
          useNativeDriver: true, // 🔥 使用原生驅動器
        }).start(() => {
          setIsSliding(false);
        });
      }
    },
    
    // 🎯 手勢被取消時的處理
    onPanResponderTerminate: (evt, gestureState) => {
      if (isSliding) {
        Animated.spring(slideAnimation, {
          toValue: 0,
          tension: 150,
          friction: 10,
          useNativeDriver: true, // 🔥 使用原生驅動器
        }).start(() => {
          setIsSliding(false);
        });
      }
    },
  });

  const formatCardNumber = (text) => {
    // 移除所有非數字字符，只保留數字
    const cleaned = text.replace(/\D/g, '');
    
    // 只返回數字，不需要格式化空格，因為只有4位數字
    return cleaned;
  };

  // 獲取銀行顯示名稱（支援多語言）
  const getBankDisplayName = (bankKey) => {
    return getText(`addCard.banks.${bankKey}`) || bankKey;
  };

  // 獲取銀行儲存名稱（永遠使用英文，確保數據一致性）
  const getBankStorageName = (bankKey) => {
    const bankMap = {
      'hsbc': 'HSBC',
      'hangseng': 'Hang Seng Bank', 
      'aeon': 'Aeon', 
      'boc': 'Bank of China (Hong Kong)',
      'icbc': 'ICBC (Asia)',
      'scb': 'Standard Chartered',
      'dbs': 'DBS Bank',
      'citibank': 'Citibank',
      'ccb': 'China Construction Bank (Asia)',
      'bea': 'Bank of East Asia',
      'other': 'Other Bank'
    };
    return bankMap[bankKey] || 'Other Bank';
  };

  const validateForm = () => {
    const newErrors = {};

    if (!cardNumber.trim()) {
      newErrors.cardNumber = getText('addCard.lastFourRequired');
    } else if (cardNumber.length !== 4) {
      newErrors.cardNumber = getText('addCard.exactlyFourDigits');
    }

    if (!cardName.trim()) {
      newErrors.cardName = getText('addCard.cardNameRequired');
    }

    if (!dueDay.trim()) {
      newErrors.dueDay = getText('addCard.dueDateRequired');
    } else {
      const day = parseInt(dueDay);
      if (isNaN(day) || day < 1 || day > 31) {
        newErrors.dueDay = getText('addCard.validDay');
      }
    }

    if (!selectedBank) {
      newErrors.bank = getText('addCard.selectBank');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      const selectedBankInfo = HONG_KONG_BANKS.find(bank => bank.value === selectedBank);
      
      const newCard = {
        number: cardNumber, // 直接儲存4位數字，不需要移除空格
        name: cardName.trim(),
        bank: getBankStorageName(selectedBank), // 使用英文名稱儲存，確保數據一致性
        dueDay: dueDay.trim(),
        color: selectedBankInfo?.color || '#666666',
        notificationEnabled: true
      };

      // 🔥 修復：直接調用回調函數，移除干擾性的彈窗通知
      onAddCard(newCard);
    }
  };

  // 🔥 新增：處理返回按鈕和邊緣滑動的統一返回邏輯
  const handleBackPress = () => {
    if (onBack && typeof onBack === 'function') {
      onBack();
    } else {
      console.warn('AddCardPage: onBack prop is missing or not a function');
    }
  };

  const clearError = (field) => {
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  return (
    <View style={styles.rootContainer} {...panResponder.panHandlers}>
      {/* 🔥 背景層：完整的 MyCards Page 渲染 */}
      <View style={styles.backgroundLayer}>
        <MyCardsPage
          creditCards={creditCards}
          paymentHistory={paymentHistory}
          notificationSettings={notificationSettings}
          userData={userData}
          onBack={() => {}} // 背景層不需要實際的返回功能
          onNavigate={onNavigate || (() => {})}
          onUpdateCard={onUpdateCard || (() => {})}
          onDeleteCard={onDeleteCard || (() => {})}
          onMarkPayment={onMarkPayment || (() => {})}
          onUpdateNotificationSettings={onUpdateNotificationSettings || (() => {})}
          getText={getText}
          currentLanguage={currentLanguage}
        />
      </View>
      
      {/* 🔥 前景層：當前頁面內容，支持滑動動畫 */}
      <Animated.View 
        style={[
          styles.foregroundLayer,
          {
            transform: [{
              translateX: slideAnimation
            }]
          }
        ]}
      >
        <SafeAreaView style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={handleBackPress}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={24} color="#000000" />
            </TouchableOpacity>
            <Text style={styles.title}>{getText('addCard.title')}</Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.formContainer}>
              {/* Card Number - 修改為只需要最後4位數字 */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{getText('addCard.lastFourDigits')}</Text>
                <TextInput
                  style={[styles.input, errors.cardNumber && styles.inputError]}
                  placeholder="1234"
                  placeholderTextColor="#999999"
                  value={cardNumber}
                  onChangeText={(text) => {
                    setCardNumber(formatCardNumber(text));
                    clearError('cardNumber');
                  }}
                  keyboardType="numeric"
                  maxLength={4} // 只允許4位數字
                />
                {errors.cardNumber && (
                  <Text style={styles.errorText}>{errors.cardNumber}</Text>
                )}
              </View>

              {/* Card Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{getText('addCard.cardName')}</Text>
                <TextInput
                  style={[styles.input, errors.cardName && styles.inputError]}
                  placeholder={getText('addCard.cardNamePlaceholder')}
                  placeholderTextColor="#999999"
                  value={cardName}
                  onChangeText={(text) => {
                    setCardName(text);
                    clearError('cardName');
                  }}
                />
                {errors.cardName && (
                  <Text style={styles.errorText}>{errors.cardName}</Text>
                )}
              </View>

              {/* Due Date */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{getText('addCard.dueDate')}</Text>
                <View style={styles.dueDateContainer}>
                  <TextInput
                    style={[styles.dueDateInput, errors.dueDay && styles.inputError]}
                    placeholder="DD"
                    placeholderTextColor="#999999"
                    value={dueDay}
                    onChangeText={(text) => {
                      setDueDay(text);
                      clearError('dueDay');
                    }}
                    keyboardType="numeric"
                    maxLength={2}
                  />
                  <Text style={styles.dueDateText}>{getText('addCard.ofEachMonth')}</Text>
                </View>
                {errors.dueDay && (
                  <Text style={styles.errorText}>{errors.dueDay}</Text>
                )}
              </View>

              {/* Issuing Bank */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{getText('addCard.issuingBank')}</Text>
                <View style={styles.banksGrid}>
                  {HONG_KONG_BANKS.map((bank, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.bankOption,
                        selectedBank === bank.value && styles.bankOptionSelected
                      ]}
                      onPress={() => {
                        setSelectedBank(bank.value);
                        clearError('bank');
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.bankOptionText,
                        selectedBank === bank.value && styles.bankOptionTextSelected
                      ]}>
                        {getBankDisplayName(bank.key)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {errors.bank && (
                  <Text style={styles.errorText}>{errors.bank}</Text>
                )}
              </View>

              {/* Save Button */}
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSubmit}
                activeOpacity={0.8}
              >
                <Text style={styles.saveButtonText}>{getText('addCard.save')}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  // 🔥 Apple風格邊緣滑動的新增樣式
  rootContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  backgroundLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#F5F5F5',
  },
  foregroundLayer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  formContainer: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000000',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  inputError: {
    borderColor: '#F44336',
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dueDateInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000000',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    width: 80,
    textAlign: 'center',
  },
  dueDateText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#666666',
  },
  banksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  bankOption: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    margin: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  bankOptionSelected: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  bankOptionText: {
    fontSize: 14,
    color: '#333333',
  },
  bankOptionTextSelected: {
    color: '#FFFFFF',
  },
  errorText: {
    color: '#F44336',
    fontSize: 12,
    marginTop: 4,
  },
  saveButton: {
    backgroundColor: '#000000',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});