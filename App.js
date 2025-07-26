// App.js - 完全修復版，語法正確，包含完整的登入系統
import React, { useState, useEffect } from 'react';
import { StatusBar, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 導入所有頁面組件
import WelcomePage from './components/WelcomePage';
import LoginPage from './components/LoginPage';
import SignUpPage from './components/SignUpPage'; // ✅ 正確的導入位置
import HomePage from './components/HomePage';
import ProfilePage from './components/ProfilePage';
import MyCardsPage from './components/MyCardsPage';
import AddCardPage from './components/AddCardPage';
import NotificationsPage from './components/NotificationsPage';
import HistoryPage from './components/HistoryPage';
import AchievementsPage from './components/AchievementsPage';

export default function App() {
  // 應用程式狀態管理
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

  // 從本地存儲載入數據
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

  // 儲存數據到本地存儲
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

  // 用戶登入處理
  const handleLogin = (userInfo) => {
    const newUserData = {
      ...userData,
      ...userInfo,
      isLoggedIn: true
    };
    setUserData(newUserData);
    handleNavigate('Home');
    Alert.alert('歡迎', `歡迎回來，${userInfo.name || userInfo.email}！`);
  };

  // 用戶數據更新
  const handleUpdateUserData = (newUserData) => {
    setUserData(newUserData);
  };

  // 用戶登出處理
  const handleLogout = async () => {
    try {
      Alert.alert(
        '確認登出',
        '您確定要登出嗎？',
        [
          {
            text: '取消',
            style: 'cancel'
          },
          {
            text: '確定',
            onPress: async () => {
              // 更新用戶狀態為未登入
              const loggedOutUserData = {
                ...userData,
                isLoggedIn: false
              };
              
              setUserData(loggedOutUserData);
              
              // 導航回歡迎頁面
              setCurrentPage('Welcome');
              
              Alert.alert('成功', '您已成功登出');
            }
          }
        ]
      );
    } catch (error) {
      console.error('登出過程中發生錯誤:', error);
      Alert.alert('錯誤', '登出失敗，請重試');
    }
  };

  // 信用卡管理函數
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

  // 還款標記處理
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

    Alert.alert('成功', '還款已標記！');
  };

  // 通知設定管理
  const handleUpdateNotificationSettings = (cardId, settings) => {
    setNotificationSettings(prev => ({
      ...prev,
      [cardId]: settings
    }));
  };

  // 成就檢查函數
  const checkAchievementsForNewCard = (cards) => {
    // 這裡可以觸發特定的成就檢查邏輯
    console.log('檢查新卡片成就:', cards.length);
  };

  const checkAchievementsForPayment = (payments) => {
    // 這裡可以觸發還款相關的成就檢查
    console.log('檢查還款成就:', payments.length);
  };

  const handleUpdateAchievements = (newAchievements) => {
    setAchievements(newAchievements);
  };

  // 根據當前頁面渲染對應組件 - ✅ 這裡是正確的 switch 語句位置
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
            onLogin={handleLogin}
            onBack={() => handleNavigate('Welcome')}
            onNavigateToSignUp={() => handleNavigate('SignUp')} // ✅ 正確的註冊頁面導航
          />
        );

      case 'SignUp': // ✅ 新增的註冊頁面 case
        return (
          <SignUpPage 
            onSignUp={handleLogin} // 使用相同的登入處理函數
            onBack={() => handleNavigate('Login')}
            onNavigateToLogin={() => handleNavigate('Login')}
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
            onLogout={handleLogout} // ✅ 正確的登出功能
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
            onCancel={() => handleNavigate('MyCards')}
            onBack={() => handleNavigate('MyCards')}
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