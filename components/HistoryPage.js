// components/HistoryPage.js - Updated with white background and English language
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
  Alert
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

export default function HistoryPage({ 
  paymentHistory = [], 
  creditCards = [],
  onBack 
}) {
  const [searchQuery, setSearchQuery] = useState('');

  // Get card name from card ID
  const getCardName = (cardId) => {
    const card = creditCards.find(c => c.id === cardId);
    return card ? card.name : 'Unknown Card';
  };

  // Get card bank from card ID
  const getCardBank = (cardId) => {
    const card = creditCards.find(c => c.id === cardId);
    return card ? card.bank : 'Unknown Bank';
  };

  // Get card due day from card ID
  const getCardDueDay = (cardId) => {
    const card = creditCards.find(c => c.id === cardId);
    return card ? card.dueDay : null;
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
      const query = String(searchQuery || '').toLowerCase();
      
      return cardName.includes(query) || cardBank.includes(query);
    } catch (error) {
      console.error('Error filtering payment history:', error);
      return false;
    }
  });

  // Group payments by month
  const groupedHistory = filteredHistory.reduce((acc, payment) => {
    if (!payment || !payment.month) return acc;
    
    if (!acc[payment.month]) {
      acc[payment.month] = [];
    }
    acc[payment.month].push(payment);
    return acc;
  }, {});

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
        return 'Not specified';
      }
      
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Date error';
    }
  };

  // Handle clear search
  const handleClearSearch = () => {
    setSearchQuery('');
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
        
        <Text style={styles.title}>History</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={20} color="#666666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search transactions"
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
            <Text style={styles.statLabel}>Total Payments</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, styles.onTimeNumber]}>{statistics.onTimePayments}</Text>
            <Text style={styles.statLabel}>On-time Payments</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, styles.lateNumber]}>{statistics.latePayments}</Text>
            <Text style={styles.statLabel}>Late Payments</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, styles.rateNumber]}>{statistics.onTimeRate}%</Text>
            <Text style={styles.statLabel}>On-time Rate</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {Object.keys(groupedHistory).length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="history" size={64} color="#E0E0E0" />
              <Text style={styles.emptyTitle}>No Payment History</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery ? 'No results found for your search' : 'Your payment history will appear here once you start making payments'}
              </Text>
            </View>
          ) : (
            Object.keys(groupedHistory)
              .sort((a, b) => new Date(b) - new Date(a))
              .map((month) => (
                <View key={month} style={styles.monthSection}>
                  <Text style={styles.monthHeader}>
                    {new Date(month + '-01').toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long'
                    })}
                  </Text>
                  
                  {groupedHistory[month].map((payment, index) => (
                    <View key={index} style={styles.paymentItem}>
                      <View style={styles.paymentHeader}>
                        <View style={styles.cardInfo}>
                          <Text style={styles.cardName}>
                            {getCardName(payment.cardId)}
                          </Text>
                          <Text style={styles.bankName}>
                            {getCardBank(payment.cardId)}
                          </Text>
                        </View>
                        
                        <View style={styles.statusContainer}>
                          {payment.onTime ? (
                            <View style={styles.statusBadge}>
                              <MaterialIcons name="check-circle" size={16} color="#4CAF50" />
                              <Text style={styles.statusText}>On Time</Text>
                            </View>
                          ) : (
                            <View style={[styles.statusBadge, styles.lateStatusBadge]}>
                              <MaterialIcons name="warning" size={16} color="#FF9800" />
                              <Text style={[styles.statusText, styles.lateStatusText]}>Late</Text>
                            </View>
                          )}
                        </View>
                      </View>
                      
                      <View style={styles.paymentDetails}>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Due Date:</Text>
                          <Text style={styles.detailValue}>
                            {formatDate(payment.dueDate, payment.cardId, true)}
                          </Text>
                        </View>
                        
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Actual Payment Date:</Text>
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
      </ScrollView>
    </SafeAreaView>
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
});