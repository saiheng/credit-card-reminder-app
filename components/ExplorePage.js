// components/ExplorePage.js - 🔥 完整修正版：進階篩選器重新設計 + 信用卡比較功能
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
  Dimensions,
  PanResponder,
  Animated,
  Modal,
  FlatList
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import HomePage from './HomePage';
import { creditCardService } from '../firebase';

const { width } = Dimensions.get('window');

// 🔥 修正版分類配置 - 確保與資料庫完全匹配
const CATEGORIES = [
  { id: 'my_cards', name: '我的信用卡', icon: 'credit-card', englishName: 'My Cards' },
  { id: 'all', name: '全部', icon: 'apps', englishName: 'All' },
  { id: '基本回贈', name: '基本回贈', icon: 'account-balance-wallet', englishName: 'Basic Cashback' },
  { id: '外幣', name: '旅遊外幣', icon: 'flight-takeoff', englishName: 'Travel & Foreign Currency' },
  { id: '手機支付', name: '流動支付', icon: 'smartphone', englishName: 'Mobile Payment' },
  { id: '網上購物', name: '網購', icon: 'shopping-cart', englishName: 'Online Shopping' },
  { id: '超市購物', name: '超市', icon: 'local-grocery-store', englishName: 'Supermarket' },
  { id: '餐飲美食', name: '餐飲', icon: 'restaurant', englishName: 'Dining' },
  { id: '青年學生', name: '學生', icon: 'school', englishName: 'Student' },
  { id: '里數', name: '里數', icon: 'flight', englishName: 'Miles' }
];

// 🔥 新增：分類篩選器專用的分類列表（包含我的卡片和英文支持）
const FILTER_CATEGORIES = [
  { id: 'my_cards', name: '我的信用卡', englishName: 'My Cards', icon: 'credit-card' },
  { id: '基本回贈', name: '基本回贈', englishName: 'Basic Cashback', icon: 'account-balance-wallet' },
  { id: '外幣', name: '旅遊外幣', englishName: 'Travel & Foreign Currency', icon: 'flight-takeoff' },
  { id: '手機支付', name: '流動支付', englishName: 'Mobile Payment', icon: 'smartphone' },
  { id: '網上購物', name: '網購', englishName: 'Online Shopping', icon: 'shopping-cart' },
  { id: '超市購物', name: '超市', englishName: 'Supermarket', icon: 'local-grocery-store' },
  { id: '餐飲美食', name: '餐飲', englishName: 'Dining', icon: 'restaurant' },
  { id: '青年學生', name: '學生', englishName: 'Student', icon: 'school' },
  { id: '里數', name: '里數', englishName: 'Miles', icon: 'flight' }
];

// 🔥 新增：銀行名稱中英文對照表
const BANK_TRANSLATIONS = {
  'HSBC': { zh: 'HSBC', en: 'HSBC' },
  '恒生銀行': { zh: '恒生銀行', en: 'Hang Seng Bank' },
  'Hang Seng Bank': { zh: '恒生銀行', en: 'Hang Seng Bank' },
  'DBS Bank': { zh: '星展銀行', en: 'DBS Bank' },
  '星展銀行': { zh: '星展銀行', en: 'DBS Bank' },
  'Citibank': { zh: '花旗銀行', en: 'Citibank' },
  '花旗銀行': { zh: '花旗銀行', en: 'Citibank' },
  'Standard Chartered': { zh: '渣打銀行', en: 'Standard Chartered' },
  '渣打銀行': { zh: '渣打銀行', en: 'Standard Chartered' },
  'Bank of China (Hong Kong)': { zh: '中國銀行（香港）', en: 'Bank of China (Hong Kong)' },
  '中國銀行（香港）': { zh: '中國銀行（香港）', en: 'Bank of China (Hong Kong)' },
  'Bank of East Asia': { zh: '東亞銀行', en: 'Bank of East Asia' },
  '東亞銀行': { zh: '東亞銀行', en: 'Bank of East Asia' },
  'AEON': { zh: 'AEON', en: 'AEON' },
  'ICBC (Asia)': { zh: '工銀亞洲', en: 'ICBC (Asia)' },
  '工銀亞洲': { zh: '工銀亞洲', en: 'ICBC (Asia)' },
  'China Construction Bank (Asia)': { zh: '建設銀行（亞洲）', en: 'China Construction Bank (Asia)' },
  '建設銀行（亞洲）': { zh: '建設銀行（亞洲）', en: 'China Construction Bank (Asia)' },
  'Dah Sing Bank': { zh: '大新銀行', en: 'Dah Sing Bank' },
  '大新銀行': { zh: '大新銀行', en: 'Dah Sing Bank' },
  'CITIC Bank International': { zh: '中信銀行國際', en: 'CITIC Bank International' },
  '中信銀行國際': { zh: '中信銀行國際', en: 'CITIC Bank International' },
  'ANX Bank': { zh: 'ANX銀行', en: 'ANX Bank' },
  'ANX銀行': { zh: 'ANX銀行', en: 'ANX Bank' },
  'MOX Bank': { zh: 'MOX Bank', en: 'MOX Bank' },
  'Other Bank': { zh: '其他銀行', en: 'Other Bank' },
  '其他銀行': { zh: '其他銀行', en: 'Other Bank' }
};

