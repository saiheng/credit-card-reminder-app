// components/HomePage.js - 修復版，添加所有缺失的功能
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  Modal
} from 'react-native';
import { format } from 'date-fns';
import StatsDropdown from './StatsDropdown';

export default function HomePage({ 
  creditCards = [], 
  paymentHistory = [],
  userData = {},
  onNavigate,
  onUpdateUserData
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDateModal, setShowDateModal] = useState(false);
  const [showStatsDropdown, setShowStatsDropdown] = useState(false);

  // 計算今日需要還款的卡片
  const getTodayPayments = () => {
    const today = new Date().getDate();
    return creditCards.filter(card => {
      const isPaid = isCardPaidThisMonth(card.id);
      return parseInt(card.dueDay) === today && !isPaid;
    });
  };

  // 獲取特定日期的還款卡片
  const getPaymentsForDate = (date) => {
    return creditCards.filter(card => {
      const isPaid = isCardPaidThisMonth(card.id);
      return parseInt(card.dueDay) === date && !isPaid;
    });
  };

  // 檢查某日期是否有還款
  const hasPaymentOnDate = (date) => {
    return creditCards.some(card => {
      const isPaid = isCardPaidThisMonth(card.id);
      return parseInt(card.dueDay) === date && !isPaid;
    });
  };

  // 檢查卡片本月是否已還款
  const isCardPaidThisMonth = (cardId) => {
    const today = new Date();
    const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    
    return paymentHistory.some(payment => 
      payment.cardId === cardId && 
      payment.month === currentMonth &&
      payment.onTime !== undefined
    );
  };

  // 處理日期點擊
  const handleDatePress = (date) => {
    const payments = getPaymentsForDate(date);
    setSelectedDate({ date, payments });
    setShowDateModal(true);
  };

  // 生成日曆
  const generateCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const weeks = [];
    let currentWeek = [];

    // 添加空白天數（月初）
    for (let i = 0; i < startingDay; i++) {
      currentWeek.push(null);
    }

    // 添加月份天數
    for (let day = 1; day <= daysInMonth; day++) {
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }

      const isToday = day === new Date().getDate() && 
                     month === new Date().getMonth() && 
                     year === new Date().getFullYear();
      const hasPayment = hasPaymentOnDate(day);
      const paymentCount = getPaymentsForDate(day).length;

      currentWeek.push({
        day,
        isToday,
        hasPayment,
        paymentCount
      });
    }

    // 完成最後一周
    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    return weeks;
  };

  const todayPayments = getTodayPayments();
  const weeks = generateCalendar();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.menuButton}
            onPress={() => onNavigate('MyCards')}
          >
            <Text style={styles.menuIcon}>☰</Text>
          </TouchableOpacity>
          
          <Text style={styles.title}>CardReminder</Text>
          
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => onNavigate('Profile')}
          >
            <Text style={styles.profileIcon}>👤</Text>
          </TouchableOpacity>
        </View>

        {/* Welcome Message */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>
            Welcome back, {userData.name || 'User'}!
          </Text>
          <Text style={styles.subtitleText}>
            You have {creditCards.length} cards to manage
          </Text>
        </View>

        {/* Today's Payments */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Payments</Text>
          <View style={styles.todayCard}>
            {todayPayments.length > 0 ? (
              <View>
                <Text style={styles.paymentIcon}>⚠️</Text>
                <Text style={styles.paymentText}>
                  {todayPayments.length} payment{todayPayments.length > 1 ? 's' : ''} due today
                </Text>
                <Text style={styles.paymentSubtext}>
                  {todayPayments.map(card => card.name).join(', ')}
                </Text>
              </View>
            ) : (
              <View>
                <Text style={styles.checkIcon}>✓</Text>
                <Text style={styles.noDueText}>No payments due today</Text>
                <Text style={styles.allCaughtText}>You're all caught up!</Text>
              </View>
            )}
          </View>
        </View>

        {/* Payment Calendar */}
        <View style={styles.section}>
          <View style={styles.calendarHeader}>
            <Text style={styles.sectionTitle}>Payment Calendar</Text>
            <Text style={styles.monthYear}>
              {format(currentDate, 'MMM yyyy')}
            </Text>
          </View>

          <View style={styles.calendar}>
            {/* Week days header */}
            <View style={styles.weekHeader}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                <Text key={index} style={styles.weekDay}>{day}</Text>
              ))}
            </View>

            {/* Calendar weeks */}
            {weeks.map((week, weekIndex) => (
              <View key={weekIndex} style={styles.week}>
                {week.map((dayObj, dayIndex) => (
                  <TouchableOpacity
                    key={dayIndex}
                    style={[
                      styles.day,
                      dayObj?.isToday && styles.today,
                      dayObj?.hasPayment && styles.paymentDay
                    ]}
                    onPress={() => dayObj && handleDatePress(dayObj.day)}
                    disabled={!dayObj}
                  >
                    {dayObj && (
                      <>
                        <Text style={[
                          styles.dayText,
                          dayObj.isToday && styles.todayText,
                          dayObj.hasPayment && styles.paymentDayText
                        ]}>
                          {dayObj.day}
                        </Text>
                        {dayObj.hasPayment && (
                          <View style={styles.paymentIndicator}>
                            <Text style={styles.paymentCount}>{dayObj.paymentCount}</Text>
                          </View>
                        )}
                      </>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>

          {/* Calendar Legend */}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={styles.legendDot} />
              <Text style={styles.legendText}>Payment due</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.todayLegend]} />
              <Text style={styles.legendText}>Today</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => onNavigate('Notifications')}
        >
          <Text style={styles.navIcon}>🔔</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => onNavigate('MyCards')}
        >
          <Text style={styles.addIcon}>☰</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => setShowStatsDropdown(true)}
        >
          <Text style={styles.navIcon}>📊</Text>
        </TouchableOpacity>
      </View>

      {/* Date Details Modal */}
      <Modal
        visible={showDateModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {selectedDate?.date} {format(currentDate, 'MMM yyyy')}
            </Text>
            
            {selectedDate?.payments.length > 0 ? (
              <View>
                <Text style={styles.modalSubtitle}>
                  {selectedDate.payments.length} Payment{selectedDate.payments.length > 1 ? 's' : ''} Due
                </Text>
                {selectedDate.payments.map((card, index) => (
                  <View key={index} style={styles.paymentItem}>
                    <View style={[styles.cardColorIndicator, { backgroundColor: card.color }]} />
                    <View style={styles.cardInfo}>
                      <Text style={styles.cardName}>{card.name}</Text>
                      <Text style={styles.cardBank}>{card.bank}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.noPaymentsText}>No payments due on this date</Text>
            )}
            
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowDateModal(false)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Stats Dropdown */}
      <StatsDropdown
        visible={showStatsDropdown}
        onClose={() => setShowStatsDropdown(false)}
        onNavigateToHistory={() => onNavigate('History')}
        onNavigateToAchievements={() => onNavigate('Achievements')}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuIcon: {
    color: '#FFFFFF',
    fontSize: 18,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIcon: {
    color: '#FFFFFF',
    fontSize: 18,
  },
  welcomeSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  welcomeText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitleText: {
    color: '#999999',
    fontSize: 16,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  todayCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  paymentIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  checkIcon: {
    fontSize: 48,
    marginBottom: 16,
    color: '#4CAF50',
  },
  paymentText: {
    color: '#FF3B30',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  paymentSubtext: {
    color: '#999999',
    fontSize: 14,
    textAlign: 'center',
  },
  noDueText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  allCaughtText: {
    color: '#4CAF50',
    fontSize: 14,
    textAlign: 'center',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  monthYear: {
    color: '#999999',
    fontSize: 16,
  },
  calendar: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 16,
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  weekDay: {
    color: '#999999',
    fontSize: 14,
    fontWeight: '600',
    width: 32,
    textAlign: 'center',
  },
  week: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  day: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    position: 'relative',
  },
  today: {
    backgroundColor: '#4CAF50',
  },
  paymentDay: {
    backgroundColor: '#FF3B30',
  },
  dayText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  todayText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  paymentDayText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  paymentIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentCount: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: 'bold',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    gap: 24,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF3B30',
  },
  todayLegend: {
    backgroundColor: '#4CAF50',
  },
  legendText: {
    color: '#999999',
    fontSize: 12,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  navButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navIcon: {
    fontSize: 24,
  },
  addIcon: {
    fontSize: 32,
    color: '#1a1a1a',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#2a2a2a',
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 20,
    maxWidth: 350,
    width: '100%',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalSubtitle: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  paymentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    marginBottom: 8,
  },
  cardColorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cardBank: {
    color: '#999999',
    fontSize: 14,
  },
  noPaymentsText: {
    color: '#999999',
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 20,
  },
  modalCloseButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 16,
  },
  modalCloseText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});