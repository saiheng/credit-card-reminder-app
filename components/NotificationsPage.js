// components/NotificationsPage.js - 修復版，解決 toLowerCase 錯誤
import React, { useState, useEffect } from 'react';
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
  const [globalNotifications, setGlobalNotifications] = useState(true);
  const [scheduledNotifications, setScheduledNotifications] = useState([]);

  useEffect(() => {
    requestNotificationPermissions();
    loadScheduledNotifications();
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

  const loadScheduledNotifications = async () => {
    try {
      // 檢查函數是否存在
      if (Notifications.getAllScheduledNotificationRequestsAsync) {
        const notifications = await Notifications.getAllScheduledNotificationRequestsAsync();
        setScheduledNotifications(notifications || []);
      } else {
        console.log('getAllScheduledNotificationRequestsAsync not available');
        setScheduledNotifications([]);
      }
    } catch (error) {
      console.error('Load scheduled notifications failed:', error);
      setScheduledNotifications([]);
    }
  };

  // 預設通知時間選項
  const defaultTimeOptions = [
    { days: 7, times: ['09:00', '18:00'] },
    { days: 3, times: ['09:00', '18:00'] },
    { days: 2, times: ['09:00', '18:00'] },
    { days: 1, times: ['09:00', '12:00', '18:00'] },
    { days: 0, times: ['09:00'] }, // 還款當日
  ];

  // 自定義通知選項
  const getCustomNotificationOptions = () => [
    { days: 14, label: '14 days before', enabled: false, selectedTimes: ['09:00'] },
    { days: 7, label: '7 days before', enabled: true, selectedTimes: ['09:00', '18:00'] },
    { days: 3, label: '3 days before', enabled: true, selectedTimes: ['09:00', '18:00'] },
    { days: 2, label: '2 days before', enabled: false, selectedTimes: ['09:00'] },
    { days: 1, label: '1 day before', enabled: true, selectedTimes: ['09:00', '12:00', '18:00'] },
    { days: 0, label: 'Due date', enabled: true, selectedTimes: ['09:00'] }
  ];

  // 時間選項
  const timeOptions = [
    '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
    '19:00', '20:00', '21:00', '22:00'
  ];

  // 獲取卡片的通知設定
  const getCardSettings = (cardId) => {
    if (!cardId) {
      return { 
        enabled: true, 
        customOptions: getCustomNotificationOptions(),
        overdueReminder: { enabled: true, time: '09:00' }
      };
    }
    
    const defaultSettings = {
      enabled: true,
      customOptions: getCustomNotificationOptions(),
      overdueReminder: { enabled: true, time: '09:00' }
    };
    
    return notificationSettings[cardId] || defaultSettings;
  };

  // 更新卡片通知設定
  const updateCardSettings = (cardId, newSettings) => {
    if (!cardId) return;
    
    const updatedSettings = {
      ...getCardSettings(cardId),
      ...newSettings
    };
    
    if (onUpdateSettings && typeof onUpdateSettings === 'function') {
      onUpdateSettings(cardId, updatedSettings);
    }
  };

  // 更新全域通知設定
  const handleGlobalNotificationChange = (enabled) => {
    setGlobalNotifications(enabled);
    
    // 如果關閉全域通知，關閉所有卡片的通知
    if (!enabled) {
      creditCards.forEach(card => {
        if (card && card.id) {
          updateCardSettings(card.id, { enabled: false });
        }
      });
    }
  };

  // 為單張卡片排程通知
  const scheduleNotificationsForCard = async (cardId, settings) => {
    if (!cardId || !settings.enabled) return;

    try {
      await cancelNotificationsForCard(cardId);

      const card = creditCards.find(c => c && c.id === cardId);
      if (!card || !card.name || !card.dueDay) return;

      const dueDay = parseInt(card.dueDay);
      if (isNaN(dueDay) || dueDay < 1 || dueDay > 31) return;

      // 為每個自定義時間創建通知
      for (const timeOption of settings.customTimes) {
        if (!timeOption || typeof timeOption.days !== 'number' || !Array.isArray(timeOption.times)) {
          continue;
        }

        for (const time of timeOption.times) {
          if (!time || typeof time !== 'string') continue;

          const [hours, minutes] = time.split(':').map(Number);
          // 添加更嚴格的時間驗證
          if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
            console.warn(`Invalid time format: ${time}`);
            continue;
          }

          const now = new Date();
          const notificationDate = new Date();
          notificationDate.setDate(dueDay - timeOption.days);
          notificationDate.setHours(hours, minutes, 0, 0);

          // 如果通知時間已過，設定為下個月
          if (notificationDate <= now) {
            notificationDate.setMonth(notificationDate.getMonth() + 1);
          }

          const content = {
            title: '💳 信用卡還款提醒',
            body: timeOption.days === 0 
              ? `${card.name} 今天到期！請盡快還款。`
              : `${card.name} 將在 ${timeOption.days} 天後到期`,
            data: { cardId, cardName: card.name, daysUntil: timeOption.days }
          };

          await Notifications.scheduleNotificationAsync({
            identifier: `${cardId}_${timeOption.days}_${time}`,
            content,
            trigger: notificationDate,
          });
        }
      }
      
      // 重新載入已排程通知
      loadScheduledNotifications();
    } catch (error) {
      console.error('Schedule notifications failed:', error);
    }
  };

  // Cancel notifications for a single card
  const cancelNotificationsForCard = async (cardId) => {
    if (!cardId) return;

    try {
      // Check if function exists
      if (Notifications.getAllScheduledNotificationRequestsAsync) {
        const allNotifications = await Notifications.getAllScheduledNotificationRequestsAsync();
        const cardNotifications = (allNotifications || []).filter(notification => 
          notification.identifier && notification.identifier.startsWith(cardId)
        );

        for (const notification of cardNotifications) {
          if (Notifications.cancelScheduledNotificationAsync) {
            await Notifications.cancelScheduledNotificationAsync(notification.identifier);
          }
        }
      }
    } catch (error) {
      console.error('Cancel notifications failed:', error);
    }
  };

  // 發送測試通知
  const sendTestNotification = async () => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🔔 測試通知',
          body: '您的通知設定正常運作！',
        },
        trigger: { seconds: 1 },
      });
      Alert.alert('成功', '測試通知已發送！');
    } catch (error) {
      console.error('發送測試通知失敗:', error);
      Alert.alert('錯誤', '發送測試通知失敗，請檢查通知權限。');
    }
  };

  // 重設所有通知
  const resetAllNotifications = async () => {
    Alert.alert(
      '重設通知',
      '確定要重設所有通知嗎？這將清除現有排程並重新創建。',
      [
        { text: '取消', style: 'cancel' },
        { 
          text: '確定', 
          onPress: async () => {
            try {
              await Notifications.cancelAllScheduledNotificationsAsync();
              
              // 為所有啟用的卡片重新排程通知
              for (const card of creditCards) {
                if (!card || !card.id) continue;
                const settings = getCardSettings(card.id);
                if (settings.enabled) {
                  await scheduleNotificationsForCard(card.id, settings);
                }
              }
              
              Alert.alert('成功', '所有通知已重設！');
              loadScheduledNotifications();
            } catch (error) {
              console.error('重設通知失敗:', error);
              Alert.alert('錯誤', '重設通知失敗');
            }
          }
        }
      ]
    );
  };

  // 改進格式化通知的函數
  const formatScheduledNotification = (notification) => {
    if (!notification || !notification.content) {
      return {
        cardName: '未知卡片',
        description: '通知提醒',
        title: '通知',
        body: ''
      };
    }

    try {
      const data = notification.content.data || {};
      const cardName = data.cardName || '未知卡片';
      const daysUntil = data.daysUntil;
      
      let description = '';
      if (typeof daysUntil === 'number') {
        description = daysUntil === 0 ? '還款當日' : `${daysUntil}天前`;
      } else {
        description = '通知提醒';
      }

      return {
        cardName: String(cardName),
        description: String(description),
        title: String(notification.content.title || '通知'),
        body: String(notification.content.body || '')
      };
    } catch (error) {
      console.error('格式化通知失敗:', error);
      return {
        cardName: '未知卡片',
        description: '通知提醒',
        title: '通知',
        body: ''
      };
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Global Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Global Settings</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingTitle}>Enable Notifications</Text>
              <Text style={styles.settingDescription}>
                Turn on or off all payment reminder notifications
              </Text>
            </View>
            <Switch
              value={globalNotifications}
              onValueChange={handleGlobalNotificationChange}
              trackColor={{ false: '#333333', true: '#007AFF' }}
              thumbColor={globalNotifications ? '#FFFFFF' : '#666666'}
            />
          </View>

          <TouchableOpacity style={styles.actionButton} onPress={sendTestNotification}>
            <Text style={styles.actionButtonText}>Send Test Notification</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={resetAllNotifications}>
            <Text style={styles.actionButtonText}>Reset All Notifications</Text>
          </TouchableOpacity>
        </View>

        {/* Credit Card Notification Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Credit Card Notification Settings</Text>
          
          {creditCards.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>💳</Text>
              <Text style={styles.emptyTitle}>No Credit Cards</Text>
              <Text style={styles.emptySubtitle}>
                Add credit cards to set up notification reminders
              </Text>
            </View>
          ) : (
            creditCards.map((card, index) => {
              if (!card || !card.id) return null;  // 添加 return 语句
              
              const settings = getCardSettings(card.id);
              const cardName = String(card.name || 'Unnamed Card');
              const cardBank = String(card.bank || 'Unknown Bank');
              const cardColor = String(card.color || '#666666');

              return (  // 添加 return 语句和完整的组件结构
                <View key={index} style={styles.cardItem}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardInfo}>
                      <View style={[styles.cardColorIndicator, { backgroundColor: cardColor }]} />
                      <View style={styles.cardDetails}>
                        <Text style={styles.cardName}>{cardName}</Text>
                        <Text style={styles.cardBank}>{cardBank}</Text>
                      </View>
                    </View>
                    <Switch
                      value={settings.enabled && globalNotifications}
                      onValueChange={(enabled) => updateCardSettings(card.id, { enabled })}
                      trackColor={{ false: '#333333', true: '#007AFF' }}
                      thumbColor={settings.enabled && globalNotifications ? '#FFFFFF' : '#666666'}
                      disabled={!globalNotifications}
                    />
                  </View>

                  {settings.enabled && globalNotifications && (
                    <View style={styles.customSettings}>
                      <Text style={styles.customTitle}>Custom Notification Settings</Text>
                      
                      {/* Reminder Days */}
                      <View style={styles.reminderSection}>
                        <Text style={styles.reminderTitle}>Reminder Days</Text>
                        {settings.customOptions?.map((option, optionIndex) => (
                          <View key={optionIndex} style={styles.reminderOption}>
                            <View style={styles.reminderLeft}>
                              <Switch
                                value={option.enabled}
                                onValueChange={(enabled) => {
                                  const newOptions = [...(settings.customOptions || [])];
                                  newOptions[optionIndex] = {
                                    ...option,
                                    enabled
                                  };
                                  updateCardSettings(card.id, { customOptions: newOptions });
                                }}
                                trackColor={{ false: '#333333', true: '#007AFF' }}
                                thumbColor={option.enabled ? '#FFFFFF' : '#666666'}
                                style={styles.smallSwitch}
                              />
                              <Text style={styles.reminderLabel}>{option.label}</Text>
                            </View>
                            
                            {option.enabled && (
                              <View style={styles.timeSelection}>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                  {timeOptions.map((time, timeIndex) => (
                                    <TouchableOpacity
                                      key={timeIndex}
                                      style={[
                                        styles.timeButton,
                                        option.selectedTimes?.includes(time) && styles.selectedTimeButton
                                      ]}
                                      onPress={() => {
                                        const selectedTimes = option.selectedTimes || ['09:00'];
                                        const newTimes = selectedTimes.includes(time)
                                          ? selectedTimes.filter(t => t !== time)
                                          : [...selectedTimes, time];
                                        
                                        const newOptions = [...(settings.customOptions || [])];
                                        newOptions[optionIndex] = {
                                          ...option,
                                          selectedTimes: newTimes.length > 0 ? newTimes : ['09:00']
                                        };
                                        updateCardSettings(card.id, { customOptions: newOptions });
                                      }}
                                    >
                                      <Text style={[
                                        styles.timeButtonText,
                                        option.selectedTimes?.includes(time) && styles.selectedTimeButtonText
                                      ]}>
                                        {time}
                                      </Text>
                                    </TouchableOpacity>
                                  ))}
                                </ScrollView>
                              </View>
                            )}
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>

        {/* Scheduled Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Scheduled Notifications</Text>
          
          {scheduledNotifications.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🔔</Text>
              <Text style={styles.emptyTitle}>No Scheduled Notifications</Text>
              <Text style={styles.emptySubtitle}>
                Enable credit card notifications to see them here
              </Text>
            </View>
          ) : (
            scheduledNotifications.map((notification, index) => {
              const formatted = formatScheduledNotification(notification);
              
              return (
                <View key={index} style={styles.notificationItem}>
                  <View style={styles.notificationLeft}>
                    <Text style={styles.notificationTitle}>{formatted.title}</Text>
                    <Text style={styles.notificationBody}>{formatted.body}</Text>
                    <Text style={styles.notificationMeta}>
                      {formatted.cardName} • {formatted.description}
                    </Text>
                  </View>
                </View>
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
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  settingItem: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  settingLeft: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDescription: {
    color: '#999999',
    fontSize: 14,
    lineHeight: 18,
  },
  actionButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  cardItem: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardColorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  cardDetails: {
    flex: 1,
  },
  cardName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  cardBank: {
    color: '#999999',
    fontSize: 14,
  },
  customSettings: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  customTitle: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  reminderSection: {
    marginBottom: 20,
  },
  reminderTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  reminderOption: {
    marginBottom: 16,
  },
  reminderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  smallSwitch: {
    transform: [{ scaleX: 0.7 }, { scaleY: 0.7 }],
    marginRight: 8,
  },
  reminderLabel: {
    color: '#CCCCCC',
    fontSize: 14,
    flex: 1,
  },
  timeSelection: {
    marginLeft: 32,
  },
  timeButton: {
    backgroundColor: '#333333',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  selectedTimeButton: {
    backgroundColor: '#007AFF',
  },
  timeButtonText: {
    color: '#CCCCCC',
    fontSize: 12,
    fontWeight: '600',
  },
  selectedTimeButtonText: {
    color: '#FFFFFF',
  },
  overdueSection: {
    marginTop: 8,
  },
  overdueOption: {
    marginBottom: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
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
  notificationItem: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  notificationLeft: {
    flex: 1,
  },
  notificationTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  notificationBody: {
    color: '#CCCCCC',
    fontSize: 14,
    marginBottom: 8,
  },
  notificationMeta: {
    color: '#999999',
    fontSize: 12,
  },
  bottomSpacing: {
    height: 20,
  },
});