export default function ExplorePage({ 
  creditCards = [],
  onBack,
  onNavigate,
  getText,
  currentLanguage = 'zh-TW',
  userData = { name: 'User', avatar: null, email: '' },
  paymentHistory = [],
  notificationSettings = {},
  onUpdateCard,
  onDeleteCard,
  onMarkPayment,
  onUpdateNotificationSettings,
  favoriteCards = [],
  onToggleFavorite
}) {
  // 基礎狀態
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // 🔥 重新設計的進階篩選狀態 - 支援多選，新增分類篩選
  const [advancedFilter, setAdvancedFilter] = useState({
    banks: [], // 改為陣列支援多選
    annualFees: [], // 改為陣列支援多選
    categories: [] // 🔥 新增：分類篩選器
  });
  
  // 🔥 進階篩選器Modal狀態
  const [showAdvancedFilterModal, setShowAdvancedFilterModal] = useState(false);
  const [filterModalType, setFilterModalType] = useState(null); // 'banks' 或 'annualFees' 或 'categories'
  
  // 🔥 新增：比較功能狀態
  const [compareMode, setCompareMode] = useState(false);
  const [selectedCardsForComparison, setSelectedCardsForComparison] = useState([]);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  
  // 🔥 Firebase資料狀態
  const [firebaseCards, setFirebaseCards] = useState([]);
  const [isLoadingFirebase, setIsLoadingFirebase] = useState(true);
  
  // 🔥 使用分離的狀態來避免循環依賴
  const [displayData, setDisplayData] = useState({
    filteredCards: [],
    userMatchedCards: [],
    recommendedCards: []
  });

  // 🔥 收藏功能狀態
  const [showFavoritesModal, setShowFavoritesModal] = useState(false);

  // 🔥 管理員檢查函數
  const isAdmin = useCallback((userEmail) => {
    const adminEmails = [
      'saihengleung101@gmail.com',
      // 如果日後需要添加其他管理員，在這裡添加Email
    ];
    const result = adminEmails.includes(userEmail);
    console.log(`🔍 管理員權限檢查: ${userEmail} -> ${result}`);
    return result;
  }, []);

  // 🔥 Apple風格邊緣滑動返回功能
  const [slideAnimation] = useState(new Animated.Value(0));
  const [isSliding, setIsSliding] = useState(false);
  const screenWidth = Dimensions.get('window').width;
  const edgeWidth = 20;
  const swipeThreshold = screenWidth * 0.3;

  // 🔥 新增：安全的category處理函數
  const safeCategoryArray = useCallback((category) => {
    if (!category) {
      console.log('⚠️ category為空，返回空陣列');
      return [];
    }
    
    if (Array.isArray(category)) {
      console.log(`✅ category已是陣列，長度: ${category.length}`);
      return category;
    }
    
    if (typeof category === 'string') {
      console.log(`🔄 category是字符串，轉換為陣列: "${category}"`);
      return [category];
    }
    
    console.log(`⚠️ category類型未知 (${typeof category})，返回空陣列`);
    return [];
  }, []);

  // 🔥 從Firebase載入信用卡資料
  const loadFirebaseCards = useCallback(async () => {
    try {
      setIsLoadingFirebase(true);
      console.log('🔥 開始從Firebase載入信用卡資料...');
      
      const cards = await creditCardService.getAllCards();
      console.log(`✅ Firebase載入成功，共 ${cards.length} 張卡片`);
      
      setFirebaseCards(cards);
    } catch (error) {
      console.error('❌ Firebase載入失敗:', error);
      setFirebaseCards([]);
    } finally {
      setIsLoadingFirebase(false);
    }
  }, []);

  // 組件載入時從Firebase載入資料
  useEffect(() => {
    loadFirebaseCards();
  }, [loadFirebaseCards]);

  // 🔥 邊緣滑動手勢處理
  const panResponder = useMemo(() => PanResponder.create({
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
        console.log('🔥 探索頁面Apple風格滑動開始');
      }
    },
    
    onPanResponderMove: (evt, gestureState) => {
      if (!isSliding) return;
      
      const swipeDistance = Math.max(0, gestureState.dx);
      const maxSlide = screenWidth * 0.8;
      const clampedDistance = Math.min(swipeDistance, maxSlide);
      
      slideAnimation.setValue(clampedDistance);
    },
    
    onPanResponderRelease: (evt, gestureState) => {
      if (!isSliding) return;
      
      const swipeDistance = gestureState.dx;
      const swipeVelocity = gestureState.vx;
      const shouldReturn = swipeDistance > swipeThreshold || swipeVelocity > 0.5;
      
      if (shouldReturn) {
        console.log('✅ 探索頁面滑動距離足夠，執行返回動畫');
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
        console.log('↩️ 探索頁面滑動距離不足，返回原位');
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
  }), [slideAnimation, screenWidth, onBack, isSliding, swipeThreshold]);

  // 🔥 完全重寫的模糊匹配邏輯，完美支持Other Bank
  const performFuzzyMatch = useCallback((userCardName, userBankName, dbCard) => {
    if (!userCardName || !dbCard) return false;
    
    const cardName = userCardName.toLowerCase().trim();
    const bankName = userBankName ? userBankName.toLowerCase().trim() : '';
    
    console.log(`🔍 詳細匹配檢查: 用戶卡片"${userCardName}" (${userBankName}) vs 資料庫卡片"${dbCard.name}" (${dbCard.bank})`);
    
    // 🔥 銀行名稱匹配邏輯，特別處理Other Bank
    let bankMatch = false;
    
    if (bankName) {
      const dbBankLower = dbCard.bank.toLowerCase();
      
      // 1. 處理Other Bank的特殊情況
      if (userBankName === 'Other Bank' || userBankName === 'other' || bankName.includes('other')) {
        console.log('🏦 檢測到Other Bank，使用卡片名稱優先匹配');
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
              console.log(`🏦 銀行標準化匹配成功: ${key} -> ${dbCard.bank}`);
              break;
            }
            if (aliases.some(alias => bankName.includes(alias.toLowerCase()) || alias.toLowerCase().includes(bankName)) &&
                (dbBankLower.includes(key.toLowerCase()) || key.toLowerCase().includes(dbBankLower))) {
              bankMatch = true;
              console.log(`🏦 銀行標準化匹配成功(反向): ${key} -> ${dbCard.bank}`);
              break;
            }
          }
        }
      }
    }
    
    console.log(`💰 銀行匹配結果: ${bankMatch} (用戶: ${userBankName}, 資料庫: ${dbCard.bank})`);
    
    // 🔥 卡片名稱匹配邏輯
    let nameMatch = false;
    
    // 1. 檢查名稱變體
    if (dbCard.nameVariations && dbCard.nameVariations.length > 0) {
      nameMatch = dbCard.nameVariations.some(variant => {
        const variantLower = variant.toLowerCase().trim();
        
        if (cardName === variantLower) {
          console.log(`🎯 精確匹配: ${cardName} = ${variantLower}`);
          return true;
        }
        
        if (cardName.includes(variantLower) || variantLower.includes(cardName)) {
          console.log(`📝 包含匹配: ${cardName} ↔ ${variantLower}`);
          return true;
        }
        
        const cardNameCleaned = cardName.replace(/[\s\-\_\.]/g, '');
        const variantCleaned = variantLower.replace(/[\s\-\_\.]/g, '');
        if (cardNameCleaned.includes(variantCleaned) || variantCleaned.includes(cardNameCleaned)) {
          console.log(`🧹 清理後匹配: ${cardNameCleaned} ↔ ${variantCleaned}`);
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
    
    console.log(`🏷️ 名稱匹配結果: ${nameMatch}`);
    console.log(`🔑 關鍵字匹配結果: ${keywordMatch}`);
    
    // 🔥 最終匹配邏輯
    let finalMatch = false;
    
    if (userBankName === 'Other Bank' || userBankName === 'other') {
      finalMatch = nameMatch || keywordMatch;
      console.log(`🔥 Other Bank特殊處理: 名稱匹配(${nameMatch}) OR 關鍵字匹配(${keywordMatch}) = ${finalMatch}`);
    } else {
      finalMatch = bankMatch && (nameMatch || keywordMatch);
      console.log(`🔥 正常匹配: 銀行匹配(${bankMatch}) AND (名稱匹配(${nameMatch}) OR 關鍵字匹配(${keywordMatch})) = ${finalMatch}`);
    }
    
    console.log(`🎯 最終匹配結果: ${finalMatch ? '✅ 成功' : '❌ 失敗'}`);
    console.log('─'.repeat(50));
    
    return finalMatch;
  }, []);

  // 🔥 修正版統一的數據處理邏輯 - 支援新的多選篩選（包含分類篩選）
  const processDataUpdate = useCallback(() => {
    console.log(`🔄 開始處理數據更新，用戶卡片數量: ${creditCards.length}，Firebase卡片數量: ${firebaseCards.length}`);
    console.log(`🔍 當前搜索詞: "${searchQuery}"`);
    console.log(`📂 當前分類: ${selectedCategory}`);
    console.log(`🎛️ 進階篩選:`, advancedFilter);
    
    const availableCards = isLoadingFirebase ? [] : firebaseCards;
    
    if (availableCards.length === 0) {
      console.log('⏳ Firebase資料尚未載入完成或為空，等待載入...');
      setDisplayData({
        filteredCards: [],
        userMatchedCards: [],
        recommendedCards: []
      });
      return;
    }
    
    // 第一步：匹配用戶信用卡
    const matchedUserCards = [];
    creditCards.forEach(userCard => {
      console.log(`📋 檢查用戶卡片: ${userCard.name} (${userCard.bank})`);
      
      const matchedDbCard = availableCards.find(dbCard => 
        performFuzzyMatch(userCard.name, userCard.bank, dbCard)
      );
      
      if (matchedDbCard) {
        console.log(`✅ 找到匹配: ${matchedDbCard.name}`);
        matchedUserCards.push({
          ...matchedDbCard,
          userCard: userCard,
          isUserCard: true
        });
      } else {
        console.log(`❌ 未找到匹配卡片: ${userCard.name} (${userCard.bank})`);
      }
    });

    console.log(`📊 匹配結果: ${matchedUserCards.length} 張卡片匹配成功`);

    // 🔥 改進搜索邏輯，確保在所有分類中都能正常工作
    const applySearchFilter = (cards) => {
      if (!searchQuery.trim()) {
        return cards;
      }
      
      const query = searchQuery.toLowerCase();
      console.log(`🔍 應用搜索過濾器: "${query}"`);
      
      const filtered = cards.filter(card => {
        const nameMatch = card.name.toLowerCase().includes(query);
        const bankMatch = card.bank.toLowerCase().includes(query);
        const keywordMatch = card.searchKeywords && card.searchKeywords.some(keyword => 
          keyword.toLowerCase().includes(query)
        );
        const descriptionMatch = card.description && card.description.toLowerCase().includes(query);
        
        const isMatch = nameMatch || bankMatch || keywordMatch || descriptionMatch;
        
        if (isMatch) {
          console.log(`✅ 搜索匹配: ${card.name}`);
        }
        
        return isMatch;
      });
      
      console.log(`🔍 搜索結果: ${filtered.length} 張卡片符合搜索條件`);
      return filtered;
    };

    // 🔥 重新設計的進階篩選邏輯 - 支援多選（包含新的分類篩選）
    const applyAdvancedFilter = (cards) => {
      let filtered = cards;
      
      // 銀行多選篩選
      if (advancedFilter.banks.length > 0) {
        filtered = filtered.filter(card => advancedFilter.banks.includes(card.bank));
        console.log(`🏦 銀行多選篩選結果: ${filtered.length} 張卡片 (選中: ${advancedFilter.banks.join(', ')})`);
      }
      
      // 年費多選篩選 - 修正為十萬單位
      if (advancedFilter.annualFees.length > 0) {
        filtered = filtered.filter(card => {
          return advancedFilter.annualFees.some(feeRange => {
            if (feeRange === 'free') {
              return card.annualFee === 0;
            } else if (feeRange === 'low') {
              return card.annualFee > 0 && card.annualFee <= 100000;
            } else if (feeRange === 'medium') {
              return card.annualFee > 100000 && card.annualFee <= 300000;
            } else if (feeRange === 'high') {
              return card.annualFee > 300000;
            }
            return false;
          });
        });
        console.log(`💰 年費多選篩選結果: ${filtered.length} 張卡片 (選中: ${advancedFilter.annualFees.join(', ')})`);
      }
      
      // 🔥 新增：分類多選篩選
      if (advancedFilter.categories.length > 0) {
        filtered = filtered.filter(card => {
          const cardCategories = safeCategoryArray(card.category);
          return advancedFilter.categories.some(filterCategory => 
            cardCategories.includes(filterCategory)
          );
        });
        console.log(`🏷️ 分類多選篩選結果: ${filtered.length} 張卡片 (選中: ${advancedFilter.categories.join(', ')})`);
      }
      
      return filtered;
    };

    // 第三步：應用分類過濾和生成最終數據
    let finalData = {};

    if (selectedCategory === 'my_cards') {
      // 🔥 新增：強制重置進階篩選器，避免干擾我的信用卡顯示
  if (advancedFilter.banks.length > 0 || advancedFilter.annualFees.length > 0 || advancedFilter.categories.length > 0) {
    console.log('🔧 檢測到進階篩選器活躍，為我的信用卡模式清除篩選器');
    setAdvancedFilter({ banks: [], annualFees: [], categories: [] });
    return; // 等待下一次渲染週期
  }
  // 🔥 徹底簡化：我的信用卡邏輯
  console.log(`📂 處理我的信用卡分類，搜索詞: "${searchQuery}"`);
  console.log(`👤 用戶匹配卡片數量: ${matchedUserCards.length}`);
  
  // 🔥 簡化邏輯：直接使用用戶匹配的卡片，只應用搜索篩選
  const searchFiltered = applySearchFilter(matchedUserCards);
  
  finalData = {
    filteredCards: searchFiltered,
    userMatchedCards: [],
    recommendedCards: []
  };
  
  console.log(`📊 我的信用卡最終結果: ${searchFiltered.length} 張卡片`);
} else if (selectedCategory === 'all') {
      // 全部分類：顯示所有卡片，不分組，但標記用戶卡片
      const searchFilteredCards = applySearchFilter(availableCards);
      const advancedFilteredCards = applyAdvancedFilter(searchFilteredCards);
      
      const allCardsWithUserStatus = advancedFilteredCards.map(card => {
        const isUserCard = matchedUserCards.some(userCard => userCard.id === card.id);
        return isUserCard ? { ...card, isUserCard: true } : card;
      });
      
      finalData = {
        filteredCards: allCardsWithUserStatus,
        userMatchedCards: [],
        recommendedCards: []
      };
    } else {
      // 特定分類：正確分組為用戶卡片和推薦卡片
      const categoryFiltered = availableCards.filter(card => {
        // 🔥 修正：使用安全的category處理，確保分類匹配
        const cardCategories = safeCategoryArray(card.category);
        const matchResult = cardCategories.includes(selectedCategory);
        
        if (matchResult) {
          console.log(`✅ 分類匹配: ${card.name} -> [${cardCategories.join(', ')}] 包含 "${selectedCategory}"`);
        }
        
        return matchResult;
      });
      
      console.log(`📂 分類"${selectedCategory}"篩選結果: ${categoryFiltered.length} 張卡片`);
      
      const searchFilteredCategoryCards = applySearchFilter(categoryFiltered);
      const advancedFilteredCategoryCards = applyAdvancedFilter(searchFilteredCategoryCards);
      
      const userCardsInCategory = matchedUserCards.filter(card => {
        // 🔥 修正：使用安全的category處理
        const cardCategories = safeCategoryArray(card.category);
        return cardCategories.includes(selectedCategory);
      });
      
      const searchAndAdvancedFilteredUserCards = applyAdvancedFilter(applySearchFilter(userCardsInCategory));
      
      const recommendedInCategory = advancedFilteredCategoryCards.filter(card => 
        !matchedUserCards.some(userCard => userCard.id === card.id)
      );

      finalData = {
        filteredCards: advancedFilteredCategoryCards,
        userMatchedCards: searchAndAdvancedFilteredUserCards,
        recommendedCards: recommendedInCategory
      };
      
      console.log(`📊 分類"${selectedCategory}"最終結果:`);
      console.log(`  - 總卡片: ${advancedFilteredCategoryCards.length}`);
      console.log(`  - 用戶卡片: ${searchAndAdvancedFilteredUserCards.length}`);
      console.log(`  - 推薦卡片: ${recommendedInCategory.length}`);
    }

    setDisplayData(finalData);
  }, [creditCards, searchQuery, selectedCategory, advancedFilter, performFuzzyMatch, firebaseCards, isLoadingFirebase, safeCategoryArray]);

  // 使用單一effect，避免依賴鏈問題
  useEffect(() => {
    processDataUpdate();
  }, [processDataUpdate]);

  // 🔥 完善的收藏功能處理
  const handleToggleFavorite = useCallback((cardId) => {
    console.log(`🔥 收藏功能觸發: ${cardId}`);
    console.log(`📋 當前收藏列表:`, favoriteCards);
    
    if (onToggleFavorite && typeof onToggleFavorite === 'function') {
      onToggleFavorite(cardId);
      console.log(`✅ 收藏狀態已更新: ${cardId}`);
      
      setTimeout(() => {
        console.log(`🔄 收藏狀態更新後檢查:`, favoriteCards);
      }, 100);
    } else {
      console.error('❌ onToggleFavorite函數未定義或不是函數');
    }
  }, [onToggleFavorite, favoriteCards]);

  const isFavorite = useCallback((cardId) => {
    const result = Array.isArray(favoriteCards) && favoriteCards.includes(cardId);
    console.log(`🔍 檢查收藏狀態: ${cardId} = ${result} (收藏列表長度: ${favoriteCards ? favoriteCards.length : 0})`);
    return result;
  }, [favoriteCards]);

  // 事件處理函數
  const handleSearchChange = useCallback((text) => {
    console.log(`🔍 搜索內容變更: "${text}"`);
    setSearchQuery(text);
  }, []);

  const handleCategorySelect = useCallback((categoryId) => {
  console.log(`📂 分類變更: ${categoryId}`);
  
  // 🔥 新增：當切換到我的信用卡時，自動清除所有進階篩選器
  if (categoryId === 'my_cards') {
    console.log('🧹 切換到我的信用卡，清除所有進階篩選器');
    setAdvancedFilter({ banks: [], annualFees: [], categories: [] });
  }
  
  setSelectedCategory(categoryId);
}, []);

  // 🔥 新增：獲取可用銀行列表
  const getAvailableBanks = useCallback(() => {
    if (firebaseCards.length === 0) return [];
    
    const banks = [...new Set(firebaseCards.map(card => card.bank))].sort();
    console.log(`🏦 可用銀行: [${banks.join(', ')}]`);
    return banks;
  }, [firebaseCards]);

  // 🔥 新增：進階篩選器處理函數
  const handleAdvancedFilterModalOpen = useCallback((filterType) => {
    console.log(`🎛️ 打開進階篩選器: ${filterType}`);
    setFilterModalType(filterType);
    setShowAdvancedFilterModal(true);
  }, []);

  const handleAdvancedFilterSelect = useCallback((filterType, value) => {
    console.log(`🎛️ 進階篩選器選擇: ${filterType} = ${value}`);
    
    setAdvancedFilter(prev => {
      const newFilter = { ...prev };
      const currentArray = newFilter[filterType] || [];
      
      if (currentArray.includes(value)) {
        // 取消選擇
        newFilter[filterType] = currentArray.filter(item => item !== value);
      } else {
        // 添加選擇
        newFilter[filterType] = [...currentArray, value];
      }
      
      console.log(`🎛️ 更新後的篩選器:`, newFilter);
      return newFilter;
    });
  }, []);

  const clearAdvancedFilter = useCallback((filterType) => {
    console.log(`🎛️ 清空進階篩選器: ${filterType}`);
    setAdvancedFilter(prev => ({
      ...prev,
      [filterType]: []
    }));
  }, []);

  // 🔥 新增：比較功能處理函數
  const handleToggleCompareMode = useCallback(() => {
    console.log(`🔄 切換比較模式: ${!compareMode}`);
    setCompareMode(!compareMode);
    if (compareMode) {
      // 如果關閉比較模式，清空選擇
      setSelectedCardsForComparison([]);
    }
  }, [compareMode]);

  const handleCardCompareSelect = useCallback((card) => {
    console.log(`📊 選擇比較卡片: ${card.name}`);
    
    setSelectedCardsForComparison(prev => {
      const isAlreadySelected = prev.some(c => c.id === card.id);
      
      if (isAlreadySelected) {
        // 取消選擇
        return prev.filter(c => c.id !== card.id);
      } else if (prev.length < 2) {
        // 添加選擇（最多2張）
        return [...prev, card];
      } else {
        // 已經選擇2張，替換第一張
        return [prev[1], card];
      }
    });
  }, []);

  const handleStartComparison = useCallback(() => {
    if (selectedCardsForComparison.length === 2) {
      console.log(`📊 開始比較: ${selectedCardsForComparison.map(c => c.name).join(' vs ')}`);
      setShowComparisonModal(true);
    }
  }, [selectedCardsForComparison]);

  const handleCloseComparison = useCallback(() => {
    console.log(`❌ 關閉比較模式`);
    setCompareMode(false);
    setSelectedCardsForComparison([]);
    setShowComparisonModal(false);
  }, []);

  // 🔥 新增：統計數字計算
  const getCardCounts = useCallback(() => {
    const counts = {
      total: displayData.filteredCards.length,
      userCards: selectedCategory === 'my_cards' ? displayData.filteredCards.length : displayData.userMatchedCards.length,
      recommended: displayData.recommendedCards.length
    };
    
    console.log(`📊 卡片統計:`, counts);
    return counts;
  }, [displayData, selectedCategory]);

  // 🔥 全新優化的卡片渲染函數 - 加入比較功能
  const renderCreditCard = useCallback((card, index) => {
    // 🧠 使用安全的category處理函數
    const cardCategories = safeCategoryArray(card.category);
    console.log(`🎨 渲染卡片: ${card.name}，分類: [${cardCategories.join(', ')}]`);
    
    const isSelectedForComparison = selectedCardsForComparison.some(c => c.id === card.id);
    
    return (
      <View key={`${card.id}-${index}`} style={[
        styles.cardItem,
        isSelectedForComparison && styles.selectedCardItem
      ]}>
        {/* 🔥 比較模式選擇器 */}
        {compareMode && (
          <TouchableOpacity
            style={[styles.compareSelector, isSelectedForComparison && styles.compareSelectorSelected]}
            onPress={() => handleCardCompareSelect(card)}
            activeOpacity={0.7}
          >
            <View style={[styles.compareSelectorInner, isSelectedForComparison && styles.compareSelectorInnerSelected]}>
              {isSelectedForComparison && (
                <MaterialIcons name="check" size={16} color="#FFFFFF" />
              )}
            </View>
          </TouchableOpacity>
        )}

        {/* 🔥 卡片頭部：名稱、銀行、回贈和收藏 */}
        <View style={styles.cardHeader}>
          <View style={styles.cardInfo}>
            <Text style={styles.cardName} numberOfLines={2}>{card.name}</Text>
            <View style={styles.bankContainer}>
              <MaterialIcons name="account-balance" size={14} color="#666666" />
              <Text style={styles.bankName}>{card.bank}</Text>
            </View>
          </View>
          <View style={styles.cardHeaderRight}>
            <View style={styles.cashbackContainer}>
              <Text style={styles.cashbackText}>{card.cashback}</Text>
              <Text style={styles.cashbackLabel}>回贈</Text>
            </View>
            <TouchableOpacity
              style={styles.favoriteButton}
              onPress={() => {
                console.log(`❤️ 收藏按鈕被點擊: ${card.id}`);
                handleToggleFavorite(card.id);
              }}
              activeOpacity={0.7}
            >
              <MaterialIcons 
                name={isFavorite(card.id) ? 'favorite' : 'favorite-border'} 
                size={22} 
                color={isFavorite(card.id) ? '#E91E63' : '#999999'} 
              />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* 🔥 年費和年薪要求資訊 */}
        <View style={styles.financialInfo}>
          <View style={styles.infoItem}>
            <MaterialIcons name="attach-money" size={14} color="#10B981" />
            <Text style={styles.infoLabel}>年費</Text>
            <Text style={styles.infoValue}>
              {card.annualFee === 0 ? '免費' : `HK$${card.annualFee.toLocaleString()}`}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <MaterialIcons name="work" size={14} color="#3B82F6" />
            <Text style={styles.infoLabel}>年薪要求</Text>
            <Text style={styles.infoValue}>
              {card.minAnnualIncome === 0 ? '無要求' : `HK$${card.minAnnualIncome.toLocaleString()}`}
            </Text>
          </View>
        </View>

        {/* 🔥 分類標籤 - 修正版：安全處理category */}
        <View style={styles.cardTags}>
          {cardCategories.slice(0, 3).map((category, idx) => (
            <View key={idx} style={[styles.categoryTag, getCategoryTagStyle(category)]}>
              <Text style={[styles.categoryTagText, getCategoryTagTextStyle(category)]}>
                {CATEGORIES.find(cat => cat.id === category)?.name || category}
              </Text>
            </View>
          ))}
          {card.isUserCard && (
            <View style={[styles.categoryTag, styles.userCardTag]}>
              <MaterialIcons name="check-circle" size={12} color="#166534" />
              <Text style={styles.userCardTagText}>
                {currentLanguage === 'zh-TW' ? '我的卡片' : 'My Card'}
              </Text>
            </View>
          )}
          <View style={[styles.categoryTag, styles.cardBrandTag]}>
            <Text style={styles.cardBrandTagText}>{card.label}</Text>
          </View>
        </View>
        
        {/* 🔥 卡片描述 - 顯示更詳細的優惠資訊 */}
        <Text style={styles.cardDescription} numberOfLines={3}>{card.description}</Text>
        
        {/* 🔥 使用條件 */}
        <View style={styles.conditionsContainer}>
          <MaterialIcons name="info-outline" size={14} color="#F59E0B" />
          <Text style={styles.conditionsText} numberOfLines={2}>{card.conditions}</Text>
        </View>

        {/* 🔥 卡片底部動作區域 - 修正比較按鈕 */}
        <View style={styles.cardActions}>
          <TouchableOpacity 
            style={[styles.actionButton, compareMode && styles.disabledActionButton]}
            activeOpacity={compareMode ? 1 : 0.7}
            onPress={() => {
              if (!compareMode) {
                handleCardCompareSelect(card);
                if (selectedCardsForComparison.length === 0) {
                  // 如果沒有選擇任何卡片，開啟比較模式並選擇這張卡片
                  setCompareMode(true);
                  setSelectedCardsForComparison([card]);
                } else if (selectedCardsForComparison.length === 1 && !selectedCardsForComparison.some(c => c.id === card.id)) {
                  // 如果已經選擇1張不同的卡片，選擇這張並開始比較
                  setSelectedCardsForComparison(prev => [...prev, card]);
                  setTimeout(() => {
                    setShowComparisonModal(true);
                  }, 100);
                }
              }
            }}
            disabled={compareMode}
          >
            <MaterialIcons name="compare" size={16} color={compareMode ? "#CCCCCC" : "#3B82F6"} />
            <Text style={[styles.actionButtonText, compareMode && styles.disabledActionButtonText]}>比較</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} activeOpacity={0.7}>
            <MaterialIcons name="open-in-new" size={16} color="#10B981" />
            <Text style={styles.actionButtonText}>了解更多</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [currentLanguage, handleToggleFavorite, isFavorite, safeCategoryArray, compareMode, selectedCardsForComparison, handleCardCompareSelect]);

  // 🔥 動態分類標籤樣式
  const getCategoryTagStyle = useCallback((category) => {
    const categoryStyles = {
      '基本回贈': { backgroundColor: '#FEF3C7' },
      '外幣': { backgroundColor: '#DBEAFE' },
      '手機支付': { backgroundColor: '#F3E8FF' },
      '網上購物': { backgroundColor: '#ECFDF5' },
      '超市購物': { backgroundColor: '#FEF2F2' },
      '餐飲美食': { backgroundColor: '#FFF7ED' },
      '青年學生': { backgroundColor: '#F0F9FF' },
      '里數': { backgroundColor: '#EDE9FE' }
    };
    return categoryStyles[category] || { backgroundColor: '#F3F4F6' };
  }, []);

  const getCategoryTagTextStyle = useCallback((category) => {
    const textStyles = {
      '基本回贈': { color: '#D97706' },
      '外幣': { color: '#2563EB' },
      '手機支付': { color: '#7C3AED' },
      '網上購物': { color: '#059669' },
      '超市購物': { color: '#DC2626' },
      '餐飲美食': { color: '#EA580C' },
      '青年學生': { color: '#0284C7' },
      '里數': { color: '#6D28D9' }
    };
    return textStyles[category] || { color: '#374151' };
  }, []);

  const renderCategoryButton = useCallback((category) => (
    <TouchableOpacity
      key={category.id}
      style={[
        styles.categoryButton,
        selectedCategory === category.id && styles.selectedCategoryButton
      ]}
      onPress={() => handleCategorySelect(category.id)}
      activeOpacity={0.7}
    >
      <MaterialIcons 
        name={category.icon} 
        size={16} 
        color={selectedCategory === category.id ? '#FFFFFF' : '#666666'} 
      />
      <Text style={[
        styles.categoryButtonText,
        selectedCategory === category.id && styles.selectedCategoryButtonText
      ]}>
        {currentLanguage === 'zh-TW' ? category.name : category.englishName}
      </Text>
    </TouchableOpacity>
  ), [selectedCategory, handleCategorySelect, currentLanguage]);

  // 🔥 收藏列表獲取邏輯
  const getFavoriteCards = useCallback(() => {
    console.log(`🔍 === 開始獲取收藏列表 ===`);
    console.log(`📊 輸入數據檢查:`);
    console.log(`  - favoriteCards:`, favoriteCards);
    console.log(`  - favoriteCards 類型:`, typeof favoriteCards);
    console.log(`  - favoriteCards 是陣列:`, Array.isArray(favoriteCards));
    console.log(`  - favoriteCards 長度:`, favoriteCards ? favoriteCards.length : 'N/A');
    console.log(`  - firebaseCards 長度:`, firebaseCards.length);
    
    // 檢查收藏列表是否有效
    if (!Array.isArray(favoriteCards)) {
      console.error('❌ favoriteCards 不是陣列:', favoriteCards);
      return [];
    }
    
    if (favoriteCards.length === 0) {
      console.log('📭 收藏列表為空，返回空陣列');
      return [];
    }
    
    if (firebaseCards.length === 0) {
      console.log('📭 Firebase卡片列表為空，返回空陣列');
      return [];
    }
    
    console.log(`🔍 開始在 ${firebaseCards.length} 張Firebase卡片中查找收藏...`);
    
    const favorites = [];
    
    favoriteCards.forEach(favoriteId => {
      console.log(`🔍 查找收藏ID: ${favoriteId}`);
      
      const foundCard = firebaseCards.find(card => {
        const match = card.id === favoriteId;
        if (match) {
          console.log(`  ✅ 找到匹配: ${card.name} (${card.id})`);
        }
        return match;
      });
      
      if (foundCard) {
        favorites.push(foundCard);
      } else {
        console.log(`  ❌ 未找到ID為 ${favoriteId} 的卡片`);
      }
    });
    
    console.log(`📊 最終收藏結果:`);
    console.log(`  - 收藏數量: ${favorites.length}`);
    console.log(`  - 收藏卡片名稱: [${favorites.map(card => card.name).join(', ')}]`);
    console.log(`🔍 === 收藏列表獲取完成 ===`);
    
    return favorites;
  }, [favoriteCards, firebaseCards]);

  // 🔥 管理員刷新功能
  const handleRefreshFirebase = useCallback(async () => {
    if (!isAdmin(userData.email)) {
      console.log('❌ 非管理員用戶嘗試刷新，拒絕操作');
      return;
    }
    
    console.log('🔄 管理員手動刷新Firebase資料...');
    await loadFirebaseCards();
  }, [loadFirebaseCards, isAdmin, userData.email]);

  // 🔥 修正：渲染進階篩選器狀態（完整英文支援）
  const renderAdvancedFilterStatus = useCallback(() => {
    const hasFilters = advancedFilter.banks.length > 0 || advancedFilter.annualFees.length > 0 || advancedFilter.categories.length > 0;
    
    if (!hasFilters) {
      return null;
    }

    const filterTexts = [];
    
    // 🔥 修正：銀行篩選器支援英文
    if (advancedFilter.banks.length > 0) {
      const bankLabel = currentLanguage === 'zh-TW' ? '銀行' : 'Banks';
      const countLabel = currentLanguage === 'zh-TW' ? '個' : '';
      filterTexts.push(`${bankLabel}: ${advancedFilter.banks.length}${countLabel}`);
    }
    
    // 🔥 修正：年費篩選器支援英文
    if (advancedFilter.annualFees.length > 0) {
      const feeLabels = {
        free: currentLanguage === 'zh-TW' ? '免費' : 'Free',
        low: currentLanguage === 'zh-TW' ? '低' : 'Low',
        medium: currentLanguage === 'zh-TW' ? '中' : 'Medium',
        high: currentLanguage === 'zh-TW' ? '高' : 'High'
      };
      const separator = currentLanguage === 'zh-TW' ? '、' : ', ';
      const feeText = advancedFilter.annualFees.map(fee => feeLabels[fee] || fee).join(separator);
      const feeLabel = currentLanguage === 'zh-TW' ? '年費' : 'Annual Fee';
      filterTexts.push(`${feeLabel}: ${feeText}`);
    }

    // 🔥 分類篩選器狀態顯示（已有英文支援）
    if (advancedFilter.categories.length > 0) {
      const categoryNames = advancedFilter.categories.map(catId => {
        const category = FILTER_CATEGORIES.find(cat => cat.id === catId);
        return currentLanguage === 'zh-TW' 
          ? (category?.name || catId)
          : (category?.englishName || catId);
      }).join(currentLanguage === 'zh-TW' ? '、' : ', ');
      
      const categoryLabel = currentLanguage === 'zh-TW' ? '分類' : 'Categories';
      filterTexts.push(`${categoryLabel}: ${categoryNames}`);
    }

    return (
      <View style={styles.activeFiltersContainer}>
        <Text style={styles.activeFiltersText}>
          {currentLanguage === 'zh-TW' ? '已篩選' : 'Filtered'}: {filterTexts.join(' | ')}
        </Text>
        <TouchableOpacity
          style={styles.clearFiltersButton}
          onPress={() => setAdvancedFilter({ banks: [], annualFees: [], categories: [] })}
          activeOpacity={0.7}
        >
          <MaterialIcons name="clear" size={14} color="#EF4444" />
        </TouchableOpacity>
      </View>
    );
  }, [advancedFilter, currentLanguage]);

  // 🔥 新增：渲染比較功能界面
  const renderComparisonInterface = useCallback(() => {
    if (!compareMode) return null;

    return (
      <View style={styles.comparisonInterface}>
        <View style={styles.comparisonHeader}>
          <View style={styles.comparisonTitle}>
            <MaterialIcons name="compare" size={20} color="#3B82F6" />
            <Text style={styles.comparisonTitleText}>
  {currentLanguage === 'zh-TW' 
    ? `比較模式 (${selectedCardsForComparison.length}/2)` 
    : `Comparison Mode (${selectedCardsForComparison.length}/2)`
  }
</Text>
          </View>
          <View style={styles.comparisonActions}>
            {selectedCardsForComparison.length === 2 && (
              <TouchableOpacity
                style={styles.startComparisonButton}
                onPress={handleStartComparison}
                activeOpacity={0.7}
              >
                <Text style={styles.startComparisonButtonText}>
  {currentLanguage === 'zh-TW' ? '開始比較' : 'Start Comparison'}
</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.cancelComparisonButton}
              onPress={handleCloseComparison}
              activeOpacity={0.7}
            >
              <MaterialIcons name="close" size={20} color="#666666" />
            </TouchableOpacity>
          </View>
        </View>
        
        {selectedCardsForComparison.length > 0 && (
          <View style={styles.selectedCardsPreview}>
            {selectedCardsForComparison.map((card, index) => (
              <View key={card.id} style={styles.selectedCardPreview}>
                <Text style={styles.selectedCardName} numberOfLines={1}>
                  {index + 1}. {card.name}
                </Text>
                <Text style={styles.selectedCardBank} numberOfLines={1}>
                  {card.bank}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  }, [compareMode, selectedCardsForComparison, handleStartComparison, handleCloseComparison]);

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

      {/* 前景層：探索頁面內容，支持滑動動畫 */}
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
          {/* 頭部區域 */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={onBack}
              activeOpacity={0.7}
            >
              <MaterialIcons name="arrow-back" size={24} color="#333333" />
            </TouchableOpacity>
            
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>
                {currentLanguage === 'zh-TW' ? '信用卡特色探索' : 'Credit Card Explorer'}
              </Text>
              <Text style={styles.headerSubtitle}>
                {currentLanguage === 'zh-TW' ? '了解您的卡片優勢，發現更好選擇' : 'Discover better credit card options'}
              </Text>
            </View>
            
            <View style={styles.headerButtons}>
              {/* 🔥 刷新按鈕只對管理員可見 */}
              {isAdmin(userData.email) && (
                <TouchableOpacity 
                  style={styles.refreshButton}
                  onPress={handleRefreshFirebase}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name="refresh" size={20} color="#007AFF" />
                </TouchableOpacity>
              )}
              
              {/* 🔥 收藏按鈕 */}
              <TouchableOpacity 
                style={styles.favoriteHeaderButton}
                onPress={() => {
                  console.log(`🔥 === 收藏頭部按鈕被點擊 ===`);
                  console.log(`📊 當前收藏數量: ${favoriteCards ? favoriteCards.length : 0}`);
                  console.log(`📋 收藏ID列表: [${favoriteCards ? favoriteCards.join(', ') : ''}]`);
                  setShowFavoritesModal(true);
                }}
                activeOpacity={0.7}
              >
                <MaterialIcons name="favorite" size={24} color="#E91E63" />
                {favoriteCards && favoriteCards.length > 0 && (
                  <View style={styles.favoriteBadge}>
                    <Text style={styles.favoriteBadgeText}>{favoriteCards.length}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* 載入狀態提示 */}
          {isLoadingFirebase && (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>
                {currentLanguage === 'zh-TW' ? '正在載入最新信用卡資料...' : 'Loading latest credit card data...'}
              </Text>
            </View>
          )}

          {/* 搜索欄 */}
          <View style={styles.searchSection}>
            <Text style={styles.sectionTitle}>
              {currentLanguage === 'zh-TW' ? '探索更好的選擇' : 'Explore Better Options'}
            </Text>
            <Text style={styles.sectionSubtitle}>
              {currentLanguage === 'zh-TW' ? '搜索和比較其他優質信用卡' : 'Search and compare premium credit cards'}
            </Text>
            
            <View style={styles.searchContainer}>
              <MaterialIcons name="search" size={20} color="#999999" />
              <TextInput
                style={styles.searchInput}
                placeholder={currentLanguage === 'zh-TW' ? '搜索信用卡名稱、銀行或優惠...' : 'Search card name, bank or offers...'}
                placeholderTextColor="#999999"
                value={searchQuery}
                onChangeText={handleSearchChange}
              />
            </View>
          </View>

          {/* 分類過濾器 */}
          <View style={styles.filterSection}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesContainer}
              style={styles.categoriesScroll}
            >
              {CATEGORIES.map(renderCategoryButton)}
            </ScrollView>
          </View>

          {/* 🔥 比較功能界面 */}
          {renderComparisonInterface()}

          {/* 推薦內容 */}
          <ScrollView style={styles.contentSection} showsVerticalScrollIndicator={false}>
            {!isLoadingFirebase && (
              <>
              {selectedCategory === 'my_cards' ? (
                // 我的信用卡：不分組，直接顯示，添加統計
                <View style={styles.section}>
                  <View style={styles.sectionHeaderRow}>
                    <View style={styles.sectionHeaderLeft}>
                      <Text style={styles.sectionHeader}>
                        {currentLanguage === 'zh-TW' ? '我的信用卡' : 'My Credit Cards'}
                      </Text>
                      <Text style={styles.sectionDescription}>
                        {currentLanguage === 'zh-TW' 
                          ? `${getCardCounts().userCards} 張信用卡` 
                          : `${getCardCounts().userCards} credit cards owned`
                        }
                      </Text>
                    </View>
                    {/* 🔥 修改：將比較按鈕改為分類按鈕 */}
                    <View style={styles.sectionHeaderRight}>
                      <TouchableOpacity
                        style={styles.advancedFilterButton}
                        onPress={() => handleAdvancedFilterModalOpen('categories')}
                        activeOpacity={0.7}
                      >
                        <MaterialIcons name="category" size={16} color="#666666" />
                        <Text style={styles.advancedFilterButtonText}>
  {advancedFilter.categories.length > 0 
    ? (currentLanguage === 'zh-TW' 
        ? `分類 (${advancedFilter.categories.length})` 
        : `Categories (${advancedFilter.categories.length})`)
    : (currentLanguage === 'zh-TW' ? '分類' : 'Categories')
  }
</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  {/* 🔥 進階篩選器狀態顯示 */}
                  {renderAdvancedFilterStatus()}
                  
                  {displayData.filteredCards.length > 0 ? (
  displayData.filteredCards.map(renderCreditCard)
) : (
  <View style={styles.emptyState}>
    <MaterialIcons name="credit-card" size={64} color="#E0E0E0" />
    <Text style={styles.emptyStateText}>
      {selectedCategory === 'my_cards' ? (
        // 🔥 修正：我的信用卡只檢查搜索條件
        searchQuery.trim() 
          ? (currentLanguage === 'zh-TW' ? '找不到符合搜索條件的信用卡' : 'No credit cards found matching your search')
          : (currentLanguage === 'zh-TW' ? '尚未添加任何信用卡' : 'No credit cards added yet')
      ) : (
        // 🔥 其他分類檢查所有篩選條件
        searchQuery.trim() || advancedFilter.banks.length > 0 || advancedFilter.annualFees.length > 0 || advancedFilter.categories.length > 0
          ? (currentLanguage === 'zh-TW' ? '找不到符合篩選條件的信用卡' : 'No credit cards found matching your filters')
          : (currentLanguage === 'zh-TW' ? '此分類暫無相關信用卡' : 'No credit cards found in this category')
      )}
    </Text>
  </View>
)}
                </View>
              ) : selectedCategory === 'all' ? (
  // 全部分類：不分組，直接顯示，修正統計顯示
  <View style={styles.section}>
    {/* 🔥 英文模式下的兩行佈局 */}
    {currentLanguage === 'zh-TW' ? (
      // 中文模式：保持原有的單行佈局
      <View style={styles.sectionHeaderRow}>
        <View style={styles.sectionHeaderLeft}>
          <Text style={styles.sectionHeader}>所有信用卡</Text>
          <Text style={styles.sectionDescription}>
  共 {getCardCounts().total} 張信用卡
</Text>
        </View>
        <View style={styles.sectionHeaderRight}>
          <TouchableOpacity
            style={styles.advancedFilterButton}
            onPress={() => handleAdvancedFilterModalOpen('banks')}
            activeOpacity={0.7}
          >
            <MaterialIcons name="account-balance" size={16} color="#666666" />
            <Text style={styles.advancedFilterButtonText}>
              {advancedFilter.banks.length > 0 ? `銀行 (${advancedFilter.banks.length})` : '銀行'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.advancedFilterButton}
            onPress={() => handleAdvancedFilterModalOpen('annualFees')}
            activeOpacity={0.7}
          >
            <MaterialIcons name="attach-money" size={16} color="#666666" />
            <Text style={styles.advancedFilterButtonText}>
              {advancedFilter.annualFees.length > 0 ? `年費 (${advancedFilter.annualFees.length})` : '年費'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.advancedFilterButton}
            onPress={() => handleAdvancedFilterModalOpen('categories')}
            activeOpacity={0.7}
          >
            <MaterialIcons name="category" size={16} color="#666666" />
            <Text style={styles.advancedFilterButtonText}>
              {advancedFilter.categories.length > 0 ? `分類 (${advancedFilter.categories.length})` : '分類'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    ) : (
      // 🔥 英文模式：兩行佈局
      <View style={styles.englishSectionHeader}>
        {/* 第一行：標題和統計 */}
        <View style={styles.englishHeaderRow}>
          <Text style={styles.sectionHeader}>All Credit Cards</Text>
          <Text style={styles.sectionDescription}>
  {getCardCounts().total} credit cards available
</Text>
        </View>
        
        {/* 第二行：篩選按鈕 */}
        <View style={styles.englishFiltersRow}>
          <TouchableOpacity
            style={styles.advancedFilterButton}
            onPress={() => handleAdvancedFilterModalOpen('banks')}
            activeOpacity={0.7}
          >
            <MaterialIcons name="account-balance" size={16} color="#666666" />
            <Text style={styles.advancedFilterButtonText}>
              {advancedFilter.banks.length > 0 ? `Banks (${advancedFilter.banks.length})` : 'Banks'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.advancedFilterButton}
            onPress={() => handleAdvancedFilterModalOpen('annualFees')}
            activeOpacity={0.7}
          >
            <MaterialIcons name="attach-money" size={16} color="#666666" />
            <Text style={styles.advancedFilterButtonText}>
              {advancedFilter.annualFees.length > 0 ? `Annual Fee (${advancedFilter.annualFees.length})` : 'Annual Fee'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.advancedFilterButton}
            onPress={() => handleAdvancedFilterModalOpen('categories')}
            activeOpacity={0.7}
          >
            <MaterialIcons name="category" size={16} color="#666666" />
            <Text style={styles.advancedFilterButtonText}>
              {advancedFilter.categories.length > 0 ? `Categories (${advancedFilter.categories.length})` : 'Categories'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    )}
                  
                  {/* 🔥 進階篩選器狀態顯示 */}
                  {renderAdvancedFilterStatus()}
                  
                  {displayData.filteredCards.length > 0 ? (
                    displayData.filteredCards.map(renderCreditCard)
                  ) : (
                    <View style={styles.emptyState}>
                      <MaterialIcons name="search-off" size={64} color="#E0E0E0" />
                      <Text style={styles.emptyStateText}>
                        {currentLanguage === 'zh-TW' ? '找不到符合篩選條件的信用卡' : 'No credit cards found matching your filters'}
                      </Text>
                    </View>
                  )}
                </View>
              ) : (
                // 其他分類：分為用戶卡片和推薦卡片
                <>
                  {/* 用戶信用卡區域 */}
                  {displayData.userMatchedCards.length > 0 && (
                    <View style={styles.section}>
                      <View style={styles.sectionHeaderRow}>
                        <View style={styles.sectionHeaderLeft}>
                          <Text style={styles.sectionHeader}>
                            {currentLanguage === 'zh-TW' ? '您的信用卡' : 'Your Credit Cards'}
                          </Text>
                          <Text style={styles.sectionDescription}>
                            {currentLanguage === 'zh-TW' 
                              ? `您已擁有的此類信用卡 (${getCardCounts().userCards} 張)` 
                              : `Credit cards you already own in this category (${getCardCounts().userCards})`
                            }
                          </Text>
                        </View>
                        {/* 🔥 修改：將比較按鈕改為分類按鈕 */}
                        <View style={styles.sectionHeaderRight}>
                          <TouchableOpacity
                            style={styles.advancedFilterButton}
                            onPress={() => handleAdvancedFilterModalOpen('categories')}
                            activeOpacity={0.7}
                          >
                            <MaterialIcons name="category" size={16} color="#666666" />
                            <Text style={styles.advancedFilterButtonText}>
                              <Text style={styles.advancedFilterButtonText}>
  {advancedFilter.categories.length > 0 
    ? (currentLanguage === 'zh-TW' 
        ? `分類 (${advancedFilter.categories.length})` 
        : `Categories (${advancedFilter.categories.length})`)
    : (currentLanguage === 'zh-TW' ? '分類' : 'Categories')
  }
</Text>
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                      {displayData.userMatchedCards.map(renderCreditCard)}
                    </View>
                  )}

                  {/* 推薦卡片區域 */}
                  {displayData.recommendedCards.length > 0 && (
                    <View style={styles.section}>
                      <View style={styles.sectionHeaderRow}>
                        <View style={styles.sectionHeaderLeft}>
                          <Text style={styles.sectionHeader}>
                            {currentLanguage === 'zh-TW' ? '為您推薦' : 'Recommended for You'}
                          </Text>
                          <Text style={styles.sectionDescription}>
                            {currentLanguage === 'zh-TW' 
                              ? `基於您的使用習慣，這些卡片可能更適合您 (${getCardCounts().recommended} 張)` 
                              : `Based on your usage, these cards might suit you better (${getCardCounts().recommended})`
                            }
                          </Text>
                        </View>
                        {/* 🔥 進階篩選器按鈕，修改比較按鈕為分類按鈕 */}
                        <View style={styles.sectionHeaderRight}>
                          <TouchableOpacity
                            style={styles.advancedFilterButton}
                            onPress={() => handleAdvancedFilterModalOpen('banks')}
                            activeOpacity={0.7}
                          >
                            <MaterialIcons name="account-balance" size={16} color="#666666" />
                            <Text style={styles.advancedFilterButtonText}>
                              <Text style={styles.advancedFilterButtonText}>
  {advancedFilter.banks.length > 0 
    ? (currentLanguage === 'zh-TW' 
        ? `銀行 (${advancedFilter.banks.length})` 
        : `Banks (${advancedFilter.banks.length})`)
    : (currentLanguage === 'zh-TW' ? '銀行' : 'Banks')
  }
</Text>
                            </Text>
                          </TouchableOpacity>
                          
                          <TouchableOpacity
                            style={styles.advancedFilterButton}
                            onPress={() => handleAdvancedFilterModalOpen('annualFees')}
                            activeOpacity={0.7}
                          >
                            <MaterialIcons name="attach-money" size={16} color="#666666" />
                            <Text style={styles.advancedFilterButtonText}>
                              <Text style={styles.advancedFilterButtonText}>
  {advancedFilter.annualFees.length > 0 
    ? (currentLanguage === 'zh-TW' 
        ? `年費 (${advancedFilter.annualFees.length})` 
        : `Annual Fee (${advancedFilter.annualFees.length})`)
    : (currentLanguage === 'zh-TW' ? '年費' : 'Annual Fee')
  }
</Text>
                            </Text>
                          </TouchableOpacity>
                          
                          {/* 🔥 修改：將比較按鈕改為分類按鈕 */}
                          <TouchableOpacity
                            style={styles.advancedFilterButton}
                            onPress={() => handleAdvancedFilterModalOpen('categories')}
                            activeOpacity={0.7}
                          >
                            <MaterialIcons name="category" size={16} color="#666666" />
                            <Text style={styles.advancedFilterButtonText}>
                              <Text style={styles.advancedFilterButtonText}>
  {advancedFilter.categories.length > 0 
    ? (currentLanguage === 'zh-TW' 
        ? `分類 (${advancedFilter.categories.length})` 
        : `Categories (${advancedFilter.categories.length})`)
    : (currentLanguage === 'zh-TW' ? '分類' : 'Categories')
  }
</Text>
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                      
                      {/* 🔥 進階篩選器狀態顯示 */}
                      {renderAdvancedFilterStatus()}
                      
                      {displayData.recommendedCards.map(renderCreditCard)}
                    </View>
                  )}

                  {/* 無推薦卡片時的提示 */}
                  {displayData.userMatchedCards.length === 0 && displayData.recommendedCards.length === 0 && (
                    <View style={styles.emptyState}>
                      <MaterialIcons name="search-off" size={64} color="#E0E0E0" />
                      <Text style={styles.emptyStateText}>
                        {searchQuery.trim() || advancedFilter.banks.length > 0 || advancedFilter.annualFees.length > 0 || advancedFilter.categories.length > 0
                          ? (currentLanguage === 'zh-TW' ? '找不到符合篩選條件的信用卡' : 'No credit cards found matching your filters')
                          : (currentLanguage === 'zh-TW' ? '此分類暫無相關信用卡' : 'No credit cards found in this category')
                        }
                      </Text>
                    </View>
                  )}
                </>
              )}
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </Animated.View>

      {/* 🔥 進階篩選器Modal */}
      <Modal
        visible={showAdvancedFilterModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAdvancedFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.filterModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
  {filterModalType === 'banks' 
    ? (currentLanguage === 'zh-TW' ? '選擇銀行' : 'Select Banks')
    : filterModalType === 'annualFees' 
    ? (currentLanguage === 'zh-TW' ? '選擇年費範圍' : 'Select Annual Fee Range')
    : (currentLanguage === 'zh-TW' ? '選擇分類' : 'Select Categories')
  }
</Text>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowAdvancedFilterModal(false)}
                activeOpacity={0.7}
              >
                <MaterialIcons name="close" size={24} color="#666666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.filterModalBody}>
              {filterModalType === 'banks' ? (
                // 銀行篩選選項
                <>
                  <View style={styles.filterSection}>
                    <View style={styles.filterSectionHeader}>
                      <Text style={styles.filterSectionTitle}>
  {currentLanguage === 'zh-TW' ? '可選銀行' : 'Available Banks'}
</Text>
                      <TouchableOpacity
                        style={styles.clearAllButton}
                        onPress={() => clearAdvancedFilter('banks')}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.clearAllButtonText}>清除全部</Text>
                      </TouchableOpacity>
                    </View>
                    {getAvailableBanks().map(bank => (
                      <TouchableOpacity
                        key={bank}
                        style={styles.filterOption}
                        onPress={() => handleAdvancedFilterSelect('banks', bank)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.filterOptionLeft}>
                          <MaterialIcons name="account-balance" size={20} color="#666666" />
                          <Text style={styles.filterOptionText}>
                            {currentLanguage === 'zh-TW' 
                               ? (BANK_TRANSLATIONS[bank]?.zh || bank)
                               : (BANK_TRANSLATIONS[bank]?.en || bank)
                        }
                        </Text>
                        </View>
                        <View style={[
                          styles.checkbox,
                          advancedFilter.banks.includes(bank) && styles.checkboxSelected
                        ]}>
                          {advancedFilter.banks.includes(bank) && (
                            <MaterialIcons name="check" size={16} color="#FFFFFF" />
                          )}
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              ) : filterModalType === 'annualFees' ? (
                // 年費篩選選項 - 修正為十萬單位
                <>
                  <View style={styles.filterSection}>
                    <View style={styles.filterSectionHeader}>
                      <Text style={styles.filterSectionTitle}>
  {currentLanguage === 'zh-TW' ? '年費範圍' : 'Annual Fee Range'}
</Text>
                      <TouchableOpacity
                        style={styles.clearAllButton}
                        onPress={() => clearAdvancedFilter('annualFees')}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.clearAllButtonText}>清除全部</Text>
                      </TouchableOpacity>
                    </View>
                    
                    {[
                     { id: 'free', label: '免費 (HK$0)', englishLabel: 'Free (HK$0)', icon: 'money-off' },
                     { id: 'low', label: '低 (≤HK$10萬)', englishLabel: 'Low (≤HK$100K)', icon: 'attach-money' },
                     { id: 'medium', label: '中 (HK$10萬-30萬)', englishLabel: 'Medium (HK$100K-300K)', icon: 'monetization-on' },
                     { id: 'high', label: '高 (>HK$30萬)', englishLabel: 'High (>HK$300K)', icon: 'diamond' }
                    ].map(option => (
                      <TouchableOpacity
                        key={option.id}
                        style={styles.filterOption}
                        onPress={() => handleAdvancedFilterSelect('annualFees', option.id)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.filterOptionLeft}>
                          <MaterialIcons name={option.icon} size={20} color="#666666" />
                          <Text style={styles.filterOptionText}>
                            {currentLanguage === 'zh-TW' ? option.label : option.englishLabel}
                          </Text>
                        </View>
                        <View style={[
                          styles.checkbox,
                          advancedFilter.annualFees.includes(option.id) && styles.checkboxSelected
                        ]}>
                          {advancedFilter.annualFees.includes(option.id) && (
                            <MaterialIcons name="check" size={16} color="#FFFFFF" />
                          )}
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              ) : (
                // 🔥 新增：分類篩選選項
                <>
                  <View style={styles.filterSection}>
                    <View style={styles.filterSectionHeader}>
                      <Text style={styles.filterSectionTitle}>
  {currentLanguage === 'zh-TW' ? '可選分類' : 'Available Categories'}
</Text>
                      <TouchableOpacity
                        style={styles.clearAllButton}
                        onPress={() => clearAdvancedFilter('categories')}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.clearAllButtonText}>清除全部</Text>
                      </TouchableOpacity>
                    </View>
                    {FILTER_CATEGORIES.map(category => (
                      <TouchableOpacity
                        key={category.id}
                        style={styles.filterOption}
                        onPress={() => handleAdvancedFilterSelect('categories', category.id)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.filterOptionLeft}>
                          <MaterialIcons name={category.icon} size={20} color="#666666" />
                          <Text style={styles.filterOptionText}>
  {currentLanguage === 'zh-TW' ? category.name : category.englishName}
</Text>
                        </View>
                        <View style={[
                          styles.checkbox,
                          advancedFilter.categories.includes(category.id) && styles.checkboxSelected
                        ]}>
                          {advancedFilter.categories.includes(category.id) && (
                            <MaterialIcons name="check" size={16} color="#FFFFFF" />
                          )}
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}
            </ScrollView>
            
            <View style={styles.filterModalFooter}>
              <TouchableOpacity
                style={styles.applyFilterButton}
                onPress={() => setShowAdvancedFilterModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.applyFilterButtonText}>
                  套用篩選 ({filterModalType === 'banks' ? advancedFilter.banks.length : 
                           filterModalType === 'annualFees' ? advancedFilter.annualFees.length : 
                           advancedFilter.categories.length})
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 🔥 信用卡比較Modal */}
      <Modal
        visible={showComparisonModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowComparisonModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.comparisonModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
  {currentLanguage === 'zh-TW' ? '信用卡比較' : 'Credit Card Comparison'}
</Text>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowComparisonModal(false)}
                activeOpacity={0.7}
              >
                <MaterialIcons name="close" size={24} color="#666666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.comparisonModalBody} showsVerticalScrollIndicator={false}>
              {selectedCardsForComparison.length === 2 && (
                <View style={styles.comparisonContent}>
                  {/* 🔥 卡片基本資訊比較 */}
                  <View style={styles.comparisonSection}>
                    <Text style={styles.comparisonSectionTitle}>
  {currentLanguage === 'zh-TW' ? '基本資訊' : 'Basic Information'}
</Text>
                    <View style={styles.comparisonTable}>
                      <View style={styles.comparisonRow}>
                        <View style={styles.comparisonLabel}>
                          <Text style={styles.comparisonLabelText}>
  {currentLanguage === 'zh-TW' ? '信用卡名稱' : 'Card Name'}
</Text>
                        </View>
                        <View style={styles.comparisonValues}>
  <View style={styles.comparisonValueCompact}>
    <Text style={styles.comparisonValueText}>{selectedCardsForComparison[0].name}</Text>
  </View>
  <View style={styles.comparisonValueCompact}>
    <Text style={styles.comparisonValueText}>{selectedCardsForComparison[1].name}</Text>
  </View>
</View>
                      </View>
                      
                      <View style={styles.comparisonRow}>
                        <View style={styles.comparisonLabel}>
                          <Text style={styles.comparisonLabelText}>
  {currentLanguage === 'zh-TW' ? '發卡銀行' : 'Issuing Bank'}
</Text>
                        </View>
                        <View style={styles.comparisonValues}>
  <View style={styles.comparisonValueCompact}>
    <Text style={styles.comparisonValueText}>{selectedCardsForComparison[0].bank}</Text>
  </View>
  <View style={styles.comparisonValueCompact}>
    <Text style={styles.comparisonValueText}>{selectedCardsForComparison[1].bank}</Text>
  </View>
</View>
                      </View>
                      
                      <View style={styles.comparisonRow}>
                        <View style={styles.comparisonLabel}>
                          <Text style={styles.comparisonLabelText}>
  {currentLanguage === 'zh-TW' ? '卡片品牌' : 'Card Brand'}
</Text>
                        </View>
                        <View style={styles.comparisonValues}>
  <View style={styles.comparisonValueCompact}>
    <Text style={styles.comparisonValueText}>{selectedCardsForComparison[0].label}</Text>
  </View>
  <View style={styles.comparisonValueCompact}>
    <Text style={styles.comparisonValueText}>{selectedCardsForComparison[1].label}</Text>
  </View>
</View>
                      </View>
                    </View>
                  </View>

                  {/* 🔥 財務條件比較 - 香港用戶最關注的部分 */}
                  <View style={styles.comparisonSection}>
                    <Text style={styles.comparisonSectionTitle}>
  {currentLanguage === 'zh-TW' ? '財務條件' : 'Financial Conditions'}
</Text>
                    <View style={styles.comparisonTable}>
                      <View style={styles.comparisonRow}>
                        <View style={styles.comparisonLabel}>
                          <Text style={styles.comparisonLabelText}>
  {currentLanguage === 'zh-TW' ? '回贈 / 里數' : 'Cashback / Miles'}
</Text>
                        </View>
                        <View style={styles.comparisonValues}>
                          <View style={[styles.comparisonValue, styles.highlightValue]}>
                            <Text style={[styles.comparisonValueText, styles.highlightValueText]}>
                              {selectedCardsForComparison[0].cashback}
                            </Text>
                          </View>
                          <View style={[styles.comparisonValue, styles.highlightValue]}>
                            <Text style={[styles.comparisonValueText, styles.highlightValueText]}>
                              {selectedCardsForComparison[1].cashback}
                            </Text>
                          </View>
                        </View>
                      </View>
                      
                      <View style={styles.comparisonRow}>
                        <View style={styles.comparisonLabel}>
                          <Text style={styles.comparisonLabelText}>
  {currentLanguage === 'zh-TW' ? '年費' : 'Annual Fee'}
</Text>
                        </View>
                        <View style={styles.comparisonValues}>
                          <View style={[styles.comparisonValue, styles.highlightValue]}>
                            <Text style={[styles.comparisonValueText, styles.highlightValueText]}>
                              {selectedCardsForComparison[0].annualFee === 0 ? '免費' : `HK$${selectedCardsForComparison[0].annualFee.toLocaleString()}`}
                            </Text>
                          </View>
                          <View style={[styles.comparisonValue, styles.highlightValue]}>
                            <Text style={[styles.comparisonValueText, styles.highlightValueText]}>
                              {selectedCardsForComparison[1].annualFee === 0 ? '免費' : `HK$${selectedCardsForComparison[1].annualFee.toLocaleString()}`}
                            </Text>
                          </View>
                        </View>
                      </View>
                      
                      <View style={styles.comparisonRow}>
                        <View style={styles.comparisonLabel}>
                          <Text style={styles.comparisonLabelText}>
  {currentLanguage === 'zh-TW' ? '年薪要求' : 'Minimum Income'}
</Text>
                        </View>
                        <View style={styles.comparisonValues}>
                          <View style={styles.comparisonValue}>
                            <Text style={styles.comparisonValueText}>
                              {selectedCardsForComparison[1].minAnnualIncome === 0 ? '無要求' : `HK${selectedCardsForComparison[1].minAnnualIncome.toLocaleString()}`}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* 🔥 優惠詳情比較 */}
                  <View style={styles.comparisonSection}>
                    <Text style={styles.comparisonSectionTitle}>
  {currentLanguage === 'zh-TW' ? '優惠詳情' : 'Offer Details'}
</Text>
                    <View style={styles.comparisonTable}>
                      <View style={styles.comparisonRow}>
                        <View style={styles.comparisonLabel}>
                          <Text style={styles.comparisonLabelText}>
  {currentLanguage === 'zh-TW' ? '主要優惠' : 'Main Offers'}
</Text>
                        </View>
                        <View style={styles.comparisonValues}>
  <View style={styles.comparisonValueLarge}>
    <Text style={styles.comparisonValueText} numberOfLines={8}>
      {selectedCardsForComparison[0].description}
    </Text>
  </View>
  <View style={styles.comparisonValueLarge}>
    <Text style={styles.comparisonValueText} numberOfLines={8}>
      {selectedCardsForComparison[1].description}
    </Text>
  </View>
</View>
                      </View>
                      
                      <View style={styles.comparisonRow}>
                        <View style={styles.comparisonLabel}>
                          <Text style={styles.comparisonLabelText}>
  {currentLanguage === 'zh-TW' ? '使用條件' : 'Terms & Conditions'}
</Text>
                        </View>
                        <View style={styles.comparisonValues}>
  <View style={styles.comparisonValueLarge}>
    <Text style={styles.comparisonValueText} numberOfLines={6}>
      {selectedCardsForComparison[0].conditions}
    </Text>
  </View>
  <View style={styles.comparisonValueLarge}>
    <Text style={styles.comparisonValueText} numberOfLines={6}>
      {selectedCardsForComparison[1].conditions}
    </Text>
  </View>
</View>
                      </View>
                    </View>
                  </View>

                  {/* 🔥 分類標籤比較 */}
                  <View style={styles.comparisonSection}>
                    <Text style={styles.comparisonSectionTitle}>
  {currentLanguage === 'zh-TW' ? '適用場景' : 'Usage Scenarios'}
</Text>
                    <View style={styles.comparisonTable}>
                      <View style={styles.comparisonRow}>
                        <View style={styles.comparisonLabel}>
                          <Text style={styles.comparisonLabelText}>
  {currentLanguage === 'zh-TW' ? '主要分類' : 'Main Categories'}
</Text>
                        </View>
                        <View style={styles.comparisonValues}>
                          <View style={styles.comparisonValue}>
                            <View style={styles.categoryTagsComparison}>
                              {safeCategoryArray(selectedCardsForComparison[0].category).slice(0, 2).map((category, idx) => (
                                <View key={idx} style={[styles.categoryTag, getCategoryTagStyle(category)]}>
                                  <Text style={[styles.categoryTagText, getCategoryTagTextStyle(category)]}>
                                    {CATEGORIES.find(cat => cat.id === category)?.name || category}
                                  </Text>
                                </View>
                              ))}
                            </View>
                          </View>
                          <View style={styles.comparisonValue}>
                            <View style={styles.categoryTagsComparison}>
                              {safeCategoryArray(selectedCardsForComparison[1].category).slice(0, 2).map((category, idx) => (
                                <View key={idx} style={[styles.categoryTag, getCategoryTagStyle(category)]}>
                                  <Text style={[styles.categoryTagText, getCategoryTagTextStyle(category)]}>
                                    {CATEGORIES.find(cat => cat.id === category)?.name || category}
                                  </Text>
                                </View>
                              ))}
                            </View>
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              )}
            </ScrollView>
            
            <View style={styles.comparisonModalFooter}>
              <TouchableOpacity
                style={styles.closeComparisonButton}
                onPress={handleCloseComparison}
                activeOpacity={0.7}
              >
                <Text style={styles.closeComparisonButtonText}>
  {currentLanguage === 'zh-TW' ? '關閉比較' : 'Close Comparison'}
</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 🔥 收藏列表模態框 */}
      <Modal
        visible={showFavoritesModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          console.log('🔒 收藏模態框關閉');
          setShowFavoritesModal(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {currentLanguage === 'zh-TW' ? '我的收藏' : 'My Favorites'}
              </Text>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => {
                  console.log('❌ 收藏模態框關閉按鈕被點擊');
                  setShowFavoritesModal(false);
                }}
                activeOpacity={0.7}
              >
                <MaterialIcons name="close" size={24} color="#666666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {(() => {
                console.log(`📱 === 模態框渲染開始 ===`);
                const favoriteCardsList = getFavoriteCards();
                console.log(`📊 模態框渲染，收藏卡片數量: ${favoriteCardsList.length}`);
                
                if (favoriteCardsList.length > 0) {
                  console.log(`✅ 準備渲染 ${favoriteCardsList.length} 張收藏卡片`);
                  favoriteCardsList.forEach((card, index) => {
                    console.log(`  ${index + 1}. ${card.name} (${card.id})`);
                  });
                  
                  return favoriteCardsList.map((card, index) => {
                    console.log(`🎨 渲染收藏卡片 ${index + 1}: ${card.name}`);
                    return renderCreditCard(card, index);
                  });
                } else {
                  console.log('📭 顯示空收藏狀態');
                  return (
                    <View style={styles.emptyFavorites}>
                      <MaterialIcons name="favorite-border" size={64} color="#E0E0E0" />
                      <Text style={styles.emptyFavoritesTitle}>
                        {currentLanguage === 'zh-TW' ? '尚未收藏任何卡片' : 'No favorites yet'}
                      </Text>
                      <Text style={styles.emptyFavoritesSubtitle}>
                        {currentLanguage === 'zh-TW' ? '點擊卡片上的愛心圖示來收藏您喜歡的信用卡' : 'Tap the heart icon on cards to add them to your favorites'}
                      </Text>
                    </View>
                  );
                }
              })()}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// 🔥 全新優化的樣式定義 - 適應新的進階篩選器和比較功能
const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  backgroundLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#F5F5F5',
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
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666666',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  refreshButton: {
    padding: 8,
  },
  favoriteHeaderButton: {
    padding: 8,
    position: 'relative',
  },
  favoriteBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#E91E63',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#666666',
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333333',
    marginLeft: 8,
  },
  filterSection: {
    paddingVertical: 10,
  },
  categoriesScroll: {
    flex: 1,
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  selectedCategoryButton: {
    backgroundColor: '#007AFF',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 4,
    fontWeight: '500',
  },
  selectedCategoryButtonText: {
    color: '#FFFFFF',
  },
  contentSection: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 5,
  },
  section: {
    marginBottom: 32,
  },
  // 🔥 新增：重新設計的section header佈局
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  sectionHeaderLeft: {
  flex: 1,
  minWidth: 0, // 🔥 新增：防止flex收縮過度
  paddingRight: 8, // 🔥 新增：確保與右側按鈕有適當間距
},
  sectionHeaderRight: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 6, // 🔥 修正：減少按鈕間距
  marginLeft: 8, // 🔥 修正：減少左邊距
  flexShrink: 0, // 🔥 新增：防止按鈕被壓縮
  flexWrap: 'wrap', // 🔥 新增：允許按鈕換行
},
  sectionHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666666',
  },
  // 🔥 新增：進階篩選器按鈕樣式
  advancedFilterButton: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#F8F8F8',
  borderRadius: 8,
  paddingHorizontal: 8, // 🔥 修正：減少水平內距
  paddingVertical: 5, // 🔥 修正：減少垂直內距
  borderWidth: 1,
  borderColor: '#E5E7EB',
  minWidth: 60, // 🔥 新增：設定最小寬度
  maxWidth: 100, // 🔥 新增：設定最大寬度，防止文字過長
},
advancedFilterButtonText: {
  fontSize: 11, // 🔥 修正：稍微減小字體，適應更長的英文文字
  color: '#666666',
  marginLeft: 3, // 🔥 修正：減少左邊距
  fontWeight: '500',
  textAlign: 'center', // 🔥 新增：文字置中
  flexShrink: 1, // 🔥 新增：允許文字收縮
},
  advancedFilterButtonTextActive: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  // 🔥 新增：進階篩選器狀態顯示
  activeFiltersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  activeFiltersText: {
    fontSize: 12,
    color: '#1E40AF',
    fontWeight: '500',
  },
  clearFiltersButton: {
    padding: 4,
  },
  // 🔥 新增：比較功能界面樣式
  comparisonInterface: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  comparisonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  comparisonTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  comparisonTitleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0C4A6E',
    marginLeft: 6,
  },
  comparisonActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  startComparisonButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  startComparisonButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  cancelComparisonButton: {
    padding: 4,
  },
  selectedCardsPreview: {
    gap: 4,
  },
  selectedCardPreview: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  selectedCardName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0C4A6E',
  },
  selectedCardBank: {
    fontSize: 11,
    color: '#075985',
  },
  // 🔥 全新優化的卡片樣式
  cardItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    position: 'relative',
  },
  selectedCardItem: {
    borderColor: '#3B82F6',
    borderWidth: 2,
    backgroundColor: '#F8FAFF',
  },
  // 🔥 新增：比較模式選擇器
  compareSelector: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  compareSelectorSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#3B82F6',
  },
  compareSelectorInner: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  compareSelectorInnerSelected: {
    backgroundColor: '#3B82F6',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardInfo: {
    flex: 1,
    marginRight: 12,
  },
  cardName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 6,
    lineHeight: 24,
  },
  bankContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bankName: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
    fontWeight: '500',
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cashbackContainer: {
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  cashbackText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 20,
  },
  cashbackLabel: {
    fontSize: 10,
    color: '#DBEAFE',
    fontWeight: '500',
    marginTop: 2,
  },
  favoriteButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
  },
  // 🔥 新增：財務資訊區域
  financialInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
    marginRight: 4,
  },
  infoValue: {
    fontSize: 12,
    color: '#1F2937',
    fontWeight: '600',
  },
  cardTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  categoryTag: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  categoryTagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  userCardTag: {
    backgroundColor: '#DCFCE7',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  userCardTagText: {
    fontSize: 11,
    color: '#166534',
    fontWeight: '600',
  },
  cardBrandTag: {
    backgroundColor: '#F3F4F6',
  },
  cardBrandTagText: {
    fontSize: 10,
    color: '#374151',
    fontWeight: '500',
  },
  cardDescription: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 12,
  },
  conditionsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  conditionsText: {
    fontSize: 12,
    color: '#92400E',
    marginLeft: 6,
    flex: 1,
    lineHeight: 16,
  },
  // 🔥 新增：卡片動作區域
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
    justifyContent: 'center',
  },
  disabledActionButton: {
    backgroundColor: '#F3F4F6',
  },
  actionButtonText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
    marginLeft: 4,
  },
  disabledActionButtonText: {
    color: '#9CA3AF',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 24,
  },
  // 🔥 Modal樣式
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: 100,
    paddingTop: 20,
  },
  // 🔥 新增：進階篩選器Modal樣式
  filterModalContent: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: 200,
    paddingTop: 20,
  },
  filterModalBody: {
    flex: 1,
    paddingHorizontal: 20,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  clearAllButton: {
    padding: 4,
  },
  clearAllButtonText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '500',
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 8,
  },
  filterOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  filterOptionText: {
    fontSize: 14,
    color: '#333333',
    marginLeft: 8,
    fontWeight: '500',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  filterModalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  applyFilterButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  applyFilterButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // 🔥 新增：比較Modal樣式
  comparisonModalContent: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: 50,
    paddingTop: 20,
  },
  comparisonModalBody: {
    flex: 1,
    paddingHorizontal: 20,
  },
  comparisonContent: {
    paddingBottom: 40,
  },
  comparisonSection: {
    marginBottom: 24,
  },
  comparisonSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#E5E7EB',
  },
  comparisonTable: {
  backgroundColor: '#F9FAFB',
  borderRadius: 12,
  overflow: 'hidden',
  minHeight: 100, // 🔥 新增：設定最小高度以確保充足空間
},
  comparisonRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  comparisonLabel: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
  },
  comparisonLabelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  comparisonValues: {
    flex: 2,
    flexDirection: 'row',
  },
