// data-management/sync_credit_card_data.js
// 🔥 智能自動同步系統：監控MoneyHero網站變化並智能更新Firebase
// 🧠 核心特色：保護手動修改、智能衝突解決、增量更新

const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  doc, 
  getDoc,
  setDoc, 
  updateDoc,
  getDocs 
} = require('firebase/firestore');
const axios = require('axios');
const cheerio = require('cheerio');
const cron = require('node-cron');

// Firebase配置
const firebaseConfig = {
  apiKey: "AIzaSyAyP7KAdGvb0r_K30P1BAxnrMhfZlBI4-8",
  authDomain: "credit-card-manager-barry.firebaseapp.com",
  projectId: "credit-card-manager-barry",
  storageBucket: "credit-card-manager-barry.firebasestorage.app",
  messagingSenderId: "941634977022",
  appId: "1:941634977022:web:0af55c0beb12a4e10d39af",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * 🔍 網站數據抓取器
 * 從MoneyHero網站抓取最新的信用卡資訊
 */
class MoneyHeroScraper {
  constructor() {
    this.baseUrl = 'https://www.moneyhero.com.hk/zh/credit-card/all';
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'zh-HK,zh;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    };
  }

  /**
   * 從網站抓取信用卡資料
   */
  async scrapeLatestData() {
    try {
      console.log('🕷️ 開始抓取MoneyHero網站最新資料...');
      console.log(`📡 目標網址: ${this.baseUrl}`);
      
      const response = await axios.get(this.baseUrl, { 
        headers: this.headers,
        timeout: 30000
      });
      
      const $ = cheerio.load(response.data);
      const creditCards = [];
      
      // 🔍 分析網頁結構，抓取信用卡資訊
      // 注意：這個選擇器需要根據實際網站結構調整
      $('.card-item, .product-card, .credit-card-item').each((index, element) => {
        try {
          const cardData = this.extractCardData($, element);
          if (cardData && cardData.name) {
            creditCards.push(cardData);
          }
        } catch (error) {
          console.warn(`⚠️ 提取第 ${index + 1} 張卡片時出錯:`, error.message);
        }
      });

      console.log(`✅ 成功抓取 ${creditCards.length} 張信用卡資料`);
      return creditCards;
      
    } catch (error) {
      console.error('❌ 抓取網站資料失敗:', error.message);
      throw error;
    }
  }

  /**
   * 從HTML元素中提取信用卡資訊
   */
  extractCardData($, element) {
    const $el = $(element);
    
    // 🔍 提取基本資訊
    const name = $el.find('.card-name, .product-name, h3, h4').first().text().trim();
    const bank = $el.find('.bank-name, .issuer').first().text().trim();
    const cashback = $el.find('.cashback, .rate, .reward').first().text().trim();
    const description = $el.find('.description, .features').first().text().trim();
    
    // 🔄 數據清理和標準化
    if (!name || name.length < 3) return null;
    
    return {
      name: this.cleanText(name),
      bank: this.inferBank(name, bank),
      cashback: this.standardizeCashback(cashback),
      description: this.cleanText(description),
      category: this.inferCategory(name, description, cashback),
      scrapedAt: new Date().toISOString(),
      source: 'moneyhero_website'
    };
  }

  /**
   * 清理文本內容
   */
  cleanText(text) {
    return text.replace(/\s+/g, ' ').trim().substring(0, 200);
  }

  /**
   * 推斷銀行名稱
   */
  inferBank(cardName, bankText) {
    const bankMappings = {
      '恒生': '恒生銀行',
      '滙豐': '滙豐銀行', 
      'HSBC': '滙豐銀行',
      '渣打': '渣打銀行',
      'SCB': '渣打銀行',
      '星展': '星展銀行',
      'DBS': '星展銀行',
      '花旗': '花旗銀行',
      'Citi': '花旗銀行',
      '安信': '安信',
      'Mox': 'Mox Bank',
      'AEON': 'AEON',
      '東亞': '東亞銀行',
      'BEA': '東亞銀行',
      '大新': '大新銀行',
      '信銀': '信銀國際',
      '美國運通': '美國運通',
      'Amex': '美國運通',
      '建行': '建行(亞洲)'
    };

    // 首先嘗試從卡片名稱推斷
    for (const [keyword, fullBankName] of Object.entries(bankMappings)) {
      if (cardName.includes(keyword)) {
        return fullBankName;
      }
    }

    // 如果有明確的銀行文本，使用映射
    if (bankText) {
      for (const [keyword, fullBankName] of Object.entries(bankMappings)) {
        if (bankText.includes(keyword)) {
          return fullBankName;
        }
      }
      return bankText.trim();
    }

    return '未知銀行';
  }

  /**
   * 標準化回贈格式
   */
  standardizeCashback(cashbackText) {
    if (!cashbackText) return '詳情請查看';
    
    // 清理文本
    let cleaned = cashbackText.replace(/[^\d%$.\-\/里積分]/g, ' ').trim();
    
    // 檢查是否包含里數
    if (cashbackText.includes('里') || cashbackText.includes('mile')) {
      // 嘗試提取里數比率
      const match = cleaned.match(/\$?(\d+)[^\d]*里/);
      if (match) {
        return `$${match[1]}/里`;
      }
      return '里數回贈';
    }
    
    // 檢查百分比
    const percentMatch = cleaned.match(/(\d+(?:\.\d+)?)%/);
    if (percentMatch) {
      return `${percentMatch[1]}%`;
    }
    
    return cashbackText.substring(0, 50);
  }

  /**
   * 推斷信用卡分類
   */
  inferCategory(name, description, cashback) {
    const categoryKeywords = {
      '基本回贈': ['基本', '全方位', '一般', 'basic', 'earnmore'],
      '外幣': ['外幣', '海外', '旅遊', '機票', 'travel', 'overseas'],
      '手機支付': ['手機', '流動', 'apple pay', 'google pay', 'paywave', 'mmpower'],
      '網上購物': ['網購', '網上', 'online', '電商', 'red', 'live fresh'],
      '超市購物': ['超市', '百佳', 'park', 'smart', '惠康'],
      '餐飲美食': ['餐飲', '食肆', '飲食', 'dining', 'eminent', 'enjoy'],
      '青年學生': ['學生', '青年', 'student', '大學', 'wakuwaku'],
      '里數': ['里', 'mile', 'asia mile', 'avios', 'ana', '國泰', 'cathay']
    };

    const fullText = `${name} ${description} ${cashback}`.toLowerCase();
    
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      for (const keyword of keywords) {
        if (fullText.includes(keyword.toLowerCase())) {
          return category;
        }
      }
    }
    
    return '基本回贈';
  }
}

