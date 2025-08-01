// components/HomePage.js - 🔥 優化版：移除冗餘UI元素，保持極簡設計
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  Modal,
  StatusBar,
  Dimensions,
  Image,
  PanResponder,
  Animated
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import StatsDropdown from './StatsDropdown';

const { width } = Dimensions.get('window');

export default function HomePage({ 
  userData = { name: 'User', avatar: null }, 
  creditCards = [], 
  paymentHistory = [],
  notificationSettings = {}, 
  onNavigate,
  getText, 
  currentLanguage 
}) {

  const [selectedDate, setSelectedDate] = useState(null);
  const [showDateModal, setShowDateModal] = useState(false);
  const [showStatsDropdown, setShowStatsDropdown] = useState(false);
  
  const [currentDisplayMonth, setCurrentDisplayMonth] = useState(new Date().getMonth());
  const [currentDisplayYear, setCurrentDisplayYear] = useState(new Date().getFullYear());
  
  const [showMonthYearPicker, setShowMonthYearPicker] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // 🔥 日曆滑動功能的動畫狀態（保留核心功能，移除提示相關狀態）
  const [calendarSlideAnimation] = useState(new Animated.Value(0));

  // 檢查卡片通知是否啟用
  const isCardNotificationEnabled = (cardId) => {
    return notificationSettings[cardId]?.enabled !== false;
  };

  // 🔥 核心函數：檢查特定月份的付款狀態
  // 這是整個系統的基礎，所有其他邏輯都依賴於這個函數的準確性
  const isCardPaidForMonth = (cardId, year, month) => {
    const monthString = `${year}-${String(month + 1).padStart(2, '0')}`;
    const payment = paymentHistory.find(payment => 
      payment.cardId === cardId && 
      payment.month === monthString &&
      payment.onTime !== undefined
    );
    
    console.log(`🔍 HomePage檢查付款狀態: 卡片${cardId}, 月份${monthString}, 結果: ${!!payment}`);
    return !!payment;
  };

  // 🔥 革命性的核心邏輯：正確的帳單月份判斷系統
  // 這個函數體現了我們的核心設計原則：狀態驅動邏輯
  const determineCurrentBillStatus = (card) => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0-11
    const currentDay = today.getDate();
    const dueDay = parseInt(card.dueDay);
    
    console.log(`\n=== HomePage: 分析卡片 ${card.name} 的帳單狀態 ===`);
    console.log(`今天: ${currentYear}-${currentMonth + 1}-${currentDay}`);
    console.log(`到期日: 每月${dueDay}日`);
    
    // 🎯 第一步：檢查當前月份的付款狀態
    // 這是最重要的一步，決定了整個邏輯的走向
    const currentMonthPaid = isCardPaidForMonth(card.id, currentYear, currentMonth);
    console.log(`當前月份(${currentMonth + 1}月)付款狀態: ${currentMonthPaid}`);
    
    if (!currentMonthPaid) {
      // 🚨 關鍵邏輯：當前月份未付款，這是我們需要關注的帳單
      console.log(`✨ 邏輯判斷: 當前月份未付款，需要處理當月帳單`);
      
      const currentMonthDueDate = new Date(currentYear, currentMonth, dueDay);
      const timeDiff = currentMonthDueDate - today;
      const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
      
      return {
        billYear: currentYear,
        billMonth: currentMonth,
        billMonthString: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`,
        dueDate: currentMonthDueDate,
        daysDiff: daysDiff,
        isPaid: false,
        reason: 'current_month_unpaid'
      };
    } else {
      // ✅ 當前月份已付款，考慮下個月的帳單
      console.log(`✅ 邏輯判斷: 當前月份已付款，檢查下個月帳單`);
      
      let nextMonth = currentMonth + 1;
      let nextYear = currentYear;
      
      if (nextMonth > 11) {
        nextMonth = 0;
        nextYear = currentYear + 1;
      }
      
      const nextMonthDueDate = new Date(nextYear, nextMonth, dueDay);
      const timeDiff = nextMonthDueDate - today;
      const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
      
      // 檢查下個月是否也已經付款（提前還款的情況）
      const nextMonthPaid = isCardPaidForMonth(card.id, nextYear, nextMonth);
      
      return {
        billYear: nextYear,
        billMonth: nextMonth,
        billMonthString: `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}`,
        dueDate: nextMonthDueDate,
        daysDiff: daysDiff,
        isPaid: nextMonthPaid,
        reason: nextMonthPaid ? 'next_month_paid' : 'next_month_unpaid'
      };
    }
  };

  // 🔥 狀態計算邏輯：基於正確的帳單狀態進行顯示計算
  const calculatePaymentStatusForDisplay = (card) => {
    console.log(`\n=== HomePage: 計算卡片 ${card.name} 的顯示狀態 ===`);
    
    // 步驟1：獲取正確的帳單狀態
    const billStatus = determineCurrentBillStatus(card);
    
    console.log(`帳單狀態分析結果:`, {
      月份: `${billStatus.billYear}-${billStatus.billMonth + 1}`,
      到期日: billStatus.dueDate.toDateString(),
      天數差: billStatus.daysDiff,
      是否已付款: billStatus.isPaid,
      原因: billStatus.reason
    });
    
    // 步驟2：檢查通知設定
    const notificationEnabled = isCardNotificationEnabled(card.id);
    if (!notificationEnabled) {
      console.log(`🔕 通知已關閉，不顯示此卡片`);
      return {
        type: 'notification_disabled',
        days: 0,
        text: '',
        cardId: card.id,
        isPaid: false,
        notificationEnabled: false,
        shouldShow: false,
        shouldHide: true
      };
    }
    
    // 步驟3：基於付款狀態和時間差計算顯示狀態
    if (billStatus.isPaid) {
      console.log(`✅ 已付款狀態`);
      return {
        type: 'paid',
        days: 0,
        text: getText('home.paid') || 'Paid',
        cardId: card.id,
        isPaid: true,
        notificationEnabled: true,
        displayColor: 'green',
        shouldShow: true,
        billInfo: billStatus
      };
    }
    
    // 未付款狀態的詳細分析
    const daysDiff = billStatus.daysDiff;
    
    if (daysDiff < 0) {
      // 逾期情況 - 這是修復的關鍵部分
      const daysPast = Math.abs(daysDiff);
      const overdueText = currentLanguage === 'zh-TW' ? 
        `逾期${daysPast}天` : 
        `${daysPast} days overdue`;
      
      console.log(`❌ 逾期狀態: ${overdueText}`);
      return {
        type: 'overdue',
        days: daysPast,
        text: overdueText,
        cardId: card.id,
        isPaid: false,
        notificationEnabled: true,
        displayColor: 'darkred',
        shouldShow: true,
        billInfo: billStatus
      };
    } else if (daysDiff === 0) {
      // 今天到期
      console.log(`⚠️ 今天到期`);
      return {
        type: 'due_today',
        days: 0,
        text: getText('home.dueToday') || 'Due Today',
        cardId: card.id,
        isPaid: false,
        notificationEnabled: true,
        displayColor: 'orange',
        shouldShow: true,
        billInfo: billStatus
      };
    } else {
      // 未來到期
      const daysLeftText = currentLanguage === 'zh-TW' ? 
        `剩餘${daysDiff}天` : 
        `${daysDiff} ${getText('home.daysLeft') || 'days left'}`;
      
      console.log(`✏️ 未來到期: ${daysLeftText}`);
      return {
        type: 'upcoming',
        days: daysDiff,
        text: daysLeftText,
        cardId: card.id,
        isPaid: false,
        notificationEnabled: true,
        displayColor: 'red',
        shouldShow: true,
        billInfo: billStatus
      };
    }
  };

  // 🔥 日曆顯示的狀態計算（針對特定日期）
  const calculatePaymentStatusForCalendar = (card, targetDate) => {
    const targetYear = targetDate.getFullYear();
    const targetMonth = targetDate.getMonth();
    const targetDay = targetDate.getDate();
    const dueDay = parseInt(card.dueDay);
    
    // 只有在到期日才顯示
    if (targetDay !== dueDay) {
      return null;
    }
    
    // 檢查該月份是否已付款
    const isPaid = isCardPaidForMonth(card.id, targetYear, targetMonth);
    
    // 檢查通知設定
    const notificationEnabled = isCardNotificationEnabled(card.id);
    if (!notificationEnabled) {
      return null; // 通知關閉的卡片不在日曆上顯示
    }
    
    const today = new Date();
    const dueDate = new Date(targetYear, targetMonth, dueDay);
    const timeDiff = dueDate - today;
    const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    
    if (isPaid) {
      return {
        type: 'paid',
        isPaid: true,
        displayColor: 'green'
      };
    } else if (daysDiff < 0) {
      return {
        type: 'overdue',
        isPaid: false,
        displayColor: 'darkred'
      };
    } else if (daysDiff === 0) {
      return {
        type: 'due_today',
        isPaid: false,
        displayColor: 'orange'
      };
    } else {
      return {
        type: 'upcoming',
        isPaid: false,
        displayColor: 'red'
      };
    }
  };

  // 🔥 獲取需要顯示的卡片列表
  const getNextDueCards = () => {
    if (!creditCards || creditCards.length === 0) return [];
    
    console.log(`\n=== HomePage: 開始處理 ${creditCards.length} 張信用卡 ===`);
    
    // 為每張卡片計算狀態
    const cardsWithStatus = creditCards.map(card => {
      const status = calculatePaymentStatusForDisplay(card);
      return { ...card, paymentStatus: status };
    });
    
    // 過濾可顯示的卡片
    const visibleCards = cardsWithStatus.filter(card => {
      return card.paymentStatus.shouldShow && !card.paymentStatus.shouldHide;
    });
    
    console.log(`可見卡片數量: ${visibleCards.length}`);
    
    if (visibleCards.length === 0) {
      return [];
    }
    
    // 智能分類和排序
    const overdueCards = visibleCards.filter(card => card.paymentStatus.type === 'overdue');
    const todayCards = visibleCards.filter(card => card.paymentStatus.type === 'due_today');
    const upcomingCards = visibleCards.filter(card => card.paymentStatus.type === 'upcoming');
    const paidCards = visibleCards.filter(card => card.paymentStatus.type === 'paid');
    
    const unpaidCards = [...overdueCards, ...todayCards, ...upcomingCards];
    
    if (unpaidCards.length > 0) {
      // 有未付款卡片，按優先級顯示
      if (overdueCards.length > 0) {
        // 逾期卡片按逾期天數排序（逾期越久越優先）
        return overdueCards.sort((a, b) => b.paymentStatus.days - a.paymentStatus.days);
      } else if (todayCards.length > 0) {
        return todayCards;
      } else {
        // 即將到期的卡片按剩餘天數排序（越近越優先）
        return upcomingCards.sort((a, b) => a.paymentStatus.days - b.paymentStatus.days);
      }
    } else if (paidCards.length > 0) {
      // 所有卡片都已付款
      return [{
        id: 'all_paid_indicator',
        name: 'All Cards',
        bank: 'Completed',
        paymentStatus: {
          type: 'all_paid',
          days: 0,
          text: currentLanguage === 'zh-TW' ? '所有信用卡已付款' : 'All cards paid',
          cardId: 'all_paid',
          isPaid: true,
          notificationEnabled: true,
          displayColor: 'green',
          shouldShow: true
        }
      }];
    }
    
    return [];
  };

  // 🔥 優化版日曆滑動手勢響應器：移除所有提示相關邏輯
  const calendarPanResponder = PanResponder.create({
    // 檢測是否應該開始處理手勢
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      // 🔥 更寬鬆的滑動開始條件：降低門檻讓用戶更容易開始滑動
      const minSwipeDistance = 2; // 從5像素降低到2像素
      const horizontal = Math.abs(gestureState.dx);
      const vertical = Math.abs(gestureState.dy);
  
      // 🔥 更寬鬆的方向判斷：水平移動只需要達到垂直移動的70%即可
      return horizontal > minSwipeDistance && horizontal > vertical * 0.7;
    },
    
    // 開始手勢處理
    onPanResponderGrant: (evt, gestureState) => {
      calendarSlideAnimation.setValue(0);
      console.log('🔥 日曆滑動開始');
    },
    
    // 手勢移動過程中
    onPanResponderMove: (evt, gestureState) => {
      // 實時更新動畫值，跟隨手指移動
      const moveDistance = gestureState.dx;
      const maxDistance = width * 0.3; // 最大滑動距離為螢幕寬度的30%
      const clampedDistance = Math.max(-maxDistance, Math.min(maxDistance, moveDistance));
      
      calendarSlideAnimation.setValue(clampedDistance);
    },
    
    // 手勢結束處理
    onPanResponderRelease: (evt, gestureState) => {
      const swipeDistance = Math.abs(gestureState.dx);
      const swipeVelocity = Math.abs(gestureState.vx);
      const threshold = width * 0.08; // 🔥 更容易觸發：從15%降低到8%，讓滑動更敏感
      
      console.log('👋 日曆滑動結束', {
        distance: swipeDistance,
        velocity: swipeVelocity,
        direction: gestureState.dx > 0 ? 'right' : 'left'
      });
      
      // 判斷是否應該切換月份
      // 🔥 更容易切換：降低速度要求，讓快速輕滑也能切換
      const shouldChange = swipeDistance > threshold || swipeVelocity > 0.15;
      
      if (shouldChange) {
        if (gestureState.dx > 0) {
          // 向右滑動：切換到上一個月
          handlePreviousMonth();
          console.log('📅 切換到上一個月');
        } else {
          // 向左滑動：切換到下一個月  
          handleNextMonth();
          console.log('📅 切換到下一個月');
        }
        
        // 執行切換動畫
        Animated.timing(calendarSlideAnimation, {
          toValue: gestureState.dx > 0 ? width : -width,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          // 動畫完成後重置
          calendarSlideAnimation.setValue(0);
        });
      } else {
        // 滑動距離不足，回彈到原位
        Animated.spring(calendarSlideAnimation, {
          toValue: 0,
          tension: 150,
          friction: 8,
          useNativeDriver: true,
        }).start();
      }
    },
    
    // 手勢被中斷
    onPanResponderTerminate: (evt, gestureState) => {
      // 如果手勢被中斷，回彈到原位
      Animated.spring(calendarSlideAnimation, {
        toValue: 0,
        tension: 150,
        friction: 8,
        useNativeDriver: true,
      }).start();
    },
  });

  // 🔥 處理上一個月切換
  const handlePreviousMonth = () => {
    let newMonth = currentDisplayMonth - 1;
    let newYear = currentDisplayYear;
    
    if (newMonth < 0) {
      newMonth = 11; // 回到12月
      newYear = currentDisplayYear - 1;
    }
    
    setCurrentDisplayMonth(newMonth);
    setCurrentDisplayYear(newYear);
    
    console.log(`📅 切換到上一個月: ${newYear}年${newMonth + 1}月`);
  };

  // 🔥 處理下一個月切換
  const handleNextMonth = () => {
    let newMonth = currentDisplayMonth + 1;
    let newYear = currentDisplayYear;
    
    if (newMonth > 11) {
      newMonth = 0; // 回到1月
      newYear = currentDisplayYear + 1;
    }
    
    setCurrentDisplayMonth(newMonth);
    setCurrentDisplayYear(newYear);
    
    console.log(`📅 切換到下一個月: ${newYear}年${newMonth + 1}月`);
  };

  // 日曆生成邏輯
  const generateCalendar = (year = currentDisplayYear, month = currentDisplayMonth) => {
    const today = new Date();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const calendar = [];
    const current = new Date(startDate);
    
    for (let week = 0; week < 6; week++) {
      const weekDays = [];
      for (let day = 0; day < 7; day++) {
        const isCurrentMonth = current.getMonth() === month;
        const isToday = current.toDateString() === today.toDateString();
        
        // 檢查這一天是否有還款
        const dayPayments = [];
        let dotColor = '#F44336';
        let dotCount = 0;
        let hasPayment = false;
        
        if (isCurrentMonth) {
          creditCards.forEach(card => {
            const status = calculatePaymentStatusForCalendar(card, current);
            if (status) {
              dayPayments.push({ ...card, paymentStatus: status });
            }
          });
          
          if (dayPayments.length > 0) {
            hasPayment = true;
            const paidCards = dayPayments.filter(card => card.paymentStatus.isPaid);
            const unpaidCards = dayPayments.filter(card => !card.paymentStatus.isPaid);
            
            if (paidCards.length > 0 && unpaidCards.length === 0) {
              dotColor = '#4CAF50';
              dotCount = paidCards.length;
            } else {
              dotColor = '#F44336';
              dotCount = unpaidCards.length;
            }
          }
        }
        
        weekDays.push({
          date: new Date(current),
          day: current.getDate(),
          isCurrentMonth,
          isToday,
          hasPayment,
          payments: dayPayments,
          dotColor,
          dotCount
        });
        
        current.setDate(current.getDate() + 1);
      }
      calendar.push(weekDays);
    }
    
    return calendar;
  };

  // 處理日期點擊
  const handleDatePress = (dateInfo) => {
    if (!dateInfo.isCurrentMonth) {
      const clickedDate = dateInfo.date;
      setCurrentDisplayMonth(clickedDate.getMonth());
      setCurrentDisplayYear(clickedDate.getFullYear());
      return;
    }
    
    if (dateInfo.hasPayment && dateInfo.payments.length > 0) {
      setSelectedDate(dateInfo);
      setShowDateModal(true);
    }
  };

  // 格式化月份年份
  const formatMonthYear = (year = currentDisplayYear, month = currentDisplayMonth) => {
    if (currentLanguage === 'zh-TW') {
      return `${year}年${month + 1}月`;
    } else {
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
      return `${monthNames[month]} ${year}`;
    }
  };

  // 處理月份年份選擇
  const handleMonthYearSelection = () => {
    setCurrentDisplayMonth(selectedMonth);
    setCurrentDisplayYear(selectedYear);
    setShowMonthYearPicker(false);
  };

  // 生成年份選項
  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 5; i <= currentYear + 5; i++) {
      years.push(i);
    }
    return years;
  };

  // 月份名稱數組
  const getMonthNames = () => {
    if (currentLanguage === 'zh-TW') {
      return ['1月', '2月', '3月', '4月', '5月', '6月',
        '7月', '8月', '9月', '10月', '11月', '12月'];
    } else {
      return ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    }
  };

  // 格式化彈窗日期標題
  const formatModalDate = (date) => {
    if (currentLanguage === 'zh-TW') {
      return `${date.getMonth() + 1}月${date.getDate()}日應付款`;
    } else {
      return `${date.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric' 
      })} ${getText('home.payments') || 'Payments'}`;
    }
  };

  const monthNames = getMonthNames();
  const nextDueCards = getNextDueCards();
  const calendar = generateCalendar(currentDisplayYear, currentDisplayMonth);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#66D9A3" />
      
      {/* 頭部區域 */}
      <View style={styles.header}>
        <Svg 
          style={styles.headerDecorative}
          width="100%" 
          height="100%" 
          viewBox="0 0 400 100"
          preserveAspectRatio="none"
        >
          <Path
            d="M0,60 Q100,20 200,40 T400,30 L400,100 L0,100 Z"
            fill="rgba(255,255,255,0.15)"
          />
          <Path
            d="M0,80 Q150,30 300,50 T400,45 L400,100 L0,100 Z"
            fill="rgba(255,255,255,0.08)"
          />
          <Path
            d="M50,10 Q150,30 250,15 T350,25"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="2"
            fill="none"
          />
        </Svg>
        
        <View style={styles.headerContent}>
          <Text style={styles.welcomeText}>{getText ? getText('home.welcome') : 'Welcome'}, {userData.name}!</Text>
          
          <View style={styles.headerButtons}>
            <TouchableOpacity 
              style={styles.notificationButton}
              onPress={() => onNavigate && onNavigate('Notifications')}
              activeOpacity={0.7}
            >
              <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.avatarButton}
              onPress={() => onNavigate && onNavigate('Profile')}
              activeOpacity={0.7}
            >
              <View style={styles.avatarContainer}>
                {userData.avatar ? (
                  <Image source={{ uri: userData.avatar }} style={styles.avatarImage} />
                ) : (
                  <MaterialIcons name="person" size={24} color="#FFFFFF" />
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* 🔥 優化版：移除右上角月份年份顯示的下一個到期付款卡片 */}
        <View style={styles.upcomingPaymentCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{getText ? getText('home.nextUpcomingDue') : 'Next Upcoming Due'}</Text>
            {/* 🚨 已移除：<Text style={styles.monthYear}>{formatMonthYear()}</Text> */}
          </View>
          
          {nextDueCards.length > 0 ? (
            <View style={styles.paymentContent}>
              {nextDueCards[0].paymentStatus.type === 'all_paid' ? (
                <View style={styles.allPaidContent}>
                  <MaterialIcons name="check-circle" size={32} color="#4CAF50" />
                  <Text style={styles.allPaidText}>
                    {currentLanguage === 'zh-TW' ? '所有信用卡已付款' : 'All credit cards paid'}
                  </Text>
                </View>
              ) : (
                <>
                  {nextDueCards.length > 1 && (
                    <View style={styles.cardCounter}>
                      <Text style={styles.cardCounterText}>
                        {nextDueCards.length} {getText('home.cardsText') || 'cards'}
                      </Text>
                    </View>
                  )}
                  
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    pagingEnabled={true}
                    style={styles.cardsScrollView}
                  >
                    {nextDueCards.map((card, index) => (
                      <View key={card.id} style={styles.cardSlide}>
                        <View style={[
                          styles.countdownBadge,
                          card.paymentStatus.type === 'overdue' && styles.overdueBadge,
                          card.paymentStatus.type === 'due_today' && styles.todayBadge,
                          card.paymentStatus.type === 'upcoming' && styles.upcomingBadge,
                          card.paymentStatus.type === 'paid' && styles.paidBadge
                        ]}>
                          <Text style={styles.countdownText}>
                            {card.paymentStatus.text}
                          </Text>
                        </View>
                        
                        <View style={styles.cardInfo}>
                          <Text style={styles.cardName}>{card.name}</Text>
                          <Text style={styles.bankName}>{card.bank}</Text>
                        </View>
                        
                        {nextDueCards.length > 1 && (
                          <View style={styles.cardIndicator}>
                            <Text style={styles.cardIndicatorText}>
                              {index + 1}/{nextDueCards.length}
                            </Text>
                          </View>
                        )}
                      </View>
                    ))}
                  </ScrollView>
                </>
              )}
            </View>
          ) : (
            <View style={styles.noPaymentContent}>
              <MaterialIcons name="check-circle" size={48} color="#4CAF50" />
              <Text style={styles.noPaymentText}>{getText ? getText('home.noUpcomingPayments') : 'No upcoming payments'}</Text>
            </View>
          )}
        </View>

        {/* 🔥 極簡版付款日曆：純滑動切換，移除所有冗餘元素 */}
        <View style={styles.calendarSection}>
          <View style={styles.calendarHeader}>
            <Text style={styles.sectionTitle}>{getText ? getText('home.paymentCalendar') : 'Payment Calendar'}</Text>
            {/* 🔥 優化版：移除箭頭按鈕，只保留可點擊的月份標題 */}
            <TouchableOpacity 
              onPress={() => {
                setSelectedMonth(currentDisplayMonth);
                setSelectedYear(currentDisplayYear);
                setShowMonthYearPicker(true);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.currentMonth}>{formatMonthYear(currentDisplayYear, currentDisplayMonth)}</Text>
            </TouchableOpacity>
          </View>
          
          {/* 🚨 已移除：滑動提示文字 */}
          
          {/* 🔥 純淨的滑動日曆容器：無任何提示或指示器 */}
          <View style={styles.calendarContainer} {...calendarPanResponder.panHandlers}>
            <Animated.View 
              style={[
                styles.calendar,
                {
                  transform: [{
                    translateX: calendarSlideAnimation
                  }]
                }
              ]}
            >
              <View style={styles.weekHeader}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                  <View key={index} style={styles.weekDayHeader}>
                    <Text style={styles.weekDayText}>{day}</Text>
                  </View>
                ))}
              </View>
              
              {calendar.map((week, weekIndex) => (
                <View key={weekIndex} style={styles.weekRow}>
                  {week.map((dateInfo, dayIndex) => (
                    <TouchableOpacity
                      key={dayIndex}
                      style={[
                        styles.dateCell,
                        !dateInfo.isCurrentMonth && styles.dateCellInactive,
                        dateInfo.isToday && styles.dateCellToday,
                        dateInfo.hasPayment && dateInfo.dotColor === '#4CAF50' && styles.dateCellWithPaidPayment,
                        dateInfo.hasPayment && dateInfo.dotColor === '#F44336' && styles.dateCellWithPayment
                      ]}
                      onPress={() => handleDatePress(dateInfo)}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.dateText,
                        !dateInfo.isCurrentMonth && styles.dateTextInactive,
                        dateInfo.isToday && styles.dateTextToday,
                        dateInfo.hasPayment && dateInfo.dotColor === '#4CAF50' && styles.dateTextWithPaidPayment,
                        dateInfo.hasPayment && dateInfo.dotColor === '#F44336' && styles.dateTextWithPayment
                      ]}>
                        {dateInfo.day}
                      </Text>
                      {dateInfo.hasPayment && dateInfo.dotCount > 0 && (
                        <View style={[
                          styles.paymentDot,
                          { backgroundColor: dateInfo.dotColor }
                        ]}>
                          <Text style={styles.paymentCount}>{dateInfo.dotCount}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </Animated.View>
            
            {/* 🚨 已移除：滑動方向指示器 */}
          </View>
        </View>
      </ScrollView>

      {/* 底部導航欄 */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => onNavigate && onNavigate('Explore')}
          activeOpacity={0.7}
        >
          <MaterialIcons name="explore" size={24} color="#999999" />
          <Text style={styles.navText}>{getText ? getText('home.explore') : 'Explore'}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => onNavigate && onNavigate('MyCards')}
          activeOpacity={0.7}
        >
          <MaterialIcons name="credit-card" size={24} color="#007AFF" />
          <Text style={[styles.navText, styles.navTextActive]}>{getText ? getText('home.myCards') : 'My Cards'}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => setShowStatsDropdown(true)}
          activeOpacity={0.7}
        >
          <MaterialIcons name="bar-chart" size={24} color="#999999" />
          <Text style={styles.navText}>{getText ? getText('home.stats') : 'Stats'}</Text>
        </TouchableOpacity>
      </View>

      {/* 日期詳情彈窗 */}
      <Modal
        visible={showDateModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedDate && formatModalDate(selectedDate.date)}
              </Text>
              <TouchableOpacity 
                onPress={() => setShowDateModal(false)}
                style={styles.closeButton}
              >
                <MaterialIcons name="close" size={24} color="#666666" />
              </TouchableOpacity>
            </View>
            
            {selectedDate?.payments.map((payment, index) => {
              return (
                <View key={index} style={styles.paymentItem}>
                  <View style={styles.paymentInfo}>
                    <Text style={styles.paymentCardName}>{payment.name}</Text>
                    <Text style={styles.paymentBankName}>{payment.bank}</Text>
                  </View>
                  <View style={styles.countdownInfo}>
                    <Text style={[
                      styles.countdownLabel,
                      payment.paymentStatus.isPaid && styles.paidLabel,
                      payment.paymentStatus.type === 'overdue' && styles.overdueLabel,
                      payment.paymentStatus.type === 'due_today' && styles.todayLabel,
                      payment.paymentStatus.type === 'upcoming' && styles.upcomingLabel
                    ]}>
                      {payment.paymentStatus.isPaid ? 
                        (getText('home.paid') || 'Paid') :
                        payment.paymentStatus.type === 'overdue' ? 
                          (getText('home.overdue') || 'Overdue') :
                        payment.paymentStatus.type === 'due_today' ?
                          (getText('home.dueToday') || 'Due Today') :
                          (getText('home.upcoming') || 'Upcoming')
                      }
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </Modal>

      {/* 月份年份選擇器 */}
      <Modal
        visible={showMonthYearPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowMonthYearPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.pickerModalContent}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>{getText ? getText('home.selectMonthYear') : 'Select Month & Year'}</Text>
              <TouchableOpacity 
                onPress={() => setShowMonthYearPicker(false)}
                style={styles.closeButton}
              >
                <MaterialIcons name="close" size={24} color="#666666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.pickersContainer}>
              <View style={styles.pickerSection}>
                <Text style={styles.pickerLabel}>{getText ? getText('home.month') : 'Month'}</Text>
                <ScrollView style={styles.optionsContainer} showsVerticalScrollIndicator={false}>
                  {monthNames.map((month, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.optionItem,
                        selectedMonth === index && styles.selectedOptionItem
                      ]}
                      onPress={() => setSelectedMonth(index)}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.optionText,
                        selectedMonth === index && styles.selectedOptionText
                      ]}>
                        {month}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              
              <View style={styles.pickerSection}>
                <Text style={styles.pickerLabel}>{getText ? getText('home.year') : 'Year'}</Text>
                <ScrollView style={styles.optionsContainer} showsVerticalScrollIndicator={false}>
                  {generateYearOptions().map((year, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.optionItem,
                        selectedYear === year && styles.selectedOptionItem
                      ]}
                      onPress={() => setSelectedYear(year)}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.optionText,
                        selectedYear === year && styles.selectedOptionText
                      ]}>
                        {year}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
            
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleMonthYearSelection}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmButtonText}>{getText ? getText('home.confirm') : 'Confirm'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Stats 下拉選單 */}
      <StatsDropdown
        visible={showStatsDropdown}
        onClose={() => setShowStatsDropdown(false)}
        onNavigateToHistory={() => onNavigate && onNavigate('History')}
        onNavigateToAchievements={() => onNavigate && onNavigate('Achievements')}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { position: 'relative', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 15, backgroundColor: '#66D9A3', overflow: 'hidden' },
  headerDecorative: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1 },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flex: 1, zIndex: 2 },
  welcomeText: { fontSize: 18, fontWeight: '600', color: '#FFFFFF', flex: 1 },
  headerButtons: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  notificationButton: { padding: 8 },
  avatarContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFFFFF', overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%', borderRadius: 18 },
  scrollView: { flex: 1, paddingHorizontal: 20 },
  upcomingPaymentCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, marginBottom: 25, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4, borderWidth: 1, borderColor: '#F0F0F0' },
  // 🔥 優化版：簡化卡片頭部，移除月份年份顯示
  cardHeader: { marginBottom: 15 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#333333' },
  // 🚨 已移除：monthYear 樣式
  paymentContent: { position: 'relative' },
  allPaidContent: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  allPaidText: { fontSize: 16, fontWeight: '600', color: '#4CAF50', marginLeft: 12 },
  countdownBadge: { position: 'absolute', bottom: 0, left: 0, backgroundColor: '#FF5722', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, zIndex: 1 },
  overdueBadge: { backgroundColor: '#D32F2F' },
  todayBadge: { backgroundColor: '#FF9800' },
  upcomingBadge: { backgroundColor: '#FF5722' },
  paidBadge: { backgroundColor: '#4CAF50' },
  countdownText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  cardInfo: { marginTop: 25, marginBottom: 35 },
  cardCounter: { position: 'absolute', top: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4, zIndex: 2 },
  cardCounterText: { color: '#FFFFFF', fontSize: 10, fontWeight: '600' },
  cardsScrollView: { flex: 1 },
  cardSlide: { width: width - 80, position: 'relative' },
  cardIndicator: { position: 'absolute', bottom: 0, right: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  cardIndicatorText: { color: '#FFFFFF', fontSize: 10, fontWeight: '600' },
  cardName: { fontSize: 18, fontWeight: '600', color: '#333333', marginBottom: 4 },
  bankName: { fontSize: 14, color: '#666666' },
  noPaymentContent: { alignItems: 'center', paddingVertical: 20 },
  noPaymentText: { fontSize: 16, color: '#666666', marginTop: 10 },
  calendarSection: { marginBottom: 100 },
  // 🔥 優化版：簡化日曆頭部，移除箭頭按鈕
  calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#333333' },
  // 🚨 已移除：calendarControls, monthNavButton 等箭頭按鈕相關樣式
  currentMonth: { fontSize: 16, fontWeight: '500', color: '#007AFF', textDecorationLine: 'underline', textAlign: 'center' },
  // 🚨 已移除：swipeHintContainer, swipeHintText 等提示相關樣式
  // 🔥 保留：核心日曆容器樣式
  calendarContainer: { position: 'relative', overflow: 'hidden' },
  calendar: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4, borderWidth: 1, borderColor: '#F0F0F0' },
  weekHeader: { flexDirection: 'row', marginBottom: 10 },
  weekDayHeader: { flex: 1, alignItems: 'center', paddingVertical: 10 },
  weekDayText: { fontSize: 12, fontWeight: '600', color: '#666666' },
  weekRow: { flexDirection: 'row' },
  dateCell: { flex: 1, aspectRatio: 1, justifyContent: 'center', alignItems: 'center', position: 'relative', margin: 1, borderRadius: 8 },
  dateCellInactive: { opacity: 0.5 },
  dateCellToday: { backgroundColor: '#E3F2FD' },
  dateCellWithPayment: { backgroundColor: '#FFEBEE' },
  dateCellWithPaidPayment: { backgroundColor: '#E8F5E9' },
  dateText: { fontSize: 14, color: '#333333' },
  dateTextInactive: { color: '#CCCCCC' },
  dateTextToday: { color: '#007AFF', fontWeight: '600' },
  dateTextWithPayment: { color: '#D32F2F', fontWeight: '600' },
  dateTextWithPaidPayment: { color: '#4CAF50', fontWeight: '600' },
  paymentDot: { position: 'absolute', top: 2, right: 2, borderRadius: 8, minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center' },
  paymentCount: { color: '#FFFFFF', fontSize: 10, fontWeight: '600' },
  // 🚨 已移除：swipeIndicator, swipeIndicatorText 等指示器相關樣式
  bottomNavigation: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', backgroundColor: '#FFFFFF', paddingVertical: 12, paddingHorizontal: 20, borderTopWidth: 1, borderTopColor: '#F0F0F0', shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 8 },
  navButton: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  navText: { fontSize: 12, color: '#999999', marginTop: 4 },
  navTextActive: { color: '#007AFF', fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, margin: 20, maxWidth: width - 40, maxHeight: '70%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '600', color: '#333333' },
  closeButton: { padding: 4 },
  paymentItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  paymentInfo: { flex: 1 },
  paymentCardName: { fontSize: 16, fontWeight: '600', color: '#333333' },
  paymentBankName: { fontSize: 14, color: '#666666', marginTop: 2 },
  countdownInfo: { alignItems: 'flex-end' },
  countdownLabel: { fontSize: 12, color: '#FF5722', fontWeight: '600' },
  paidLabel: { color: '#4CAF50' },
  overdueLabel: { color: '#D32F2F' },
  todayLabel: { color: '#F57C00' },
  upcomingLabel: { color: '#FF5722' },
  pickerModalContent: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, margin: 15, maxWidth: width - 30, maxHeight: '80%', minWidth: 320 },
  pickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  pickerTitle: { fontSize: 20, fontWeight: '600', color: '#333333' },
  pickersContainer: { flexDirection: 'row', gap: 15 },
  pickerSection: { flex: 1, minWidth: 140 },
  pickerLabel: { fontSize: 16, fontWeight: '600', color: '#333333', marginBottom: 10, textAlign: 'center' },
  optionsContainer: { maxHeight: 200, borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, minWidth: 140 },
  optionItem: { paddingVertical: 12, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', minHeight: 44 },
  selectedOptionItem: { backgroundColor: '#E3F2FD' },
  optionText: { fontSize: 15, color: '#333333', textAlign: 'center', lineHeight: 20 },
  selectedOptionText: { color: '#007AFF', fontWeight: '600' },
  confirmButton: { backgroundColor: '#007AFF', borderRadius: 8, paddingVertical: 16, alignItems: 'center', marginTop: 20 },
  confirmButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});