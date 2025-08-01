// App.js - 🔥 更新：添加語言切換支援到整合登入和註冊頁面
import React, { useState, useEffect } from 'react';
import { StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations } from './languages';
import * as Linking from 'expo-linking';

// 導入所有頁面組件
import WelcomePage from './components/WelcomePage';
import LoginPage from './components/LoginPage';
import SignUpPage from './components/SignUpPage';
import HomePage from './components/HomePage';
import ProfilePage from './components/ProfilePage';
import MyCardsPage from './components/MyCardsPage';
import AddCardPage from './components/AddCardPage';
import NotificationsPage from './components/NotificationsPage';
import HistoryPage from './components/HistoryPage';
import AchievementsPage from './components/AchievementsPage';
import ExplorePage from './components/ExplorePage';
import AdminPanel from './components/AdminPanel';
import TermsOfServicePage from './components/TermsOfServicePage';
import PrivacyPolicyPage from './components/PrivacyPolicyPage';
import ForgotPasswordPage from './components/ForgotPasswordPage';
import IntegratedLoginPage from './components/IntegratedLoginPage';
import IntegratedSignUpPage from './components/IntegratedSignUpPage';

export default function App() {
  // 應用程式狀態管理
  const [currentPage, setCurrentPage] = useState('Welcome');
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    phone: '',
    loginMethod: '',
    language: 'en',
    isLoggedIn: false
  });
  const [creditCards, setCreditCards] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [notificationSettings, setNotificationSettings] = useState({});
  const [achievements, setAchievements] = useState([]);
  
  // 收藏功能狀態管理
  const [favoriteCards, setFavoriteCards] = useState([]);

  // 獲取當前語言的文字內容
  const getText = (path) => {
    const keys = path.split('.');
    let result = translations[currentLanguage];
    for (const key of keys) {
      result = result?.[key];
    }
    return result || path;
  };

  // 載入儲存的數據
  useEffect(() => {
    loadStoredData();
  }, []);
  
// 🔥 新增：處理深度鏈接的useEffect
  useEffect(() => {
    // 處理深度鏈接的函數
    const handleDeepLink = (url) => {
      console.log('🔗 收到深度鏈接:', url);
      
      // 如果URL包含verified參數，說明用戶從驗證頁面返回
      if (url && url.includes('verified')) {
        console.log('✅ 檢測到郵件驗證返回，導航到登入頁面');
        setCurrentPage('Login');
      }
      
      // 您可以根據需要添加更多的URL處理邏輯
      if (url && url.includes('home')) {
        console.log('🏠 導航到主頁');
        setCurrentPage('Home');
      }
    };

    // 監聽應用程式啟動時的URL（冷啟動）
    const getInitialURL = async () => {
      try {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          console.log('🚀 應用啟動時的URL:', initialUrl);
          handleDeepLink(initialUrl);
        }
      } catch (error) {
        console.warn('獲取初始URL失敗:', error);
      }
    };

    // 執行初始URL檢查
    getInitialURL();

    // 監聽應用程式運行時的URL變化（熱啟動）
    const subscription = Linking.addEventListener('url', (event) => {
      console.log('🔄 運行時收到URL:', event.url);
      handleDeepLink(event.url);
    });

    // 清理函數：當組件卸載時移除監聽器
    return () => {
      if (subscription && subscription.remove) {
        subscription.remove();
      }
    };
  }, []); // 空依賴數組，表示這個effect只在組件掛載時執行一次

  // 儲存數據到本地
  useEffect(() => {
    saveStoredData();
  }, [userData, creditCards, paymentHistory, notificationSettings, achievements, currentLanguage, favoriteCards]);

  // 從本地存儲載入數據
  const loadStoredData = async () => {
    try {
      const [
        storedUserData,
        storedCreditCards,
        storedPaymentHistory,
        storedNotificationSettings,
        storedAchievements,
        storedLanguage,
        storedFavoriteCards
      ] = await Promise.all([
        AsyncStorage.getItem('userData'),
        AsyncStorage.getItem('creditCards'),
        AsyncStorage.getItem('paymentHistory'),
        AsyncStorage.getItem('notificationSettings'),
        AsyncStorage.getItem('achievements'),
        AsyncStorage.getItem('currentLanguage'),
        AsyncStorage.getItem('favoriteCards')
      ]);

      if (storedUserData) {
        const parsedUserData = JSON.parse(storedUserData);
        setUserData(parsedUserData);
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

      if (storedLanguage) {
        setCurrentLanguage(storedLanguage);
      }

      if (storedFavoriteCards) {
        setFavoriteCards(JSON.parse(storedFavoriteCards));
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
        AsyncStorage.setItem('achievements', JSON.stringify(achievements)),
        AsyncStorage.setItem('currentLanguage', currentLanguage),
        AsyncStorage.setItem('favoriteCards', JSON.stringify(favoriteCards))
      ]);
    } catch (error) {
      console.error('儲存數據失敗:', error);
    }
  };

  // 收藏功能處理函數
  const handleToggleFavorite = (cardId) => {
    setFavoriteCards(prev => {
      if (prev.includes(cardId)) {
        console.log(`移除收藏: ${cardId}`);
        return prev.filter(id => id !== cardId);
      } else {
        console.log(`添加收藏: ${cardId}`);
        return [...prev, cardId];
      }
    });
  };

  // 語言切換處理函數
  const handleLanguageChange = (languageCode) => {
    setCurrentLanguage(languageCode);
    setUserData(prev => ({
      ...prev,
      language: languageCode
    }));
    
    console.log(`語言已切換為: ${languageCode}`);
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
      isLoggedIn: true,
      language: currentLanguage
    };
    setUserData(newUserData);
    handleNavigate('Home');
    
    console.log(`歡迎回來，${userInfo.name || userInfo.email}！`);
  };
  
  // 🔥 新增：用戶註冊處理函數（修復錯誤的關鍵）
