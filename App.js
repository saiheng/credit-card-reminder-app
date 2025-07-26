// App.js - 修復版，完整的導航和功能管理
import React, { useState, useEffect } from 'react';
import { StatusBar, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 導入所有頁面組件
import WelcomePage from './components/WelcomePage';
import LoginPage from './components/LoginPage';
import HomePage from './components/HomePage';
import ProfilePage from './components/ProfilePage';
import MyCardsPage from './components/MyCardsPage';
import AddCardPage from './components/AddCardPage';
import NotificationsPage from './components/NotificationsPage';
import HistoryPage from './components/HistoryPage';
import AchievementsPage from './components/AchievementsPage';

export default function App() {
  const [currentPage, setCurrentPage] = useState('Welcome');
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    phone: '',
    loginMethod: '',
    language: 'zh-TW',
    isLoggedIn: false
  });
  const [creditCards, setCreditCards] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [notificationSettings, setNotificationSettings] = useState({});
  const [achievements, setAchievements] = useState([]);

  // 載入儲存的數據
  useEffect(() => {
    loadStoredData();
  }, []);

  // 儲存數據到本地
  useEffect(() => {
    saveStoredData();
  }, [userData, creditCards, paymentHistory, notificationSettings, achievements]);

  const loadStoredData = async () => {
    try {
      const [
        storedUserData,
        storedCreditCards,
        storedPaymentHistory,
        storedNotificationSettings,
        storedAchievements
      ] = await Promise.all([
        AsyncStorage.getItem('userData'),
        AsyncStorage.getItem('creditCards'),
        AsyncStorage.getItem('paymentHistory'),
        AsyncStorage.getItem('notificationSettings'),
        AsyncStorage.getItem('achievements')
      ]);

      if (storedUserData) {
        const parsedUserData = JSON.parse(storedUserData);
        setUserData(parsedUserData);
        // 如果用戶已登入，直接跳到首頁
        if (parsedUserData.isLoggedIn) {
          setCurrentPage('Home');
        }
      }

      if (storedCreditCards) {
        setCreditCards(JSON.parse(storedCreditCards));
      }

      if (storedPaymentHistory) {
        setPaymentHistory(JSON.parse(storedPaymentHistory));
      }

      if (storedNotificationSettings) {
        setNotificationSettings(JSON.parse(storedNotificationSettings));
      }

      if (storedAchievements) {
        setAchievements(JSON.parse(storedAchievements));
      }
    } catch (error) {
      console.error('載入數據失敗:', error);
    }
  };

  const saveStoredData = async () => {
    try {
      await Promise.all([
        AsyncStorage.setItem('userData', JSON.stringify(userData)),
        AsyncStorage.setItem('creditCards', JSON.stringify(creditCards)),
        AsyncStorage.setItem('paymentHistory', JSON.stringify(paymentHistory)),
        AsyncStorage.setItem('notificationSettings', JSON.stringify(notificationSettings)),
        AsyncStorage.setItem('achievements', JSON.stringify(achievements))
      ]);
    } catch (error) {
      console.error('儲存數據失敗:', error);
    }
  };

  // 導航函數
  const handleNavigate = (pageName) => {
    setCurrentPage(pageName);
  };

  // 用戶數據更新
  const handleUpdateUserData = (newUserData) => {
    setUserData(newUserData);
  };

  // 信用卡管理
  const handleAddCard = (newCard) => {
    const cardWithId = {
      ...newCard,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      isMarkedPaid: false
    };
    setCreditCards(prev => [...prev, cardWithId]);
    
    // 觸發成就檢查
    checkAchievementsForNewCard([...creditCards, cardWithId]);
    
    setCurrentPage('MyCards');
    Alert.alert('成功', '信用卡已成功新增！');
  };

  const handleUpdateCard = (cardId, updatedCard) => {
    setCreditCards(prev => 
      prev.map(card => 
        card.id === cardId ? { ...card, ...updatedCard } : card
      )
    );
  };

  const handleDeleteCard = (cardId) => {
    setCreditCards(prev => prev.filter(card => card.id !== cardId));
    // 同時清理相關的通知設定和歷史記錄
    setNotificationSettings(prev => {
      const newSettings = { ...prev };
      delete newSettings[cardId];
      return newSettings;
    });
    setPaymentHistory(prev => prev.filter(payment => payment.cardId !== cardId));
  };

  // 還款標記
  const handleMarkPayment = (cardId) => {
    const card = creditCards.find(c => c.id === cardId);
    if (!card) return;

    const today = new Date();
    const dueDate = new Date(today.getFullYear(), today.getMonth(), parseInt(card.dueDay));
    const isOnTime = today <= dueDate;

    const payment = {
      cardId,
      date: dueDate.toISOString(),
      markedDate: today.toISOString(),
      onTime: isOnTime,
      month: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
    };

    setPaymentHistory(prev => [...prev, payment]);
    
    // 標記卡片已還款
    handleUpdateCard(cardId, { isMarkedPaid: true });
    
    // 觸發成就檢查
    checkAchievementsForPayment([...paymentHistory, payment]);

    Alert.alert('成功', '還款已標記！', [
      { text: '確定', onPress: () => {} }
    ]);
  };

  // 通知設定管理
  const handleUpdateNotificationSettings = (cardId, settings) => {
    setNotificationSettings(prev => ({
      ...prev,
      [cardId]: settings
    }));
  };

  // 成就檢查
  const checkAchievementsForNewCard = (cards) => {
    // 這裡可以觸發特定的成就檢查邏輯
    // 例如：第一張卡片、卡片收集家等
  };

  const checkAchievementsForPayment = (payments) => {
    // 這裡可以觸發還款相關的成就檢查
    // 例如：首次還款、連續還款等
  };

  const handleUpdateAchievements = (newAchievements) => {
    setAchievements(newAchievements);
  };

  // 根據當前頁面渲染對應組件
  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'Welcome':
        return (
          <WelcomePage 
            onStartNow={() => handleNavigate('Login')}
          />
        );

      case 'Login':
        return (
          <LoginPage 
            onLogin={(method, userInfo) => {
              const newUserData = {
                ...userData,
                ...userInfo,
                loginMethod: method,
                isLoggedIn: true
              };
              setUserData(newUserData);
              handleNavigate('Home');
            }}
            onBack={() => handleNavigate('Welcome')}
          />
        );

      case 'Home':
        return (
          <HomePage 
            creditCards={creditCards}
            paymentHistory={paymentHistory}
            userData={userData}
            onNavigate={handleNavigate}
            onUpdateUserData={handleUpdateUserData}
          />
        );

      case 'Profile':
        return (
          <ProfilePage 
            userData={userData}
            onBack={() => handleNavigate('Home')}
            onUpdateUserData={handleUpdateUserData}
            onNavigate={handleNavigate}
          />
        );

      case 'MyCards':
        return (
          <MyCardsPage 
            creditCards={creditCards}
            paymentHistory={paymentHistory}
            notificationSettings={notificationSettings}
            onBack={() => handleNavigate('Home')}
            onNavigate={handleNavigate}
            onUpdateCard={handleUpdateCard}
            onDeleteCard={handleDeleteCard}
            onMarkPayment={handleMarkPayment}
            onUpdateNotificationSettings={handleUpdateNotificationSettings}
          />
        );

      case 'AddCard':
        return (
          <AddCardPage 
            onAddCard={handleAddCard}
            onCancel={() => handleNavigate('Home')}
            onBack={() => handleNavigate('Home')}
          />
        );

      case 'Notifications':
        return (
          <NotificationsPage 
            creditCards={creditCards}
            notificationSettings={notificationSettings}
            onBack={() => handleNavigate('Home')}
            onUpdateSettings={handleUpdateNotificationSettings}
          />
        );

      case 'History':
        return (
          <HistoryPage 
            paymentHistory={paymentHistory}
            creditCards={creditCards}
            onBack={() => handleNavigate('Home')}
          />
        );

      case 'Achievements':
        return (
          <AchievementsPage 
            achievements={achievements}
            creditCards={creditCards}
            paymentHistory={paymentHistory}
            onBack={() => handleNavigate('Home')}
            onUpdateAchievements={handleUpdateAchievements}
          />
        );

      default:
        return (
          <WelcomePage 
            onStartNow={() => handleNavigate('Login')}
          />
        );
    }
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      {renderCurrentPage()}
    </>
  );
}