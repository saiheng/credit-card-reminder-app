// components/HistoryPage.js - 修復版，添加標題並移除金額顯示
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput
} from 'react-native';

export default function HistoryPage({ 
  paymentHistory = [], 
  creditCards = [], 
  onBack 
}) {
  const [searchQuery, setSearchQuery] = useState('');

  // 計算統計數據
  const calculateStats = () => {
    const totalPayments = paymentHistory.length;
    const onTimePayments = paymentHistory.filter(p => p.onTime).length;
    const latePayments = totalPayments - onTimePayments;
    const onTimeRate = totalPayments > 0 ? (onTimePayments / totalPayments * 100) : 0;

    return {
      totalPayments,
      onTimePayments,
      latePayments,
      onTimeRate: Math.round(onTimeRate)
    };
  };

  // 獲取信用卡名稱
  const getCardName = (cardId) => {
    const card = creditCards.find(c => c.id === cardId);
    return card ? card.name : '未知卡片';
  };

  // 獲取信用卡顏色
  const getCardColor = (cardId) => {
    const card = creditCards.find(c => c.id === cardId);
    return card ? card.color : '#666666';
  };

  // 按月份分組歷史記錄
  const groupHistoryByMonth = () => {
    const filtered = paymentHistory.filter(payment => {
      if (!payment || !payment.cardId) return false;
      const cardName = String(getCardName(payment.cardId) || '').toLowerCase();
      const query = String(searchQuery || '').toLowerCase();
      return cardName.includes(query);
    });

    const grouped = filtered.reduce((acc, payment) => {
      const month = payment.month;
      if (!acc[month]) {
        acc[month] = [];
      }
      acc[month].push(payment);
      return acc;
    }, {});

    // 按月份排序（最新的在前）
    return Object.keys(grouped)
      .sort((a, b) => new Date(b) - new Date(a))
      .map(month => ({
        month,
        payments: grouped[month].sort((a, b) => new Date(b.date) - new Date(a.date))
      }));
  };

  const stats = calculateStats();
  const groupedHistory = groupHistoryByMonth();

  // 格式化日期
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  // 格式化月份
  const formatMonth = (monthString) => {
    const [year, month] = monthString.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long'
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>History</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* 統計卡片 */}
        <View style={styles.statsContainer}>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.totalPayments}</Text>
              <Text style={styles.statLabel}>總還款次數</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.onTimePayments}</Text>
              <Text style={styles.statLabel}>準時還款</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.latePayments}</Text>
              <Text style={styles.statLabel}>逾期還款</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statNumber, { color: stats.onTimeRate >= 80 ? '#4CAF50' : '#FF3B30' }]}>
                {stats.onTimeRate}%
              </Text>
              <Text style={styles.statLabel}>準時率</Text>
            </View>
          </View>
        </View>

        {/* 搜尋欄 */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="搜尋信用卡..."
            placeholderTextColor="#666666"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* 歷史記錄 */}
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>還款記錄</Text>
          
          {groupedHistory.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📝</Text>
              <Text style={styles.emptyTitle}>暫無還款記錄</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery ? '沒有找到匹配的記錄' : '開始使用應用程式後，您的還款記錄將會顯示在這裡'}
              </Text>
            </View>
          ) : (
            groupedHistory.map((group, index) => (
              <View key={index} style={styles.monthSection}>
                <Text style={styles.monthTitle}>{formatMonth(group.month)}</Text>
                
                {group.payments.map((payment, paymentIndex) => (
                  <View key={paymentIndex} style={styles.paymentItem}>
                    <View style={styles.paymentLeft}>
                      <View style={[
                        styles.cardIndicator, 
                        { backgroundColor: getCardColor(payment.cardId) }
                      ]} />
                      <View style={styles.paymentInfo}>
                        <Text style={styles.cardName}>{getCardName(payment.cardId)}</Text>
                        <Text style={styles.paymentDate}>
                          還款日期：{formatDate(payment.date)}
                        </Text>
                        <Text style={styles.markedDate}>
                          標記時間：{formatDate(payment.markedDate)}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.paymentRight}>
                      <View style={[
                        styles.statusBadge,
                        payment.onTime ? styles.onTimeBadge : styles.lateBadge
                      ]}>
                        <Text style={[
                          styles.statusText,
                          payment.onTime ? styles.onTimeText : styles.lateText
                        ]}>
                          {payment.onTime ? '準時' : '逾期'}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            ))
          )}
        </View>

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
  statsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 20,
    width: '48%',
    marginBottom: 16,
    alignItems: 'center',
  },
  statNumber: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statLabel: {
    color: '#999999',
    fontSize: 14,
    textAlign: 'center',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchInput: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 16,
  },
  historySection: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: '#999999',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  monthSection: {
    marginBottom: 32,
  },
  monthTitle: {
    color: '#007AFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  paymentItem: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  paymentInfo: {
    flex: 1,
  },
  cardName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  paymentDate: {
    color: '#CCCCCC',
    fontSize: 14,
    marginBottom: 2,
  },
  markedDate: {
    color: '#999999',
    fontSize: 12,
  },
  paymentRight: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  onTimeBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  lateBadge: {
    backgroundColor: 'rgba(255, 59, 48, 0.2)',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  onTimeText: {
    color: '#4CAF50',
  },
  lateText: {
    color: '#FF3B30',
  },
  bottomSpacing: {
    height: 20,
  },
});