/**
 * 🔄 智能數據同步管理器
 * 負責比較新舊數據並智能處理衝突
 */
class IntelligentSyncManager {
  constructor() {
    this.scraper = new MoneyHeroScraper();
  }

  /**
   * 🧠 核心同步邏輯：智能處理資料衝突
   */
  async performIntelligentSync() {
    try {
      console.log('\n🚀 開始智能同步流程');
      console.log('🧠 這個系統會保護您的手動修改，只更新真正變化的資料');
      console.log('=' .repeat(80));

      // 步驟1: 獲取網站最新資料
      console.log('\n📋 步驟 1/4: 抓取網站最新資料');
      const webData = await this.scraper.scrapeLatestData();
      
      if (webData.length === 0) {
        console.log('⚠️ 未能從網站抓取到有效資料，跳過本次同步');
        return;
      }

      // 步驟2: 獲取Firebase現有資料
      console.log('\n📋 步驟 2/4: 讀取Firebase現有資料');
      const firebaseData = await this.getFirebaseData();
      
      // 步驟3: 智能比較和衝突檢測
      console.log('\n📋 步驟 3/4: 智能資料比較');
      const syncPlan = await this.createSyncPlan(webData, firebaseData);
      
      // 步驟4: 執行同步計劃
      console.log('\n📋 步驟 4/4: 執行智能同步');
      await this.executeSyncPlan(syncPlan);
      
      console.log('\n🎉 智能同步完成！');
      
    } catch (error) {
      console.error('\n❌ 同步過程中發生錯誤:', error);
      throw error;
    }
  }