comparisonValue: {
  flex: 1,
  paddingVertical: 16, // 🔥 修正：適中的垂直內距，適用於中等長度文字
  paddingHorizontal: 16,
  justifyContent: 'center', // 🔥 修正：中等文字置中顯示
  borderLeftWidth: 1,
  borderLeftColor: '#E5E7EB',
  minHeight: 70, // 🔥 修正：適中的最小高度
},
// 🔥 新增：主要優惠專用的大空間樣式
  comparisonValueLarge: {
    flex: 1,
    paddingVertical: 32, // 🔥 專為長文字設計：更大的垂直內距
    paddingHorizontal: 20,
    justifyContent: 'flex-start',
    borderLeftWidth: 1,
    borderLeftColor: '#E5E7EB',
    minHeight: 150, // 🔥 專為長文字設計：更大的最小高度
  },
  // 🔥 新增：短文字專用的緊湊樣式
  comparisonValueCompact: {
    flex: 1,
    paddingVertical: 12, // 🔥 專為短文字設計：緊湊的垂直內距
    paddingHorizontal: 16,
    justifyContent: 'center', // 🔥 短文字置中顯示更美觀
    borderLeftWidth: 1,
    borderLeftColor: '#E5E7EB',
    minHeight: 50, // 🔥 專為短文字設計：緊湊的最小高度
  },
  highlightValue: {
    backgroundColor: '#FEF3C7',
  },
comparisonValueText: {
  fontSize: 12, // 🔥 進一步修正：再次減小字體以容納更多內容
  color: '#374151',
  fontWeight: '500',
  lineHeight: 16, // 🔥 進一步修正：調整行高以容納更多行數
  textAlign: 'left',
  flexWrap: 'wrap', // 🔥 新增：允許文字換行
},
  highlightValueText: {
    fontWeight: '700',
    color: '#D97706',
  },
  categoryTagsComparison: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  comparisonModalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  closeComparisonButton: {
    backgroundColor: '#6B7280',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  closeComparisonButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  emptyFavorites: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyFavoritesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyFavoritesSubtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 20,
  },
// 🔥 新增：英文模式專用的兩行佈局樣式
  englishSectionHeader: {
    marginBottom: 16,
  },
  englishHeaderRow: {
    marginBottom: 12,
  },
  englishFiltersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
})