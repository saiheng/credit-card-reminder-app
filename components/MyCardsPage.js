// components/MyCardsPage.js - 🔥 修正版：解決category陣列錯誤問題
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  PanResponder,
  Animated,
  Dimensions,
  TextInput,
  Modal
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import HomePage from './HomePage';
import { creditCardService } from '../firebase';

const { width: screenWidth } = Dimensions.get('window');

// 🔥 新增分類映射配置（與ExplorePage完全一致）
const CATEGORIES = [
 { id: '基本回贈', name: '基本回贈', icon: 'account-balance-wallet', englishName: 'Basic Cashback', color: '#4CAF50'},
  { id: '外幣', name: '旅遊外幣', icon: 'flight-takeoff', englishName: 'Travel & Foreign Currency', color: '#2196F3'},
  { id: '手機支付', name: '流動支付', icon: 'smartphone', englishName: 'Mobile Payment', color: '#9C27B0'  },
  { id: '網上購物', name: '網購', icon: 'shopping-cart', englishName: 'Online Shopping', color: '#FF9800'  },
  { id: '超市購物', name: '超市', icon: 'local-grocery-store', englishName: 'Supermarket', color: '#4CAF50'  },
  { id: '餐飲美食', name: '餐飲', icon: 'restaurant', englishName: 'Dining', color: '#E91E63'  },
  { id: '青年學生', name: '學生', icon: 'school', englishName: 'Student', color: '#3F51B5'  },
  { id: '里數', name: '里數', icon: 'flight', englishName: 'Miles', color: '#607D8B'  }
];

