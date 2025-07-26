// components/MyCardsPage.js - 專業UI重新設計版本
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Switch,
  Alert
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

export default function MyCardsPage({ 
  creditCards = [], 
  paymentHistory = [],
  notificationSettings = {},
  onBack, 
  onNavigate, 
  onUpdateCard, 
  onDeleteCard, 
  onMarkPayment,
  onUpdateNotificationSettings
}) {
  // 計算統計數據
  const calculateStats = () => {
    const total = creditCards.length;
    const paid = creditCards.filter(card => isCardPaid(card.id)).length;
    const unpaid = total - paid;
    return { total, paid, unpaid };
  };

  // 計算距離還款日的天數
  const calculateDaysUntilDue = (dueDay) => {
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    let dueDate = new Date(currentYear, currentMonth, parseInt(dueDay));
    
    if (dueDate <= today) {
      dueDate.setMonth(dueDate.getMonth() + 1);
    }
    
    const diffTime = dueDate - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // 檢查卡片是否已還款
  const isCardPaid = (cardId) => {
    const today = new Date();
    const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    
    return paymentHistory.some(payment => 
      payment.cardId === cardId && 
      payment.month === currentMonth &&
      payment.onTime !== undefined
    );
  };

  // 獲取到期日期格式化顯示
  const formatDueDate = (dueDay) => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    let dueDate = new Date(currentYear, currentMonth, parseInt(dueDay));
    
    if (dueDate <= today) {
      dueDate.setMonth(dueDate.getMonth() + 1);
    }
    
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[dueDate.getMonth()]} ${dueDate.getDate()}`;
  };

  // 獲取卡片的通知設定
  const getCardNotificationSetting = (cardId) => {
    return notificationSettings[cardId]?.enabled !== false;
  };

  // 更新卡片通知設定
  const handleToggleNotification = (cardId, enabled) => {
    if (onUpdateNotificationSettings) {
      const currentSettings = notificationSettings[cardId] || {};
      onUpdateNotificationSettings(cardId, {
        ...currentSettings,
        enabled: enabled
      });
    }
  };

  // 切換還款狀態
  const handleTogglePayment = (cardId) => {
    const isPaid = isCardPaid(cardId);
    
    if (!isPaid) {
      // 標記為已還款
      if (onMarkPayment) {
        onMarkPayment(cardId);
      }
    } else {
      // 標記為未還款（移除還款記錄）
      const today = new Date();
      const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
      
      Alert.alert(
        'Confirm Action',
        'Mark this card as unpaid?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Confirm', 
            onPress: () => {
              if (onUpdateCard) {
                onUpdateCard(cardId, { isMarkedPaid: false });
              }
              Alert.alert('Success', 'Card marked as unpaid');
            }
          }
        ]
      );
    }
  };

  // 長按刪除卡片
  const handleLongPress = (card) => {
    Alert.alert(
      'Delete Card',
      `Are you sure you want to delete ${card.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (onDeleteCard) {
              onDeleteCard(card.id);
            }
          }
        }
      ]
    );
  };

  const stats = calculateStats();

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
        
        <View style={styles.titleSection}>
          <Text style={styles.title}>My Cards</Text>
          <Text style={styles.subtitle}>
            Total: {stats.total} | Paid: {stats.paid} | Unpaid: {stats.unpaid}
          </Text>
        </View>
        
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => onNavigate('AddCard')}
          activeOpacity={0.7}
        >
          <MaterialIcons name="add" size={24} color="#000000" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.cardsContainer}>
          {creditCards.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="credit-card" size={64} color="#E0E0E0" />
              <Text style={styles.emptyTitle}>No Credit Cards</Text>
              <Text style={styles.emptySubtitle}>
                Add your first credit card to get started
              </Text>
              <TouchableOpacity 
                style={styles.emptyButton}
                onPress={() => onNavigate('AddCard')}
                activeOpacity={0.7}
              >
                <Text style={styles.emptyButtonText}>Add Card</Text>
              </TouchableOpacity>
            </View>
          ) : (
            creditCards.map((card, index) => {
              const isPaid = isCardPaid(card.id);
              const daysLeft = calculateDaysUntilDue(card.dueDay);
              const notificationEnabled = getCardNotificationSetting(card.id);
              const dueDate = formatDueDate(card.dueDay);

              return (
                <TouchableOpacity
                  key={index}
                  style={styles.cardItem}
                  onLongPress={() => handleLongPress(card)}
                  activeOpacity={0.95}
                >
                  <View style={styles.cardContent}>
                    {/* 左側信息 */}
                    <View style={styles.cardLeft}>
                      {/* 通知開關 */}
                      <View style={styles.notificationSection}>
                        <Text style={styles.notificationLabel}>Notifications</Text>
                        <Switch
                          value={notificationEnabled}
                          onValueChange={(enabled) => handleToggleNotification(card.id, enabled)}
                          trackColor={{ false: '#E0E0E0', true: '#4CAF50' }}
                          thumbColor={notificationEnabled ? '#FFFFFF' : '#F5F5F5'}
                          style={styles.switch}
                        />
                      </View>
                      
                      {/* 卡片信息 */}
                      <Text style={styles.cardName}>{card.name}</Text>
                      <Text style={styles.bankName}>{card.bank}</Text>
                      <Text style={styles.dueDate}>Due: {dueDate}</Text>
                      <Text style={[
                        styles.daysLeft,
                        daysLeft <= 3 && styles.daysLeftUrgent,
                        daysLeft <= 0 && styles.daysLeftOverdue
                      ]}>
                        {daysLeft > 0 ? `${daysLeft} days left` : 
                         daysLeft === 0 ? 'Due today' : 
                         `${Math.abs(daysLeft)} days overdue`}
                      </Text>
                    </View>

                    {/* 右側按鈕 */}
                    <View style={styles.cardRight}>
                      <TouchableOpacity
                        style={[
                          styles.paymentButton,
                          isPaid && styles.paidButton
                        ]}
                        onPress={() => handleTogglePayment(card.id)}
                        activeOpacity={0.7}
                      >
                        <Text style={[
                          styles.paymentButtonText,
                          isPaid && styles.paidButtonText
                        ]}>
                          {isPaid ? 'Paid' : 'Unpaid'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  titleSection: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
  },
  subtitle: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  addButton: {
    padding: 8,
    marginLeft: 8,
  },
  scrollView: {
    flex: 1,
  },
  cardsContainer: {
    padding: 16,
  },
  cardItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardContent: {
    flexDirection: 'row',
    padding: 16,
  },
  cardLeft: {
    flex: 1,
  },
  notificationSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  notificationLabel: {
    fontSize: 10,
    color: '#666666',
    marginRight: 8,
  },
  switch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
  cardName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  bankName: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  dueDate: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 4,
  },
  daysLeft: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  daysLeftUrgent: {
    color: '#FF9800',
  },
  daysLeftOverdue: {
    color: '#F44336',
  },
  cardRight: {
    justifyContent: 'flex-end',
  },
  paymentButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  paidButton: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
  },
  paymentButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
  },
  paidButtonText: {
    color: '#4CAF50',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#000000',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
});