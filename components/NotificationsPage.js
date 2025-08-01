// components/NotificationsPage.js - 🔥 修復2：解決個別卡片設定影響全局的問題（增加邊緣滑動返回功能）
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Switch,
  Alert,
  Modal,
  PanResponder,
  Dimensions,
  Animated
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import HomePage from './HomePage';

// 🔥 關鍵修復：導入NotificationManager（保持最小修改）
import { NotificationManager } from '../utils/NotificationManager';

// 配置通知處理
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function NotificationsPage({ 
  creditCards = [], 
  notificationSettings = {},
  onBack, 
  onUpdateSettings,
  onUpdateNotificationSettings, // 同步回調函數
  getText,
  // 🔥 新增：HomePage 完整渲染所需的 props
  userData = {},
  paymentHistory = [],
  onNavigate,
  currentLanguage = 'en'
}) {
  const [paymentDueEnabled, setPaymentDueEnabled] = useState(true);
  const [selectedCard, setSelectedCard] = useState('all');
  const [showCardPicker, setShowCardPicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [currentPickerType, setCurrentPickerType] = useState('reminder');
  
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
        console.log('🔥 通知設定頁面Apple風格滑動開始');
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
      
      console.log(`🔔 通知設定頁面滑動進度: ${Math.round((clampedDistance / swipeThreshold) * 100)}%`);
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
        console.log('✅ 通知設定頁面滑動距離足夠，執行返回動畫');
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
        console.log('↩️ 通知設定頁面滑動距離不足，返回原位');
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
  
  // 🔥 修復2：分離全局設定和個別卡片設定的狀態管理
  // 全局設定（應用於所有卡片的預設值）
  const [globalReminderDays, setGlobalReminderDays] = useState([7, 3, 1]);
  const [globalReminderTimes, setGlobalReminderTimes] = useState(['09:00', '18:00']);
  const [globalOverdueTime, setGlobalOverdueTime] = useState('09:00');
  
  // 個別卡片設定（每張卡片的特定設定）
  const [individualCardSettings, setIndividualCardSettings] = useState({});
  
  // 暫存設定狀態 - 解決設定保存問題的關鍵
  const [draftNotificationSettings, setDraftNotificationSettings] = useState({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // 修復總開關狀態管理，增加持久性
  const [masterSwitchEnabled, setMasterSwitchEnabled] = useState(true);
  const [masterSwitchInitialized, setMasterSwitchInitialized] = useState(false);

  // 🔥 關鍵修復：初始化NotificationManager（保持最小修改）
  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        console.log('🔔 初始化NotificationManager...');
        const initialized = await NotificationManager.initialize();
        if (!initialized) {
          console.log('❌ NotificationManager初始化失敗');
        }
      } catch (error) {
        console.error('NotificationManager初始化錯誤:', error);
      }
    };

    initializeNotifications();
    requestNotificationPermissions();
    // 初始化暫存設定
    initializeDraftSettings();
    // 載入並初始化總開關狀態
    loadAndInitializeMasterSwitch();
    // 🔥 修復2：初始化個別卡片設定
    initializeIndividualCardSettings();
  }, []);

  // 監聽外部設定變化，同步更新暫存設定
  useEffect(() => {
    if (!hasUnsavedChanges) {
      initializeDraftSettings();
      if (!masterSwitchInitialized) {
        loadAndInitializeMasterSwitch();
      }
      // 🔥 修復2：重新同步個別卡片設定
      initializeIndividualCardSettings();
    }
  }, [notificationSettings]);

  const requestNotificationPermissions = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          getText('notifications.notificationPermission') || '通知權限',
          getText('notifications.enableNotificationPermissions') || '請啟用通知權限以接收提醒',
          [{ text: getText('common.ok') || '確定' }]
        );
      }
    } catch (error) {
      console.error('Request notification permissions failed:', error);
    }
  };

  // 核心功能：初始化暫存設定
  const initializeDraftSettings = () => {
    // 深度複製當前設定到暫存區
    const draft = {};
    creditCards.forEach(card => {
      draft[card.id] = {
        enabled: notificationSettings[card.id]?.enabled !== false,
        ...notificationSettings[card.id]
      };
    });
    setDraftNotificationSettings(draft);
    setHasUnsavedChanges(false);
  };

  // 🔥 修復2：初始化個別卡片設定，避免全局污染
  const initializeIndividualCardSettings = () => {
    const cardSettings = {};
    creditCards.forEach(card => {
      // 每張卡片都有獨立的設定，如果沒有特定設定則使用全局預設值
      cardSettings[card.id] = {
        reminderDays: notificationSettings[card.id]?.reminderDays || [...globalReminderDays],
        reminderTimes: notificationSettings[card.id]?.reminderTimes || [...globalReminderTimes],
        overdueTime: notificationSettings[card.id]?.overdueTime || globalOverdueTime
      };
    });
    setIndividualCardSettings(cardSettings);
  };

  // 載入並初始化總開關狀態
  const loadAndInitializeMasterSwitch = async () => {
    try {
      // 從AsyncStorage載入保存的總開關狀態
      const savedMasterSwitchState = await AsyncStorage.getItem('masterSwitchEnabled');
      
      if (savedMasterSwitchState !== null) {
        // 如果有保存的狀態，直接使用保存的狀態
        const parsedState = JSON.parse(savedMasterSwitchState);
        setMasterSwitchEnabled(parsedState);
        console.log('載入保存的總開關狀態:', parsedState);
      } else {
        // 只有在沒有保存狀態時，才根據卡片狀態初始化
        initializeMasterSwitchFromCards();
      }
      
      setMasterSwitchInitialized(true); // 標記為已初始化
    } catch (error) {
      console.error('載入總開關狀態失敗:', error);
      // 如果載入失敗，回退到根據卡片狀態初始化
      initializeMasterSwitchFromCards();
      setMasterSwitchInitialized(true);
    }
  };

  // 根據卡片狀態初始化總開關（僅在首次載入時使用）
  const initializeMasterSwitchFromCards = () => {
    if (creditCards.length === 0) {
      setMasterSwitchEnabled(false);
      return;
    }
    
    // 檢查是否所有卡片都啟用通知
    const allEnabled = creditCards.every(card => 
      notificationSettings[card.id]?.enabled !== false
    );
    setMasterSwitchEnabled(allEnabled);
    
    console.log('根據卡片狀態初始化總開關:', allEnabled);
  };

  // 保存總開關狀態到AsyncStorage
  const saveMasterSwitchState = async (state) => {
    try {
      await AsyncStorage.setItem('masterSwitchEnabled', JSON.stringify(state));
      console.log('總開關狀態已保存:', state);
    } catch (error) {
      console.error('保存總開關狀態失敗:', error);
    }
  };

  // 核心功能：更新暫存設定（不直接保存到系統）
  const updateDraftSetting = (cardId, settings) => {
    setDraftNotificationSettings(prev => ({
      ...prev,
      [cardId]: {
        ...prev[cardId],
        ...settings
      }
    }));
    setHasUnsavedChanges(true);
  };

  // 徹底重新設計：總開關邏輯
  const getCardRepaymentReminderState = () => {
    if (selectedCard === 'all') {
      // 總開關使用持久化的狀態
      return masterSwitchEnabled;
    } else {
      // 當選擇特定卡片時，顯示該卡片的通知狀態
      return draftNotificationSettings[selectedCard]?.enabled !== false;
    }
  };

  // 增強總開關控制邏輯，加入狀態持久化
  const handleCardRepaymentReminderToggle = async (enabled) => {
    if (selectedCard === 'all') {
      // 總開關操作時保存狀態
      setMasterSwitchEnabled(enabled);
      
      // 立即保存總開關狀態到AsyncStorage
      await saveMasterSwitchState(enabled);
      
      // 當用戶操作總開關時，同步更新所有卡片狀態
      creditCards.forEach(card => {
        updateDraftSetting(card.id, { enabled: enabled });
      });
      
      // 提供操作提示
      const message = enabled ? 
        (getText('notifications.allCardsEnabled') || '已開啟所有卡片的通知') :
        (getText('notifications.allCardsDisabled') || '已關閉所有卡片的通知');
      
      console.log(message);
      
    } else {
      // 單個卡片操作不影響總開關，且不保存總開關狀態
      updateDraftSetting(selectedCard, { enabled: enabled });
      
      // 重要修復：單個卡片的變更不會改變總開關狀態
      // 總開關保持用戶最後設定的狀態，不會自動變化
      
      console.log(`${creditCards.find(c => c.id === selectedCard)?.name} 通知狀態已${enabled ? '開啟' : '關閉'}`);
    }
  };

  // 修復：帶確認提示的返回處理
  const handleBackPress = () => {
    if (hasUnsavedChanges) {
      // 如果有未保存的變更，顯示確認對話框
      Alert.alert(
        getText('notifications.unsavedChanges') || '未保存的變更',
        getText('notifications.unsavedChangesMessage') || '您有未保存的通知設定變更，是否要保存？',
        [
          {
            text: getText('notifications.discardChanges') || '捨棄變更',
            style: 'destructive',
            onPress: () => {
              // 捨棄變更，恢復原始設定
              initializeDraftSettings();
              initializeIndividualCardSettings(); // 🔥 修復2：同時恢復個別卡片設定
              onBack();
            }
          },
          {
            text: getText('notifications.saveAndExit') || '保存並退出',
            onPress: () => {
              handleSaveSettings();
              onBack();
            }
          },
          {
            text: getText('common.cancel') || '取消',
            style: 'cancel'
          }
        ]
      );
    } else {
      // 沒有變更，直接返回
      onBack();
    }
  };

  // 🔥 關鍵修復：重寫handleSaveSettings，集成NotificationManager（保持原始邏輯）
  const handleSaveSettings = async () => {
    console.log('🔔 開始保存通知設定並排程通知...');
    
    try {
      // 第一步：將暫存設定保存到系統中（保持原始邏輯）
      Object.keys(draftNotificationSettings).forEach(cardId => {
        if (onUpdateNotificationSettings) {
          // 🔥 修復2：保存時包含個別卡片的詳細設定
          const cardSettings = {
            ...draftNotificationSettings[cardId],
            reminderDays: individualCardSettings[cardId]?.reminderDays || globalReminderDays,
            reminderTimes: individualCardSettings[cardId]?.reminderTimes || globalReminderTimes,
            overdueTime: individualCardSettings[cardId]?.overdueTime || globalOverdueTime
          };
          onUpdateNotificationSettings(cardId, cardSettings);
        }
      });
      
      // 第二步：🔥 新增NotificationManager集成（保持最小修改）
      console.log('🔔 開始為所有卡片排程通知...');
      for (const card of creditCards) {
        const cardSettings = draftNotificationSettings[card.id];
        const individualSettings = individualCardSettings[card.id];
        
        if (cardSettings?.enabled) {
          console.log(`🔔 為卡片 ${card.name} 排程通知...`);
          
          // 構建完整的卡片對象
          const fullCard = {
            id: card.id,
            cardName: card.name,
            name: card.name,
            bank: card.bank,
            number: card.number,
            dueDay: card.dueDay,
            isNotificationEnabled: true,
            isPaidThisMonth: false
          };
          
          // 構建自定義通知規則
          const customRules = [];
          
          // 添加提醒日期規則
          const reminderDays = individualSettings?.reminderDays || globalReminderDays;
          const reminderTimes = individualSettings?.reminderTimes || globalReminderTimes;
          
          reminderDays.forEach(days => {
            customRules.push({
              id: `custom_${days}_days`,
              daysBefore: days,
              times: reminderTimes,
              isEnabled: true
            });
          });
          
          // 添加逾期規則
          const overdueTime = individualSettings?.overdueTime || globalOverdueTime;
          customRules.push({
            id: 'custom_overdue',
            daysBefore: -1,
            times: [overdueTime],
            isEnabled: true,
            isOverdue: true
          });
          
          // 為這張卡片安排通知
          await NotificationManager.scheduleCardNotifications(fullCard, customRules);
          console.log(`✅ 卡片 ${card.name} 的通知已成功排程`);
        } else {
          // 如果卡片通知被關閉，取消該卡片的所有通知
          console.log(`🔔 取消卡片 ${card.name} 的所有通知...`);
          await NotificationManager.cancelCardNotifications(card.id);
        }
      }
      
      // 重置變更標記（保持原始邏輯）
      setHasUnsavedChanges(false);
      
      // 移除過度的成功通知，設定變更通過UI即時反映（保持原始邏輯）
      console.log('✅ 通知設定已保存並排程完成');
      
    } catch (error) {
      console.error('保存通知設定時發生錯誤:', error);
      Alert.alert(
        getText('common.error') || '錯誤',
        getText('notifications.saveError') || '保存通知設定時發生錯誤，請稍後再試。',
        [{ text: getText('common.ok') || '確定' }]
      );
    }
  };

  // 🔥 新增：管理員專用測試通知功能（只有admin能看到）
  const handleTestNotification = async () => {
    try {
      console.log('🔔 發送測試通知...');
      await NotificationManager.sendTestNotification(currentLanguage === 'zh-TW' ? 'zh' : 'en');
      
      Alert.alert(
        getText('notifications.testNotification') || '測試通知',
        getText('notifications.testNotificationSent') || '測試通知已發送！如果您沒有收到通知，請檢查系統設定中的通知權限。',
        [{ text: getText('common.ok') || '確定' }]
      );
    } catch (error) {
      console.error('發送測試通知失敗:', error);
      Alert.alert(
        getText('common.error') || '錯誤',
        getText('notifications.testNotificationError') || '發送測試通知失敗，請確認通知權限已開啟。',
        [{ text: getText('common.ok') || '確定' }]
      );
    }
  };

  // 🔥 簡化的管理員檢查函數
