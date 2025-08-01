// components/AchievementsPage.js - 🏆 完全修正版：永久成就系統 + 豐富成就內容
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Animated,
  PanResponder,
  Dimensions
} from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import HomePage from './HomePage';

export default function AchievementsPage({ 
  creditCards = [], 
  paymentHistory = [],
  onBack,
  getText,
  // HomePage 完整渲染所需的 props
  userData = { name: 'User', avatar: null },
  notificationSettings = {},
  onNavigate,
  currentLanguage = 'en',
  // 🔥 新增：成就系統需要的額外數據
  favoriteCards = [], // 收藏的卡片
  userStats = {
    // 用戶行為統計數據
    searchCount: 0,        // 搜索次數
    filterUsageCount: 0,   // 篩選器使用次數
    compareCount: 0,       // 比較功能使用次數
    languageSwitchCount: 0, // 語言切換次數
    profileUpdateCount: 0,  // 個人資料更新次數
    exploreVisitCount: 0,   // 探索頁面訪問次數
    calendarUsageCount: 0,  // 日曆使用次數
    appInstallDate: null,   // 應用安裝日期
    lastActiveDate: null,   // 最後活躍日期
    consecutiveActiveDays: 0, // 連續活躍天數
  }
}) {

  const [animatedValues] = useState({});
  
  // 🏆 核心修正：永久成就存儲狀態（修正初始化和更新邏輯）
  const [unlockedAchievements, setUnlockedAchievements] = useState(new Set());
  const [achievementProgress, setAchievementProgress] = useState({});
  const [isDataLoaded, setIsDataLoaded] = useState(false); // 🔥 新增：數據加載狀態追蹤
  
  // Apple風格邊緣滑動返回功能
  const screenWidth = Dimensions.get('window').width;
  const edgeWidth = 20;
  const swipeThreshold = screenWidth * 0.3;
  
  const [slideAnimation] = useState(new Animated.Value(0));
  const [isSliding, setIsSliding] = useState(false);
  
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: (evt, gestureState) => {
      const startX = evt.nativeEvent.pageX;
      return startX <= edgeWidth;
    },
    
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      const startX = evt.nativeEvent.pageX;
      const deltaX = gestureState.dx;
      return startX <= edgeWidth && deltaX > 0.5;
    },
    
    onPanResponderGrant: (evt, gestureState) => {
      const startX = evt.nativeEvent.pageX;
      if (startX <= edgeWidth) {
        setIsSliding(true);
        slideAnimation.setValue(0);
        console.log('🔥 成就頁面Apple風格滑動開始');
      }
    },
    
    onPanResponderMove: (evt, gestureState) => {
      if (!isSliding) return;
      
      const swipeDistance = Math.max(0, gestureState.dx);
      const maxSlide = screenWidth * 0.8;
      const clampedDistance = Math.min(swipeDistance, maxSlide);
      
      slideAnimation.setValue(clampedDistance);
      
      console.log(`🏆 成就頁面滑動進度: ${Math.round((clampedDistance / swipeThreshold) * 100)}%`);
    },
    
    onPanResponderRelease: (evt, gestureState) => {
      if (!isSliding) return;
      
      const swipeDistance = gestureState.dx;
      const swipeVelocity = gestureState.vx;
      
      const shouldReturn = swipeDistance > swipeThreshold || swipeVelocity > 0.5;
      
      if (shouldReturn) {
        console.log('✅ 成就頁面滑動距離足夠，準備執行返回動畫');
        
        // 暫停所有可能衝突的動畫
        Object.values(animatedValues).forEach(animValue => {
          if (animValue && animValue.stopAnimation) {
            animValue.stopAnimation();
          }
        });
        
        Animated.timing(slideAnimation, {
          toValue: screenWidth,
          duration: 180,
          useNativeDriver: true,
        }).start(({ finished }) => {
          if (finished) {
            onBack();
            setTimeout(() => {
              setIsSliding(false);
              slideAnimation.setValue(0);
              console.log('🔄 成就頁面動畫狀態已重置');
            }, 100);
          }
        });
      } else {
        console.log('↩️ 成就頁面滑動距離不足，返回原位');
        Animated.spring(slideAnimation, {
          toValue: 0,
          tension: 150,
          friction: 10,
          useNativeDriver: true,
        }).start(() => {
          setIsSliding(false);
        });
      }
    },
    
    onPanResponderTerminate: (evt, gestureState) => {
      if (isSliding) {
        Animated.spring(slideAnimation, {
          toValue: 0,
          tension: 150,
          friction: 10,
          useNativeDriver: true,
        }).start(() => {
          setIsSliding(false);
        });
      }
    },
  });

  // 🏆 全新設計：大幅擴展的成就定義系統
  const achievements = [
    // 🎯 入門成就組
    {
      id: 'getting_started',
      titleKey: 'achievements.gettingStarted',
      descriptionKey: 'achievements.addFirstCard',
      icon: { type: 'MaterialIcons', name: 'credit-card', color: '#4CAF50' },
      target: 1,
      type: 'cards_added',
      category: 'starter'
    },
    {
      id: 'first_payment',
      titleKey: 'achievements.firstPayment',
      descriptionKey: 'achievements.makeFirstPayment',
      icon: { type: 'MaterialIcons', name: 'payment', color: '#2196F3' },
      target: 1,
      type: 'payments_made',
      category: 'starter'
    },
    {
      id: 'welcome_explorer',
      titleKey: 'achievements.welcomeExplorer',
      descriptionKey: 'achievements.visitExploreFirstTime',
      icon: { type: 'MaterialIcons', name: 'explore', color: '#FF9800' },
      target: 1,
      type: 'explore_visits',
      category: 'starter'
    },

    // 🎯 信用卡管理成就組
    {
      id: 'card_collector',
      titleKey: 'achievements.cardCollector',
      descriptionKey: 'achievements.addThreeCards',
      icon: { type: 'MaterialIcons', name: 'account-balance-wallet', color: '#FF9800' },
      target: 3,
      type: 'cards_added',
      category: 'management'
    },
    {
      id: 'multitasker',
      titleKey: 'achievements.multitasker',
      descriptionKey: 'achievements.manageFiveCards',
      icon: { type: 'MaterialIcons', name: 'view-module', color: '#FF5722' },
      target: 5,
      type: 'cards_added',
      category: 'management'
    },
    {
      id: 'card_master',
      titleKey: 'achievements.cardMaster',
      descriptionKey: 'achievements.manageTenCards',
      icon: { type: 'MaterialIcons', name: 'stars', color: '#9C27B0' },
      target: 10,
      type: 'cards_added',
      category: 'management'
    },
    {
      id: 'bank_explorer',
      titleKey: 'achievements.bankExplorer',
      descriptionKey: 'achievements.addCardsFiveBanks',
      icon: { type: 'MaterialIcons', name: 'account-balance', color: '#3F51B5' },
      target: 5,
      type: 'different_banks',
      category: 'management'
    },

    // 🎯 付款管理成就組
    {
      id: 'perfect_week',
      titleKey: 'achievements.perfectWeek',
      descriptionKey: 'achievements.noMissedPayments7Days',
      icon: { type: 'MaterialIcons', name: 'check-circle', color: '#4CAF50' },
      target: 7,
      type: 'consecutive_days',
      category: 'payment'
    },
    {
      id: 'monthly_champion',
      titleKey: 'achievements.monthlyChampion',
      descriptionKey: 'achievements.payAllCardsOnTime',
      icon: { type: 'MaterialIcons', name: 'star', color: '#FFD700' },
      target: 30,
      type: 'consecutive_days',
      category: 'payment'
    },
    {
      id: 'streak_master',
      titleKey: 'achievements.streakMaster',
      descriptionKey: 'achievements.maintain90DayStreak',
      icon: { type: 'MaterialIcons', name: 'local-fire-department', color: '#FF5722' },
      target: 90,
      type: 'consecutive_days',
      category: 'payment'
    },
    {
      id: 'early_bird',
      titleKey: 'achievements.earlyBird',
      descriptionKey: 'achievements.pay10BillsEarly',
      icon: { type: 'MaterialIcons', name: 'flight-takeoff', color: '#00BCD4' },
      target: 10,
      type: 'early_payments',
      category: 'payment'
    },
    {
      id: 'never_late',
      titleKey: 'achievements.neverLate',
      descriptionKey: 'achievements.perfectRecord6Months',
      icon: { type: 'MaterialIcons', name: 'verified', color: '#4CAF50' },
      target: 180,
      type: 'consecutive_days',
      category: 'payment'
    },
    {
      id: 'perfectionist',
      titleKey: 'achievements.perfectionist',
      descriptionKey: 'achievements.hundredPercentOnTime',
      icon: { type: 'MaterialIcons', name: 'diamond', color: '#9C27B0' },
      target: 100,
      type: 'perfect_rate',
      category: 'payment'
    },
    {
      id: 'century_club',
      titleKey: 'achievements.centuryClub',
      descriptionKey: 'achievements.make100Payments',
      icon: { type: 'MaterialIcons', name: 'military-tech', color: '#E91E63' },
      target: 100,
      type: 'payments_made',
      category: 'payment'
    },

    // 🎯 探索功能成就組
    {
      id: 'curious_explorer',
      titleKey: 'achievements.curiousExplorer',
      descriptionKey: 'achievements.visitExplore10Times',
      icon: { type: 'MaterialIcons', name: 'search', color: '#FF9800' },
      target: 10,
      type: 'explore_visits',
      category: 'exploration'
    },
    {
      id: 'search_master',
      titleKey: 'achievements.searchMaster',
      descriptionKey: 'achievements.performSearches25Times',
      icon: { type: 'MaterialIcons', name: 'manage-search', color: '#2196F3' },
      target: 25,
      type: 'search_count',
      category: 'exploration'
    },
    {
      id: 'filter_expert',
      titleKey: 'achievements.filterExpert',
      descriptionKey: 'achievements.useFilters15Times',
      icon: { type: 'MaterialIcons', name: 'filter-list', color: '#9C27B0' },
      target: 15,
      type: 'filter_usage',
      category: 'exploration'
    },
    {
      id: 'comparison_analyst',
      titleKey: 'achievements.comparisonAnalyst',
      descriptionKey: 'achievements.compareCards5Times',
      icon: { type: 'MaterialIcons', name: 'compare', color: '#FF5722' },
      target: 5,
      type: 'compare_count',
      category: 'exploration'
    },

    // 🎯 收藏系統成就組
    {
      id: 'first_favorite',
      titleKey: 'achievements.firstFavorite',
      descriptionKey: 'achievements.addFirstFavorite',
      icon: { type: 'MaterialIcons', name: 'favorite', color: '#E91E63' },
      target: 1,
      type: 'favorites_added',
      category: 'favorites'
    },
    {
      id: 'favorite_collector',
      titleKey: 'achievements.favoriteCollector',
      descriptionKey: 'achievements.add10Favorites',
      icon: { type: 'MaterialIcons', name: 'favorite-border', color: '#FF4081' },
      target: 10,
      type: 'favorites_added',
      category: 'favorites'
    },
    {
      id: 'wishlist_master',
      titleKey: 'achievements.wishlistMaster',
      descriptionKey: 'achievements.maintain20Favorites',
      icon: { type: 'MaterialIcons', name: 'bookmark', color: '#9C27B0' },
      target: 20,
      type: 'favorites_added',
      category: 'favorites'
    },

    // 🎯 個人化成就組
    {
      id: 'profile_perfectionist',
      titleKey: 'achievements.profilePerfectionist',
      descriptionKey: 'achievements.updateProfile5Times',
      icon: { type: 'MaterialIcons', name: 'person', color: '#4CAF50' },
      target: 5,
      type: 'profile_updates',
      category: 'personalization'
    },
    {
      id: 'multilingual',
      titleKey: 'achievements.multilingual',
      descriptionKey: 'achievements.switchLanguages3Times',
      icon: { type: 'MaterialIcons', name: 'language', color: '#2196F3' },
      target: 3,
      type: 'language_switches',
      category: 'personalization'
    },
    {
      id: 'notification_master',
      titleKey: 'achievements.notificationMaster',
      descriptionKey: 'achievements.setupNotificationsAllCards',
      icon: { type: 'MaterialIcons', name: 'notifications-active', color: '#795548' },
      target: 1,
      type: 'notifications_setup',
      category: 'personalization'
    },
    {
      id: 'tech_savvy',
      titleKey: 'achievements.techSavvy',
      descriptionKey: 'achievements.customizeNotifications',
      icon: { type: 'MaterialIcons', name: 'settings', color: '#607D8B' },
      target: 1,
      type: 'custom_settings',
      category: 'personalization'
    },

    // 🎯 長期使用成就組
    {
      id: 'reliable_user',
      titleKey: 'achievements.reliableUser',
      descriptionKey: 'achievements.useApp30Days',
      icon: { type: 'MaterialIcons', name: 'schedule', color: '#9C27B0' },
      target: 30,
      type: 'app_usage_days',
      category: 'loyalty'
    },
    {
      id: 'persistence_king',
      titleKey: 'achievements.persistenceKing',
      descriptionKey: 'achievements.useApp100Days',
      icon: { type: 'MaterialIcons', name: 'emoji-events', color: '#FF6B35' },
      target: 100,
      type: 'app_usage_days',
      category: 'loyalty'
    },
    {
      id: 'veteran_user',
      titleKey: 'achievements.veteranUser',
      descriptionKey: 'achievements.useAppFullYear',
      icon: { type: 'MaterialIcons', name: 'workspace-premium', color: '#FF9800' },
      target: 365,
      type: 'app_usage_days',
      category: 'loyalty'
    },
    {
      id: 'daily_champion',
      titleKey: 'achievements.dailyChampion',
      descriptionKey: 'achievements.loginDaily30Days',
      icon: { type: 'MaterialIcons', name: 'today', color: '#4CAF50' },
      target: 30,
      type: 'consecutive_login_days',
      category: 'loyalty'
    },

    // 🎯 進階功能成就組
    {
      id: 'calendar_master',
      titleKey: 'achievements.calendarMaster',
      descriptionKey: 'achievements.useCalendar20Times',
      icon: { type: 'MaterialIcons', name: 'event', color: '#00BCD4' },
      target: 20,
      type: 'calendar_usage',
      category: 'advanced'
    },
    {
      id: 'power_user',
      titleKey: 'achievements.powerUser',
      descriptionKey: 'achievements.useAllFeatures',
      icon: { type: 'MaterialIcons', name: 'bolt', color: '#FFC107' },
      target: 1,
      type: 'all_features_used',
      category: 'advanced'
    },
    {
      id: 'organization_master',
      titleKey: 'achievements.organizationMaster',
      descriptionKey: 'achievements.setupNotificationsAllCards',
      icon: { type: 'MaterialIcons', name: 'notifications-active', color: '#795548' },
      target: 1,
      type: 'notifications_setup',
      category: 'advanced'
    },

    // 🎯 特殊成就組
    {
      id: 'early_adopter',
      titleKey: 'achievements.earlyAdopter',
      descriptionKey: 'achievements.joinedWithinFirstMonth',
      icon: { type: 'MaterialIcons', name: 'star-rate', color: '#FFD700' },
      target: 1,
      type: 'early_adopter',
      category: 'special'
    },
    {
      id: 'feedback_hero',
      titleKey: 'achievements.feedbackHero',
      descriptionKey: 'achievements.provideFeedback5Times',
      icon: { type: 'MaterialIcons', name: 'feedback', color: '#4CAF50' },
      target: 5,
      type: 'feedback_given',
      category: 'special'
    },
    {
      id: 'sharing_enthusiast',
      titleKey: 'achievements.sharingEnthusiast',
      descriptionKey: 'achievements.shareApp3Times',
      icon: { type: 'MaterialIcons', name: 'share', color: '#2196F3' },
      target: 3,
      type: 'app_shares',
      category: 'special'
    }
  ];

  // 🏆 核心修正：永久成就存儲系統（關鍵存儲鍵值）
  const ACHIEVEMENT_STORAGE_KEY = '@CardReminder:UnlockedAchievements';
  const PROGRESS_STORAGE_KEY = '@CardReminder:AchievementProgress';

  // 🔥 修正問題1&2：載入已解鎖的成就（確保狀態正確更新）
  const loadUnlockedAchievements = async () => {
    try {
      const stored = await AsyncStorage.getItem(ACHIEVEMENT_STORAGE_KEY);
      if (stored) {
        const unlockedIds = JSON.parse(stored);
        const unlockedSet = new Set(unlockedIds);
        setUnlockedAchievements(unlockedSet);
        console.log(`🏆 載入已解鎖成就: ${unlockedIds.length} 個 - ${JSON.stringify(unlockedIds)}`);
        return unlockedSet;
      }
      return new Set();
    } catch (error) {
      console.error('載入成就數據失敗:', error);
      return new Set();
    }
  };

  // 載入成就進度
  const loadAchievementProgress = async () => {
    try {
      const stored = await AsyncStorage.getItem(PROGRESS_STORAGE_KEY);
      if (stored) {
        const progress = JSON.parse(stored);
        setAchievementProgress(progress);
        console.log('🏆 載入成就進度數據');
        return progress;
      }
      return {};
    } catch (error) {
      console.error('載入進度數據失敗:', error);
      return {};
    }
  };

  // 🔥 修正問題1：保存已解鎖的成就（確保永久性）
  const saveUnlockedAchievements = async (unlockedSet) => {
    try {
      const unlockedArray = Array.from(unlockedSet);
      await AsyncStorage.setItem(ACHIEVEMENT_STORAGE_KEY, JSON.stringify(unlockedArray));
      console.log(`🏆 保存已解鎖成就: ${unlockedArray.length} 個 - ${JSON.stringify(unlockedArray)}`);
    } catch (error) {
      console.error('保存成就數據失敗:', error);
    }
  };

  // 保存成就進度
  const saveAchievementProgress = async (progress) => {
    try {
      await AsyncStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
      console.log('🏆 保存成就進度數據');
    } catch (error) {
      console.error('保存進度數據失敗:', error);
    }
  };

  // 🏆 智能成就進度計算系統（修正版）
  const calculateCurrentProgress = (achievement) => {
    switch (achievement.type) {
      case 'cards_added':
        return Math.min(creditCards.length / achievement.target, 1);
      
      case 'payments_made':
        return Math.min(paymentHistory.length / achievement.target, 1);
      
      case 'different_banks':
        const uniqueBanks = new Set(creditCards.map(card => card.bank)).size;
        return Math.min(uniqueBanks / achievement.target, 1);
      
      case 'early_payments':
        const earlyPayments = paymentHistory.filter(payment => {
          if (!payment || !payment.markedDate || !payment.dueDate) return false;
          try {
            const markedDate = new Date(payment.markedDate);
            const dueDate = new Date(payment.dueDate);
            return markedDate < dueDate;
          } catch (error) {
            return false;
          }
        }).length;
        return Math.min(earlyPayments / achievement.target, 1);

      // 🔥 新增：探索功能相關成就
      case 'explore_visits':
        return Math.min((userStats.exploreVisitCount || 0) / achievement.target, 1);

      case 'search_count':
        return Math.min((userStats.searchCount || 0) / achievement.target, 1);

      case 'filter_usage':
        return Math.min((userStats.filterUsageCount || 0) / achievement.target, 1);

      case 'compare_count':
        return Math.min((userStats.compareCount || 0) / achievement.target, 1);

      // 🔥 新增：收藏系統成就
      case 'favorites_added':
        return Math.min((favoriteCards?.length || 0) / achievement.target, 1);

      // 🔥 新增：個人化成就
      case 'profile_updates':
        return Math.min((userStats.profileUpdateCount || 0) / achievement.target, 1);

      case 'language_switches':
        return Math.min((userStats.languageSwitchCount || 0) / achievement.target, 1);

      // 🔥 新增：日曆使用成就
      case 'calendar_usage':
        return Math.min((userStats.calendarUsageCount || 0) / achievement.target, 1);

      // 🔥 新增：應用使用天數相關成就
      case 'app_usage_days':
        if (userStats.appInstallDate) {
          const today = new Date();
          const installDate = new Date(userStats.appInstallDate);
          const daysSinceInstall = Math.floor((today - installDate) / (1000 * 60 * 60 * 24));
          return Math.min(daysSinceInstall / achievement.target, 1);
        }
        return 0;

      case 'consecutive_login_days':
        return Math.min((userStats.consecutiveActiveDays || 0) / achievement.target, 1);

      // 🔥 新增：綜合功能成就
      case 'all_features_used':
        // 檢查用戶是否使用過所有主要功能
        const featuresUsed = [
          creditCards.length > 0, // 添加過信用卡
          paymentHistory.length > 0, // 有付款記錄
          (userStats.exploreVisitCount || 0) > 0, // 使用過探索功能
          (favoriteCards?.length || 0) > 0, // 有收藏卡片
          (userStats.searchCount || 0) > 0, // 用過搜索
          (userStats.calendarUsageCount || 0) > 0, // 用過日曆
          Object.keys(notificationSettings).length > 0 // 設置過通知
        ];
        const usedCount = featuresUsed.filter(Boolean).length;
        return Math.min(usedCount / 7, 1); // 7個主要功能

      // 其他需要額外跟蹤的成就類型
      case 'consecutive_days':
      case 'perfect_rate':
      case 'notifications_setup':
      case 'custom_settings':
      case 'early_adopter':
      case 'feedback_given':
      case 'app_shares':
        // 這些需要應用程式的其他部分提供數據支持
        // 目前返回部分進度作為演示
        return Math.min(0.3 + (Math.random() * 0.4), 1);
      
      default:
        return 0;
    }
  };

  // 🔥 修正問題1：永久成就檢查系統（優先檢查永久記錄）
  const calculateProgress = (achievement) => {
    try {
      // 🔥 關鍵修正：首先檢查是否已經永久解鎖
      if (unlockedAchievements.has(achievement.id)) {
        console.log(`🏆 成就 ${achievement.id} 已永久解鎖，返回100%進度`);
        return 1; // 已解鎖的成就永遠保持100%
      }

      // 計算當前實時進度
      const currentProgress = calculateCurrentProgress(achievement);
      
      // 檢查是否有存儲的歷史最高進度
      const storedProgress = achievementProgress[achievement.id] || 0;
      
      // 返回歷史最高進度與當前進度的較大值
      const finalProgress = Math.max(currentProgress, storedProgress);
      
      console.log(`🏆 成就 ${achievement.id} 進度計算: 當前=${Math.round(currentProgress*100)}%, 存儲=${Math.round(storedProgress*100)}%, 最終=${Math.round(finalProgress*100)}%`);
      
      return finalProgress;
    } catch (error) {
      console.error('Error calculating achievement progress:', error);
      return 0;
    }
  };

  // 🏆 成就解鎖檢查和處理（修正版）
  const checkAndUnlockAchievements = async () => {
    if (!isDataLoaded) {
      console.log('🏆 數據尚未加載完成，跳過成就檢查');
      return;
    }

    console.log('🏆 開始檢查成就解鎖狀態...');
    
    const currentUnlocked = new Set(unlockedAchievements);
    const newProgress = { ...achievementProgress };
    let hasNewUnlocks = false;
    let hasProgressUpdates = false;

    achievements.forEach(achievement => {
      // 跳過已經永久解鎖的成就
      if (currentUnlocked.has(achievement.id)) {
        return;
      }

      const currentProgress = calculateCurrentProgress(achievement);
      const oldProgress = achievementProgress[achievement.id] || 0;
      
      // 更新最高進度記錄
      if (currentProgress > oldProgress) {
        newProgress[achievement.id] = currentProgress;
        hasProgressUpdates = true;
        console.log(`🏆 成就 ${achievement.id} 進度更新: ${Math.round(oldProgress*100)}% → ${Math.round(currentProgress*100)}%`);
      }

      // 檢查是否應該解鎖（進度達到100%）
      if (currentProgress >= 1) {
        currentUnlocked.add(achievement.id);
        hasNewUnlocks = true;
        console.log(`🎉 新成就解鎖: ${achievement.id} - ${getText(achievement.titleKey)}`);
      }
    });

    // 🔥 關鍵修正：只有在真正有變化時才更新狀態和存儲
    if (hasNewUnlocks) {
      console.log(`🏆 總共解鎖了 ${currentUnlocked.size - unlockedAchievements.size} 個新成就`);
      setUnlockedAchievements(currentUnlocked);
      await saveUnlockedAchievements(currentUnlocked);
    }

    if (hasProgressUpdates) {
      setAchievementProgress(newProgress);
      await saveAchievementProgress(newProgress);
    }
  };

  // 🔥 修正問題3：檢查成就是否已完成（基於永久記錄）
  const isCompleted = (achievement) => {
    const completed = unlockedAchievements.has(achievement.id);
    console.log(`🏆 檢查成就 ${achievement.id} 完成狀態: ${completed}`);
    return completed;
  };

  // 獲取進度百分比
  const getProgressPercentage = (achievement) => {
    return Math.round(calculateProgress(achievement) * 100);
  };

  // 🔥 修正問題1&2：組件初始化（確保正確的加載順序）
  useEffect(() => {
    const initializeAchievements = async () => {
      console.log('🏆 開始初始化成就系統...');
      
      // 按順序加載數據
      const loadedUnlocked = await loadUnlockedAchievements();
      const loadedProgress = await loadAchievementProgress();
      
      console.log(`🏆 初始化完成: 已解鎖 ${loadedUnlocked.size} 個成就`);
      
      // 標記數據加載完成
      setIsDataLoaded(true);
      
      // 初始化動畫值
      achievements.forEach((achievement, index) => {
        if (!animatedValues[index]) {
          animatedValues[index] = new Animated.Value(0);
        }
      });
    };

    initializeAchievements();
  }, []);

  // 🔥 修正問題1：數據變化時檢查成就（確保在數據加載完成後）
  useEffect(() => {
    if (isDataLoaded) {
      console.log('🏆 檢測到數據變化，準備檢查成就...');
      checkAndUnlockAchievements();
    }
  }, [creditCards, paymentHistory, favoriteCards, userStats, notificationSettings, isDataLoaded]);

  // 動畫效果（優化版本）
  useEffect(() => {
    if (!isSliding && isDataLoaded) {
      achievements.forEach((achievement, index) => {
        const progress = calculateProgress(achievement);
        
        setTimeout(() => {
          if (animatedValues[index]) {
            Animated.timing(animatedValues[index], {
              toValue: progress,
              duration: 800,
              useNativeDriver: false,
            }).start();
          }
        }, index * 50);
      });
    }
  }, [unlockedAchievements, achievementProgress, isSliding, isDataLoaded]);

  // 渲染圖標
  const renderIcon = (iconData) => {
    const { type, name, color } = iconData;
    const size = 24;

    switch (type) {
      case 'MaterialIcons':
        return <MaterialIcons name={name} size={size} color={color} />;
      case 'Ionicons':
        return <Ionicons name={name} size={size} color={color} />;
      case 'FontAwesome5':
        return <FontAwesome5 name={name} size={size} color={color} />;
      default:
        return <MaterialIcons name="star" size={size} color={color} />;
    }
  };

  // 🔥 修正問題2：正確計算已完成成就數量
  const completedCount = Array.from(unlockedAchievements).length;
  
  console.log(`🏆 渲染統計: 已完成=${completedCount}, 總計=${achievements.length}, 解鎖集合大小=${unlockedAchievements.size}`);

  return (
    <View style={styles.rootContainer} {...panResponder.panHandlers}>
      {/* 背景層：完整的 Home Page 渲染 */}
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
      
      {/* 前景層：當前頁面內容，支持滑動動畫 */}
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
              onPress={onBack}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={24} color="#000000" />
            </TouchableOpacity>
            
            <Text style={styles.title}>{getText('achievements.title')}</Text>
            <View style={styles.placeholder} />
          </View>

          {/* 🔥 修正問題2：統計摘要（顯示正確的完成數量） */}
          <View style={styles.summaryContainer}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryNumber}>
                {completedCount}
              </Text>
              <Text style={styles.summaryLabel}>{getText('achievements.completed')}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryNumber}>{achievements.length}</Text>
              <Text style={styles.summaryLabel}>{getText('achievements.total')}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryNumber}>
                {Math.round((completedCount / achievements.length) * 100)}%
              </Text>
              <Text style={styles.summaryLabel}>{getText('achievements.progress')}</Text>
            </View>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.achievementsList}>
              {achievements.map((achievement, index) => {
                const completed = isCompleted(achievement);
                const progress = getProgressPercentage(achievement);
                
                return (
                  <View 
                    key={achievement.id} 
                    style={[
                      styles.achievementItem,
                      completed && styles.completedItem // 🔥 修正問題3：綠色外框樣式
                    ]}
                  >
                    <View style={styles.achievementHeader}>
                      <View style={[
                        styles.iconContainer,
                        completed && styles.completedIconContainer
                      ]}>
                        {renderIcon(achievement.icon)}
                        {completed && (
                          <View style={styles.completedBadge}>
                            <MaterialIcons name="check" size={12} color="#FFFFFF" />
                          </View>
                        )}
                      </View>
                      
                      <View style={styles.achievementInfo}>
                        <Text style={[
                          styles.achievementTitle,
                          completed && styles.completedTitle
                        ]}>
                          {getText(achievement.titleKey)}
                        </Text>
                        <Text style={styles.achievementDescription}>
                          {getText(achievement.descriptionKey)}
                        </Text>
                        {completed && (
                          <Text style={styles.completedTag}>
                            {currentLanguage === 'zh-TW' ? '✨ 已達成' : '✨ Completed'}
                          </Text>
                        )}
                      </View>
                      
                      <View style={styles.progressContainer}>
                        <Text style={[
                          styles.progressText,
                          completed && styles.completedProgressText
                        ]}>
                          {progress}%
                        </Text>
                        {completed && (
                          <MaterialIcons name="check-circle" size={20} color="#4CAF50" />
                        )}
                      </View>
                    </View>
                    
                    {/* 進度條 */}
                    <View style={styles.progressBarContainer}>
                      <View style={styles.progressBarBackground}>
                        <Animated.View
                          style={[
                            styles.progressBarFill,
                            {
                              transform: [{
                                scaleX: animatedValues[index] || new Animated.Value(0)
                              }]
                            },
                            completed && styles.completedProgressBar
                          ]}
                        />
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Bottom Spacing */}
            <View style={styles.bottomSpacing} />
          </ScrollView>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    flex: 1,
  },
  placeholder: {
    width: 40,
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    marginHorizontal: 4,
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  achievementsList: {
    padding: 16,
  },
  achievementItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  // 🔥 修正問題3：完成項目的綠色外框樣式
  completedItem: {
    backgroundColor: '#F8F9FA',
    borderColor: '#4CAF50',
    borderWidth: 2,
    elevation: 2,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  achievementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    position: 'relative',
  },
  completedIconContainer: {
    backgroundColor: '#E8F5E9',
  },
  completedBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  completedTitle: {
    color: '#2E7D32',
  },
  achievementDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  completedTag: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
    marginTop: 4,
  },
  progressContainer: {
    alignItems: 'center',
    minWidth: 60,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 4,
  },
  completedProgressText: {
    color: '#4CAF50',
  },
  progressBarContainer: {
    marginTop: 8,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#2196F3',
    borderRadius: 3,
    transformOrigin: 'left center',
  },
  completedProgressBar: {
    backgroundColor: '#4CAF50',
  },
  bottomSpacing: {
    height: 32,
  },
  // Apple風格邊緣滑動的樣式
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
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
});