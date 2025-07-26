// components/NotificationsPage.js - 專業UI重新設計版本
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Switch,
  Alert,
  Modal
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';

// 配置通知處理
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function NotificationsPage({ 
  creditCards = [], 
  notificationSettings = {},
  onBack, 
  onUpdateSettings 
}) {
  const [cardExpiryEnabled, setCardExpiryEnabled] = useState(true);
  const [paymentDueEnabled, setPaymentDueEnabled] = useState(true);
  const [selectedCard, setSelectedCard] = useState('all');
  const [reminderDays, setReminderDays] = useState([7, 3, 1]);
  const [reminderTimes, setReminderTimes] = useState(['09:00', '18:00']);
  const [overdueTime, setOverdueTime] = useState('09:00');
  const [showCardPicker, setShowCardPicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [currentPickerType, setCurrentPickerType] = useState('reminder');

  useEffect(() => {
    requestNotificationPermissions();
  }, []);

  const requestNotificationPermissions = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Notification Permission',
          'Please enable notification permissions in settings to receive payment reminders.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Request notification permissions failed:', error);
    }
  };

  const timeOptions = [
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00',
    '20:00', '21:00', '22:00'
  ];

  const dayOptions = [
    { value: 7, label: '7 days before' },
    { value: 3, label: '3 days before' },
    { value: 2, label: '2 days before' },
    { value: 1, label: '1 day before' },
    { value: 0, label: 'Due date' }
  ];

  const handleDayToggle = (day) => {
    if (reminderDays.includes(day)) {
      setReminderDays(reminderDays.filter(d => d !== day));
    } else {
      setReminderDays([...reminderDays, day].sort((a, b) => b - a));
    }
  };

  const handleTimeToggle = (time) => {
    if (reminderTimes.includes(time)) {
      if (reminderTimes.length > 1) {
        setReminderTimes(reminderTimes.filter(t => t !== time));
      }
    } else {
      setReminderTimes([...reminderTimes, time].sort());
    }
  };

  const handleSaveSettings = () => {
    // 保存設置邏輯
    Alert.alert('Success', 'Notification settings saved');
  };

  const getSelectedCardName = () => {
    if (selectedCard === 'all') return 'All Cards';
    const card = creditCards.find(c => c.id === selectedCard);
    return card ? card.name : 'Select Card';
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
        <Text style={styles.title}>Notifications</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Card Selection */}
          <View style={styles.cardSelectionSection}>
            <Text style={styles.sectionLabel}>Apply to:</Text>
            <TouchableOpacity
              style={styles.cardSelector}
              onPress={() => setShowCardPicker(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.cardSelectorText}>{getSelectedCardName()}</Text>
              <Ionicons name="chevron-down" size={20} color="#666666" />
            </TouchableOpacity>
          </View>

          {/* Card Expiry Reminder */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Card Expiry Reminder</Text>
              <Switch
                value={cardExpiryEnabled}
                onValueChange={setCardExpiryEnabled}
                trackColor={{ false: '#E0E0E0', true: '#4CAF50' }}
                thumbColor={cardExpiryEnabled ? '#FFFFFF' : '#F5F5F5'}
              />
            </View>
            
            {cardExpiryEnabled && (
              <View style={styles.cardContent}>
                <Text style={styles.settingLabel}>Get notified when your card is about to expire.</Text>
                
                <View style={styles.reminderDaysSection}>
                  <Text style={styles.subLabel}>Reminder Days</Text>
                  <View style={styles.daysGrid}>
                    {dayOptions.map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          styles.dayOption,
                          reminderDays.includes(option.value) && styles.dayOptionSelected
                        ]}
                        onPress={() => handleDayToggle(option.value)}
                        activeOpacity={0.7}
                      >
                        <Text style={[
                          styles.dayOptionText,
                          reminderDays.includes(option.value) && styles.dayOptionTextSelected
                        ]}>
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.reminderTimesSection}>
                  <Text style={styles.subLabel}>Reminder Times</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.timesRow}>
                      {timeOptions.map((time) => (
                        <TouchableOpacity
                          key={time}
                          style={[
                            styles.timeOption,
                            reminderTimes.includes(time) && styles.timeOptionSelected
                          ]}
                          onPress={() => handleTimeToggle(time)}
                          activeOpacity={0.7}
                        >
                          <Text style={[
                            styles.timeOptionText,
                            reminderTimes.includes(time) && styles.timeOptionTextSelected
                          ]}>
                            {time}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              </View>
            )}
          </View>

          {/* Payment Due Alert */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Payment Due Alert</Text>
              <Switch
                value={paymentDueEnabled}
                onValueChange={setPaymentDueEnabled}
                trackColor={{ false: '#E0E0E0', true: '#4CAF50' }}
                thumbColor={paymentDueEnabled ? '#FFFFFF' : '#F5F5F5'}
              />
            </View>
            
            {paymentDueEnabled && (
              <View style={styles.cardContent}>
                <Text style={styles.settingLabel}>
                  Receive alerts for upcoming payment due dates.
                </Text>
                
                <View style={styles.overdueSection}>
                  <Text style={styles.subLabel}>Overdue Reminder Time</Text>
                  <TouchableOpacity
                    style={styles.overdueTimeSelector}
                    onPress={() => {
                      setCurrentPickerType('overdue');
                      setShowTimePicker(true);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.overdueTimeText}>{overdueTime}</Text>
                    <Ionicons name="time-outline" size={20} color="#666666" />
                  </TouchableOpacity>
                  <Text style={styles.overdueDescription}>
                    Daily reminder after payment due date
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSaveSettings}
            activeOpacity={0.8}
          >
            <Text style={styles.saveButtonText}>Save Settings</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Card Picker Modal */}
      <Modal
        visible={showCardPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCardPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Card</Text>
            
            <TouchableOpacity
              style={[
                styles.modalOption,
                selectedCard === 'all' && styles.modalOptionSelected
              ]}
              onPress={() => {
                setSelectedCard('all');
                setShowCardPicker(false);
              }}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.modalOptionText,
                selectedCard === 'all' && styles.modalOptionTextSelected
              ]}>
                All Cards
              </Text>
              {selectedCard === 'all' && (
                <Ionicons name="checkmark" size={20} color="#000000" />
              )}
            </TouchableOpacity>
            
            {creditCards.map((card) => (
              <TouchableOpacity
                key={card.id}
                style={[
                  styles.modalOption,
                  selectedCard === card.id && styles.modalOptionSelected
                ]}
                onPress={() => {
                  setSelectedCard(card.id);
                  setShowCardPicker(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.modalOptionText,
                  selectedCard === card.id && styles.modalOptionTextSelected
                ]}>
                  {card.name}
                </Text>
                {selectedCard === card.id && (
                  <Ionicons name="checkmark" size={20} color="#000000" />
                )}
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowCardPicker(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  cardSelectionSection: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  cardSelector: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cardSelectorText: {
    fontSize: 16,
    color: '#000000',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  cardContent: {
    padding: 16,
  },
  settingLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
    lineHeight: 20,
  },
  subLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 8,
  },
  reminderDaysSection: {
    marginBottom: 20,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  dayOption: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    margin: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  dayOptionSelected: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  dayOptionText: {
    fontSize: 14,
    color: '#333333',
  },
  dayOptionTextSelected: {
    color: '#FFFFFF',
  },
  reminderTimesSection: {
    marginBottom: 16,
  },
  timesRow: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  timeOption: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  timeOptionSelected: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  timeOptionText: {
    fontSize: 14,
    color: '#333333',
  },
  timeOptionTextSelected: {
    color: '#FFFFFF',
  },
  overdueSection: {
    marginTop: 8,
  },
  overdueTimeSelector: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 8,
  },
  overdueTimeText: {
    fontSize: 16,
    color: '#000000',
  },
  overdueDescription: {
    fontSize: 12,
    color: '#666666',
    fontStyle: 'italic',
  },
  saveButton: {
    backgroundColor: '#000000',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalOptionSelected: {
    backgroundColor: '#F5F5F5',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#333333',
  },
  modalOptionTextSelected: {
    fontWeight: '600',
    color: '#000000',
  },
  modalCancelButton: {
    marginTop: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#666666',
  },
});