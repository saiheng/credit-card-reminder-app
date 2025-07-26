// components/HomePage.js - 完全重新設計版本，符合附圖要求
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
  Dimensions
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import StatsDropdown from './StatsDropdown';

const { width } = Dimensions.get('window');

export default function HomePage({ 
  userData = { name: 'User' }, 
  creditCards = [], 
  paymentHistory = [],
  onNavigate 
}) {

  const [selectedDate, setSelectedDate] = useState(null);
  const [showDateModal, setShowDateModal] = useState(false);
  const [showStatsDropdown, setShowStatsDropdown] = useState(false);

  // 取得最近到期的信用卡（包含逾期檢查）
  const getNextDueCard = () => {
    if (!creditCards || creditCards.length === 0) return null;
    
    // 過濾掉已還款的卡片
    const unpaidCards = creditCards.filter(card => !isCardPaid(card.id));
    if (unpaidCards.length === 0) return null;
    
    // 計算每張卡片的還款狀態
    const cardsWithStatus = unpaidCards.map(card => {
      const status = calculatePaymentStatus(card.dueDay);
      return { ...card, paymentStatus: status };
    });
    
    // 優先顯示邏輯：逾期 > 今日到期 > 即將到期
    const overdueCards = cardsWithStatus.filter(card => card.paymentStatus.type === 'overdue');
    const todayCards = cardsWithStatus.filter(card => card.paymentStatus.type === 'due_today');
    const upcomingCards = cardsWithStatus.filter(card => card.paymentStatus.type === 'upcoming');
    
    if (overdueCards.length > 0) {
      // 如果有逾期的，選擇逾期最久的
      return overdueCards.reduce((latest, current) => 
        current.paymentStatus.days > latest.paymentStatus.days ? current : latest
      );
    } else if (todayCards.length > 0) {
      // 如果有今天到期的，隨便選一張
      return todayCards[0];
    } else if (upcomingCards.length > 0) {
      // 選擇最近即將到期的
      return upcomingCards.reduce((nearest, current) => 
        current.paymentStatus.days < nearest.paymentStatus.days ? current : nearest
      );
    }
    
    return null;
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

  // 生成日曆
  const generateCalendar = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    
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
        const dayPayments = creditCards.filter(card => {
          if (!isCurrentMonth) return false;
          const isPaid = isCardPaid(card.id);
          return parseInt(card.dueDay) === current.getDate() && !isPaid;
        });
        
        weekDays.push({
          date: new Date(current),
          day: current.getDate(),
          isCurrentMonth,
          isToday,
          hasPayment: dayPayments.length > 0,
          payments: dayPayments
        });
        
        current.setDate(current.getDate() + 1);
      }
      calendar.push(weekDays);
    }
    
    return calendar;
  };

  // 處理日期點擊
  const handleDatePress = (dateInfo) => {
    if (dateInfo.hasPayment && dateInfo.payments.length > 0) {
      setSelectedDate(dateInfo);
      setShowDateModal(true);
    }
  };

  // 計算還款狀態和天數 - 包含逾期檢查
  const calculatePaymentStatus = (dueDay) => {
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // 建立這個月的還款日期
    const thisDueDate = new Date(currentYear, currentMonth, parseInt(dueDay));
    
    // 計算時間差（以毫秒為單位）
    const timeDiff = thisDueDate - today;
    const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    
    if (daysDiff > 0) {
      // 未來：還有時間
      return {
        type: 'upcoming',
        days: daysDiff,
        text: `${daysDiff} days left`
      };
    } else if (daysDiff === 0) {
      // 今天：到期日
      return {
        type: 'due_today',
        days: 0,
        text: 'Due today'
      };
    } else {
      // 過去：已逾期
      return {
        type: 'overdue',
        days: Math.abs(daysDiff),
        text: `Overdue ${Math.abs(daysDiff)} days`
      };
    }
  };

  // 格式化月份年份
  const formatMonthYear = () => {
    const today = new Date();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    return `${monthNames[today.getMonth()]} ${today.getFullYear()}`;
  };

  const nextDueCard = getNextDueCard();
  const calendar = generateCalendar();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* 頭部區域 */}
      <View style={styles.header}>
        {/* 左上角頭像按鈕 */}
        <TouchableOpacity 
          style={styles.avatarButton}
          onPress={() => onNavigate && onNavigate('Profile')}
          activeOpacity={0.7}
        >
          <View style={styles.avatarContainer}>
            <MaterialIcons name="person" size={24} color="#007AFF" />
          </View>
        </TouchableOpacity>
        
        {/* 歡迎文字 */}
        <Text style={styles.welcomeText}>Welcome back, {userData.name}!</Text>
        
        {/* 右邊佔位符 */}
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* 下一個到期付款卡片 */}
        <View style={styles.upcomingPaymentCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Next Upcoming Due Payment</Text>
            <Text style={styles.monthYear}>{formatMonthYear()}</Text>
          </View>
          
          {nextDueCard ? (
            <View style={styles.paymentContent}>
              <View style={[
                styles.countdownBadge,
                nextDueCard.paymentStatus.type === 'overdue' && styles.overdueBadge,
                nextDueCard.paymentStatus.type === 'due_today' && styles.todayBadge
              ]}>
                <Text style={styles.countdownText}>
                  {nextDueCard.paymentStatus.text}
                </Text>
              </View>
              
              <View style={styles.cardInfo}>
                <Text style={styles.cardName}>{nextDueCard.name}</Text>
                <Text style={styles.bankName}>{nextDueCard.bank}</Text>
              </View>
              
              <View style={[
                styles.dueSoonBadge,
                nextDueCard.paymentStatus.type === 'overdue' && styles.overdueWarning,
                nextDueCard.paymentStatus.type === 'due_today' && styles.todayWarning
              ]}>
                <Text style={[
                  styles.dueSoonText,
                  nextDueCard.paymentStatus.type === 'overdue' && styles.overdueWarningText,
                  nextDueCard.paymentStatus.type === 'due_today' && styles.todayWarningText
                ]}>
                  {nextDueCard.paymentStatus.type === 'overdue' ? 'Payment Overdue' :
                   nextDueCard.paymentStatus.type === 'due_today' ? 'Payment Due Today' :
                   'Payment Due Soon'}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.noPaymentContent}>
              <MaterialIcons name="check-circle" size={48} color="#4CAF50" />
              <Text style={styles.noPaymentText}>No upcoming payments</Text>
            </View>
          )}
        </View>

        {/* 付款日曆 */}
        <View style={styles.calendarSection}>
          <View style={styles.calendarHeader}>
            <Text style={styles.sectionTitle}>Payment Calendar</Text>
            <Text style={styles.currentMonth}>{formatMonthYear()}</Text>
          </View>
          
          <View style={styles.calendar}>
            {/* 星期標題 */}
            <View style={styles.weekHeader}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                <View key={index} style={styles.weekDayHeader}>
                  <Text style={styles.weekDayText}>{day}</Text>
                </View>
              ))}
            </View>
            
            {/* 日期格子 */}
            {calendar.map((week, weekIndex) => (
              <View key={weekIndex} style={styles.weekRow}>
                {week.map((dateInfo, dayIndex) => (
                  <TouchableOpacity
                    key={dayIndex}
                    style={[
                      styles.dateCell,
                      !dateInfo.isCurrentMonth && styles.dateCellInactive,
                      dateInfo.isToday && styles.dateCellToday,
                      dateInfo.hasPayment && styles.dateCellWithPayment
                    ]}
                    onPress={() => handleDatePress(dateInfo)}
                    activeOpacity={dateInfo.hasPayment ? 0.7 : 1}
                  >
                    <Text style={[
                      styles.dateText,
                      !dateInfo.isCurrentMonth && styles.dateTextInactive,
                      dateInfo.isToday && styles.dateTextToday,
                      dateInfo.hasPayment && styles.dateTextWithPayment
                    ]}>
                      {dateInfo.day}
                    </Text>
                    {dateInfo.hasPayment && (
                      <View style={styles.paymentDot}>
                        <Text style={styles.paymentCount}>{dateInfo.payments.length}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* 底部導航欄 */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => onNavigate && onNavigate('Home')}
          activeOpacity={0.7}
        >
          <MaterialIcons name="home" size={24} color="#007AFF" />
          <Text style={[styles.navText, styles.navTextActive]}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => onNavigate && onNavigate('MyCards')}
          activeOpacity={0.7}
        >
          <MaterialIcons name="credit-card" size={24} color="#999999" />
          <Text style={styles.navText}>Cards</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => setShowStatsDropdown(true)}
          activeOpacity={0.7}
        >
          <MaterialIcons name="bar-chart" size={24} color="#999999" />
          <Text style={styles.navText}>Stats</Text>
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
                {selectedDate?.date.toLocaleDateString('en-US', { 
                  month: 'long', 
                  day: 'numeric' 
                })} Payments
              </Text>
              <TouchableOpacity 
                onPress={() => setShowDateModal(false)}
                style={styles.closeButton}
              >
                <MaterialIcons name="close" size={24} color="#666666" />
              </TouchableOpacity>
            </View>
            
            {selectedDate?.payments.map((payment, index) => {
              const status = calculatePaymentStatus(payment.dueDay);
              return (
                <View key={index} style={styles.paymentItem}>
                  <View style={styles.paymentInfo}>
                    <Text style={styles.paymentCardName}>{payment.name}</Text>
                    <Text style={styles.paymentBankName}>{payment.bank}</Text>
                  </View>
                  <View style={styles.countdownInfo}>
                    <Text style={[
                      styles.countdownLabel,
                      status.type === 'overdue' && styles.overdueLabel,
                      status.type === 'due_today' && styles.todayLabel
                    ]}>
                      {status.text}
                    </Text>
                  </View>
                </View>
              );
            })}
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
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // 白色背景
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20, // 往上移動
    paddingBottom: 15,
    backgroundColor: '#FFFFFF',
  },
  avatarButton: {
    marginRight: 15,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F8FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  welcomeText: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  headerPlaceholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  upcomingPaymentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  monthYear: {
    fontSize: 14,
    color: '#666666',
  },
  paymentContent: {
    position: 'relative',
  },
  countdownBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: '#FF5722', // 默認橙色，表示即將到期
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    zIndex: 1,
  },
  overdueBadge: {
    backgroundColor: '#D32F2F', // 紅色，表示已逾期
  },
  todayBadge: {
    backgroundColor: '#FF9800', // 深橙色，表示今日到期
  },
  countdownText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  cardInfo: {
    marginTop: 25,
    marginBottom: 15,
  },
  cardName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  bankName: {
    fontSize: 14,
    color: '#666666',
  },
  dueSoonBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF3E0', // 默認淺橙色背景，表示即將到期
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  overdueWarning: {
    backgroundColor: '#FFEBEE', // 淺紅色背景，表示已逾期
  },
  todayWarning: {
    backgroundColor: '#FFF8E1', // 淺黃色背景，表示今日到期
  },
  dueSoonText: {
    color: '#FF9800', // 默認橙色文字
    fontSize: 12,
    fontWeight: '600',
  },
  overdueWarningText: {
    color: '#D32F2F', // 紅色文字，表示逾期警告
  },
  todayWarningText: {
    color: '#F57C00', // 深橙色文字，表示今日到期
  },
  noPaymentContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noPaymentText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 10,
  },
  calendarSection: {
    marginBottom: 100, // 為底部導航留空間
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  currentMonth: {
    fontSize: 16,
    fontWeight: '500',
    color: '#007AFF',
  },
  calendar: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  weekHeader: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  weekDayHeader: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
  },
  weekRow: {
    flexDirection: 'row',
  },
  dateCell: {
    flex: 1,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    margin: 1,
    borderRadius: 8,
  },
  dateCellInactive: {
    opacity: 0.3,
  },
  dateCellToday: {
    backgroundColor: '#E3F2FD',
  },
  dateCellWithPayment: {
    backgroundColor: '#FFEBEE',
  },
  dateText: {
    fontSize: 14,
    color: '#333333',
  },
  dateTextInactive: {
    color: '#CCCCCC',
  },
  dateTextToday: {
    color: '#007AFF',
    fontWeight: '600',
  },
  dateTextWithPayment: {
    color: '#D32F2F',
    fontWeight: '600',
  },
  paymentDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#F44336',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentCount: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  bottomNavigation: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  navButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  navText: {
    fontSize: 12,
    color: '#999999',
    marginTop: 4,
  },
  navTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    margin: 20,
    maxWidth: width - 40,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  closeButton: {
    padding: 4,
  },
  paymentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  paymentInfo: {
    flex: 1,
  },
  paymentCardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  paymentBankName: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  countdownInfo: {
    alignItems: 'flex-end',
  },
  countdownLabel: {
    fontSize: 12,
    color: '#FF5722', // 默認橙色，表示即將到期
    fontWeight: '600',
  },
  overdueLabel: {
    color: '#D32F2F', // 紅色，表示已逾期
  },
  todayLabel: {
    color: '#F57C00', // 深橙色，表示今日到期
  },
});