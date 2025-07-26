// components/AchievementsPage.js - 擴展版，添加更多成就
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Animated
} from 'react-native';

export default function AchievementsPage({ 
  achievements = [], 
  creditCards = [], 
  paymentHistory = [], 
  onBack,
  onUpdateAchievements
}) {
  const [animationValues] = useState(() => new Map());

  // 定義所有可能的成就
  const ALL_ACHIEVEMENTS = [
    // 基礎成就
    {
      id: 'first_card',
      name: '初來乍到',
      description: '成功新增第一張信用卡',
      icon: '🎯',
      category: '基礎',
      condition: () => creditCards.length >= 1,
      points: 10
    },
    {
      id: 'first_payment',
      name: '首次還款',
      description: '完成第一次還款標記',
      icon: '✅',
      category: '基礎',
      condition: () => paymentHistory.length >= 1,
      points: 15
    },
    {
      id: 'card_collector',
      name: '卡片收集家',
      description: '管理5張或以上信用卡',
      icon: '💳',
      category: '基礎',
      condition: () => creditCards.length >= 5,
      points: 25
    },

    // 還款成就
    {
      id: 'perfect_week',
      name: '完美一週',
      description: '連續7天準時還款',
      icon: '📅',
      category: '還款',
      condition: () => {
        const recent = paymentHistory.slice(-7);
        return recent.length >= 7 && recent.every(p => p.onTime);
      },
      points: 30
    },
    {
      id: 'month_champion',
      name: '月度冠軍',
      description: '單月內完成10次以上準時還款',
      icon: '🏆',
      category: '還款',
      condition: () => {
        const thisMonth = new Date().toISOString().slice(0, 7);
        const monthPayments = paymentHistory.filter(p => 
          p.month === thisMonth && p.onTime
        );
        return monthPayments.length >= 10;
      },
      points: 50
    },
    {
      id: 'streak_master',
      name: '連擊大師',
      description: '連續30天準時還款',
      icon: '🔥',
      category: '還款',
      condition: () => {
        const recent = paymentHistory.slice(-30);
        return recent.length >= 30 && recent.every(p => p.onTime);
      },
      points: 100
    },

    // 連續性成就
    {
      id: 'reliable_user',
      name: '可靠用戶',
      description: '準時還款率達到90%以上',
      icon: '⭐',
      category: '連續',
      condition: () => {
        const total = paymentHistory.length;
        const onTime = paymentHistory.filter(p => p.onTime).length;
        return total >= 10 && (onTime / total) >= 0.9;
      },
      points: 75
    },
    {
      id: 'consistency_king',
      name: '持續之王',
      description: '連續6個月每月至少還款一次',
      icon: '👑',
      category: '連續',
      condition: () => {
        const months = [...new Set(paymentHistory.map(p => p.month))];
        return months.length >= 6;
      },
      points: 80
    },
    {
      id: 'early_bird',
      name: '早起的鳥兒',
      description: '10次提前3天以上還款',
      icon: '🐦',
      category: '連續',
      condition: () => {
        const earlyPayments = paymentHistory.filter(p => {
          if (!p || !p.markedDate || !p.date) return false;
          
          try {
            const paymentDate = new Date(p.markedDate);
            const dueDate = new Date(p.date);
            
            if (isNaN(paymentDate.getTime()) || isNaN(dueDate.getTime())) {
              return false;
            }
            
            const diffDays = (dueDate - paymentDate) / (1000 * 60 * 60 * 24);
            return diffDays >= 3;
          } catch (error) {
            return false;
          }
        });
        return earlyPayments.length >= 10;
      },
      points: 40
    },

    // 特殊成就
    {
      id: 'never_late',
      name: '從不遲到',
      description: '累計50次還款且從未逾期',
      icon: '💎',
      category: '特殊',
      condition: () => {
        return paymentHistory.length >= 50 && 
               paymentHistory.every(p => p.onTime);
      },
      points: 150
    },
    {
      id: 'bank_explorer',
      name: '銀行探索者',
      description: '使用來自5個不同銀行的信用卡',
      icon: '🏦',
      category: '特殊',
      condition: () => {
        const banks = [...new Set(creditCards.map(c => c.bank))];
        return banks.length >= 5;
      },
      points: 60
    },
    {
      id: 'organization_master',
      name: '整理大師',
      description: '為每張信用卡設置不同顏色',
      icon: '🎨',
      category: '特殊',
      condition: () => {
        const colors = [...new Set(creditCards.map(c => c.color))];
        return creditCards.length >= 3 && colors.length === creditCards.length;
      },
      points: 35
    },

    // 里程碑成就
    {
      id: 'hundred_club',
      name: '百次俱樂部',
      description: '累計完成100次還款',
      icon: '💯',
      category: '里程碑',
      condition: () => paymentHistory.length >= 100,
      points: 200
    },
    {
      id: 'year_veteran',
      name: '年度老兵',
      description: '使用應用程式滿365天',
      icon: '🗓️',
      category: '里程碑',
      condition: () => {
        // 這裡需要根據實際的用戶註冊時間來計算
        // 暫時使用簡化邏輯
        return paymentHistory.length >= 50;
      },
      points: 300
    },
    {
      id: 'perfectionist',
      name: '完美主義者',
      description: '連續100次準時還款',
      icon: '🌟',
      category: '里程碑',
      condition: () => {
        const recent = paymentHistory.slice(-100);
        return recent.length >= 100 && recent.every(p => p.onTime);
      },
      points: 500
    },

    // 創新成就
    {
      id: 'tech_savvy',
      name: '科技達人',
      description: '使用所有應用程式功能',
      icon: '📱',
      category: '創新',
      condition: () => {
        // 檢查是否使用過主要功能：新增卡片、設置通知、查看歷史
        return creditCards.length >= 1 && 
               paymentHistory.length >= 1;
      },
      points: 45
    },
    {
      id: 'multi_tasker',
      name: '多工處理者',
      description: '同一天標記3張以上信用卡還款',
      icon: '⚡',
      category: '創新',
      condition: () => {
        const dailyPayments = paymentHistory.reduce((acc, payment) => {
          if (!payment || !payment.markedDate) return acc;
          
          try {
            const dateStr = String(payment.markedDate);
            const date = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr.split(' ')[0];
            acc[date] = (acc[date] || 0) + 1;
          } catch (error) {
            console.error('Date parsing error:', error);
          }
          
          return acc;
        }, {});
        return Object.values(dailyPayments).some(count => count >= 3);
      },
      points: 25
    },
    {
      id: 'calendar_master',
      name: '日曆大師',
      description: '連續使用日曆功能查看還款安排30天',
      icon: '📆',
      category: '創新',
      condition: () => {
        // 簡化條件：至少使用應用程式30天
        return paymentHistory.length >= 30;
      },
      points: 40
    }
  ];

  // 檢查並更新成就狀態
  useEffect(() => {
    checkAchievements();
  }, [creditCards, paymentHistory]);

  const checkAchievements = () => {
    let newAchievements = [...achievements];
    let hasNewAchievement = false;

    ALL_ACHIEVEMENTS.forEach(achievementDef => {
      const existingAchievement = newAchievements.find(a => a.id === achievementDef.id);
      
      if (!existingAchievement) {
        // 檢查是否滿足解鎖條件
        if (achievementDef.condition()) {
          newAchievements.push({
            ...achievementDef,
            unlocked: true,
            unlockedDate: new Date().toISOString(),
            progress: 1.0
          });
          hasNewAchievement = true;
          
          // 觸發動畫
          startUnlockAnimation(achievementDef.id);
        } else {
          // 添加未解鎖的成就
          newAchievements.push({
            ...achievementDef,
            unlocked: false,
            unlockedDate: null,
            progress: calculateProgress(achievementDef)
          });
        }
      } else if (!existingAchievement.unlocked && achievementDef.condition()) {
        // 更新已存在但未解鎖的成就
        const index = newAchievements.findIndex(a => a.id === achievementDef.id);
        newAchievements[index] = {
          ...existingAchievement,
          unlocked: true,
          unlockedDate: new Date().toISOString(),
          progress: 1.0
        };
        hasNewAchievement = true;
        startUnlockAnimation(achievementDef.id);
      } else if (existingAchievement && !existingAchievement.unlocked) {
        // 更新進度
        const index = newAchievements.findIndex(a => a.id === achievementDef.id);
        newAchievements[index].progress = calculateProgress(achievementDef);
      }
    });

    if (hasNewAchievement) {
      onUpdateAchievements(newAchievements);
    }
  };

  // 計算成就進度
  const calculateProgress = (achievementDef) => {
    switch (achievementDef.id) {
      case 'first_card':
        return Math.min(creditCards.length / 1, 1);
      case 'card_collector':
        return Math.min(creditCards.length / 5, 1);
      case 'first_payment':
        return Math.min(paymentHistory.length / 1, 1);
      case 'hundred_club':
        return Math.min(paymentHistory.length / 100, 1);
      case 'perfect_week':
        const recent7 = paymentHistory.slice(-7);
        return Math.min(recent7.filter(p => p.onTime).length / 7, 1);
      case 'streak_master':
        const recent30 = paymentHistory.slice(-30);
        return Math.min(recent30.filter(p => p.onTime).length / 30, 1);
      case 'never_late':
        const onTimeCount = paymentHistory.filter(p => p.onTime).length;
        return Math.min(onTimeCount / 50, 1);
      default:
        return 0;
    }
  };

  // 啟動解鎖動畫
  const startUnlockAnimation = (achievementId) => {
    const animValue = new Animated.Value(0);
    animationValues.set(achievementId, animValue);
    
    Animated.sequence([
      Animated.timing(animValue, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(animValue, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();
  };

  // 按類別分組成就
  const groupAchievementsByCategory = () => {
    const categories = ['基礎', '還款', '連續', '特殊', '里程碑', '創新'];
    return categories.map(category => ({
      name: category,
      achievements: achievements.filter(a => a.category === category)
    })).filter(group => group.achievements.length > 0);
  };

  // 計算總統計
  const calculateOverallStats = () => {
    const unlockedCount = achievements.filter(a => a.unlocked).length;
    const totalPoints = achievements.filter(a => a.unlocked).reduce((sum, a) => sum + a.points, 0);
    const completionRate = achievements.length > 0 ? Math.round((unlockedCount / achievements.length) * 100) : 0;
    
    return {
      unlockedCount,
      totalAchievements: achievements.length,
      totalPoints,
      completionRate
    };
  };

  const stats = calculateOverallStats();
  const groupedAchievements = groupAchievementsByCategory();

  // 格式化日期
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      
      return date.toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (error) {
      console.error('Date formatting error:', error);
      return '';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Achievements</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* 總體統計 */}
        <View style={styles.statsSection}>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.unlockedCount}</Text>
              <Text style={styles.statLabel}>已解鎖</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.totalPoints}</Text>
              <Text style={styles.statLabel}>總積分</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.completionRate}%</Text>
              <Text style={styles.statLabel}>完成度</Text>
            </View>
          </View>
        </View>

        {/* 成就列表 */}
        {groupedAchievements.map((group, groupIndex) => (
          <View key={groupIndex} style={styles.categorySection}>
            <Text style={styles.categoryTitle}>{group.name}</Text>
            
            {group.achievements.map((achievement, index) => {
              const animValue = animationValues.get(achievement.id);
              
              return (
                <Animated.View
                  key={index}
                  style={[
                    styles.achievementCard,
                    achievement.unlocked && styles.unlockedCard,
                    animValue && {
                      transform: [{
                        scale: animValue.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 1.05]
                        })
                      }]
                    }
                  ]}
                >
                  <View style={styles.achievementLeft}>
                    <Text style={[
                      styles.achievementIcon,
                      !achievement.unlocked && styles.lockedIcon
                    ]}>
                      {achievement.unlocked ? achievement.icon : '🔒'}
                    </Text>
                    <View style={styles.achievementInfo}>
                      <Text style={[
                        styles.achievementName,
                        !achievement.unlocked && styles.lockedText
                      ]}>
                        {achievement.name}
                      </Text>
                      <Text style={styles.achievementDescription}>
                        {achievement.description}
                      </Text>
                      {achievement.unlocked && achievement.unlockedDate && (
                        <Text style={styles.unlockedDate}>
                          解鎖於：{formatDate(achievement.unlockedDate)}
                        </Text>
                      )}
                    </View>
                  </View>
                  
                  <View style={styles.achievementRight}>
                    <Text style={[
                      styles.pointsText,
                      achievement.unlocked && styles.earnedPoints
                    ]}>
                      {achievement.unlocked ? `+${achievement.points}` : achievement.points}
                    </Text>
                    
                    {!achievement.unlocked && (
                      <View style={styles.progressContainer}>
                        <View style={styles.progressBar}>
                          <View style={[
                            styles.progressFill,
                            { 
                              transform: [{ scaleX: achievement.progress }]
                            }
                          ]} />
                        </View>
                        <Text style={styles.progressText}>
                          {Math.round(achievement.progress * 100)}%
                        </Text>
                      </View>
                    )}
                    
                    {achievement.unlocked && (
                      <Text style={styles.completedBadge}>✓</Text>
                    )}
                  </View>
                </Animated.View>
              );
            })}
          </View>
        ))}

        {/* 底部間距 */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  statsSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 20,
    width: '30%',
    alignItems: 'center',
  },
  statNumber: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statLabel: {
    color: '#999999',
    fontSize: 12,
    textAlign: 'center',
  },
  categorySection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  categoryTitle: {
    color: '#007AFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  achievementCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  unlockedCard: {
    borderColor: '#007AFF',
    backgroundColor: '#1e3a8a20',
  },
  achievementLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  achievementIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  lockedIcon: {
    opacity: 0.5,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  lockedText: {
    color: '#999999',
  },
  achievementDescription: {
    color: '#CCCCCC',
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 4,
  },
  unlockedDate: {
    color: '#007AFF',
    fontSize: 12,
  },
  achievementRight: {
    alignItems: 'flex-end',
  },
  pointsText: {
    color: '#999999',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  earnedPoints: {
    color: '#4CAF50',
  },
  progressContainer: {
    alignItems: 'flex-end',
  },
  progressBar: {
    width: 60,
    height: 6,
    backgroundColor: '#333333',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    width: '100%',
    height: '100%',
    backgroundColor: '#007AFF',
    transformOrigin: 'left center',
  },
  progressText: {
    color: '#999999',
    fontSize: 12,
  },
  completedBadge: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomSpacing: {
    height: 20,
  },
});