const isAdmin = (userEmail) => {
  const adminEmails = [
    'saihengleung101@gmail.com',
    // 如果日後需要添加其他管理員，在這裡添加Email
  ];
  return adminEmails.includes(userEmail);
};

  const timeOptions = [
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00',
    '20:00', '21:00', '22:00'
  ];

  const dayOptions = [
    { value: 7, labelKey: 'notifications.daysBeforeOptions.7' },
    { value: 3, labelKey: 'notifications.daysBeforeOptions.3' },
    { value: 2, labelKey: 'notifications.daysBeforeOptions.2' },
    { value: 1, labelKey: 'notifications.daysBeforeOptions.1' },
    { value: 0, labelKey: 'notifications.daysBeforeOptions.0' }
  ];

  // 🔥 修復2：重新設計日期切換邏輯，區分全局和個別設定
  const handleDayToggle = (day) => {
    if (selectedCard === 'all') {
      // 🔥 關鍵修復：選擇所有卡片時，修改全局設定
      if (globalReminderDays.includes(day)) {
        setGlobalReminderDays(globalReminderDays.filter(d => d !== day));
      } else {
        setGlobalReminderDays([...globalReminderDays, day].sort((a, b) => b - a));
      }
      
      // 同時應用到所有卡片的個別設定
      const newCardSettings = { ...individualCardSettings };
      creditCards.forEach(card => {
        const currentDays = newCardSettings[card.id]?.reminderDays || globalReminderDays;
        if (currentDays.includes(day)) {
          newCardSettings[card.id] = {
            ...newCardSettings[card.id],
            reminderDays: currentDays.filter(d => d !== day)
          };
        } else {
          newCardSettings[card.id] = {
            ...newCardSettings[card.id],
            reminderDays: [...currentDays, day].sort((a, b) => b - a)
          };
        }
      });
      setIndividualCardSettings(newCardSettings);
      
    } else {
      // 🔥 關鍵修復：選擇特定卡片時，只修改該卡片的設定
      const cardId = selectedCard;
      const currentDays = individualCardSettings[cardId]?.reminderDays || globalReminderDays;
      
      let newDays;
      if (currentDays.includes(day)) {
        newDays = currentDays.filter(d => d !== day);
      } else {
        newDays = [...currentDays, day].sort((a, b) => b - a);
      }
      
      setIndividualCardSettings(prev => ({
        ...prev,
        [cardId]: {
          ...prev[cardId],
          reminderDays: newDays
        }
      }));
    }
    
    setHasUnsavedChanges(true); // 標記為有變更
  };

  // 🔥 修復2：重新設計時間切換邏輯，區分全局和個別設定
  const handleTimeToggle = (time) => {
    if (selectedCard === 'all') {
      // 🔥 關鍵修復：選擇所有卡片時，修改全局設定
      if (globalReminderTimes.includes(time)) {
        if (globalReminderTimes.length > 1) {
          setGlobalReminderTimes(globalReminderTimes.filter(t => t !== time));
        }
      } else {
        setGlobalReminderTimes([...globalReminderTimes, time].sort());
      }
      
      // 同時應用到所有卡片的個別設定
      const newCardSettings = { ...individualCardSettings };
      creditCards.forEach(card => {
        const currentTimes = newCardSettings[card.id]?.reminderTimes || globalReminderTimes;
        if (currentTimes.includes(time)) {
          if (currentTimes.length > 1) {
            newCardSettings[card.id] = {
              ...newCardSettings[card.id],
              reminderTimes: currentTimes.filter(t => t !== time)
            };
          }
        } else {
          newCardSettings[card.id] = {
            ...newCardSettings[card.id],
            reminderTimes: [...currentTimes, time].sort()
          };
        }
      });
      setIndividualCardSettings(newCardSettings);
      
    } else {
      // 🔥 關鍵修復：選擇特定卡片時，只修改該卡片的設定
      const cardId = selectedCard;
      const currentTimes = individualCardSettings[cardId]?.reminderTimes || globalReminderTimes;
      
      let newTimes;
      if (currentTimes.includes(time)) {
        if (currentTimes.length > 1) {
          newTimes = currentTimes.filter(t => t !== time);
        } else {
          newTimes = currentTimes; // 保持至少一個時間
        }
      } else {
        newTimes = [...currentTimes, time].sort();
      }
      
      setIndividualCardSettings(prev => ({
        ...prev,
        [cardId]: {
          ...prev[cardId],
          reminderTimes: newTimes
        }
      }));
    }
    
    setHasUnsavedChanges(true); // 標記為有變更
  };

  // 🔥 修復2：重新設計逾期時間設定邏輯
  const handleOverdueTimeChange = (time) => {
    if (selectedCard === 'all') {
      // 修改全局設定
      setGlobalOverdueTime(time);
      
      // 同時應用到所有卡片
      const newCardSettings = { ...individualCardSettings };
      creditCards.forEach(card => {
        newCardSettings[card.id] = {
          ...newCardSettings[card.id],
          overdueTime: time
        };
      });
      setIndividualCardSettings(newCardSettings);
    } else {
      // 只修改特定卡片的設定
      const cardId = selectedCard;
      setIndividualCardSettings(prev => ({
        ...prev,
        [cardId]: {
          ...prev[cardId],
          overdueTime: time
        }
      }));
    }
    
    setHasUnsavedChanges(true);
  };

  // 🔥 修復2：獲取當前顯示的提醒天數（根據選擇的卡片）
  const getCurrentReminderDays = () => {
    if (selectedCard === 'all') {
      return globalReminderDays;
    } else {
      return individualCardSettings[selectedCard]?.reminderDays || globalReminderDays;
    }
  };

  // 🔥 修復2：獲取當前顯示的提醒時間（根據選擇的卡片）
  const getCurrentReminderTimes = () => {
    if (selectedCard === 'all') {
      return globalReminderTimes;
    } else {
      return individualCardSettings[selectedCard]?.reminderTimes || globalReminderTimes;
    }
  };

  // 🔥 修復2：獲取當前顯示的逾期時間（根據選擇的卡片）
  const getCurrentOverdueTime = () => {
    if (selectedCard === 'all') {
      return globalOverdueTime;
    } else {
      return individualCardSettings[selectedCard]?.overdueTime || globalOverdueTime;
    }
  };

  const getSelectedCardName = () => {
    if (selectedCard === 'all') return getText('notifications.allCards') || '所有卡片';
    const card = creditCards.find(c => c.id === selectedCard);
    return card ? `${card.name} (${card.number ? card.number.slice(-4) : '****'})` : getText('notifications.selectCard') || '選擇卡片';
  };

 // 🔥 修改：簡化的描述文字（移除統計信息）
  const getCardRepaymentReminderDescription = () => {
    if (selectedCard === 'all') {
      return getText('notifications.getNotifiedForDueDates') || '獲取信用卡到期日通知';
    } else {
      const card = creditCards.find(c => c.id === selectedCard);
      if (card) {
        const cardText = getText('notifications.getNotifiedForCard') || '獲取';
        const dueDatesText = getText('notifications.dueDates') || '到期日通知';
        return `${cardText} ${card.name} ${dueDatesText}`;
      }
      return getText('notifications.getNotifiedForDueDates') || '獲取信用卡到期日通知';
    }
  };

