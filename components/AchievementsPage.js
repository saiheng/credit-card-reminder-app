// components/AchievementsPage.js - Updated with white background and professional icons
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Animated
} from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';

export default function AchievementsPage({ 
  creditCards = [], 
  paymentHistory = [],
  onBack 
}) {
  const [animatedValues] = useState({});

  // Initialize animated values for progress bars
  useEffect(() => {
    achievements.forEach((achievement, index) => {
      if (!animatedValues[index]) {
        animatedValues[index] = new Animated.Value(0);
      }
    });

    // Animate progress bars
    achievements.forEach((achievement, index) => {
      const progress = calculateProgress(achievement);
      Animated.timing(animatedValues[index], {
        toValue: progress,
        duration: 1000 + (index * 100),
        useNativeDriver: false,
      }).start();
    });
  }, [creditCards, paymentHistory]);

  // Define achievements with professional icons
  const achievements = [
    {
      id: 1,
      title: 'Getting Started',
      description: 'Add your first credit card',
      icon: { type: 'MaterialIcons', name: 'credit-card', color: '#4CAF50' },
      target: 1,
      type: 'cards_added'
    },
    {
      id: 2,
      title: 'First Payment',
      description: 'Make your first on-time payment',
      icon: { type: 'MaterialIcons', name: 'payment', color: '#2196F3' },
      target: 1,
      type: 'payments_made'
    },
    {
      id: 3,
      title: 'Card Collector',
      description: 'Add 3 different credit cards',
      icon: { type: 'MaterialIcons', name: 'account-balance-wallet', color: '#FF9800' },
      target: 3,
      type: 'cards_added'
    },
    {
      id: 4,
      title: 'Perfect Week',
      description: 'No missed payments for 7 days',
      icon: { type: 'MaterialIcons', name: 'check-circle', color: '#4CAF50' },
      target: 7,
      type: 'consecutive_days'
    },
    {
      id: 5,
      title: 'Monthly Champion',
      description: 'Pay all cards on time for a month',
      icon: { type: 'MaterialIcons', name: 'star', color: '#FFD700' },
      target: 30,
      type: 'consecutive_days'
    },
    {
      id: 6,
      title: 'Streak Master',
      description: 'Maintain 90-day payment streak',
      icon: { type: 'MaterialIcons', name: 'local-fire-department', color: '#FF5722' },
      target: 90,
      type: 'consecutive_days'
    },
    {
      id: 7,
      title: 'Reliable User',
      description: 'Use the app for 30 consecutive days',
      icon: { type: 'MaterialIcons', name: 'schedule', color: '#9C27B0' },
      target: 30,
      type: 'app_usage_days'
    },
    {
      id: 8,
      title: 'Persistence King',
      description: 'Use the app for 100 consecutive days',
      icon: { type: 'MaterialIcons', name: 'emoji-events', color: '#FF6B35' },
      target: 100,
      type: 'app_usage_days'
    },
    {
      id: 9,
      title: 'Early Bird',
      description: 'Pay 10 bills early (before due date)',
      icon: { type: 'MaterialIcons', name: 'flight-takeoff', color: '#00BCD4' },
      target: 10,
      type: 'early_payments'
    },
    {
      id: 10,
      title: 'Never Late',
      description: 'Perfect payment record for 6 months',
      icon: { type: 'MaterialIcons', name: 'verified', color: '#4CAF50' },
      target: 180,
      type: 'consecutive_days'
    },
    {
      id: 11,
      title: 'Bank Explorer',
      description: 'Add cards from 5 different banks',
      icon: { type: 'MaterialIcons', name: 'account-balance', color: '#3F51B5' },
      target: 5,
      type: 'different_banks'
    },
    {
      id: 12,
      title: 'Organization Master',
      description: 'Set up notifications for all cards',
      icon: { type: 'MaterialIcons', name: 'notifications-active', color: '#795548' },
      target: 1,
      type: 'notifications_setup'
    },
    {
      id: 13,
      title: 'Century Club',
      description: 'Make 100 successful payments',
      icon: { type: 'MaterialIcons', name: 'military-tech', color: '#E91E63' },
      target: 100,
      type: 'payments_made'
    },
    {
      id: 14,
      title: 'Veteran User',
      description: 'Use the app for a full year',
      icon: { type: 'MaterialIcons', name: 'workspace-premium', color: '#FF9800' },
      target: 365,
      type: 'app_usage_days'
    },
    {
      id: 15,
      title: 'Perfectionist',
      description: '100% on-time payment rate',
      icon: { type: 'MaterialIcons', name: 'diamond', color: '#9C27B0' },
      target: 100,
      type: 'perfect_rate'
    },
    {
      id: 16,
      title: 'Tech Savvy',
      description: 'Customize notification settings',
      icon: { type: 'MaterialIcons', name: 'settings', color: '#607D8B' },
      target: 1,
      type: 'custom_settings'
    },
    {
      id: 17,
      title: 'Multitasker',
      description: 'Manage 5+ active credit cards',
      icon: { type: 'MaterialIcons', name: 'view-module', color: '#FF5722' },
      target: 5,
      type: 'cards_added'
    },
    {
      id: 18,
      title: 'Calendar Master',
      description: 'Use payment calendar feature 20 times',
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
        
        <Text style={styles.title}>Achievements</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Summary Stats */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>
            {achievements.filter(achievement => isCompleted(achievement)).length}
          </Text>
          <Text style={styles.summaryLabel}>Completed</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{achievements.length}</Text>
          <Text style={styles.summaryLabel}>Total</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>
            {Math.round((achievements.filter(achievement => isCompleted(achievement)).length / achievements.length) * 100)}%
          </Text>
          <Text style={styles.summaryLabel}>Progress</Text>
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
                      {achievement.title}
                    </Text>
                    <Text style={styles.achievementDescription}>
                      {achievement.description}
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
                
                {/* Progress Bar */}
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
});