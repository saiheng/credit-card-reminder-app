// components/HistoryPage.js - 具备完整多语言支持（已移除提示並修復抖動）
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
  Alert,
  PanResponder,
  Dimensions,
  Animated
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import HomePage from './HomePage';

export default function HistoryPage({ 
  paymentHistory = [], 
  creditCards = [],
  onBack,
  getText, // 接收多语言函数
  // 🔥 新增：HomePage 完整渲染所需的 props
  userData = { name: 'User', avatar: null },
  notificationSettings = {},
  onNavigate,
  currentLanguage = 'en'
}) {

  const [searchQuery, setSearchQuery] = useState('');

 // 🔥 Apple風格邊緣滑動返回功能：漸進式頁面過渡（優化版本）
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
        console.log('🔥 Apple風格滑動開始');
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
      
      console.log(`📱 滑動進度: ${Math.round((clampedDistance / swipeThreshold) * 100)}%`);
    },
    
    // 🎯 手勢結束時的判斷和動畫（修復抖動問題）
    onPanResponderRelease: (evt, gestureState) => {
      if (!isSliding) return;
      
      const swipeDistance = gestureState.dx;
      const swipeVelocity = gestureState.vx;
      
      // 判斷是否應該執行返回操作
      const shouldReturn = swipeDistance > swipeThreshold || swipeVelocity > 0.5;
      
      if (shouldReturn) {
        // 🔥 修復抖動：執行平滑的返回動畫，完成後直接切換頁面
        console.log('✅ 滑動距離足夠，執行返回動畫');
        Animated.timing(slideAnimation, {
          toValue: screenWidth,
          duration: 200, // 稍微縮短動畫時間，讓過渡更加快捷
          useNativeDriver: true, // 🔥 使用原生驅動器，提供更流暢的動畫
        }).start(({ finished }) => {
          // 🔥 關鍵修復：只有在動畫真正完成時才執行返回操作
          if (finished) {
            // 先執行返回操作，讓頁面切換開始
            onBack();
            // 🔥 延遲重置動畫狀態，避免視覺抖動
            setTimeout(() => {
              setIsSliding(false);
              slideAnimation.setValue(0);
            }, 50);
          }
        });
      } else {
        // 返回原位動畫
        console.log('↩️ 滑動距離不足，返回原位');
        Animated.spring(slideAnimation, {
          toValue: 0,
          tension: 120,
          friction: 8,
          useNativeDriver: true, // 🔥 使用原生驅動器
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
          tension: 120,
          friction: 8,
          useNativeDriver: true, // 🔥 使用原生驅動器
        }).start(() => {
          setIsSliding(false);
        });
      }
    },
  });
  
  // Get card name from card ID
  const getCardName = (cardId) => {
    const card = creditCards.find(c => c.id === cardId);
    return card ? card.name : getText('history.unknownCard') || 'Unknown Card';
  };

  // Get card bank from card ID
  const getCardBank = (cardId) => {
    const card = creditCards.find(c => c.id === cardId);
    return card ? card.bank : getText('history.unknownBank') || 'Unknown Bank';
  };

  // Get card due day from card ID
  const getCardDueDay = (cardId) => {
    const card = creditCards.find(c => c.id === cardId);
    return card ? card.dueDay : null;
  };

  // 修复：获取信用卡的真实最后4位数字（与用户输入的卡号一致）
  const getCardLastFourDigits = (cardId) => {
    const card = creditCards.find(c => c.id === cardId);
    if (!card) return '****';
    
    // 读取用户在AddCardPage中输入的4位数字
    // 根据AddCardPage.js，数据保存在card.number属性中
    if (card.number) {
      // 确保是字符串并清理任何非数字字符
      const cleanNumber = card.number.toString().replace(/\D/g, '');
      
      // 由于AddCardPage验证确保输入必须是4位数字，这里直接返回
      if (cleanNumber.length === 4) {
        return cleanNumber;
      }
      
      // 安全处理：如果长度不是4位，补足或截取
      if (cleanNumber.length > 4) {
        return cleanNumber.slice(-4); // 取最后4位
      } else if (cleanNumber.length > 0) {
        return cleanNumber.padStart(4, '0'); // 前面补0
      }
    }
    
    // 理论上不应该到达这里，因为AddCardPage确保必须有4位数字
    // 但为了安全起见，返回占位符
    return '****';
  };

  // 新增：格式化卡片显示名称（包含最后4位数字）
  const getFormattedCardName = (cardId) => {
    const cardName = getCardName(cardId);
    const lastFour = getCardLastFourDigits(cardId);
    return `${cardName} (${lastFour})`;
  };

  // Calculate statistics for the payment history
  const calculateStatistics = () => {
    const totalPayments = paymentHistory.length;
    const onTimePayments = paymentHistory.filter(payment => payment.onTime === true).length;
    const latePayments = paymentHistory.filter(payment => payment.onTime === false).length;
    const onTimeRate = totalPayments > 0 ? Math.round((onTimePayments / totalPayments) * 100) : 0;

    return {
      totalPayments,
      onTimePayments,
      latePayments,
      onTimeRate
    };
  };

  const statistics = calculateStatistics();

  // Filter payment history based on search query
  const filteredHistory = paymentHistory.filter(payment => {
    if (!payment || !payment.cardId) return false;
    
    try {
      const cardName = String(getCardName(payment.cardId) || '').toLowerCase();
      const cardBank = String(getCardBank(payment.cardId) || '').toLowerCase();
      const lastFour = String(getCardLastFourDigits(payment.cardId) || '').toLowerCase();
      const query = String(searchQuery || '').toLowerCase();
      
      // 扩展搜寻功能：现在也可以搜寻卡片的最后4位数字
      return cardName.includes(query) || cardBank.includes(query) || lastFour.includes(query);
    } catch (error) {
      console.error('Error filtering payment history:', error);
      return false;
    }
  });

  // 改进：确保历史记录的完整性 - 按月份分组并保持时间顺序
  const groupedHistory = filteredHistory.reduce((acc, payment) => {
    if (!payment || !payment.month) return acc;
    
    // 创建月份键，确保格式一致
    const monthKey = payment.month;
    
    if (!acc[monthKey]) {
      acc[monthKey] = [];
    }
    
    // 检查是否已存在相同的记录（防止重复）
    const existingRecord = acc[monthKey].find(existing => 
      existing.cardId === payment.cardId && 
      existing.markedDate === payment.markedDate
    );
    
    // 只有在不存在重复记录时才添加
    if (!existingRecord) {
      acc[monthKey].push(payment);
    }
    
    return acc;
  }, {});

  // 改进：对月份进行排序，确保最新的月份在前面，但保留所有历史记录
  const sortedMonths = Object.keys(groupedHistory).sort((a, b) => {
    // 将月份字符串转换为日期进行比较
    const dateA = new Date(a + '-01');
    const dateB = new Date(b + '-01');
    return dateB - dateA; // 降序排列（最新的在前）
  });

  // Format date for display with improved due date calculation
  const formatDate = (dateString, cardId = null, isOriginalDueDate = false) => {
    try {
      if (!dateString) {
        // If this is a due date and we have card info, calculate it
        if (isOriginalDueDate && cardId) {
          const dueDay = getCardDueDay(cardId);
          if (dueDay) {
            const today = new Date();
            const currentYear = today.getFullYear();
            const currentMonth = today.getMonth();
            
            // Create due date for current month
            let dueDate = new Date(currentYear, currentMonth, parseInt(dueDay));
            
            // If due date has passed this month, it was for this month's cycle
            return dueDate.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            });
          }
        }
        return getText('history.notSpecified') || 'Not specified';
      }
      
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return getText('history.invalidDate') || 'Invalid date';
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return getText('history.dateError') || 'Date error';
    }
  };

  // Handle clear search
  const handleClearSearch = () => {
    setSearchQuery('');
  };

  // 新增：调试信息（可选，用于开发阶段检查数据完整性）
  const debugDataIntegrity = () => {
    console.log('=== History Page Data Integrity Check ===');
    console.log('Total payment history records:', paymentHistory.length);
    console.log('Months with data:', Object.keys(groupedHistory).length);
    console.log('Sorted months:', sortedMonths);
    
    // 检查每个月的记录数量
    sortedMonths.forEach(month => {
      console.log(`${month}: ${groupedHistory[month].length} records`);
    });
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
            
            <Text style={styles.title}>{getText('history.title')}</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <MaterialIcons name="search" size={20} color="#666666" />
              <TextInput
                style={styles.searchInput}
                placeholder={getText('history.searchPlaceholder') || 'Search transactions'}
                placeholderTextColor="#999999"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={handleClearSearch}>
                  <MaterialIcons name="clear" size={20} color="#666666" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Statistics Cards */}
          <View style={styles.statisticsContainer}>
            <View style={styles.statisticsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{statistics.totalPayments}</Text>
                <Text style={styles.statLabel}>{getText('history.totalPayments')}</Text>
              </View>
              
              <View style={styles.statCard}>
                <Text style={[styles.statNumber, styles.onTimeNumber]}>{statistics.onTimePayments}</Text>
                <Text style={styles.statLabel}>{getText('history.onTimePayments')}</Text>
              </View>
              
              <View style={styles.statCard}>
                <Text style={[styles.statNumber, styles.lateNumber]}>{statistics.latePayments}</Text>
                <Text style={styles.statLabel}>{getText('history.latePayments')}</Text>
              </View>
              
              <View style={styles.statCard}>
                <Text style={[styles.statNumber, styles.rateNumber]}>{statistics.onTimeRate}%</Text>
                <Text style={styles.statLabel}>{getText('history.onTimeRate')}</Text>
              </View>
            </View>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.content}>
              {sortedMonths.length === 0 ? (
                <View style={styles.emptyState}>
                  <MaterialIcons name="history" size={64} color="#E0E0E0" />
                  <Text style={styles.emptyTitle}>{getText('history.noHistory')}</Text>
                  <Text style={styles.emptySubtitle}>
                    {searchQuery ? 
                      (getText('history.noResults') || 'No results found for your search') : 
                      (getText('history.noHistoryDescription') || 'Your payment history will appear here once you start making payments')
                    }
                  </Text>
                </View>
              ) : (
                // 使用排序后的月份来渲染，确保所有历史记录都能显示
                sortedMonths.map((month) => (
                  <View key={month} style={styles.monthSection}>
                    <Text style={styles.monthHeader}>
                      {new Date(month + '-01').toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long'
                      })}
                    </Text>
                    
                    {/* 对每个月内的记录也进行排序，确保显示顺序一致 */}
                    {groupedHistory[month]
                      .sort((a, b) => new Date(b.markedDate || b.dueDate) - new Date(a.markedDate || a.dueDate))
                      .map((payment, index) => (
                        <View key={`${payment.cardId}-${payment.markedDate}-${index}`} style={styles.paymentItem}>
                          <View style={styles.paymentHeader}>
                            <View style={styles.cardInfo}>
                              {/* 重要修改：显示卡片名称和最后4位数字 */}
                              <Text style={styles.cardName}>
                                {getFormattedCardName(payment.cardId)}
                              </Text>
                              <Text style={styles.bankName}>
                                {getCardBank(payment.cardId)}
                              </Text>
                            </View>
                            
                            <View style={styles.statusContainer}>
                              {payment.onTime ? (
                                <View style={styles.statusBadge}>
                                  <MaterialIcons name="check-circle" size={16} color="#4CAF50" />
                                  <Text style={styles.statusText}>{getText('history.onTime')}</Text>
                                </View>
                              ) : (
                                <View style={[styles.statusBadge, styles.lateStatusBadge]}>
                                  <MaterialIcons name="warning" size={16} color="#FF9800" />
                                  <Text style={[styles.statusText, styles.lateStatusText]}>{getText('history.late')}</Text>
                                </View>
                              )}
                            </View>
                          </View>
                          
                          <View style={styles.paymentDetails}>
                            <View style={styles.detailRow}>
                              <Text style={styles.detailLabel}>{getText('history.dueDate')}:</Text>
                              <Text style={styles.detailValue}>
                                {formatDate(payment.dueDate, payment.cardId, true)}
                              </Text>
                            </View>
                            
                            <View style={styles.detailRow}>
                              <Text style={styles.detailLabel}>{getText('history.actualPaymentDate')}:</Text>
                              <Text style={styles.detailValue}>
                                {formatDate(payment.markedDate)}
                              </Text>
                            </View>
                          </View>
                        </View>
                      ))}
                  </View>
                ))
              )}
            </View>

            {/* 新增：数据完整性指示器（用于调试，正式版本可隐藏） */}
            {__DEV__ && sortedMonths.length > 0 && (
              <View style={styles.debugInfo}>
                <Text style={styles.debugText}>
                  Displaying {sortedMonths.length} months of history
                </Text>
                <Text style={styles.debugText}>
                  Total records: {filteredHistory.length}
                </Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Animated.View>
      
      {/* 🔥 已移除：滑動進度指示器（根據用戶要求移除提示） */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // White background like MyCards page
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 40, // Raised even higher for better positioning
    paddingBottom: 12,
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
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000', // Black text for white background
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
    marginLeft: 8,
  },
  statisticsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  statisticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
  },
  onTimeNumber: {
    color: '#4CAF50',
  },
  lateNumber: {
    color: '#FF5722',
  },
  rateNumber: {
    color: '#2196F3',
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 2,
  },
  statSubLabel: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
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
    lineHeight: 20,
    paddingHorizontal: 32,
  },
  monthSection: {
    marginBottom: 24,
  },
  monthHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  paymentItem: {
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
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  bankName: {
    fontSize: 14,
    color: '#666666',
  },
  statusContainer: {
    marginLeft: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  lateStatusBadge: {
    backgroundColor: '#FFF3E0',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4CAF50',
    marginLeft: 4,
  },
  lateStatusText: {
    color: '#FF9800',
  },
  paymentDetails: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666666',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
    textAlign: 'right',
    flex: 1,
  },
  // 新增：调试信息样式（开发阶段使用）
  debugInfo: {
    backgroundColor: '#F0F8FF',
    padding: 12,
    margin: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E3F2FD',
  },
  debugText: {
    fontSize: 12,
    color: '#1976D2',
    textAlign: 'center',
    marginBottom: 2,
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
  // 🔥 已移除：progressIndicator 相關樣式（根據用戶要求移除提示）
});