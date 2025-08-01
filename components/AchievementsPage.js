// components/AchievementsPage.js - 支援多語言版本（徹底修復動畫衝突）
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
import HomePage from './HomePage';

export default function AchievementsPage({ 
  creditCards = [], 
  paymentHistory = [],
  onBack,
  getText,
  // 🔥 新增：HomePage 完整渲染所需的 props
  userData = { name: 'User', avatar: null },
  notificationSettings = {},
  onNavigate,
  currentLanguage = 'en'
}) {

  const [animatedValues] = useState({});
  
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
        console.log('🔥 成就頁面Apple風格滑動開始');
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
      
      console.log(`🏆 成就頁面滑動進度: ${Math.round((clampedDistance / swipeThreshold) * 100)}%`);
    },
    
    // 🎯 手勢結束時的判斷和動畫（完全修復抖動問題）
    onPanResponderRelease: (evt, gestureState) => {
      if (!isSliding) return;
      
      const swipeDistance = gestureState.dx;
      const swipeVelocity = gestureState.vx;
      
      // 判斷是否應該執行返回操作
      const shouldReturn = swipeDistance > swipeThreshold || swipeVelocity > 0.5;
      
      if (shouldReturn) {
        // 🔥 關鍵修復：在執行返回動畫前，暫停所有進度條動畫
        console.log('✅ 成就頁面滑動距離足夠，準備執行返回動畫');
        
        // 暫停所有可能衝突的動畫
        Object.values(animatedValues).forEach(animValue => {
          if (animValue && animValue.stopAnimation) {
            animValue.stopAnimation();
          }
        });
        
        // 執行平滑的返回動畫
        Animated.timing(slideAnimation, {
          toValue: screenWidth,
          duration: 180, // 🔥 進一步縮短動畫時間，避免與進度條動畫衝突
          useNativeDriver: true, // 使用原生驅動器
        }).start(({ finished }) => {
          // 🔥 關鍵修復：確保動畫完成後的清理順序
          if (finished) {
            // 立即執行返回操作
            onBack();
            // 🔥 延遲重置所有動畫狀態，確保頁面切換完成
            setTimeout(() => {
              setIsSliding(false);
              slideAnimation.setValue(0);
              // 重新啟動進度條動畫（如果需要）
              console.log('🔄 成就頁面動畫狀態已重置');
            }, 100); // 增加延遲時間，確保頁面切換完全完成
          }
        });
      } else {
        // 返回原位動畫
        console.log('↩️ 成就頁面滑動距離不足，返回原位');
        Animated.spring(slideAnimation, {
          toValue: 0,
          tension: 150, // 🔥 提高張力，讓回彈更快
          friction: 10, // 🔥 調整摩擦力，減少震盪
          useNativeDriver: true,
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
          useNativeDriver: true,
        }).start(() => {
          setIsSliding(false);
        });
      }
    },
  });

  // 🔥 優化進度條動畫初始化，避免與滑動動畫衝突
  useEffect(() => {
    // 只有在不處於滑動狀態時才初始化進度條動畫
    if (!isSliding) {
      achievements.forEach((achievement, index) => {
        if (!animatedValues[index]) {
          animatedValues[index] = new Animated.Value(0);
        }
      });

      // 🔥 關鍵優化：使用原生驅動器並優化動畫參數
      achievements.forEach((achievement, index) => {
        const progress = calculateProgress(achievement);
        
        // 延遲啟動動畫，避免頁面載入時的性能問題
        setTimeout(() => {
          Animated.timing(animatedValues[index], {
            toValue: progress,
            duration: 800, // 🔥 縮短動畫時間，減少系統負擔
            useNativeDriver: false, // 進度條必須使用 false，因為涉及 scaleX
          }).start();
        }, index * 50); // 🔥 錯開動畫啟動時間，避免同時大量動畫
      });
    }
  }, [creditCards, paymentHistory, isSliding]); // 🔥 添加 isSliding 依賴

  // Define achievements with professional icons
  const achievements = [
    {
      id: 1,
      titleKey: 'achievements.gettingStarted',
      descriptionKey: 'achievements.addFirstCard',
      icon: { type: 'MaterialIcons', name: 'credit-card', color: '#4CAF50' },
      target: 1,
      type: 'cards_added'
    },
    {
      id: 2,
      titleKey: 'achievements.firstPayment',
      descriptionKey: 'achievements.makeFirstPayment',
      icon: { type: 'MaterialIcons', name: 'payment', color: '#2196F3' },
      target: 1,
      type: 'payments_made'
    },
    {
      id: 3,
      titleKey: 'achievements.cardCollector',
      descriptionKey: 'achievements.addThreeCards',
      icon: { type: 'MaterialIcons', name: 'account-balance-wallet', color: '#FF9800' },
      target: 3,
      type: 'cards_added'
    },
    {
      id: 4,
      titleKey: 'achievements.perfectWeek',
      descriptionKey: 'achievements.noMissedPayments7Days',
      icon: { type: 'MaterialIcons', name: 'check-circle', color: '#4CAF50' },
      target: 7,
      type: 'consecutive_days'
    },
    {
      id: 5,
      titleKey: 'achievements.monthlyChampion',
      descriptionKey: 'achievements.payAllCardsOnTime',
      icon: { type: 'MaterialIcons', name: 'star', color: '#FFD700' },
      target: 30,
      type: 'consecutive_days'
    },
    {
      id: 6,
      titleKey: 'achievements.streakMaster',
      descriptionKey: 'achievements.maintain90DayStreak',
      icon: { type: 'MaterialIcons', name: 'local-fire-department', color: '#FF5722' },
      target: 90,
      type: 'consecutive_days'
    },
    {
      id: 7,
      titleKey: 'achievements.reliableUser',
      descriptionKey: 'achievements.useApp30Days',
      icon: { type: 'MaterialIcons', name: 'schedule', color: '#9C27B0' },
      target: 30,
      type: 'app_usage_days'
    },
    {
      id: 8,
      titleKey: 'achievements.persistenceKing',
      descriptionKey: 'achievements.useApp100Days',
      icon: { type: 'MaterialIcons', name: 'emoji-events', color: '#FF6B35' },
      target: 100,
      type: 'app_usage_days'
    },
    {
      id: 9,
      titleKey: 'achievements.earlyBird',
      descriptionKey: 'achievements.pay10BillsEarly',
      icon: { type: 'MaterialIcons', name: 'flight-takeoff', color: '#00BCD4' },
      target: 10,
      type: 'early_payments'
    },
    {
      id: 10,
      titleKey: 'achievements.neverLate',
      descriptionKey: 'achievements.perfectRecord6Months',
      icon: { type: 'MaterialIcons', name: 'verified', color: '#4CAF50' },
      target: 180,
      type: 'consecutive_days'
    },
    {
      id: 11,
      titleKey: 'achievements.bankExplorer',
      descriptionKey: 'achievements.addCardsFiveBanks',
      icon: { type: 'MaterialIcons', name: 'account-balance', color: '#3F51B5' },
      target: 5,
      type: 'different_banks'
    },
    {
      id: 12,
      titleKey: 'achievements.organizationMaster',
      descriptionKey: 'achievements.setupNotificationsAllCards',
      icon: { type: 'MaterialIcons', name: 'notifications-active', color: '#795548' },
      target: 1,
      type: 'notifications_setup'
    },
    {
      id: 13,
      titleKey: 'achievements.centuryClub',
      descriptionKey: 'achievements.make100Payments',
      icon: { type: 'MaterialIcons', name: 'military-tech', color: '#E91E63' },
      target: 100,
      type: 'payments_made'
    },
    {
      id: 14,
      titleKey: 'achievements.veteranUser',
      descriptionKey: 'achievements.useAppFullYear',
      icon: { type: 'MaterialIcons', name: 'workspace-premium', color: '#FF9800' },
      target: 365,
      type: 'app_usage_days'
    },
    {
      id: 15,
      titleKey: 'achievements.perfectionist',
      descriptionKey: 'achievements.hundredPercentOnTime',
      icon: { type: 'MaterialIcons', name: 'diamond', color: '#9C27B0' },
      target: 100,
      type: 'perfect_rate'
    },
    {
      id: 16,
      titleKey: 'achievements.techSavvy',
      descriptionKey: 'achievements.customizeNotifications',
      icon: { type: 'MaterialIcons', name: 'settings', color: '#607D8B' },
      target: 1,
      type: 'custom_settings'
    },
    {
      id: 17,
      titleKey: 'achievements.multitasker',
      descriptionKey: 'achievements.manageFiveCards',
      icon: { type: 'MaterialIcons', name: 'view-module', color: '#FF5722' },
      target: 5,
      type: 'cards_added'
    },
    {
      id: 18,
      titleKey: 'achievements.calendarMaster',
      descriptionKey: 'achievements.useCalendar20Times',
      icon: { type: 'MaterialIcons', name: 'event', color: '#00BCD4' },
      target: 20,
      type: 'calendar_usage'
    }
  ];

  // Calculate progress for each achievement
  const calculateProgress = (achievement) => {
    try {
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
        
        case 'consecutive_days':
        case 'app_usage_days':
        case 'perfect_rate':
        case 'notifications_setup':
        case 'custom_settings':
        case 'calendar_usage':
          // These would require additional tracking in a real app
          // For demo purposes, return partial progress
          return Math.min(0.3 + (Math.random() * 0.4), 1);
        
        default:
          return 0;
      }
    } catch (error) {
      console.error('Error calculating achievement progress:', error);
      return 0;
    }
  };

  // Check if achievement is completed
  const isCompleted = (achievement) => {
    return calculateProgress(achievement) >= 1;
  };

  // Get progress percentage
  const getProgressPercentage = (achievement) => {
    return Math.round(calculateProgress(achievement) * 100);
  };

  // Render icon based on type
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

          {/* Summary Stats */}
          <View style={styles.summaryContainer}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryNumber}>
                {achievements.filter(achievement => isCompleted(achievement)).length}
              </Text>
              <Text style={styles.summaryLabel}>{getText('achievements.completed')}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryNumber}>{achievements.length}</Text>
              <Text style={styles.summaryLabel}>{getText('achievements.total')}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryNumber}>
                {Math.round((achievements.filter(achievement => isCompleted(achievement)).length / achievements.length) * 100)}%
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
                      completed && styles.completedItem
                    ]}
                  >
                    <View style={styles.achievementHeader}>
                      <View style={[
                        styles.iconContainer,
                        completed && styles.completedIconContainer
                      ]}>
                        {renderIcon(achievement.icon)}
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
                    
                    {/* 🔥 優化進度條：減少衝突的可能性 */}
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
    backgroundColor: '#FFFFFF', // White background
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
  completedItem: {
    backgroundColor: '#F8F9FA',
    borderColor: '#4CAF50',
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
  },
  completedIconContainer: {
    backgroundColor: '#E8F5E9',
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
  homePreview: {
    flex: 1,
    paddingHorizontal: 20,
  },
  homeHeader: {
    paddingTop: 60,
    paddingBottom: 20,
    alignItems: 'center',
  },
  homeHeaderText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333333',
  },
  homeContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  homeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 40,
  },
  homeCardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
    marginTop: 12,
  },
  homeCardSubtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  homeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  homeIndicatorText: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 8,
    fontWeight: '500',
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