  /**
   * 獲取Firebase中的現有資料
   */
  async getFirebaseData() {
    try {
      const querySnapshot = await getDocs(collection(db, 'credit_cards'));
      const firebaseCards = [];
      
      querySnapshot.forEach((doc) => {
        firebaseCards.push({ 
          firestoreId: doc.id, 
          ...doc.data() 
        });
      });
      
      console.log(`📊 Firebase中現有 ${firebaseCards.length} 張信用卡`);
      return firebaseCards;
      
    } catch (error) {
      console.error('❌ 讀取Firebase資料失敗:', error);
      throw error;
    }
  }

  /**
   * 🧠 創建智能同步計劃
   * 這是整個系統最核心的邏輯，決定如何處理每張卡片
   */
  async createSyncPlan(webData, firebaseData) {
    console.log('🧠 開始建立智能同步計劃...');
    
    const syncPlan = {
      toAdd: [],        // 新增的卡片
      toUpdate: [],     // 需要更新的卡片
      toKeep: [],       // 保持不變的卡片
      conflicts: [],    // 需要人工處理的衝突
      toArchive: []     // 網站上已不存在的卡片
    };

    // 為Firebase中的每張卡片建立查找索引
    const firebaseCardMap = new Map();
    firebaseData.forEach(card => {
      // 使用多種方式建立索引，提高匹配準確性
      if (card.id) firebaseCardMap.set(card.id, card);
      if (card.name) firebaseCardMap.set(this.normalizeCardName(card.name), card);
    });

    // 🔍 分析網站資料，決定同步策略
    for (const webCard of webData) {
      const matchingFirebaseCard = this.findMatchingCard(webCard, firebaseData);
      
      if (!matchingFirebaseCard) {
        // 🆕 新卡片：直接加入
        console.log(`🆕 發現新卡片: ${webCard.name}`);
        syncPlan.toAdd.push(this.prepareNewCard(webCard));
      } else {
        // 🔄 現有卡片：檢查是否需要更新
        const updateResult = this.analyzeCardChanges(webCard, matchingFirebaseCard);
        
        if (updateResult.hasConflict) {
          console.log(`⚠️ 發現衝突: ${webCard.name}`);
          syncPlan.conflicts.push(updateResult);
        } else if (updateResult.needsUpdate) {
          console.log(`🔄 需要更新: ${webCard.name}`);
          syncPlan.toUpdate.push(updateResult);
        } else {
          console.log(`✅ 無需更改: ${webCard.name}`);
          syncPlan.toKeep.push(matchingFirebaseCard);
        }
      }
    }

    // 🔍 檢查Firebase中是否有網站上已不存在的卡片
    const webCardNames = new Set(webData.map(card => this.normalizeCardName(card.name)));
    firebaseData.forEach(fbCard => {
      if (!webCardNames.has(this.normalizeCardName(fbCard.name))) {
        // 🗂️ 判斷是手動添加還是已下架
        if (this.isManuallyAdded(fbCard)) {
          console.log(`🛡️ 保護手動添加的卡片: ${fbCard.name}`);
          syncPlan.toKeep.push(fbCard);
        } else {
          console.log(`📂 卡片可能已下架: ${fbCard.name}`);
          syncPlan.toArchive.push(fbCard);
        }
      }
    });

    // 📊 輸出同步計劃摘要
    console.log('\n📊 同步計劃摘要:');
    console.log(`🆕 新增卡片: ${syncPlan.toAdd.length}`);
    console.log(`🔄 更新卡片: ${syncPlan.toUpdate.length}`);
    console.log(`⚠️ 衝突卡片: ${syncPlan.conflicts.length}`);
    console.log(`✅ 保持卡片: ${syncPlan.toKeep.length}`);
    console.log(`📂 歸檔卡片: ${syncPlan.toArchive.length}`);
    
    return syncPlan;
  }