export default function MyCardsPage({ 
  creditCards = [], 
  paymentHistory = [],
  notificationSettings = {},
  onBack, 
  onNavigate, 
  onUpdateCard, 
  onDeleteCard, 
  onMarkPayment,
  onUpdateNotificationSettings,
  getText,
  currentLanguage,
  userData = {}
}) {
  // 編輯模態框狀態
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [editCardName, setEditCardName] = useState('');
  const [editCardNumber, setEditCardNumber] = useState('');

  // 通知選項模態框狀態
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const [selectedCardForNotification, setSelectedCardForNotification] = useState(null);

  // 🔥 Firebase信用卡資料狀態，用於獲取分類信息
  const [firebaseCards, setFirebaseCards] = useState([]);
  const [isLoadingFirebase, setIsLoadingFirebase] = useState(true);

  // Apple風格邊緣滑動返回功能
  const edgeWidth = 20;
  const swipeThreshold = screenWidth * 0.3;
  const [slideAnimation] = useState(new Animated.Value(0));
  const [isSliding, setIsSliding] = useState(false);

  // 🔥 新增：安全的category處理函數（與ExplorePage完全一致）
  const safeCategoryArray = useCallback((category) => {
    // 🧠 智能處理：無論category是字符串還是陣列，都能正常工作
    if (!category) {
      console.log('⚠️ MyCards: category為空，返回空陣列');
      return [];
    }
    
    if (Array.isArray(category)) {
      console.log(`✅ MyCards: category已是陣列，長度: ${category.length}`);
      return category;
    }
    
    if (typeof category === 'string') {
      console.log(`🔄 MyCards: category是字符串，轉換為陣列: "${category}"`);
      return [category];
    }
    
    console.log(`⚠️ MyCards: category類型未知 (${typeof category})，返回空陣列`);
    return [];
  }, []);
  
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: (evt, gestureState) => {
      const startX = evt.nativeEvent.pageX;
      return startX <= edgeWidth;
    },
    
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      const startX = evt.nativeEvent.pageX;
      const deltaX = gestureState.dx;
      return startX <= edgeWidth && deltaX > 0.5;
    },
    
    onPanResponderGrant: (evt, gestureState) => {
      const startX = evt.nativeEvent.pageX;
      if (startX <= edgeWidth) {
        setIsSliding(true);
        slideAnimation.setValue(0);
        console.log('🔥 我的信用卡頁面Apple風格滑動開始');
      }
    },
    
    onPanResponderMove: (evt, gestureState) => {
      if (!isSliding) return;
      
      const swipeDistance = Math.max(0, gestureState.dx);
      const maxSlide = screenWidth * 0.8;
      const clampedDistance = Math.min(swipeDistance, maxSlide);
      
      slideAnimation.setValue(clampedDistance);
      
      console.log(`💳 我的信用卡頁面滑動進度: ${Math.round((clampedDistance / swipeThreshold) * 100)}%`);
    },
    
    onPanResponderRelease: (evt, gestureState) => {
      if (!isSliding) return;
      
      const swipeDistance = gestureState.dx;
      const swipeVelocity = gestureState.vx;
      const shouldReturn = swipeDistance > swipeThreshold || swipeVelocity > 0.5;
      
      if (shouldReturn) {
        console.log('✅ 我的信用卡頁面滑動距離足夠，執行返回動畫');
        Animated.timing(slideAnimation, {
          toValue: screenWidth,
          duration: 180,
          useNativeDriver: true,
        }).start(({ finished }) => {
          if (finished) {
            onBack();
            setTimeout(() => {
              setIsSliding(false);
              slideAnimation.setValue(0);
            }, 100);
          }
        });
      } else {
        console.log('↩️ 我的信用卡頁面滑動距離不足，返回原位');
        Animated.spring(slideAnimation, {
          toValue: 0,
          tension: 150,
          friction: 10,
          useNativeDriver: true,
        }).start(() => {
          setIsSliding(false);
        });
      }
    },
    
    onPanResponderTerminate: (evt, gestureState) => {
      if (isSliding) {
        Animated.spring(slideAnimation, {
          toValue: 0,
          tension: 150,
          friction: 10,
          useNativeDriver: true,
        }).start(() => {
          setIsSliding(false);
        });
      }
    },
  });

  // 🔥 從Firebase載入信用卡資料以獲取分類信息
  const loadFirebaseCards = useCallback(async () => {
    try {
      setIsLoadingFirebase(true);
      console.log('🔥 MyCards: 開始從Firebase載入信用卡資料以獲取分類信息...');
      
      const cards = await creditCardService.getAllCards();
      console.log(`✅ MyCards: Firebase載入成功，共 ${cards.length} 張卡片`);
      
      setFirebaseCards(cards);
    } catch (error) {
      console.error('❌ MyCards: Firebase載入失敗:', error);
      setFirebaseCards([]);
    } finally {
      setIsLoadingFirebase(false);
    }
  }, []);

  // 組件載入時從Firebase載入資料
  useEffect(() => {
    loadFirebaseCards();
  }, [loadFirebaseCards]);

  // 🔥 完全重新設計的模糊匹配邏輯（與ExplorePage完全一致）
  const performFuzzyMatch = useCallback((userCardName, userBankName, dbCard) => {
    if (!userCardName || !dbCard) return false;
    
    const cardName = userCardName.toLowerCase().trim();
    const bankName = userBankName ? userBankName.toLowerCase().trim() : '';
    
    console.log(`🔍 MyCards匹配檢查: 用戶卡片"${userCardName}" (${userBankName}) vs 資料庫卡片"${dbCard.name}" (${dbCard.bank})`);
    
    // 🔥 銀行名稱匹配邏輯，特別處理Other Bank
    let bankMatch = false;
    
    if (bankName) {
      const dbBankLower = dbCard.bank.toLowerCase();
      
      // 1. 處理Other Bank的特殊情況
      if (userBankName === 'Other Bank' || userBankName === 'other' || bankName.includes('other')) {
        console.log('🏦 MyCards: 檢測到Other Bank，使用卡片名稱優先匹配');
        bankMatch = true;
      } else {
        // 2. 直接匹配
        bankMatch = dbBankLower.includes(bankName) || bankName.includes(dbBankLower);
        
        // 3. 完整的香港銀行名稱標準化映射
        const bankNormalizationMap = {
          '恒生銀行': ['hang seng bank', 'hangseng', 'hs', '恒生', 'hang seng'],
          'hang seng bank': ['恒生銀行', 'hangseng', 'hs', '恒生', 'hang seng'],
          'hangseng': ['恒生銀行', 'hang seng bank', 'hs', '恒生', 'hang seng'],
          '中國銀行': ['bank of china', 'boc', '中銀', 'bank of china (hong kong)'],
          'bank of china (hong kong)': ['中國銀行', 'boc', '中銀', 'bank of china'],
          'boc': ['中國銀行', 'bank of china', '中銀', 'bank of china (hong kong)'],
          '滙豐': ['hsbc', 'hongkong shanghai banking', '滙豐銀行'],
          'hsbc': ['滙豐', 'hongkong shanghai banking', '滙豐銀行'],
          '滙豐銀行': ['hsbc', '滙豐', 'hongkong shanghai banking'],
          'dbs': ['星展', '星展銀行', 'dbs bank'],
          'dbs bank': ['星展', '星展銀行', 'dbs'],
          '星展': ['dbs', '星展銀行', 'dbs bank'],
          '星展銀行': ['dbs', '星展', 'dbs bank'],
          'citibank': ['花旗', '花旗銀行', 'citi'],
          'citi': ['花旗', '花旗銀行', 'citibank'],
          '花旗': ['citibank', 'citi', '花旗銀行'],
          '花旗銀行': ['citibank', 'citi', '花旗'],
          'aeon': ['永旺', '永旺銀行', 'aeon bank'],
          'aeon bank': ['永旺', '永旺銀行', 'aeon'],
          '永旺': ['aeon', '永旺銀行', 'aeon bank'],
          '永旺銀行': ['aeon', '永旺', 'aeon bank'],
          'mox': ['mox bank', '虛擬銀行'],
          'mox bank': ['mox', '虛擬銀行'],
          '信銀': ['citic', '中信銀行', '信銀國際'],
          '信銀國際': ['citic', '中信銀行', '信銀'],
          'citic': ['信銀', '信銀國際', '中信銀行'],
          'anx bank': ['安信', 'anx', '安信銀行', '安信信貸'],
          'anx': ['安信', 'anx bank', '安信銀行', '安信信貸'],
          '安信': ['anx bank', 'anx', '安信銀行', '安信信貸'],
          '安信銀行': ['anx bank', 'anx', '安信', '安信信貸'],
          '安信信貸': ['anx bank', 'anx', '安信', '安信銀行'],
          'standard chartered': ['渣打', '渣打銀行', 'scb'],
          'scb': ['渣打', '渣打銀行', 'standard chartered'],
          '渣打': ['standard chartered', 'scb', '渣打銀行'],
          '渣打銀行': ['standard chartered', 'scb', '渣打'],
          'bank of east asia': ['東亞', '東亞銀行', 'bea'],
          'bea': ['東亞', '東亞銀行', 'bank of east asia'],
          '東亞': ['bank of east asia', 'bea', '東亞銀行'],
          '東亞銀行': ['bank of east asia', 'bea', '東亞'],
          'dah sing bank': ['大新', '大新銀行', 'dah sing'],
          'dah sing': ['大新', '大新銀行', 'dah sing bank'],
          '大新': ['dah sing bank', 'dah sing', '大新銀行'],
          '大新銀行': ['dah sing bank', 'dah sing', '大新'],
          'other bank': ['其他銀行', 'other', '其他', 'anx', 'mox', '安信', '虛擬銀行'],
          'other': ['other bank', '其他銀行', '其他', 'anx', 'mox', '安信', '虛擬銀行'],
          '其他銀行': ['other bank', 'other', '其他', 'anx', 'mox', '安信', '虛擬銀行']
        };
        
        // 檢查標準化匹配
        if (!bankMatch) {
          for (const [key, aliases] of Object.entries(bankNormalizationMap)) {
            if ((bankName.includes(key.toLowerCase()) || key.toLowerCase().includes(bankName)) && 
                (dbBankLower.includes(key.toLowerCase()) || aliases.some(alias => dbBankLower.includes(alias.toLowerCase())))) {
              bankMatch = true;
              console.log(`🏦 MyCards: 銀行標準化匹配成功: ${key} -> ${dbCard.bank}`);
              break;
            }
            if (aliases.some(alias => bankName.includes(alias.toLowerCase()) || alias.toLowerCase().includes(bankName)) &&
                (dbBankLower.includes(key.toLowerCase()) || key.toLowerCase().includes(dbBankLower))) {
              bankMatch = true;
              console.log(`🏦 MyCards: 銀行標準化匹配成功(反向): ${key} -> ${dbCard.bank}`);
              break;
            }
          }
        }
      }
    }
    
    // 🔥 卡片名稱匹配邏輯
    let nameMatch = false;
    
    // 1. 檢查名稱變體
    if (dbCard.nameVariations && dbCard.nameVariations.length > 0) {
      nameMatch = dbCard.nameVariations.some(variant => {
        const variantLower = variant.toLowerCase().trim();
        
        if (cardName === variantLower) {
          console.log(`🎯 MyCards: 精確匹配: ${cardName} = ${variantLower}`);
          return true;
        }
        
        if (cardName.includes(variantLower) || variantLower.includes(cardName)) {
          console.log(`📝 MyCards: 包含匹配: ${cardName} ↔ ${variantLower}`);
          return true;
        }
        
        const cardNameCleaned = cardName.replace(/[\s\-\_\.]/g, '');
        const variantCleaned = variantLower.replace(/[\s\-\_\.]/g, '');
        if (cardNameCleaned.includes(variantCleaned) || variantCleaned.includes(cardNameCleaned)) {
          console.log(`🧹 MyCards: 清理後匹配: ${cardNameCleaned} ↔ ${variantCleaned}`);
          return true;
        }
        
        return false;
      });
    }
    
    // 2. 檢查資料庫卡片本身的名稱
    if (!nameMatch) {
      const dbCardNameLower = dbCard.name.toLowerCase().trim();
      nameMatch = cardName.includes(dbCardNameLower) || dbCardNameLower.includes(cardName);
      
      if (!nameMatch) {
        const cardNameCleaned = cardName.replace(/[\s\-\_\.]/g, '');
        const dbNameCleaned = dbCardNameLower.replace(/[\s\-\_\.]/g, '');
        nameMatch = cardNameCleaned.includes(dbNameCleaned) || dbNameCleaned.includes(cardNameCleaned);
      }
    }
    
    // 3. 檢查關鍵字匹配
    let keywordMatch = false;
    if (dbCard.searchKeywords && dbCard.searchKeywords.length > 0) {
      keywordMatch = dbCard.searchKeywords.some(keyword => {
        const keywordLower = keyword.toLowerCase().trim();
        return cardName.includes(keywordLower) || keywordLower.includes(cardName);
      });
    }
    
    // 🔥 最終匹配邏輯
    let finalMatch = false;
    
    if (userBankName === 'Other Bank' || userBankName === 'other') {
      finalMatch = nameMatch || keywordMatch;
      console.log(`🔥 MyCards: Other Bank特殊處理: 名稱匹配(${nameMatch}) OR 關鍵字匹配(${keywordMatch}) = ${finalMatch}`);
    } else {
      finalMatch = bankMatch && (nameMatch || keywordMatch);
      console.log(`🔥 MyCards: 正常匹配: 銀行匹配(${bankMatch}) AND (名稱匹配(${nameMatch}) OR 關鍵字匹配(${keywordMatch})) = ${finalMatch}`);
    }
    
    console.log(`🎯 MyCards: 最終匹配結果: ${finalMatch ? '✅ 成功' : '❌ 失敗'}`);
    
    return finalMatch;
  }, []);

  // 🔥 修正版：獲取用戶卡片的分類信息，使用安全的category處理
  const getCardCategories = useCallback((userCard) => {
    if (isLoadingFirebase || firebaseCards.length === 0) {
      return [];
    }
    
    console.log(`🔍 MyCards: 查找卡片分類 - ${userCard.name} (${userCard.bank})`);
    
    const matchedDbCard = firebaseCards.find(dbCard => 
      performFuzzyMatch(userCard.name, userCard.bank, dbCard)
    );
    
    if (matchedDbCard && matchedDbCard.category) {
      // 🔥 修正：使用安全的category處理函數
      const cardCategories = safeCategoryArray(matchedDbCard.category);
      console.log(`✅ MyCards: 找到匹配卡片及其分類: ${matchedDbCard.name} -> [${cardCategories.join(', ')}]`);
      return cardCategories;
    }
    
    console.log(`❌ MyCards: 未找到匹配的卡片分類`);
    return [];
  }, [firebaseCards, performFuzzyMatch, isLoadingFirebase, safeCategoryArray]);

  // 🔥 點擊分類標籤跳轉到ExplorePage
  const handleCategoryPress = useCallback((categoryId) => {
    console.log(`🔗 MyCards: 點擊分類標籤: ${categoryId}，準備跳轉到ExplorePage`);
    
    // 通過onNavigate傳遞分類信息到ExplorePage
    if (onNavigate) {
      onNavigate('Explore', { selectedCategory: categoryId });
    }
    
    // 震動反饋確認操作
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [onNavigate]);

  // 🔥 修正版：渲染分類標籤，使用安全的category處理
  const renderCategoryTags = useCallback((userCard) => {
    const categories = getCardCategories(userCard);
    
    if (categories.length === 0) {
      return null;
    }
    
    // 只顯示前兩個分類，避免過於擁擠
    const displayCategories = categories.slice(0, 2);
    
    return (
      <View style={styles.categoryTagsContainer}>
        {displayCategories.map((categoryId, index) => {
          const categoryInfo = CATEGORIES.find(cat => cat.id === categoryId);
          if (!categoryInfo) return null;
          
          return (
            <TouchableOpacity
              key={`${categoryId}-${index}`}
              style={[
                styles.categoryTag,
                { backgroundColor: categoryInfo.color + '20', borderColor: categoryInfo.color }
              ]}
              onPress={() => handleCategoryPress(categoryId)}
              activeOpacity={0.7}
            >
              <MaterialIcons 
                name={categoryInfo.icon} 
                size={12} 
                color={categoryInfo.color} 
              />
              <Text style={[styles.categoryTagText, { color: categoryInfo.color }]}>
                {currentLanguage === 'zh-TW' ? categoryInfo.name : categoryInfo.englishName}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }, [getCardCategories, handleCategoryPress, currentLanguage]);

  // 🔥 核心函數：檢查特定月份的付款狀態（與HomePage完全一致）
  const isCardPaidForMonth = (cardId, year, month) => {
    const monthString = `${year}-${String(month + 1).padStart(2, '0')}`;
    const payment = paymentHistory.find(payment => 
      payment.cardId === cardId && 
      payment.month === monthString &&
      payment.onTime !== undefined
    );
    
    console.log(`🔍 MyCards檢查付款狀態: 卡片${cardId}, 月份${monthString}, 結果: ${!!payment}`);
    return !!payment;
  };

  // 🔥 核心邏輯：正確的帳單月份判斷系統（與HomePage完全一致）
  const determineCurrentBillStatus = (card) => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0-11
    const currentDay = today.getDate();
    const dueDay = parseInt(card.dueDay);
    
    console.log(`\n=== MyCards: 分析卡片 ${card.name} 的帳單狀態 ===`);
    console.log(`今天: ${currentYear}-${currentMonth + 1}-${currentDay}`);
    console.log(`到期日: 每月${dueDay}日`);
    
    // 🎯 第一步：檢查當前月份的付款狀態
    const currentMonthPaid = isCardPaidForMonth(card.id, currentYear, currentMonth);
    console.log(`當前月份(${currentMonth + 1}月)付款狀態: ${currentMonthPaid}`);
    
    if (!currentMonthPaid) {
      // 🚨 關鍵邏輯：當前月份未付款，這是我們需要關注的帳單
      console.log(`✨ MyCards邏輯判斷: 當前月份未付款，需要處理當月帳單`);
      
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
      console.log(`✅ MyCards邏輯判斷: 當前月份已付款，檢查下個月帳單`);
      
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

  // 🔥 簡化的付款狀態檢查：檢查當前應該關注的月份是否已付款
  const isCardPaid = (cardId) => {
    const card = creditCards.find(c => c.id === cardId);
    if (!card) return false;

    const billStatus = determineCurrentBillStatus(card);
    console.log(`MyCards整體付款狀態檢查: ${card.name}, 結果: ${billStatus.isPaid}`);
    return billStatus.isPaid;
  };

  // 🔥 重新設計的天數計算邏輯
  const calculateDaysUntilDue = (dueDay, cardId) => {
    const card = creditCards.find(c => c.id === cardId);
    if (!card) return 0;
    
    const billStatus = determineCurrentBillStatus(card);
    
    console.log(`MyCards天數計算: ${card.name}, 天數: ${billStatus.daysDiff}, 原因: ${billStatus.reason}`);
    
    return billStatus.daysDiff;
  };

  // 🔥 重新設計的到期日格式化
  const formatDueDate = (dueDay, cardId) => {
    const card = creditCards.find(c => c.id === cardId);
    if (!card) return '';
    
    const billStatus = determineCurrentBillStatus(card);
    const dueDate = billStatus.dueDate;
    
    if (currentLanguage === 'zh-TW') {
      return `${dueDate.getMonth() + 1}月${dueDate.getDate()}日`;
    } else {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${monthNames[dueDate.getMonth()]} ${dueDate.getDate()}`;
    }
  };

  // 🔥 重新設計的付款月份顯示
  const getPaidMonthDisplay = (cardId) => {
    const card = creditCards.find(c => c.id === cardId);
    if (!card) return '';
    
    const billStatus = determineCurrentBillStatus(card);
    
    if (billStatus.isPaid) {
      if (currentLanguage === 'zh-TW') {
        return `${billStatus.billYear}年${billStatus.billMonth + 1}月`;
      } else {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'];
        return `${monthNames[billStatus.billMonth]} ${billStatus.billYear}`;
      }
    }
    
    return '';
  };

  // 計算統計數據
  const calculateStats = () => {
    const total = creditCards.length;
    const paid = creditCards.filter(card => isCardPaid(card.id)).length;
    const unpaid = total - paid;
    return { total, paid, unpaid };
  };

  // 獲取卡片通知設定
  const getCardNotificationSetting = useCallback((cardId) => {
    const cardSettings = notificationSettings[cardId];
    
    if (cardSettings && cardSettings.enabled === false) {
      return false;
    }
    
    return true;
  }, [notificationSettings]);

  // 通知設定切換邏輯
  const handleToggleNotification = useCallback((cardId, enabled) => {
    console.log(`🔔 通知切換: 卡片 ${cardId}, 新狀態: ${enabled}`);
    
    if (onUpdateNotificationSettings) {
      const existingSettings = notificationSettings[cardId] || {};
      const newSettings = {
        ...existingSettings,
        enabled: enabled,
        updatedAt: Date.now()
      };
      
      onUpdateNotificationSettings(cardId, newSettings);
    }
  }, [onUpdateNotificationSettings, notificationSettings]);

  // 🔥 重新設計的付款切換邏輯
  const handleTogglePayment = (cardId) => {
    const isPaid = isCardPaid(cardId);
    const card = creditCards.find(c => c.id === cardId);
    
    if (!card) {
      console.error('找不到指定的信用卡:', cardId);
      return;
    }
    
    console.log('\n=== MyCards付款切換操作 ===');
    console.log(`卡片: ${card.name} (${cardId})`);
    console.log(`當前狀態: ${isPaid ? '已付款' : '未付款'}`);
    console.log(`操作: ${isPaid ? '標記為未付款' : '標記為已付款'}`);
    
    if (!isPaid) {
      // 標記為已付款
      if (onMarkPayment) {
        console.log('✅ 調用 onMarkPayment 標記已付款');
        onMarkPayment(cardId);
      }
    } else {
      // 移除付款記錄
      const billStatus = determineCurrentBillStatus(card);
      
      console.log('❌ 調用 onMarkPayment 移除付款記錄:', {
        cardId: cardId,
        paymentMonth: billStatus.billMonthString,
        billInfo: billStatus
      });
      
      if (onMarkPayment) {
        onMarkPayment(cardId, { removePayment: true, month: billStatus.billMonthString });
      }
    }
  };

  // 編輯卡片功能
  const handleEditCard = (card) => {
    setEditingCard(card);
    setEditCardName(card.name);
    setEditCardNumber(card.number || '');
    setEditModalVisible(true);
  };

  const handleSaveEdit = () => {
    if (!editingCard || !editCardName.trim()) {
      Alert.alert(
        getText('myCards.error') || '錯誤',
        getText('myCards.cardNameRequired') || '卡片名稱不能為空'
      );
      return;
    }

    if (onUpdateCard) {
      const updatedCard = {
        ...editingCard,
        name: editCardName.trim(),
        number: editCardNumber.trim()
      };
      
      onUpdateCard(updatedCard.id, updatedCard);
      
      setEditModalVisible(false);
      setEditingCard(null);
      setEditCardName('');
      setEditCardNumber('');
      
      console.log(`卡片 ${editingCard.name} 已更新為 ${editCardName}`);
    }
  };

  const handleCancelEdit = () => {
    setEditModalVisible(false);
    setEditingCard(null);
    setEditCardName('');
    setEditCardNumber('');
  };

  // 通知選項處理
  const handleNotificationOptionSelect = (enabled) => {
    if (selectedCardForNotification) {
      handleToggleNotification(selectedCardForNotification.id, enabled);
      setNotificationModalVisible(false);
      setSelectedCardForNotification(null);
      
      // 震動反馈確認操作完成
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleCloseNotificationModal = () => {
    setNotificationModalVisible(false);
    setSelectedCardForNotification(null);
  };

  // 滑動刪除處理邏輯
  const handleSwipeDelete = (card) => {
    const hasPaymentHistory = paymentHistory.some(payment => payment.cardId === card.id);
    
    const warningMessage = hasPaymentHistory ? 
      `${getText('myCards.confirmDeleteWithHistory') || '此操作將同時刪除相關的付款歷史記錄。'}\n\n${getText('myCards.confirmDelete') || '確定要刪除'} ${card.name}?` :
      `${getText('myCards.confirmDelete') || '確定要刪除'} ${card.name}?`;

    Alert.alert(
      getText('myCards.deleteCard') || '刪除信用卡',
      warningMessage,
      [
        { 
          text: getText('common.cancel') || '取消', 
          style: 'cancel' 
        },
        {
          text: getText('myCards.delete') || '刪除',
          style: 'destructive',
          onPress: () => {
            if (onDeleteCard) {
              onDeleteCard(card.id);
              console.log(`${card.name} 已成功刪除`);
            }
          }
        }
      ]
    );
  };

  // 獲取卡片狀態的視覺指示器
  const getCardStatusIndicator = (cardId) => {
    const isPaid = isCardPaid(cardId);
    const notificationEnabled = getCardNotificationSetting(cardId);
    
    if (isPaid) {
      return {
        color: '#4CAF50',
        icon: 'check-circle',
        label: getText('myCards.paidThisMonth') || '本月已還款',
        borderColor: '#4CAF50'
      };
    } else if (!notificationEnabled) {
      return {
        color: '#FF9800',
        icon: 'notifications-off',
        label: getText('myCards.notificationDisabled') || '通知已關閉',
        borderColor: '#FF9800'
      };
    } else {
      return {
        color: '#F44336',
        icon: 'schedule',
        label: getText('myCards.paymentPending') || '等待還款',
        borderColor: '#F44336'
      };
    }
  };

  // 🔥 重新設計的排序邏輯：基於正確的帳單狀態進行排序
  const sortCardsByUrgency = (cards) => {
    return [...cards].sort((cardA, cardB) => {
      const billStatusA = determineCurrentBillStatus(cardA);
      const billStatusB = determineCurrentBillStatus(cardB);
      
      const isPaidA = billStatusA.isPaid;
      const isPaidB = billStatusB.isPaid;
      
      const daysLeftA = billStatusA.daysDiff;
      const daysLeftB = billStatusB.daysDiff;
      
      const isOverdueA = daysLeftA < 0;
      const isOverdueB = daysLeftB < 0;
      
      console.log(`排序比較: ${cardA.name}(${daysLeftA}天, 已付款: ${isPaidA}) vs ${cardB.name}(${daysLeftB}天, 已付款: ${isPaidB})`);
      
      // 已付款的排在後面
      if (isPaidA && !isPaidB) return 1;
      if (!isPaidA && isPaidB) return -1;
      
      // 兩張都未付款時的排序邏輯
      if (!isPaidA && !isPaidB) {
        // 逾期的優先顯示
        if (isOverdueA && !isOverdueB) return -1;
        if (!isOverdueA && isOverdueB) return 1;
        
        // 如果都是逾期，逾期時間越長越優先
        if (isOverdueA && isOverdueB) {
          return daysLeftA - daysLeftB; // 負數越小（絕對值越大）越優先
        }
        
        // 如果都不是逾期，距離到期越近越優先
        return daysLeftA - daysLeftB;
      }
      
      // 兩張都已付款時，按距離下次到期時間排序
      return daysLeftA - daysLeftB;
    });
  };

  const stats = useMemo(() => calculateStats(), [creditCards, paymentHistory]);

  // 🔥 修復版本：雙向滑動卡片組件，解決兩個核心問題
  const DualSwipeCardItem = React.memo(({ card, index, categoryPrefix }) => {
    const isPaid = isCardPaid(card.id);
    const daysLeft = calculateDaysUntilDue(card.dueDay, card.id);
    const dueDate = formatDueDate(card.dueDay, card.id);
    const statusIndicator = getCardStatusIndicator(card.id);
    const notificationEnabled = getCardNotificationSetting(card.id);

    // 雙向滑動的獨立狀態
    const [translateX] = useState(new Animated.Value(0));
    const [swipeDirection, setSwipeDirection] = useState('none');
    const [isActivelyDragging, setIsActivelyDragging] = useState(false);
    
    // 🔥 修復二：右滑通知按鈕的顯示狀態（不直接觸發模態框）
    const [showNotificationButton, setShowNotificationButton] = useState(false);
    
    const cardPanResponder = PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        const hasMinimalMovement = Math.abs(gestureState.dx) > 0.3;
        if (hasMinimalMovement) {
          console.log('🎯 雙向滑動手勢識別成功', {
            dx: gestureState.dx,
            threshold: 0.3
          });
          return true;
        }
        return false;
      },
      
      onPanResponderGrant: (evt) => {
        setIsActivelyDragging(true);
        setSwipeDirection('none');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        console.log('🤏 雙向滑動開始');
      },
      
      onPanResponderMove: (evt, gestureState) => {
        if (!isActivelyDragging) return;
        
        const currentX = gestureState.dx;
        const swipeDistance = Math.abs(currentX);
        
        if (swipeDirection === 'none') {
          if (currentX < -0.5) {
            setSwipeDirection('left');
            console.log('🔒 方向鎖定：向左（編輯/刪除）');
          } else if (currentX > 0.5) {
            setSwipeDirection('right');
            console.log('🔒 方向鎖定：向右（通知管理）');
          }
        }
        
        if (currentX < 0) {
          const maxLeftSwipe = 200;
          const clampedDistance = Math.min(swipeDistance, maxLeftSwipe);
          translateX.setValue(-clampedDistance);
          
          if (swipeDistance >= 4 && swipeDistance <= 6) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            console.log('✏️ 左滑觸發閾值達成', { distance: swipeDistance });
          }
        } else if (currentX > 0) {
          const maxRightSwipe = 120;
          const clampedDistance = Math.min(swipeDistance, maxRightSwipe);
          translateX.setValue(clampedDistance);
          
          if (swipeDistance >= 4 && swipeDistance <= 6) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            console.log('🔔 右滑觸發閾值達成', { distance: swipeDistance });
          }
        }
      },
      
      onPanResponderRelease: (evt, gestureState) => {
        const swipeDistance = Math.abs(gestureState.dx);
        const swipeVelocity = Math.abs(gestureState.vx);
        
        console.log('👋 雙向滑動結束', {
          distance: swipeDistance,
          velocity: swipeVelocity,
          direction: swipeDirection,
          finalX: gestureState.dx
        });
        
        if (gestureState.dx < 0) {
          // 左滑邏輯保持不變
          if (swipeDistance > 40 || (swipeDistance > 20 && swipeVelocity > 0.2)) {
            snapToLeftStage(2);
          } else if (swipeDistance > 20) {
            snapToLeftStage(1);
          } else {
            snapToStage(0);
          }
        } else if (gestureState.dx > 0) {
          // 🔥 修復：右滑只顯示按鈕，不直接觸發模態框
          if (swipeDistance > 4) {
            snapToRightStage(1);
            setShowNotificationButton(true); // 顯示通知按鈕
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            console.log('🔔 右滑通知按鈕顯示！');
            
            // 3秒後自動隱藏按鈕（如果用戶沒有操作）
            setTimeout(() => {
              setShowNotificationButton(false);
              snapToStage(0);
            }, 3000);
          } else {
            snapToStage(0);
          }
        } else {
          snapToStage(0);
        }
        
        setIsActivelyDragging(false);
        setSwipeDirection('none');
      },
      
      onPanResponderTerminate: () => {
        console.log('🛑 雙向滑動被中斷');
        setIsActivelyDragging(false);
        setSwipeDirection('none');
        setShowNotificationButton(false);
        snapToStage(0);
      },
    });
    
    const snapToStage = (stage) => {
      Animated.spring(translateX, {
        toValue: 0,
        tension: 140,
        friction: 10,
        useNativeDriver: false,
      }).start();
      console.log(`🎯 回到原位：${stage}`);
    };
    
    const snapToLeftStage = (stage) => {
      let targetX = 0;
      
      switch (stage) {
        case 1:
          targetX = -60;
          break;
        case 2:
          targetX = -120;
          break;
        default:
          targetX = 0;
      }
      
      Animated.spring(translateX, {
        toValue: targetX,
        tension: 140,
        friction: 10,
        useNativeDriver: false,
      }).start();
      
      console.log(`🎯 左滑階段切換：${stage}`, { targetX });
    };
    
    const snapToRightStage = (stage) => {
      if (stage === 1) {
        Animated.spring(translateX, {
          toValue: 80,
          tension: 140,
          friction: 10,
          useNativeDriver: false,
        }).start();
        
        console.log('🔔 右滑通知階段：顯示按鈕等待點擊');
      }
    };

    // 🔥 修復：點擊通知按鈕才觸發模態框
    const handleNotificationButtonPress = () => {
      console.log('🔔 用戶點擊通知按鈕，顯示選項模態框');
      setSelectedCardForNotification(card);
      setNotificationModalVisible(true);
      setShowNotificationButton(false);
      
      // 回到原位
      snapToStage(0);
      
      // 震動反饋
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    };

    const handleEditPress = () => {
      handleEditCard(card);
      snapToStage(0);
    };

    const handleDeletePress = () => {
      handleSwipeDelete(card);
      snapToStage(0);
    };

    return (
      <View style={styles.swipeContainer}>
        {/* 左側背景：編輯和刪除按鈕 */}
        <Animated.View 
          style={[
            styles.leftActionBackground,
            {
              opacity: translateX.interpolate({
                inputRange: [-120, -20, 0, 120],
                outputRange: [1, 0.3, 0, 0],
                extrapolate: 'clamp',
              }),
            }
          ]}
        >
          <TouchableOpacity 
            style={[styles.actionButton, styles.editButton]}
            onPress={handleEditPress}
            activeOpacity={0.7}
          >
            <MaterialIcons name="edit" size={22} color="#FFFFFF" />
            <Text style={styles.actionText}>
              {getText('myCards.edit') || '編輯'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteButton]}
            onPress={handleDeletePress}
            activeOpacity={0.7}
          >
            <MaterialIcons name="delete" size={22} color="#FFFFFF" />
            <Text style={styles.actionText}>
              {getText('myCards.swipeToDelete') || '刪除'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
        
        {/* 右側背景通知管理按鈕 */}
        <Animated.View 
          style={[
            styles.rightActionBackground,
            {
              opacity: translateX.interpolate({
                inputRange: [-120, 0, 4, 120],
                outputRange: [0, 0, 0.3, 1],
                extrapolate: 'clamp',
              }),
            }
          ]}
        >
          {/* 🔥 修復：可點擊的通知按鈕 */}
          <TouchableOpacity 
            style={styles.notificationActionButton}
            onPress={handleNotificationButtonPress}
            activeOpacity={0.8}
          >
            <MaterialIcons 
              name={notificationEnabled ? "notifications" : "notifications-off"} 
              size={28} 
              color="#FFFFFF" 
            />
            <Text style={styles.notificationActionText}>
              {getText('myCards.notifications') || '通知'}
            </Text>
            {/* 🔥 修復：添加點擊提示箭頭 */}
            <MaterialIcons 
              name="touch-app" 
              size={16} 
              color="#FFFFFF" 
              style={{ marginTop: 2, opacity: 0.8 }}
            />
          </TouchableOpacity>
        </Animated.View>
        
        {/* 卡片主體 */}
        <Animated.View
          style={[
            styles.cardSwipeWrapper,
            {
              transform: [{ translateX }],
            }
          ]}
          {...cardPanResponder.panHandlers}
        >
          <View style={[styles.cardItem, { borderLeftColor: statusIndicator.borderColor }]}>
            <View style={styles.cardContent}>
              <View style={styles.topIconsContainer}>
                <MaterialIcons 
                  name={statusIndicator.icon} 
                  size={16} 
                  color={statusIndicator.color} 
                />
                {/* 🔥 在右上角顯示分類標籤 */}
                <View style={styles.topRightContainer}>
                  {renderCategoryTags(card)}
                </View>
              </View>

              <View style={styles.cardLeft}>
                <Text style={styles.cardName}>
                  {card.name} ({card.number ? card.number.slice(-4) : '****'})
                </Text>
                <Text style={styles.bankName}>{card.bank}</Text>
                <Text style={styles.dueDate}>{getText('myCards.due') || '到期日'}: {dueDate}</Text>

                {/* 🔥 修復一：只有未付款的卡片才顯示天數倒計時 */}
                {!isPaid && (
                  <Text style={[
                    styles.daysLeft,
                    daysLeft <= 3 && daysLeft >= 0 && styles.daysLeftUrgent,
                    daysLeft < 0 && styles.daysLeftOverdue
                  ]}>
                    {daysLeft > 0 ? 
                      (currentLanguage === 'zh-TW' ? 
                        `${getText('myCards.remaining') || '剩餘'}${daysLeft}天` : 
                        `${daysLeft} ${getText('myCards.remaining') || 'days left'}`
                      ) : 
                     daysLeft === 0 ? getText('myCards.dueToday') || '今日到期' : 
                      (currentLanguage === 'zh-TW' ?
                        `${getText('myCards.overdue') || '逾期'}${Math.abs(daysLeft)}天` :
                        `${Math.abs(daysLeft)} ${getText('myCards.overdue') || 'days overdue'}`
                      )}
                  </Text>
                )}

                {/* 🔥 已付款狀態的專用顯示信息 */}
                {isPaid && (
                  <Text style={styles.paidMonthInfo}>
                    {currentLanguage === 'zh-TW' 
                      ? `已還款月份：${getPaidMonthDisplay(card.id)}` 
                      : `Paid for: ${getPaidMonthDisplay(card.id)}`}
                  </Text>
                )}
              </View>

              <View style={styles.cardRight}>
                <TouchableOpacity
                  style={[
                    styles.paymentButton,
                    isPaid && styles.paidButton
                  ]}
                  onPress={() => handleTogglePayment(card.id)}
                  activeOpacity={0.7}
                >
                  <MaterialIcons 
                    name={isPaid ? 'check-circle' : 'radio-button-unchecked'} 
                    size={16} 
                    color={isPaid ? '#4CAF50' : '#666666'} 
                    style={styles.paymentIcon}
                  />
                  <Text style={[
                    styles.paymentButtonText,
                    isPaid && styles.paidButtonText
                  ]}>
                    {isPaid ? getText('myCards.paid') || '已還款' : getText('myCards.unpaid') || '未還款'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Animated.View>
      </View>
    );
  }, (prevProps, nextProps) => {
    return (
      prevProps.card.id === nextProps.card.id &&
      prevProps.card.name === nextProps.card.name &&
      prevProps.card.bank === nextProps.card.bank &&
      prevProps.card.dueDay === nextProps.card.dueDay &&
      prevProps.index === nextProps.index &&
      prevProps.categoryPrefix === nextProps.categoryPrefix
    );
  });

  return (
    <View style={styles.rootContainer} {...panResponder.panHandlers}>
      {/* 背景層：完整的 Home Page 渲染 */}
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
      
      {/* 前景層：當前頁面內容，支持滑動動畫 */}
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
            
            <View style={styles.titleSection}>
              <Text style={styles.title}>{getText('myCards.title') || '我的信用卡'}</Text>
              <Text style={styles.subtitle}>
                {getText('myCards.totalCards') || '總卡片'}: {stats.total} | {getText('myCards.paidCards') || '已還款'}: {stats.paid} | {getText('myCards.unpaidCards') || '未還款'}: {stats.unpaid}
              </Text>
            </View>
            
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => onNavigate('AddCard')}
              activeOpacity={0.7}
            >
              <MaterialIcons name="add" size={24} color="#000000" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.cardsContainer}>
             {creditCards.length === 0 ? (
                <View style={styles.emptyState}>
                  <MaterialIcons name="credit-card" size={64} color="#E0E0E0" />
                  <Text style={styles.emptyTitle}>{getText('myCards.noCreditCards') || '尚未添加信用卡'}</Text>
                  <Text style={styles.emptySubtitle}>
                    {getText('myCards.addFirstCard') || '添加您的第一張信用卡開始管理還款提醒'}
                  </Text>
                  <TouchableOpacity 
                    style={styles.emptyButton}
                    onPress={() => onNavigate('AddCard')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.emptyButtonText}>{getText('myCards.addCard') || '添加信用卡'}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View>
                  {/* 排序標籤 */}
                  <View style={styles.sortingHeader}>
                    <Text style={styles.sortingText}>
                      {getText('myCards.sortedBy') || 'SORTED BY'}: <Text style={styles.sortingHighlight}>{getText('myCards.dueDate') || 'DUE DATE'}</Text>
                    </Text>
                   <Text style={styles.swipeHint}>
                    {getText('myCards.swipeHint') || '向左滑動可編輯或刪除卡片'} | {getText('myCards.swipeRightHint') || '向右滑動顯示通知按鈕，再點擊設定'}
                    </Text>
                  </View>

                  {/* 🔥 重新設計的卡片分類系統 */}
                  {(() => {
                    const sortedCards = sortCardsByUrgency(creditCards);
                    const unpaidCards = sortedCards.filter(card => !isCardPaid(card.id));
                    const paidCards = sortedCards.filter(card => isCardPaid(card.id));
                    
                    console.log(`\n=== MyCards卡片分類結果 ===`);
                    console.log(`未付款卡片: ${unpaidCards.map(c => c.name).join(', ')}`);
                    console.log(`已付款卡片: ${paidCards.map(c => c.name).join(', ')}`);
                    
                    return (
                      <View>
                        {/* 未付款分類 */}
                        {unpaidCards.length > 0 && (
                          <View style={styles.categorySection}>
                            <Text style={styles.categoryTitle}>Not yet paid</Text>
                            {unpaidCards.map((card, index) => (
                              <DualSwipeCardItem
                                key={`unpaid-${card.id}`}
                                card={card}
                                index={index}
                                categoryPrefix="unpaid"
                              />
                            ))}
                          </View>
                        )}

                        {/* 已付款分類 */}
                        {paidCards.length > 0 && (
                          <View style={styles.categorySection}>
                            <Text style={styles.categoryTitle}>Already paid</Text>
                            {paidCards.map((card, index) => (
                              <DualSwipeCardItem
                                key={`paid-${card.id}`}
                                card={card}
                                index={index}
                                categoryPrefix="paid"
                              />
                            ))}
                          </View>
                        )}
                      </View>
                    );
                  })()}
                </View>
              )}
            </View>
          </ScrollView>

          {/* 編輯模態框 */}
          <Modal
            visible={editModalVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={handleCancelEdit}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {getText('myCards.editCard') || '編輯信用卡'}
                  </Text>
                  <TouchableOpacity 
                    style={styles.modalCloseButton}
                    onPress={handleCancelEdit}
                    activeOpacity={0.7}
                  >
                    <MaterialIcons name="close" size={24} color="#666666" />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalBody}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>
                      {getText('myCards.cardName') || '卡片名稱'} *
                    </Text>
                    <TextInput
                      style={styles.textInput}
                      value={editCardName}
                      onChangeText={setEditCardName}
                      placeholder={getText('myCards.enterCardName') || '請輸入卡片名稱'}
                      maxLength={50}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>
                      {getText('myCards.cardNumber') || '卡片號碼（後四位）'}
                    </Text>
                    <TextInput
                      style={styles.textInput}
                      value={editCardNumber}
                      onChangeText={setEditCardNumber}
                      placeholder={getText('myCards.enterCardNumber') || '請輸入卡片號碼後四位'}
                      maxLength={4}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <View style={styles.modalFooter}>
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={handleCancelEdit}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.cancelButtonText}>
                      {getText('common.cancel') || '取消'}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.saveButton]}
                    onPress={handleSaveEdit}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.saveButtonText}>
                      {getText('common.save') || '保存'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* 通知選項模態框（Apple風格） */}
          <Modal
            visible={notificationModalVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={handleCloseNotificationModal}
          >
            <TouchableOpacity 
              style={styles.notificationModalOverlay}
              onPress={handleCloseNotificationModal}
              activeOpacity={1}
            >
              <View style={styles.notificationModalContent}>
                <View style={styles.notificationModalHeader}>
                  <Text style={styles.notificationModalTitle}>
                    {getText('myCards.notificationSettingsFor') || '通知設定'}
                  </Text>
                  <Text style={styles.notificationModalSubtitle}>
                    {selectedCardForNotification ? selectedCardForNotification.name : ''}
                  </Text>
                </View>
                
                <View style={styles.notificationOptions}>
                  <TouchableOpacity 
                    style={styles.notificationOption}
                    onPress={() => handleNotificationOptionSelect(true)}
                    activeOpacity={0.7}
                  >
                    <MaterialIcons name="notifications" size={24} color="#4CAF50" />
                    <Text style={styles.notificationOptionText}>
                      {getText('myCards.turnOnNotifications') || '開啟'}
                    </Text>
                    <MaterialIcons name="chevron-right" size={20} color="#CCCCCC" />
                  </TouchableOpacity>
                  
                  <View style={styles.notificationOptionDivider} />
                  
                  <TouchableOpacity 
                    style={styles.notificationOption}
                    onPress={() => handleNotificationOptionSelect(false)}
                    activeOpacity={0.7}
                  >
                    <MaterialIcons name="notifications-off" size={24} color="#FF9800" />
                    <Text style={styles.notificationOptionText}>
                      {getText('myCards.turnOffNotifications') || '關閉'}
                    </Text>
                    <MaterialIcons name="chevron-right" size={20} color="#CCCCCC" />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          </Modal>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: { flex: 1, backgroundColor: '#F5F5F5' },
  backgroundLayer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#F5F5F5' },
  foregroundLayer: { flex: 1, backgroundColor: '#F5F5F5', shadowColor: '#000', shadowOffset: { width: -2, height: 0 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 8 },
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E0E0E0', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 2 },
  backButton: { padding: 8, marginRight: 8 },
  titleSection: { flex: 1 },
  title: { fontSize: 20, fontWeight: '600', color: '#000000' },
  subtitle: { fontSize: 12, color: '#666666', marginTop: 2 },
  addButton: { padding: 8, marginLeft: 8 },
  scrollView: { flex: 1 },
  cardsContainer: { padding: 16 },
  swipeContainer: { position: 'relative', marginBottom: 12 },
  leftActionBackground: { position: 'absolute', top: 0, right: 0, bottom: 0, width: 120, flexDirection: 'row', zIndex: 0 },
  rightActionBackground: { position: 'absolute', top: 0, left: 0, bottom: 0, width: 140, backgroundColor: '#FFC107', justifyContent: 'center', alignItems: 'center', borderTopLeftRadius: 12, borderBottomLeftRadius: 12, zIndex: 0 },
  notificationActionButton: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20, minWidth: 80 },
  notificationActionText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600', marginTop: 4, textAlign: 'center' },
  actionButton: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 8 },
  editButton: { backgroundColor: '#2196F3', borderTopRightRadius: 0, borderBottomRightRadius: 0 },
  deleteButton: { backgroundColor: '#F44336', borderTopRightRadius: 12, borderBottomRightRadius: 12 },
  actionText: { color: '#FFFFFF', fontSize: 10, fontWeight: '600', marginTop: 2, textAlign: 'center' },
  cardSwipeWrapper: { zIndex: 1 },
  cardItem: { backgroundColor: '#FFFFFF', borderRadius: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, borderLeftWidth: 4 },
  cardContent: { flexDirection: 'row', padding: 16, position: 'relative', paddingTop: 24 },
  topIconsContainer: { position: 'absolute', top: 8, left: 8, flexDirection: 'row', alignItems: 'center', zIndex: 1, width: '100%', justifyContent: 'space-between', paddingRight: 16 },
  // 🔥 右上角分類標籤容器
  topRightContainer: { 
    position: 'absolute', 
    top: 0, 
    right: 0,
    flexDirection: 'row',
    alignItems: 'center'
  },
  categoryTagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  categoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    gap: 2,
  },
  categoryTagText: {
    fontSize: 10,
    fontWeight: '600',
  },
  cardLeft: { flex: 1, paddingTop: 8 },
  cardName: { fontSize: 18, fontWeight: '600', color: '#000000', marginBottom: 4 },
  bankName: { fontSize: 14, color: '#666666', marginBottom: 8 },
  dueDate: { fontSize: 14, color: '#333333', marginBottom: 4 },
  paidMonthInfo: { fontSize: 12, color: '#4CAF50', fontWeight: '600', marginBottom: 4, backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start' },
  daysLeft: { fontSize: 14, color: '#666666', fontWeight: '500', marginBottom: 4 },
  daysLeftUrgent: { color: '#FF9800' },
  daysLeftOverdue: { color: '#F44336' },
  cardRight: { justifyContent: 'flex-end', alignItems: 'flex-end' },
  paymentButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#E0E0E0', flexDirection: 'row', alignItems: 'center' },
  paidButton: { backgroundColor: '#E8F5E9', borderColor: '#4CAF50' },
  paymentIcon: { marginRight: 4 },
  paymentButtonText: { fontSize: 14, fontWeight: '500', color: '#666666' },
  paidButtonText: { color: '#4CAF50' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: '#333333', marginTop: 16, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#666666', textAlign: 'center', marginBottom: 24 },
  emptyButton: { backgroundColor: '#000000', paddingHorizontal: 32, paddingVertical: 12, borderRadius: 24 },
  emptyButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '500' },
  sortingHeader: { marginBottom: 20, paddingHorizontal: 4 },
  sortingText: { fontSize: 12, color: '#666666', fontWeight: '500', letterSpacing: 0.5 },
  sortingHighlight: { color: '#333333', fontWeight: '700' },
  swipeHint: { fontSize: 10, color: '#999999', fontStyle: 'italic', marginTop: 4 },
  categorySection: { marginBottom: 30 },
  categoryTitle: { fontSize: 16, fontWeight: '600', color: '#333333', marginBottom: 12, paddingHorizontal: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFFFFF', borderRadius: 16, width: '100%', maxWidth: 400, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  modalTitle: { fontSize: 18, fontWeight: '600', color: '#000000' },
  modalCloseButton: { padding: 4 },
  modalBody: { padding: 20 },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 14, fontWeight: '500', color: '#333333', marginBottom: 8 },
  textInput: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, color: '#000000', backgroundColor: '#FAFAFA' },
  modalFooter: { flexDirection: 'row', padding: 20, paddingTop: 0, gap: 12 },
  modalButton: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  cancelButton: { backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#E0E0E0' },
  saveButton: { backgroundColor: '#000000' },
  cancelButtonText: { fontSize: 16, fontWeight: '500', color: '#666666' },
  saveButtonText: { fontSize: 16, fontWeight: '500', color: '#FFFFFF' },
  notificationModalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  notificationModalContent: { backgroundColor: '#FFFFFF', borderRadius: 16, width: '90%', maxWidth: 320, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  notificationModalHeader: { padding: 20, paddingBottom: 16, alignItems: 'center' },
  notificationModalTitle: { fontSize: 18, fontWeight: '600', color: '#000000', marginBottom: 4 },
  notificationModalSubtitle: { fontSize: 14, color: '#666666', textAlign: 'center' },
  notificationOptions: { paddingHorizontal: 16, paddingBottom: 20 },
  notificationOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 12 },
  notificationOptionText: { flex: 1, fontSize: 16, color: '#000000', marginLeft: 12 },
  notificationOptionDivider: { height: 1, backgroundColor: '#E0E0E0', marginHorizontal: 12 },
});