// 🔥 新增：獲取卡片統計信息的函數
  const getCardEnabledStats = () => {
    if (selectedCard === 'all') {
      // 實時計算並顯示啟用的卡片數量
      const enabledCount = creditCards.filter(card => 
        draftNotificationSettings[card.id]?.enabled !== false
      ).length;
      
      const totalCount = creditCards.length;
      
      if (totalCount === 0) {
        return null; // 沒有卡片時不顯示統計
      }
      
      const cardsEnabledText = getText('notifications.cardsEnabled') || '張卡片已啟用';
      return `(${enabledCount}/${totalCount} ${cardsEnabledText})`;
    }
    
    return null; // 選擇特定卡片時不顯示統計
  };

  // 檢查是否有變更的視覺提示
  const renderSaveButton = () => {
    return (
      <TouchableOpacity
        style={[
          styles.saveButton,
          hasUnsavedChanges && styles.saveButtonHighlight, // 有變更時高亮顯示
          !hasUnsavedChanges && styles.saveButtonDisabled   // 無變更時灰化
        ]}
        onPress={handleSaveSettings}
        activeOpacity={hasUnsavedChanges ? 0.8 : 1}
        disabled={!hasUnsavedChanges}
      >
        <Text style={[
          styles.saveButtonText,
          hasUnsavedChanges && styles.saveButtonTextHighlight,
          !hasUnsavedChanges && styles.saveButtonTextDisabled
        ]}>
          {hasUnsavedChanges ? 
            (getText('notifications.saveChanges') || '保存變更') :
            (getText('notifications.noChangesToSave') || '無變更需保存')
          }
        </Text>
        {hasUnsavedChanges && (
          <View style={styles.changeIndicator}>
            <Text style={styles.changeIndicatorText}>•</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.rootContainer} {...panResponder.panHandlers}>
      {/* 🔥 背景層：完整的 Home Page 渲染 */}
      <View style={styles.backgroundLayer}>
        <HomePage
          userData={userData}
          creditCards={creditCards}
          paymentHistory={paymentHistory}
          notificationSettings={notificationSettings}
          onNavigate={onNavigate || (() => {})}
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
          {/* Header - 修改為使用自定義返回處理 */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={handleBackPress} // 使用自定義返回處理
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={24} color="#000000" />
            </TouchableOpacity>
            <Text style={styles.title}>{getText('notifications.title') || '通知設定'}</Text>
            {/* 變更指示器 */}
            <View style={styles.headerRight}>
              {hasUnsavedChanges && (
                <View style={styles.unsavedIndicator}>
                  <Text style={styles.unsavedIndicatorText}>•</Text>
                </View>
              )}
            </View>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.content}>
              {/* Card Selection */}
              <View style={styles.cardSelectionSection}>
                <Text style={styles.sectionLabel}>{getText('notifications.applyTo') || '應用於'}</Text>
                <TouchableOpacity
                  style={styles.cardSelector}
                  onPress={() => setShowCardPicker(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cardSelectorText}>{getSelectedCardName()}</Text>
                  <Ionicons name="chevron-down" size={20} color="#666666" />
                </TouchableOpacity>
              </View>

              {/* Card Repayment Reminder - 完全獨立且持久化的總開關版本 */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{getText('notifications.cardRepaymentReminder') || '信用卡還款提醒'}</Text>
                  <Switch
                    value={getCardRepaymentReminderState()}
                    onValueChange={handleCardRepaymentReminderToggle}
                    trackColor={{ false: '#E0E0E0', true: '#4CAF50' }}
                    thumbColor={getCardRepaymentReminderState() ? '#FFFFFF' : '#F5F5F5'}
                  />
                </View>
                
                {getCardRepaymentReminderState() && (
                  <View style={styles.cardContent}>
                    <Text style={styles.settingLabel}>{getCardRepaymentReminderDescription()}</Text>
                    {getCardEnabledStats() && (
                      <Text style={styles.statsLabel}>{getCardEnabledStats()}</Text>
                    )}
                    
                    <View style={styles.reminderDaysSection}>
                      <Text style={styles.subLabel}>{getText('notifications.reminderDays') || '提醒天數'}</Text>
                      <View style={styles.daysGrid}>
                        {dayOptions.map((option) => (
                          <TouchableOpacity
                            key={option.value}
                            style={[
                              styles.dayOption,
                              getCurrentReminderDays().includes(option.value) && styles.dayOptionSelected
                            ]}
                            onPress={() => handleDayToggle(option.value)}
                            activeOpacity={0.7}
                          >
                            <Text style={[
                              styles.dayOptionText,
                              getCurrentReminderDays().includes(option.value) && styles.dayOptionTextSelected
                            ]}>
                              {getText(option.labelKey) || `${option.value} 天前`}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    <View style={styles.reminderTimesSection}>
                      <Text style={styles.subLabel}>{getText('notifications.reminderTimes') || '提醒時間'}</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={styles.timesRow}>
                          {timeOptions.map((time) => (
                            <TouchableOpacity
                              key={time}
                              style={[
                                styles.timeOption,
                                getCurrentReminderTimes().includes(time) && styles.timeOptionSelected
                              ]}
                              onPress={() => handleTimeToggle(time)}
                              activeOpacity={0.7}
                            >
                              <Text style={[
                                styles.timeOptionText,
                                getCurrentReminderTimes().includes(time) && styles.timeOptionTextSelected
                              ]}>
                                {time}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </ScrollView>
                    </View>
                  </View>
                )}
              </View>

              {/* Payment Overdue Alert - 保持原設計 */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{getText('notifications.paymentOverdueAlert') || '逾期付款提醒'}</Text>
                  <Switch
                    value={paymentDueEnabled}
                    onValueChange={(enabled) => {
                      setPaymentDueEnabled(enabled);
                      setHasUnsavedChanges(true);
                    }}
                    trackColor={{ false: '#E0E0E0', true: '#4CAF50' }}
                    thumbColor={paymentDueEnabled ? '#FFFFFF' : '#F5F5F5'}
                  />
                </View>
                
                {paymentDueEnabled && (
                  <View style={styles.cardContent}>
                    <Text style={styles.settingLabel}>
                      {getText('notifications.receiveOverdueAlerts') || '接收逾期提醒通知'}
                    </Text>
                    
                    <View style={styles.overdueSection}>
                      <Text style={styles.subLabel}>{getText('notifications.overdueReminderTime') || '逾期提醒時間'}</Text>
                      <TouchableOpacity
                        style={styles.overdueTimeSelector}
                        onPress={() => {
                          setCurrentPickerType('overdue');
                          setShowTimePicker(true);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.overdueTimeText}>{getCurrentOverdueTime()}</Text>
                        <Ionicons name="time-outline" size={20} color="#666666" />
                      </TouchableOpacity>
                      <Text style={styles.overdueDescription}>
                        {getText('notifications.dailyReminderAfterOverdue') || '逾期後每日提醒'}
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              {/* 🔥 管理員專用測試通知按鈕（只有admin能看到） */}
              {isAdmin(userData.email) && (
                <View style={styles.card}>
                  <TouchableOpacity
                    style={styles.testButton}
                    onPress={handleTestNotification}
                    activeOpacity={0.7}
                  >
                    <MaterialIcons name="notifications-active" size={24} color="#000000" />
                    <Text style={styles.testButtonText}>
                      {getText('notifications.sendTestNotification') || '發送測試通知'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* 智能保存按鈕 */}
              {renderSaveButton()}
            </View>
          </ScrollView>

          {/* Card Picker Modal */}
          <Modal
            visible={showCardPicker}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowCardPicker(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>{getText('notifications.selectCard') || '選擇卡片'}</Text>
                
                <TouchableOpacity
                  style={[
                    styles.modalOption,
                    selectedCard === 'all' && styles.modalOptionSelected
                  ]}
                  onPress={() => {
                    setSelectedCard('all');
                    setShowCardPicker(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.modalOptionText,
                    selectedCard === 'all' && styles.modalOptionTextSelected
                  ]}>
                    {getText('notifications.allCards') || '所有卡片'}
                  </Text>
                  {selectedCard === 'all' && (
                    <Ionicons name="checkmark" size={20} color="#000000" />
                  )}
                </TouchableOpacity>
                
                {creditCards.map((card) => (
                  <TouchableOpacity
                    key={card.id}
                    style={[
                      styles.modalOption,
                      selectedCard === card.id && styles.modalOptionSelected
                    ]}
                    onPress={() => {
                      setSelectedCard(card.id);
                      setShowCardPicker(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.modalOptionText,
                      selectedCard === card.id && styles.modalOptionTextSelected
                    ]}>
                      {card.name} ({card.number ? card.number.slice(-4) : '****'})
                    </Text>
                    {selectedCard === card.id && (
                      <Ionicons name="checkmark" size={20} color="#000000" />
                    )}
                  </TouchableOpacity>
                ))}
                
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => setShowCardPicker(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalCancelText}>{getText('common.cancel') || '取消'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {/* Time Picker Modal */}
          <Modal
            visible={showTimePicker}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowTimePicker(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>
                  {getText('notifications.selectTime') || '選擇時間'}
                </Text>
                
                <ScrollView style={styles.timePickerContainer} showsVerticalScrollIndicator={false}>
                  {timeOptions.map((time) => (
                    <TouchableOpacity
                      key={time}
                      style={[
                        styles.modalOption,
                        getCurrentOverdueTime() === time && styles.modalOptionSelected
                      ]}
                      onPress={() => {
                        handleOverdueTimeChange(time);
                        setShowTimePicker(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.modalOptionText,
                        getCurrentOverdueTime() === time && styles.modalOptionTextSelected
                      ]}>
                        {time}
                      </Text>
                      {getCurrentOverdueTime() === time && (
                        <Ionicons name="checkmark" size={20} color="#000000" />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => setShowTimePicker(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalCancelText}>{getText('common.cancel') || '取消'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
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
  // 頭部右側和變更指示器樣式
  headerRight: {
    width: 40,
    alignItems: 'center',
  },
  unsavedIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF5722',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unsavedIndicatorText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  cardSelectionSection: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  cardSelector: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cardSelectorText: {
    fontSize: 16,
    color: '#000000',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  cardContent: {
    padding: 16,
  },
  settingLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
    lineHeight: 20,
  },
  statsLabel: {
    fontSize: 12,
    color: '#999999',
    marginBottom: 16,
    marginTop: -12, // 縮短與上一行的距離
    lineHeight: 16,
    fontStyle: 'italic',
  },
  subLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 8,
  },
  reminderDaysSection: {
    marginBottom: 20,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  dayOption: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    margin: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  dayOptionSelected: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  dayOptionText: {
    fontSize: 14,
    color: '#333333',
  },
  dayOptionTextSelected: {
    color: '#FFFFFF',
  },
  reminderTimesSection: {
    marginBottom: 16,
  },
  timesRow: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  timeOption: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  timeOptionSelected: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  timeOptionText: {
    fontSize: 14,
    color: '#333333',
  },
  timeOptionTextSelected: {
    color: '#FFFFFF',
  },
  overdueSection: {
    marginTop: 8,
  },
  overdueTimeSelector: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 8,
  },
  overdueTimeText: {
    fontSize: 16,
    color: '#000000',
  },
  overdueDescription: {
    fontSize: 12,
    color: '#666666',
    fontStyle: 'italic',
  },
  // 🔥 測試按鈕樣式（管理員專用，保持黑色主題）
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 10,
  },
  testButtonText: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '500',
  },
  // 智能保存按鈕樣式（保持原始黑色設計）
  saveButton: {
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'relative',
  },
  saveButtonHighlight: {
    backgroundColor: '#000000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  saveButtonDisabled: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonTextHighlight: {
    color: '#FFFFFF',
  },
  saveButtonTextDisabled: {
    color: '#999999',
  },
  changeIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF5722',
    justifyContent: 'center',
    alignItems: 'center',
  },
  changeIndicatorText: {
    color: '#FFFFFF',
    fontSize: 6,
    fontWeight: 'bold',
  },
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
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalOptionSelected: {
    backgroundColor: '#F5F5F5',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#333333',
  },
  modalOptionTextSelected: {
    fontWeight: '600',
    color: '#000000',
  },
  modalCancelButton: {
    marginTop: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#666666',
  },
  timePickerContainer: {
    maxHeight: 300,
  },
});