  /**
   * 尋找匹配的Firebase卡片
   */
  findMatchingCard(webCard, firebaseCards) {
    const webCardName = this.normalizeCardName(webCard.name);
    
    // 方法1: 精確名稱匹配
    let match = firebaseCards.find(fbCard => 
      this.normalizeCardName(fbCard.name) === webCardName
    );
    if (match) return match;
    
    // 方法2: 部分名稱匹配
    match = firebaseCards.find(fbCard => {
      const fbName = this.normalizeCardName(fbCard.name);
      return fbName.includes(webCardName) || webCardName.includes(fbName);
    });
    if (match) return match;
    
    // 方法3: 銀行+關鍵字匹配
    if (webCard.bank) {
      match = firebaseCards.find(fbCard => 
        fbCard.bank === webCard.bank && 
        this.calculateSimilarity(webCardName, this.normalizeCardName(fbCard.name)) > 0.7
      );
    }
    
    return match;
  }

  /**
   * 分析卡片變化
   */
  analyzeCardChanges(webCard, firebaseCard) {
    const changes = {};
    let hasConflict = false;
    let needsUpdate = false;

    // 🔍 檢查關鍵欄位的變化
    const fieldsToCheck = ['cashback', 'description', 'bank'];
    
    for (const field of fieldsToCheck) {
      const webValue = this.normalizeValue(webCard[field]);
      const firebaseValue = this.normalizeValue(firebaseCard[field]);
      
      if (webValue && webValue !== firebaseValue) {
        // 🧠 判斷是否為手動修改
        if (this.isManuallyModified(firebaseCard, field)) {
          console.log(`⚠️ 檢測到手動修改的欄位: ${firebaseCard.name}.${field}`);
          hasConflict = true;
          changes[field] = {
            current: firebaseValue,
            web: webValue,
            action: 'CONFLICT_PROTECT_MANUAL'
          };
        } else {
          needsUpdate = true;
          changes[field] = {
            current: firebaseValue,
            web: webValue,
            action: 'UPDATE_FROM_WEB'
          };
        }
      }
    }

    return {
      firebaseCard,
      webCard,
      changes,
      hasConflict,
      needsUpdate,
      conflictResolution: hasConflict ? 'PROTECT_MANUAL_CHANGES' : null
    };
  }

