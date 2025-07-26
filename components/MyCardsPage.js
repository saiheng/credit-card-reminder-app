// components/MyCardsPage.js - 修復版，解決所有功能問題
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
  const [expandedCard, setExpandedCard] = useState(null);

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
      payment.onTime !== undefined // 確保是有效的還款記錄
    );
  };

  // 獲取卡片的通知設定
  const getCardNotificationSetting = (cardId) => {
    return notificationSettings[cardId]?.enabled || false;
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

  // 標記為已還款
  const handleMarkAsPaid = (cardId) => {
    if (onMarkPayment) {
      onMarkPayment(cardId);
    }
  };

  // 標記為未還款
  const handleMarkAsUnpaid = (cardId) => {
    const today = new Date();
    const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    
    // 找到並移除當月的還款記錄
    const updatedHistory = paymentHistory.filter(payment => 
      !(payment.cardId === cardId && payment.month === currentMonth)
    );
    
    // 更新卡片狀態
    if (onUpdateCard) {
      onUpdateCard(cardId, { isMarkedPaid: false });
    }
    
    Alert.alert('Success', 'Card marked as unpaid');
  };

  // 長按刪除卡片
  const handleLongPress = (card) => {
    Alert.alert(
      'Card Options',
      `What would you like to do with ${card.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Card',
          style: 'destructive',
          onPress: () => confirmDelete(card)
        }
      ]
    );
  };

  const confirmDelete = (card) => {
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

  // 獲取卡片狀態
  const getCardStatus = (card) => {
    const daysUntil = calculateDaysUntilDue(card.dueDay);
    const isPaid = isCardPaid(card.id);

    if (isPaid) {
      return { status: 'paid', color: '#4CAF50', text: 'Paid' };
    } else if (daysUntil < 0) {
      return { status: 'overdue', color: '#FF3B30', text: `${Math.abs(daysUntil)} days overdue` };
    } else if (daysUntil === 0) {
      return { status: 'due', color: '#FF9500', text: 'Due today' };
    } else if (daysUntil <= 3) {
      return { status: 'urgent', color: '#FF9500', text: `${daysUntil} days left` };
    } else {
      return { status: 'normal', color: '#007AFF', text: `${daysUntil} days left` };
    }
  };

  // 排序卡片（按緊急程度）
  const sortedCards = [...creditCards].sort((a, b) => {
    const aStatus = getCardStatus(a);
    const bStatus = getCardStatus(b);
    
    const statusPriority = {
      'overdue': 1,
      'due': 2,
      'urgent': 3,
      'normal': 4,
      'paid': 5
    };
    
    return statusPriority[aStatus.status] - statusPriority[bStatus.status];
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={onBack}
          activeOpacity={0.8}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>My Cards</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => onNavigate('AddCard')}
          activeOpacity={0.8}
        >
          <Text style={styles.addIcon}>+</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Cards List */}
        <View style={styles.cardsSection}>
          {sortedCards.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>💳</Text>
              <Text style={styles.emptyTitle}>No Credit Cards</Text>
              <Text style={styles.emptySubtitle}>
                Add your first credit card to get started with payment reminders
              </Text>
              <TouchableOpacity 
                style={styles.emptyButton}
                onPress={() => onNavigate('AddCard')}
              >
                <Text style={styles.emptyButtonText}>Add Your First Card</Text>
              </TouchableOpacity>
            </View>
          ) : (
            sortedCards.map((card, index) => {
              const cardStatus = getCardStatus(card);
              const isPaid = cardStatus.status === 'paid';
              const notificationEnabled = getCardNotificationSetting(card.id);

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.cardContainer,
                    { borderLeftColor: card.color || '#666666' }
                  ]}
                  onLongPress={() => handleLongPress(card)}
                  activeOpacity={0.8}
                >
                  <View style={styles.cardContent}>
                    {/* Card Header */}
                    <View style={styles.cardHeader}>
                      <View style={styles.cardInfo}>
                        <Text style={styles.cardName}>{card.name}</Text>
                        <Text style={styles.cardBank}>{card.bank}</Text>
                        <Text style={styles.cardDueDate}>Due: {card.dueDay}th of each month</Text>
                      </View>
                      
                      {/* Notification Toggle */}
                      <View style={styles.notificationToggle}>
                        <Switch
                          value={notificationEnabled}
                          onValueChange={(enabled) => handleToggleNotification(card.id, enabled)}
                          trackColor={{ false: '#333333', true: '#007AFF' }}
                          thumbColor={notificationEnabled ? '#FFFFFF' : '#666666'}
                          style={styles.switch}
                        />
                      </View>
                    </View>

                    {/* Card Status */}
                    <View style={styles.cardStatus}>
                      <View style={[
                        styles.statusBadge,
                        { backgroundColor: cardStatus.color + '20' }
                      ]}>
                        <Text style={[
                          styles.statusText,
                          { color: cardStatus.color }
                        ]}>
                          {cardStatus.text}
                        </Text>
                      </View>
                    </View>

                    {/* Card Actions */}
                    <View style={styles.cardActions}>
                      {isPaid ? (
                        <TouchableOpacity
                          style={[styles.actionButton, styles.unpaidButton]}
                          onPress={() => handleMarkAsUnpaid(card.id)}
                        >
                          <Text style={styles.unpaidButtonText}>Mark as Unpaid</Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          style={[styles.actionButton, styles.paidButton]}
                          onPress={() => handleMarkAsPaid(card.id)}
                        >
                          <Text style={styles.paidButtonText}>Mark as Paid</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
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
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60, // 調整位置避免動態島遮擋
    paddingBottom: 16,
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addIcon: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  cardsSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  cardContainer: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    overflow: 'hidden',
  },
  cardContent: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardBank: {
    color: '#CCCCCC',
    fontSize: 14,
    marginBottom: 4,
  },
  cardDueDate: {
    color: '#999999',
    fontSize: 12,
  },
  notificationToggle: {
    alignItems: 'flex-end',
  },
  switch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
  cardStatus: {
    marginBottom: 16,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  paidButton: {
    backgroundColor: '#4CAF50',
  },
  unpaidButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#666666',
  },
  paidButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  unpaidButtonText: {
    color: '#999999',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  emptySubtitle: {
    color: '#999999',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  emptyButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 20,
  },
});