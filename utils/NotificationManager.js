// utils/NotificationManager.js
// 通知管理器 - 處理所有與通知相關的功能
// 這個管理器會幫助用戶按時餵養他們的寵物，發送可愛的提醒通知

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// 設定通知的行為方式
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

class NotificationManager {
  constructor() {
    this.permissionGranted = false;
    this.expoPushToken = null;
  }

  // 初始化通知系統
  async initialize() {
    try {
      // 註冊推送通知
      await this.registerForPushNotificationsAsync();
      return true;
    } catch (error) {
      console.error('通知初始化失敗:', error);
      return false;
    }
  }

  // 註冊推送通知權限
  async registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF6B9D',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        alert('需要通知權限才能發送餵養提醒！');
        this.permissionGranted = false;
        return;
      }
      
      this.permissionGranted = true;
      
      try {
        token = (await Notifications.getExpoPushTokenAsync({
          projectId: Constants.expoConfig?.extra?.eas?.projectId,
        })).data;
      } catch (error) {
        console.error('獲取推送令牌失敗:', error);
      }
    } else {
      alert('必須使用實體設備來接收推送通知');
    }

    this.expoPushToken = token;
    return token;
  }

  // 為單張卡片安排通知
  async scheduleCardNotifications(card, customRules = null) {
    if (!this.permissionGranted) {
      console.log('沒有通知權限，跳過安排通知');
      return;
    }

    // 如果卡片通知被關閉或本月已還款，不安排通知
    if (!card.isNotificationEnabled || card.isPaidThisMonth) {
      return;
    }

    // 使用預設或自定義規則
    const rules = customRules || this.getDefaultNotificationRules();
    
    for (const rule of rules) {
      if (rule.isEnabled) {
        await this.scheduleRuleNotifications(card, rule);
      }
    }
  }

  // 獲取預設通知規則
  getDefaultNotificationRules() {
    return [
      {
        id: 'default_7_days',
        daysBefore: 7,
        times: ['09:00', '18:00'],
        isEnabled: true
      },
      {
        id: 'default_3_days',
        daysBefore: 3,
        times: ['09:00', '18:00'],
        isEnabled: true
      },
      {
        id: 'default_1_day',
        daysBefore: 1,
        times: ['09:00', '12:00', '18:00'],
        isEnabled: true
      },
      {
        id: 'default_due_day',
        daysBefore: 0,
        times: ['09:00'],
        isEnabled: true
      },
      {
        id: 'default_overdue',
        daysBefore: -1,
        times: ['09:00'],
        isEnabled: true,
        isOverdue: true
      }
    ];
  }

  // 為特定規則安排通知
  async scheduleRuleNotifications(card, rule) {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    for (const time of rule.times) {
      const [hour, minute] = time.split(':').map(Number);
      
      if (rule.isOverdue) {
        // 逾期通知 - 從還款日後開始，每天發送
        for (let i = 1; i <= 7; i++) { // 最多提醒7天
          const notificationDate = new Date(currentYear, currentMonth, card.dueDay + i, hour, minute);
          
          if (notificationDate > today) {
            await this.scheduleNotification(
              card,
              notificationDate,
              this.getOverdueNotificationContent(card, i),
              `${card.id}_overdue_${i}_${time}`
            );
          }
        }
      } else {
        // 正常提醒通知
        const notificationDate = new Date(
          currentYear, 
          currentMonth, 
          card.dueDay - rule.daysBefore, 
          hour, 
          minute
        );
        
        // 如果這個月的日期已過，安排下個月的
        if (notificationDate <= today) {
          notificationDate.setMonth(currentMonth + 1);
        }
        
        await this.scheduleNotification(
          card,
          notificationDate,
          this.getNotificationContent(card, rule.daysBefore),
          `${card.id}_${rule.id}_${time}`
        );
      }
    }
  }

  // 安排單個通知
  async scheduleNotification(card, date, content, identifier) {
    try {
      await Notifications.scheduleNotificationAsync({
        identifier,
        content: {
          title: content.title,
          body: content.body,
          data: { 
            cardId: card.id, 
            cardName: card.cardName,
            type: 'payment_reminder'
          },
          sound: 'default',
        },
        trigger: {
          date: date,
        },
      });
    } catch (error) {
      console.error('安排通知失敗:', error);
    }
  }

  // 獲取通知內容（可愛風格）
  getNotificationContent(card, daysBefore) {
    if (daysBefore === 7) {
      return {
        title: `信用卡還款提醒`,
        body: `您的${card.cardName} 還有7天到期，請準備還款金額`
      };
    } else if (daysBefore === 3) {
      return {
        title: `重要還款提醒`,
        body: `您的${card.cardName} 還有3天到期，請儘快安排還款`
      };
    } else if (daysBefore === 1) {
      return {
        title: `緊急還款提醒`,
        body: `您的${card.cardName} 明天到期，請立即處理還款`
      };
    } else if (daysBefore === 0) {
      return {
        title: `今日還款到期`,
        body: `您的${card.cardName} 今天到期，請立即還款避免逾期費用`
      };
    }
    
    return {
      title: `信用卡還款提醒`,
      body: `${card.cardName}即將到期，請及時處理還款`
    };
  }

  // 獲取逾期通知內容
  getOverdueNotificationContent(card, daysOverdue) {
    // 根據逾期天數提供相應嚴重程度的警告
    if (daysOverdue === 1) {
      return {
        title: '信用卡逾期通知',
        body: `${card.cardName}已逾期1天，請立即還款避免產生更多費用`
      };
    } else if (daysOverdue <= 3) {
      return {
        title: '逾期還款警告',
        body: `${card.cardName}已逾期${daysOverdue}天，請立即還款避免影響信用記錄`
      };
    } else if (daysOverdue <= 7) {
      return {
        title: '嚴重逾期警告',
        body: `${card.cardName}已逾期${daysOverdue}天，請立即聯絡銀行安排還款`
      };
    } else {
      return {
        title: '長期逾期警告',
        body: `${card.cardName}已逾期${daysOverdue}天，請立即處理以避免嚴重後果`
      };
    }
  }

  // 為所有卡片重新安排通知
  async rescheduleAllNotifications(cards) {
    // 先取消所有現有通知
    await this.cancelAllNotifications();
    
    // 為每張啟用通知的卡片安排新通知
    for (const card of cards) {
      if (card.isNotificationEnabled && !card.isPaidThisMonth) {
        await this.scheduleCardNotifications(card);
      }
    }
  }

  // 取消特定卡片的所有通知
  async cancelCardNotifications(cardId) {
    try {
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      const cardNotifications = scheduledNotifications.filter(notification => 
        notification.identifier.startsWith(cardId)
      );
      
      for (const notification of cardNotifications) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    } catch (error) {
      console.error('取消卡片通知失敗:', error);
    }
  }

  // 取消所有通知
  async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('取消所有通知失敗:', error);
    }
  }

  // 發送測試通知
  async sendTestNotification(language = 'zh') {
    const testContent = language === 'zh' ? {
      title: '測試通知',
      body: '您信用卡還款提醒功能正常運作中，您將準時收到還款通知'
    } : {
      title: 'Test Notification',
      body: 'Credit card payment reminder is working properly, you will receive payment notifications on time'
    };

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: testContent.title,
          body: testContent.body,
          data: { type: 'test' },
          sound: 'default',
        },
        trigger: {
          seconds: 1,
        },
      });
    } catch (error) {
      console.error('發送測試通知失敗:', error);
      throw error;
    }
  }

  // 獲取所有已安排的通知
  async getAllScheduledNotifications() {
    try {
      const notifications = await Notifications.getAllScheduledNotificationsAsync();
      return notifications.map(notification => ({
        id: notification.identifier,
        cardName: notification.content.data?.cardName || 'Unknown',
        title: notification.content.title,
        body: notification.content.body,
        scheduledTime: notification.trigger.value || notification.trigger.date,
      }));
    } catch (error) {
      console.error('獲取已安排通知失敗:', error);
      return [];
    }
  }

  // 檢查通知權限狀態
  async checkPermissionStatus() {
    const { status } = await Notifications.getPermissionsAsync();
    this.permissionGranted = status === 'granted';
    return this.permissionGranted;
  }

  // 處理用戶點擊通知
  handleNotificationResponse(response) {
    const data = response.notification.request.content.data;
    
    if (data.type === 'payment_reminder') {
      // 這裡可以導航到特定卡片或打開應用程式
      console.log('用戶點擊了還款提醒通知:', data.cardName);
    }
  }

  // 當月重置 - 清除已還款狀態並重新安排通知
  async monthlyReset(cards) {
    // 清除所有卡片的已還款狀態
    const resetCards = cards.map(card => ({
      ...card,
      isPaidThisMonth: false
    }));

    // 重新安排所有通知
    await this.rescheduleAllNotifications(resetCards);
    
    return resetCards;
  }
}

// 創建並導出單例實例 - 使用不同的名稱避免衝突
const notificationManagerInstance = new NotificationManager();

// 導出實例和類別
export { notificationManagerInstance as NotificationManager };
export { NotificationManager as NotificationManagerClass };