const handleSignUp = (userInfo) => {
  const newUserData = {
    ...userData,
    ...userInfo,
    isLoggedIn: true,
    language: currentLanguage
  };
  setUserData(newUserData);
  handleNavigate('Home');
  
  console.log(`歡迎加入CardReminder，${userInfo.name || userInfo.email}！`);
};

  // 用戶數據更新
  const handleUpdateUserData = (newUserData) => {
    setUserData(newUserData);
  };

  const handleLogout = async () => {
    try {
      const loggedOutUserData = {
        ...userData,
        isLoggedIn: false
      };
      
      setUserData(loggedOutUserData);
      setCurrentPage('Welcome');
      
      console.log('用戶已成功登出');
    } catch (error) {
      console.error('登出過程中發生錯誤:', error);
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
    
    checkAchievementsForNewCard([...creditCards, cardWithId]);
    
    setCurrentPage('MyCards');
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
    setNotificationSettings(prev => {
      const newSettings = { ...prev };
      delete newSettings[cardId];
      return newSettings;
    });
    setPaymentHistory(prev => prev.filter(payment => payment.cardId !== cardId));
  };

  // 🔥 核心函數：檢查特定月份的付款狀態（與HomePage和MyCardsPage完全一致）
  const isCardPaidForMonth = (cardId, year, month) => {
    const monthString = `${year}-${String(month + 1).padStart(2, '0')}`;
    const payment = paymentHistory.find(payment => 
      payment.cardId === cardId && 
      payment.month === monthString &&
      payment.onTime !== undefined
    );
    
    console.log(`🔍 App.js檢查付款狀態: 卡片${cardId}, 月份${monthString}, 結果: ${!!payment}`);
    return !!payment;
  };

  // 🔥 核心邏輯：正確的帳單月份判斷系統（與HomePage和MyCardsPage完全一致）
  const determineCurrentBillStatus = (card) => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0-11
    const currentDay = today.getDate();
    const dueDay = parseInt(card.dueDay);
    
    console.log(`\n=== App.js: 分析卡片 ${card.name} 的帳單狀態 ===`);
    console.log(`今天: ${currentYear}-${currentMonth + 1}-${currentDay}`);
    console.log(`到期日: 每月${dueDay}日`);
    
    // 🎯 第一步：檢查當前月份的付款狀態
    const currentMonthPaid = isCardPaidForMonth(card.id, currentYear, currentMonth);
    console.log(`當前月份(${currentMonth + 1}月)付款狀態: ${currentMonthPaid}`);
    
    if (!currentMonthPaid) {
      // 🚨 關鍵邏輯：當前月份未付款，這是我們需要關注的帳單
      console.log(`✨ App.js邏輯判斷: 當前月份未付款，需要處理當月帳單`);
      
      const currentMonthDueDate = new Date(currentYear, currentMonth, dueDay);
      const timeDiff = currentMonthDueDate - today;
      const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
      
      return {
        billYear: currentYear,
        billMonth: currentMonth,
        billMonthString: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`,
        dueDate: currentMonthDueDate,
        daysDiff: daysDiff,
        isPaid: false,
        reason: 'current_month_unpaid'
      };
    } else {
      // ✅ 當前月份已付款，考慮下個月的帳單
      console.log(`✅ App.js邏輯判斷: 當前月份已付款，檢查下個月帳單`);
      
      let nextMonth = currentMonth + 1;
      let nextYear = currentYear;
      
      if (nextMonth > 11) {
        nextMonth = 0;
        nextYear = currentYear + 1;
      }
      
      const nextMonthDueDate = new Date(nextYear, nextMonth, dueDay);
      const timeDiff = nextMonthDueDate - today;
      const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
      
      // 檢查下個月是否也已經付款（提前還款的情況）
      const nextMonthPaid = isCardPaidForMonth(card.id, nextYear, nextMonth);
      
      return {
        billYear: nextYear,
        billMonth: nextMonth,
        billMonthString: `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}`,
        dueDate: nextMonthDueDate,
        daysDiff: daysDiff,
        isPaid: nextMonthPaid,
        reason: nextMonthPaid ? 'next_month_paid' : 'next_month_unpaid'
      };
    }
  };

  // 🔥 完全重新設計的付款標記邏輯：基於正確的狀態驅動邏輯
  const handleMarkPayment = (cardId, options = null) => {
    const card = creditCards.find(c => c.id === cardId);
    if (!card) {
      console.error('找不到指定的信用卡');
      return;
    }

    console.log(`\n=== App.js付款操作開始 ===`);
    console.log(`卡片: ${card.name} (${cardId})`);
    console.log(`操作類型: ${options?.removePayment ? '移除付款記錄' : '標記為已付款'}`);

    // 🔥 移除付款記錄的處理
    if (options && options.removePayment) {
      const targetMonth = options.month;
      
      console.log(`🗑️ 移除付款記錄操作:`, {
        cardId,
        targetMonth,
        說明: '根據傳入的月份精確移除付款記錄'
      });
      
      setPaymentHistory(prev => {
        const newHistory = prev.filter(payment => 
          !(payment.cardId === cardId && payment.month === targetMonth)
        );
        
        console.log('移除付款記錄操作完成:', {
          cardId,
          targetMonth,
          原始記錄數量: prev.length,
          新記錄數量: newHistory.length,
          被移除的記錄: prev.filter(payment => 
            payment.cardId === cardId && payment.month === targetMonth
          )
        });
        
        return newHistory;
      });
      
      handleUpdateCard(cardId, { isMarkedPaid: false });
      return;
    }

    // 🔥 標記為已付款的處理：使用正確的邏輯系統
    const today = new Date();
    
    // 步驟1：使用統一的邏輯獲取當前應該關注的帳單狀態
    const billStatus = determineCurrentBillStatus(card);
    
    console.log(`📋 付款操作的帳單狀態分析:`, {
      應該付款的月份: `${billStatus.billYear}-${billStatus.billMonth + 1}`,
      帳單月份字符串: billStatus.billMonthString,
      到期日: billStatus.dueDate.toDateString(),
      當前是否已付款: billStatus.isPaid,
      判斷原因: billStatus.reason
    });

    // 步驟2：檢查該月份是否已有付款記錄（避免重複）
    const existingPayment = paymentHistory.find(payment => 
      payment.cardId === cardId && payment.month === billStatus.billMonthString
    );

    if (existingPayment) {
      console.log('⚠️ 付款記錄已存在，跳過創建:', {
        cardName: card.name,
        month: billStatus.billMonthString,
        existingPayment
      });
      return;
    }

    // 步驟3：創建正確的付款記錄
    const dueDate = billStatus.dueDate;
    const isOnTime = today <= dueDate;

    const payment = {
      cardId,
      date: dueDate.toISOString(),
      markedDate: today.toISOString(),
      onTime: isOnTime,
      month: billStatus.billMonthString
    };

    console.log('✅ 創建付款記錄成功:', {
      cardName: card.name,
      付款月份: billStatus.billMonthString,
      到期日: dueDate.toDateString(),
      是否準時: isOnTime,
      標記日期: today.toDateString(),
      邏輯說明: billStatus.reason === 'current_month_unpaid' 
        ? '當前月份未付款，記錄在當前月份（可能為逾期還款）'
        : '當前月份已付款，記錄在下個月份（提前還款）'
    });

    setPaymentHistory(prev => [...prev, payment]);
    handleUpdateCard(cardId, { isMarkedPaid: true });
    checkAchievementsForPayment([...paymentHistory, payment]);
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
    console.log('檢查新卡片成就:', cards.length);
  };

  const checkAchievementsForPayment = (payments) => {
    console.log('檢查還款成就:', payments.length);
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
            getText={getText}
          />
        );

      case 'Login':
        return (
          <IntegratedLoginPage 
            onLogin={handleLogin}
            onBack={() => handleNavigate('Welcome')}
            onNavigateToSignUp={() => handleNavigate('SignUp')}
            onNavigateToForgotPassword={() => handleNavigate('ForgotPassword')}
            getText={getText}
            currentLanguage={currentLanguage}
            onLanguageChange={handleLanguageChange}
          />
        );

      case 'SignUp':
        return (
          <IntegratedSignUpPage 
            onSignUp={handleSignUp}
            onBack={() => handleNavigate('Welcome')}
            onNavigateToLogin={() => handleNavigate('Login')}
            onNavigateToTerms={() => handleNavigate('TermsOfService')}
            onNavigateToPrivacy={() => handleNavigate('PrivacyPolicy')}
            getText={getText}
            currentLanguage={currentLanguage}
            onLanguageChange={handleLanguageChange}
          />
        );

      case 'Home':
        return (
          <HomePage 
            creditCards={creditCards}
            paymentHistory={paymentHistory}
            notificationSettings={notificationSettings}
            userData={userData}
            onNavigate={handleNavigate}
            onUpdateUserData={handleUpdateUserData}
            getText={getText}
            currentLanguage={currentLanguage}
          />
        );

      case 'Profile':
        return (
          <ProfilePage 
            userData={userData}
            onBack={() => handleNavigate('Home')}
            onUpdateUserData={handleUpdateUserData}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
            currentLanguage={currentLanguage}
            onLanguageChange={handleLanguageChange}
            getText={getText}
            creditCards={creditCards}
            paymentHistory={paymentHistory}
            notificationSettings={notificationSettings}
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
            getText={getText}
            currentLanguage={currentLanguage}
            userData={userData}
          />
        );

      case 'AddCard':
        return (
          <AddCardPage 
            onAddCard={handleAddCard}
            onCancel={() => handleNavigate('MyCards')}
            onBack={() => handleNavigate('MyCards')}
            getText={getText}
            creditCards={creditCards}
            paymentHistory={paymentHistory}
            notificationSettings={notificationSettings}
            userData={userData}
            currentLanguage={currentLanguage}
            onNavigate={handleNavigate}
            onUpdateCard={handleUpdateCard}
            onDeleteCard={handleDeleteCard}
            onMarkPayment={handleMarkPayment}
            onUpdateNotificationSettings={handleUpdateNotificationSettings}
          />
        );

      case 'Notifications':
        return (
          <NotificationsPage 
            creditCards={creditCards}
            notificationSettings={notificationSettings}
            onBack={() => handleNavigate('Home')}
            onUpdateSettings={handleUpdateNotificationSettings}
            onUpdateNotificationSettings={handleUpdateNotificationSettings}
            getText={getText}
            userData={userData}
            paymentHistory={paymentHistory}
            onNavigate={handleNavigate}
            currentLanguage={currentLanguage}
          />
        );

      case 'History':
        return (
          <HistoryPage 
            paymentHistory={paymentHistory}
            creditCards={creditCards}
            onBack={() => handleNavigate('Home')}
            getText={getText}
            userData={userData}
            notificationSettings={notificationSettings}
            onNavigate={handleNavigate}
            currentLanguage={currentLanguage}
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
            getText={getText}
            userData={userData}
            notificationSettings={notificationSettings}
            onNavigate={handleNavigate}
            currentLanguage={currentLanguage}
          />
        );

      case 'Explore':
        return (
          <ExplorePage
            creditCards={creditCards}
            onBack={() => handleNavigate('Home')}
            onNavigate={handleNavigate}
            getText={getText}
            currentLanguage={currentLanguage}
            userData={userData}
            paymentHistory={paymentHistory}
            notificationSettings={notificationSettings}
            onUpdateCard={handleUpdateCard}
            onDeleteCard={handleDeleteCard}
            onMarkPayment={handleMarkPayment}
            onUpdateNotificationSettings={handleUpdateNotificationSettings}
            favoriteCards={favoriteCards}
            onToggleFavorite={handleToggleFavorite}
          />
        );

      case 'Admin':
        return (
          <AdminPanel 
            onBack={() => handleNavigate('Profile')}
            getText={getText}
            currentLanguage={currentLanguage}
          />
        );
        case 'ForgotPassword':
  return (
    <ForgotPasswordPage 
      onBack={() => handleNavigate('Login')}
      getText={getText}
    />
  );
  case 'TermsOfService':
  return (
    <TermsOfServicePage 
      onBack={() => handleNavigate('SignUp')}
      getText={getText}
    />
  );

case 'PrivacyPolicy':
  return (
    <PrivacyPolicyPage 
      onBack={() => handleNavigate('SignUp')}
      getText={getText}
    />
  );

      default:
        return (
          <WelcomePage 
            onStartNow={() => handleNavigate('Login')}
            getText={getText}
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