  /**
   * 判斷是否為手動修改
   */
  isManuallyModified(firebaseCard, field) {
    // 🔍 檢查元數據標記
    if (firebaseCard.manuallyModified && firebaseCard.manuallyModified[field]) {
      return true;
    }
    
    // 🔍 檢查資料來源
    if (firebaseCard.dataSource === 'manual_entry') {
      return true;
    }
    
    // 🔍 檢查最後修改時間
    if (firebaseCard.lastManualUpdate) {
      const lastManualUpdate = new Date(firebaseCard.lastManualUpdate);
      const lastAutoSync = new Date(firebaseCard.lastSyncDate || 0);
      if (lastManualUpdate > lastAutoSync) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * 判斷是否為手動添加的卡片
   */
  isManuallyAdded(firebaseCard) {
    return firebaseCard.dataSource === 'manual_entry' || 
           firebaseCard.addedBy === 'user' ||
           !firebaseCard.dataSource; // 舊資料沒有dataSource標記，保守處理
  }

  /**
   * 執行同步計劃
   */
  async executeSyncPlan(syncPlan) {
    let successCount = 0;
    let errorCount = 0;

    try {
      // 🆕 處理新增卡片
      for (const newCard of syncPlan.toAdd) {
        try {
          await this.addNewCard(newCard);
          successCount++;
          console.log(`✅ 新增卡片成功: ${newCard.name}`);
        } catch (error) {
          errorCount++;
          console.error(`❌ 新增卡片失敗: ${newCard.name}`, error.message);
        }
      }

      // 🔄 處理更新卡片
      for (const updateInfo of syncPlan.toUpdate) {
        try {
          await this.updateCard(updateInfo);
          successCount++;
          console.log(`✅ 更新卡片成功: ${updateInfo.firebaseCard.name}`);
        } catch (error) {
          errorCount++;
          console.error(`❌ 更新卡片失敗: ${updateInfo.firebaseCard.name}`, error.message);
        }
      }

      // ⚠️ 處理衝突（記錄但不強制更新）
      if (syncPlan.conflicts.length > 0) {
        console.log('\n⚠️ 衝突處理報告:');
        for (const conflict of syncPlan.conflicts) {
          console.log(`🛡️ 保護手動修改: ${conflict.firebaseCard.name}`);
          // 記錄衝突但保留原有數據
          await this.recordConflict(conflict);
        }
      }

      // 📂 處理歸檔卡片（標記為非活躍而不是刪除）
      for (const archivedCard of syncPlan.toArchive) {
        try {
          await this.archiveCard(archivedCard);
          console.log(`📂 歸檔卡片: ${archivedCard.name}`);
        } catch (error) {
          console.error(`❌ 歸檔卡片失敗: ${archivedCard.name}`, error.message);
        }
      }

      console.log('\n📊 同步結果統計:');
      console.log(`✅ 成功操作: ${successCount}`);
      console.log(`❌ 失敗操作: ${errorCount}`);
      console.log(`🛡️ 受保護的手動修改: ${syncPlan.conflicts.length}`);

    } catch (error) {
      console.error('❌ 執行同步計劃時發生錯誤:', error);
      throw error;
    }
  }

  /**
   * 添加新卡片
   */
  async addNewCard(cardData) {
    const cardId = this.generateCardId(cardData);
    await setDoc(doc(db, 'credit_cards', cardId), {
      ...cardData,
      id: cardId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastSyncDate: new Date().toISOString(),
      dataSource: 'auto_sync',
      version: '2.1',
      isActive: true
    });
  }

  /**
   * 更新現有卡片
   */
  async updateCard(updateInfo) {
    const { firebaseCard, changes } = updateInfo;
    const updateData = {};
    
    // 只更新變化的欄位
    for (const [field, changeInfo] of Object.entries(changes)) {
      if (changeInfo.action === 'UPDATE_FROM_WEB') {
        updateData[field] = changeInfo.web;
      }
    }
    
    updateData.updatedAt = new Date().toISOString();
    updateData.lastSyncDate = new Date().toISOString();
    
    await updateDoc(doc(db, 'credit_cards', firebaseCard.firestoreId), updateData);
  }

  /**
   * 記錄衝突
   */
  async recordConflict(conflict) {
    const conflictData = {
      conflictDetectedAt: new Date().toISOString(),
      conflictReason: 'MANUAL_MODIFICATION_PROTECTED',
      webData: conflict.webCard,
      conflictFields: Object.keys(conflict.changes)
    };
    
    await updateDoc(doc(db, 'credit_cards', conflict.firebaseCard.firestoreId), {
      lastConflict: conflictData,
      lastSyncDate: new Date().toISOString()
    });
  }

  /**
   * 歸檔卡片（標記為非活躍）
   */
  async archiveCard(card) {
    await updateDoc(doc(db, 'credit_cards', card.firestoreId), {
      isActive: false,
      archivedAt: new Date().toISOString(),
      archiveReason: 'NOT_FOUND_ON_WEBSITE'
    });
  }

  // 輔助函數
  normalizeCardName(name) {
    return name ? name.replace(/[^\w\s]/g, '').toLowerCase().trim() : '';
  }

  normalizeValue(value) {
    return value ? value.toString().trim() : '';
  }

  calculateSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    const editDistance = this.getEditDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  getEditDistance(str1, str2) {
    const matrix = [];
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[str2.length][str1.length];
  }

  generateCardId(cardData) {
    const bankCode = this.getBankCode(cardData.bank);
    const cardType = this.getCardType(cardData.name, cardData.category);
    return `${bankCode}_${cardType}_${Date.now()}`.toLowerCase();
  }

  getBankCode(bankName) {
    const bankCodes = {
      '恒生銀行': 'hang_seng',
      '滙豐銀行': 'hsbc', 
      '渣打銀行': 'scb',
      '星展銀行': 'dbs',
      '花旗銀行': 'citi',
      '安信': 'anx',
      'Mox Bank': 'mox',
      'AEON': 'aeon',
      '東亞銀行': 'bea',
      '大新銀行': 'dah_sing',
      '信銀國際': 'cncbi',
      '美國運通': 'ae',
      '建行(亞洲)': 'ccb'
    };
    return bankCodes[bankName] || 'unknown';
  }

  getCardType(cardName, category) {
    if (cardName.includes('白金')) return 'platinum';
    if (cardName.includes('金卡')) return 'gold';
    if (cardName.includes('學生')) return 'student';
    if (category === '里數') return 'miles';
    return 'general';
  }

  prepareNewCard(webCard) {
    return {
      name: webCard.name,
      bank: webCard.bank,
      category: [webCard.category],
      cashback: webCard.cashback,
      description: webCard.description || `${webCard.name}提供優質的信用卡服務`,
      conditions: '請查看官方條款細則',
      nameVariations: [webCard.name],
      searchKeywords: [webCard.name, webCard.bank, webCard.category],
      minAnnualIncome: 0,
      annualFee: 0,
      label: 'VISA'
    };
  }
}

/**
 * 🕐 定時任務調度器
 */
class SyncScheduler {
  constructor() {
    this.syncManager = new IntelligentSyncManager();
  }

  /**
   * 啟動定時同步任務
   */
  startScheduledSync() {
    console.log('🕐 啟動定時同步任務...');
    console.log('📅 同步計劃: 每天凌晨2點和下午2點自動檢查更新');
    
    // 每天凌晨2點執行同步
    cron.schedule('0 2 * * *', async () => {
      console.log('\n🌙 執行凌晨定時同步...');
      try {
        await this.syncManager.performIntelligentSync();
      } catch (error) {
        console.error('❌ 定時同步失敗:', error);
      }
    });

    // 每天下午2點執行同步  
    cron.schedule('0 14 * * *', async () => {
      console.log('\n☀️ 執行下午定時同步...');
      try {
        await this.syncManager.performIntelligentSync();
      } catch (error) {
        console.error('❌ 定時同步失敗:', error);
      }
    });

    console.log('✅ 定時任務已啟動，程序將持續運行');
    console.log('💡 按 Ctrl+C 停止定時任務');
  }

  /**
   * 執行單次手動同步
   */
  async runManualSync() {
    console.log('🖐 執行手動同步...');
    try {
      await this.syncManager.performIntelligentSync();
    } catch (error) {
      console.error('❌ 手動同步失敗:', error);
      throw error;
    }
  }
}

/**
 * 🚀 主程序入口
 */
async function main() {
  console.log('🚀 智能信用卡數據同步系統啟動');
  console.log('🧠 系統特色: 保護手動修改、智能衝突檢測、增量更新');
  console.log('=' .repeat(80));

  const scheduler = new SyncScheduler();
  
  // 檢查命令行參數
  const args = process.argv.slice(2);
  
  if (args.includes('--schedule')) {
    // 啟動定時任務模式
    scheduler.startScheduledSync();
    
    // 保持程序運行
    process.on('SIGINT', () => {
      console.log('\n👋 接收到停止信號，正在關閉同步系統...');
      process.exit(0);
    });
    
  } else {
    // 執行單次同步
    try {
      await scheduler.runManualSync();
      console.log('\n🎉 同步完成！程序即將退出');
    } catch (error) {
      console.error('\n💥 同步失敗:', error);
      process.exit(1);
    }
  }
}

// 🔥 直接執行主函數
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { IntelligentSyncManager, SyncScheduler };