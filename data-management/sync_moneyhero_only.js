// data-management/sync_moneyhero_only.js
// 🔥 純淨版MoneyHero同步系統：只從MoneyHero網站同步，與清潔資料庫完美兼容
// 🧠 核心特色：保護手動修改、智能更新檢測、無多源衝突

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
 * 🔍 MoneyHero專用網站抓取器
 * 專門從MoneyHero網站抓取最新的信用卡資訊，與清潔資料庫格式完美兼容
 */
class CleanMoneyHeroScraper {
  constructor() {
    this.baseUrl = 'https://www.moneyhero.com.hk/zh/credit-card/all';
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'zh-HK,zh;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    };
  }

  /**
   * 從MoneyHero網站抓取最新信用卡資料
   */
  async scrapeLatestMoneyHeroData() {
    try {
      console.log('🕷️ 開始從MoneyHero網站抓取最新資料...');
      console.log('💡 只從MoneyHero單一可信來源獲取資料，確保資料一致性');
      console.log(`📡 目標網址: ${this.baseUrl}`);
      
      const response = await axios.get(this.baseUrl, { 
        headers: this.headers,
        timeout: 30000,
        maxRedirects: 5
      });
      
      if (response.status !== 200) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const $ = cheerio.load(response.data);
      const creditCards = [];
      
      // 🔍 多重選擇器策略，適應網站結構變化
      const cardSelectors = [
        '.card-item',
        '.product-card', 
        '.credit-card-item',
        '.card-container',
        '[data-testid*="credit-card"]',
        '.product-item'
      ];
      
      let totalCardsFound = 0;
      
      // 嘗試不同的選擇器
      for (const selector of cardSelectors) {
        const elements = $(selector);
        if (elements.length > 0) {
          console.log(`✅ 使用選擇器 "${selector}" 找到 ${elements.length} 個元素`);
          
          elements.each((index, element) => {
            try {
              const cardData = this.extractMoneyHeroCardData($, element);
              if (cardData && cardData.name && cardData.name.length > 3) {
                creditCards.push(cardData);
                totalCardsFound++;
                
                // 顯示前幾張卡片的詳情
                if (totalCardsFound <= 5) {
                  console.log(`📝 發現: ${cardData.name} (${cardData.bank}) - ${cardData.cashback}`);
                }
              }
            } catch (error) {
              console.warn(`⚠️ 提取第 ${index + 1} 張卡片時出錯:`, error.message);
            }
          });
          
          if (totalCardsFound > 0) {
            break; // 找到有效資料後停止嘗試其他選擇器
          }
        }
      }
      
      // 去除重複項目
      const uniqueCards = this.removeDuplicateCards(creditCards);
      
      console.log(`✅ 成功抓取 ${uniqueCards.length} 張獨特的信用卡資料`);
      console.log(`🧹 已自動去除 ${creditCards.length - uniqueCards.length} 個重複項目`);
      
      if (uniqueCards.length === 0) {
        console.log('⚠️ 網站結構可能已變更，使用備用資料抓取策略...');
        return await this.fallbackScrapeStrategy($);
      }
      
      return uniqueCards;
      
    } catch (error) {
      console.error('❌ 抓取MoneyHero網站資料失敗:', error.message);
      console.log('💡 這可能是因為網絡問題或網站結構變更');
      throw error;
    }
  }

  /**
   * 從HTML元素中提取MoneyHero信用卡資訊
   */
  extractMoneyHeroCardData($, element) {
    const $el = $(element);
    
    // 🔍 多重策略提取卡片名稱
    const name = this.extractCardName($el);
    if (!name) return null;
    
    // 🔍 提取銀行資訊
    const bank = this.extractBankName($el, name);
    
    // 🔍 提取回贈資訊
    const cashback = this.extractCashbackInfo($el);
    
    // 🔍 提取描述資訊
    const description = this.extractDescription($el);
    
    // 🔍 提取年費資訊
    const annualFee = this.extractAnnualFee($el);
    
    // 🔍 提取最低收入要求
    const minIncome = this.extractMinIncome($el);
    
    return {
      name: this.cleanText(name),
      bank: bank,
      cashback: this.standardizeMoneyHeroCashback(cashback),
      description: this.cleanText(description),
      category: this.inferCategoryFromMoneyHero(name, description, cashback),
      annualFee: annualFee,
      minAnnualIncome: minIncome,
      scrapedAt: new Date().toISOString(),
      source: 'moneyhero_website_clean',
      sourceUrl: this.baseUrl
    };
  }

  /**
   * 提取卡片名稱（多重策略）
   */
  extractCardName($el) {
    const nameSelectors = [
      '.card-name',
      '.product-name', 
      '.credit-card-name',
      'h1', 'h2', 'h3', 'h4',
      '[data-testid*="name"]',
      '.title',
      '.card-title'
    ];
    
    for (const selector of nameSelectors) {
      const nameText = $el.find(selector).first().text().trim();
      if (nameText && nameText.length > 3) {
        return nameText;
      }
    }
    
    return null;
  }

  /**
   * 提取銀行名稱
   */
  extractBankName($el, cardName) {
    // 首先嘗試從HTML中找到銀行資訊
    const bankSelectors = ['.bank-name', '.issuer', '.provider', '.bank'];
    
    for (const selector of bankSelectors) {
      const bankText = $el.find(selector).first().text().trim();
      if (bankText) {
        return this.standardizeBankName(bankText);
      }
    }
    
    // 如果找不到，從卡片名稱推斷
    return this.inferBankFromCardName(cardName);
  }

  /**
   * 提取回贈資訊
   */
  extractCashbackInfo($el) {
    const cashbackSelectors = [
      '.cashback', '.rate', '.reward', '.percentage',
      '.offer', '.benefit', '.return', '.bonus'
    ];
    
    for (const selector of cashbackSelectors) {
      const cashbackText = $el.find(selector).first().text().trim();
      if (cashbackText) {
        return cashbackText;
      }
    }
    
    return '詳情請查看';
  }

  /**
   * 標準化MoneyHero回贈格式
   */
  standardizeMoneyHeroCashback(cashbackText) {
    if (!cashbackText) return '詳情請查看';
    
    // 清理和標準化文本
    let cleaned = cashbackText.replace(/[^\d%$.\-\/里積分mile]/gi, ' ').trim();
    
    // 里數格式檢測和標準化
    if (cashbackText.includes('里') || /mile/i.test(cashbackText)) {
      const mileMatch = cleaned.match(/\$?(\d+)[^\d]*里/);
      if (mileMatch) {
        return `$${mileMatch[1]}/里`;
      }
      
      const mileMatchEng = cleaned.match(/\$?(\d+)[^\d]*mile/i);
      if (mileMatchEng) {
        return `$${mileMatchEng[1]}/里`;
      }
      
      return '里數回贈';
    }
    
    // 百分比格式檢測
    const percentMatch = cleaned.match(/(\d+(?:\.\d+)?)%/);
    if (percentMatch) {
      return `${percentMatch[1]}%`;
    }
    
    // 如果包含複雜的優惠描述，保留原文但限制長度
    if (cashbackText.length > 50) {
      return cashbackText.substring(0, 47) + '...';
    }
    
    return cashbackText;
  }

  /**
   * 從MoneyHero資料推斷分類
   */
  inferCategoryFromMoneyHero(name, description, cashback) {
    const fullText = `${name} ${description} ${cashback}`.toLowerCase();
    
    // 🔥 與清潔資料庫的分類系統保持一致
    const categoryKeywords = {
      '里數': ['里', 'mile', 'asia mile', 'avios', 'ana', '國泰', 'cathay', 'miles'],
      '外幣': ['外幣', '海外', '旅遊', '機票', 'travel', 'overseas', 'foreign'],
      '手機支付': ['手機', '流動', 'apple pay', 'google pay', 'paywave', 'mmpower', '流動支付'],
      '網上購物': ['網購', '網上', 'online', '電商', 'red', 'live fresh', '網上購物'],
      '超市購物': ['超市', '百佳', 'park', 'smart', '惠康', '超級市場'],
      '餐飲美食': ['餐飲', '食肆', '飲食', 'dining', 'eminent', 'enjoy'],
      '青年學生': ['學生', '青年', 'student', '大學', 'wakuwaku', '大專'],
      '基本回贈': ['基本', '全方位', '一般', 'basic', 'earnmore', 'cashback']
    };
    
    // 按照優先級匹配（先匹配更具體的分類）
    const priorityOrder = ['里數', '外幣', '手機支付', '網上購物', '超市購物', '餐飲美食', '青年學生', '基本回贈'];
    
    for (const category of priorityOrder) {
        const keywords = categoryKeywords[category];
        for (const keyword of keywords) {
            if (fullText.includes(keyword.toLowerCase())) {
                return category;
            }
        }
    }
    
    return '基本回贈'; // 預設分類
  }

  /**
   * 去除重複的信用卡
   */
  removeDuplicateCards(cards) {
    const seen = new Map();
    const unique = [];
    
    cards.forEach(card => {
      const key = this.normalizeCardName(card.name) + '_' + card.bank;
      if (!seen.has(key)) {
        seen.set(key, true);
        unique.push(card);
      }
    });
    
    return unique;
  }

  /**
   * 備用抓取策略
   */
  async fallbackScrapeStrategy($) {
    console.log('🔄 使用備用抓取策略...');
    
    // 嘗試從頁面標題和元數據抓取基本資訊
    const fallbackCards = [];
    
    // 這裡可以實現更保守的抓取邏輯
    // 例如，查找包含"信用卡"字樣的文本
    
    return fallbackCards;
  }

  // 輔助函數
  cleanText(text) {
    if (!text) return '';
    return text.replace(/\s+/g, ' ').trim().substring(0, 200);
  }

  standardizeBankName(bankText) {
    const bankMappings = {
      '恒生': '恒生銀行',
      'hang seng': '恒生銀行',
      '滙豐': '滙豐銀行', 
      'hsbc': '滙豐銀行',
      '渣打': '渣打銀行',
      'scb': '渣打銀行',
      'standard chartered': '渣打銀行',
      '星展': '星展銀行',
      'dbs': '星展銀行',
      '花旗': '花旗銀行',
      'citi': '花旗銀行',
      'citibank': '花旗銀行',
      '安信': '安信',
      'anx': '安信',
      'mox': 'Mox Bank',
      'aeon': 'AEON',
      '東亞': '東亞銀行',
      'bea': '東亞銀行',
      '大新': '大新銀行',
      'dah sing': '大新銀行',
      '信銀': '信銀國際',
      'cncbi': '信銀國際',
      '美國運通': '美國運通',
      'amex': '美國運通',
      'american express': '美國運通',
      '建行': '建行(亞洲)',
      'ccb': '建行(亞洲)'
    };

    const lowerBank = bankText.toLowerCase();
    for (const [keyword, fullBankName] of Object.entries(bankMappings)) {
      if (lowerBank.includes(keyword.toLowerCase())) {
        return fullBankName;
      }
    }

    return bankText.trim() || '未知銀行';
  }

  inferBankFromCardName(cardName) {
    return this.standardizeBankName(cardName);
  }

  extractDescription($el) {
    const descSelectors = [
      '.description', '.features', '.details', 
      '.benefit', '.offer-details', '.summary'
    ];
    
    for (const selector of descSelectors) {
      const desc = $el.find(selector).first().text().trim();
      if (desc && desc.length > 10) {
        return desc;
      }
    }
    
    return '';
  }

  extractAnnualFee($el) {
    const feeText = $el.find('.fee, .annual-fee, .cost').text();
    const feeMatch = feeText.match(/\$?(\d+)/);
    return feeMatch ? parseInt(feeMatch[1]) : 0;
  }

  extractMinIncome($el) {
    const incomeText = $el.find('.income, .salary, .requirement').text();
    const incomeMatch = incomeText.match(/\$?([\d,]+)/);
    return incomeMatch ? parseInt(incomeMatch[1].replace(/,/g, '')) : 0;
  }

  normalizeCardName(name) {
    return name ? name.replace(/[^\w\s]/g, '').toLowerCase().trim() : '';
  }
}

/**
 * 🔄 清潔版智能同步管理器
 * 專門處理MoneyHero資料與清潔Firebase資料庫的同步
 */
class CleanSyncManager {
  constructor() {
    this.scraper = new CleanMoneyHeroScraper();
  }

  /**
   * 🧠 執行純淨MoneyHero同步
   */
  async performCleanMoneyHeroSync() {
    try {
      console.log('\n🚀 開始純淨MoneyHero同步流程');
      console.log('💡 這個系統只從MoneyHero獲取資料，確保資料來源一致性');
      console.log('🛡️ 同時保護您的手動修改，只更新真正變化的資料');
      console.log('=' .repeat(80));

      // 步驟1: 獲取MoneyHero最新資料
      console.log('\n📋 步驟 1/4: 從MoneyHero抓取最新資料');
      const moneyHeroData = await this.scraper.scrapeLatestMoneyHeroData();
      
      if (moneyHeroData.length === 0) {
        console.log('⚠️ 未能從MoneyHero抓取到有效資料，跳過本次同步');
        console.log('💡 這可能是因為網站結構變更或網絡問題');
        return { success: false, reason: 'no_data_scraped' };
      }

      // 步驟2: 獲取Firebase現有資料
      console.log('\n📋 步驟 2/4: 讀取Firebase清潔資料庫');
      const firebaseData = await this.getCleanFirebaseData();
      
      // 步驟3: 智能比較和更新計劃
      console.log('\n📋 步驟 3/4: 智能資料比較分析');
      const syncPlan = await this.createCleanSyncPlan(moneyHeroData, firebaseData);
      
      // 步驟4: 執行同步計劃
      console.log('\n📋 步驟 4/4: 執行智能同步更新');
      const result = await this.executeCleanSyncPlan(syncPlan);
      
      console.log('\n🎉 純淨MoneyHero同步完成！');
      return { success: true, result };
      
    } catch (error) {
      console.error('\n❌ 同步過程中發生錯誤:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 獲取清潔的Firebase資料
   */
  async getCleanFirebaseData() {
    try {
      const querySnapshot = await getDocs(collection(db, 'credit_cards'));
      const firebaseCards = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        firebaseCards.push({ 
          firestoreId: doc.id,
          ...data
        });
      });
      
      console.log(`📊 Firebase中現有 ${firebaseCards.length} 張信用卡`);
      console.log(`🧹 其中清潔導入的卡片: ${firebaseCards.filter(card => 
        card.dataSource === 'hk_credit_cards_data_clean_import'
      ).length} 張`);
      
      return firebaseCards;
      
    } catch (error) {
      console.error('❌ 讀取Firebase資料失敗:', error);
      throw error;
    }
  }

  /**
   * 創建清潔同步計劃
   */
  async createCleanSyncPlan(moneyHeroData, firebaseData) {
    console.log('🧠 開始建立清潔同步計劃...');
    console.log('💡 只處理MoneyHero資料，避免多源衝突');
    
    const syncPlan = {
      toAdd: [],           // 新增的卡片
      toUpdate: [],        // 需要更新的卡片  
      toKeep: [],          // 保持不變的卡片
      protected: [],       // 受保護的手動修改
      skipped: []          // 跳過的卡片
    };

    // 為Firebase資料建立索引
    const firebaseCardMap = new Map();
    firebaseData.forEach(card => {
      if (card.name) {
        const normalizedName = this.normalizeCardName(card.name);
        firebaseCardMap.set(normalizedName, card);
        
        // 也用ID建立索引
        if (card.id) {
          firebaseCardMap.set(card.id, card);
        }
      }
    });

    // 分析MoneyHero資料
    for (const webCard of moneyHeroData) {
      const matchingFirebaseCard = this.findMatchingFirebaseCard(webCard, firebaseData);
      
      if (!matchingFirebaseCard) {
        // 🆕 全新卡片
        console.log(`🆕 發現新卡片: ${webCard.name} (${webCard.bank})`);
        syncPlan.toAdd.push(this.prepareNewCardData(webCard));
        
      } else {
        // 🔄 現有卡片，檢查是否需要更新
        const updateAnalysis = this.analyzeCardUpdateNeeds(webCard, matchingFirebaseCard);
        
        if (updateAnalysis.isProtected) {
          console.log(`🛡️ 保護手動修改: ${webCard.name}`);
          syncPlan.protected.push(updateAnalysis);
          
        } else if (updateAnalysis.needsUpdate) {
          console.log(`🔄 需要更新: ${webCard.name}`);
          syncPlan.toUpdate.push(updateAnalysis);
          
        } else {
          console.log(`✅ 無需更改: ${webCard.name}`);
          syncPlan.toKeep.push(matchingFirebaseCard);
        }
      }
    }

    // 📊 輸出同步計劃摘要
    console.log('\n📊 清潔同步計劃摘要:');
    console.log(`🆕 新增卡片: ${syncPlan.toAdd.length}`);
    console.log(`🔄 更新卡片: ${syncPlan.toUpdate.length}`);
    console.log(`🛡️ 受保護卡片: ${syncPlan.protected.length}`);
    console.log(`✅ 保持不變: ${syncPlan.toKeep.length}`);
    
    return syncPlan;
  }

  /**
   * 尋找匹配的Firebase卡片
   */
  findMatchingFirebaseCard(webCard, firebaseCards) {
    const webCardName = this.normalizeCardName(webCard.name);
    
    // 方法1: 精確名稱匹配
    let match = firebaseCards.find(fbCard => 
      this.normalizeCardName(fbCard.name) === webCardName
    );
    if (match) return match;
    
    // 方法2: 銀行+部分名稱匹配
    if (webCard.bank) {
      match = firebaseCards.find(fbCard => 
        fbCard.bank === webCard.bank && 
        (this.normalizeCardName(fbCard.name).includes(webCardName) || 
         webCardName.includes(this.normalizeCardName(fbCard.name)))
      );
      if (match) return match;
    }
    
    // 方法3: 高相似度匹配
    match = firebaseCards.find(fbCard => 
      this.calculateNameSimilarity(webCardName, this.normalizeCardName(fbCard.name)) > 0.8
    );
    
    return match;
  }

  /**
   * 分析卡片更新需求
   */
  analyzeCardUpdateNeeds(webCard, firebaseCard) {
    const changes = {};
    let needsUpdate = false;

    // 檢查是否受保護
    const isProtected = this.isCardProtected(firebaseCard);
    
    if (isProtected) {
      return {
        firebaseCard,
        webCard,
        isProtected: true,
        reason: 'MANUAL_MODIFICATION_PROTECTED'
      };
    }

    // 檢查需要更新的欄位
    const fieldsToCheck = ['cashback', 'description', 'annualFee', 'minAnnualIncome'];
    
    for (const field of fieldsToCheck) {
      const webValue = this.normalizeValue(webCard[field]);
      const firebaseValue = this.normalizeValue(firebaseCard[field]);
      
      if (webValue && webValue !== firebaseValue) {
        needsUpdate = true;
        changes[field] = {
          current: firebaseValue,
          new: webValue,
          action: 'UPDATE_FROM_MONEYHERO'
        };
      }
    }

    return {
      firebaseCard,
      webCard,
      changes,
      needsUpdate,
      isProtected: false
    };
  }

  /**
   * 檢查卡片是否受保護
   */
  isCardProtected(firebaseCard) {
    // 檢查自動同步保護標記
    if (firebaseCard.autoSyncProtection?.enabled) {
      return true;
    }
    
    // 檢查資料來源
    if (firebaseCard.dataSource === 'manual_entry') {
      return true;
    }
    
    // 檢查手動修改標記
    if (firebaseCard.manuallyModified) {
      return true;
    }
    
    return false;
  }

  /**
   * 執行清潔同步計劃
   */
  async executeCleanSyncPlan(syncPlan) {
    let successCount = 0;
    let errorCount = 0;
    const results = {
      added: 0,
      updated: 0,
      protected: syncPlan.protected.length,
      errors: []
    };

    try {
      // 🆕 處理新增卡片
      for (const newCard of syncPlan.toAdd) {
        try {
          await this.addNewCleanCard(newCard);
          successCount++;
          results.added++;
          console.log(`✅ 新增成功: ${newCard.name}`);
        } catch (error) {
          errorCount++;
          results.errors.push(`新增失敗: ${newCard.name} - ${error.message}`);
          console.error(`❌ 新增失敗: ${newCard.name}`, error.message);
        }
      }

      // 🔄 處理更新卡片
      for (const updateInfo of syncPlan.toUpdate) {
        try {
          await this.updateCleanCard(updateInfo);
          successCount++;
          results.updated++;
          console.log(`✅ 更新成功: ${updateInfo.firebaseCard.name}`);
        } catch (error) {
          errorCount++;
          results.errors.push(`更新失敗: ${updateInfo.firebaseCard.name} - ${error.message}`);
          console.error(`❌ 更新失敗: ${updateInfo.firebaseCard.name}`, error.message);
        }
      }

      console.log('\n📊 同步結果統計:');
      console.log(`✅ 成功操作: ${successCount}`);
      console.log(`❌ 失敗操作: ${errorCount}`);
      console.log(`🛡️ 受保護的手動修改: ${results.protected}`);
      console.log(`🆕 新增卡片: ${results.added}`);
      console.log(`🔄 更新卡片: ${results.updated}`);

      return results;

    } catch (error) {
      console.error('❌ 執行同步計劃時發生錯誤:', error);
      throw error;
    }
  }

  /**
   * 添加新的清潔卡片
   */
  async addNewCleanCard(cardData) {
    const cardId = this.generateCleanCardId(cardData);
    
    const cleanCardData = {
      ...cardData,
      id: cardId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastSyncDate: new Date().toISOString(),
      dataSource: 'moneyhero_auto_sync',
      version: '3.0_clean',
      isActive: true,
      syncedFrom: 'moneyhero_website',
      autoSyncProtection: {
        enabled: false,
        reason: 'AUTO_SYNC_ENABLED'
      }
    };
    
    await setDoc(doc(db, 'credit_cards', cardId), cleanCardData);
  }

  /**
   * 更新現有清潔卡片
   */
  async updateCleanCard(updateInfo) {
    const { firebaseCard, changes } = updateInfo;
    const updateData = {};
    
    // 只更新變化的欄位
    for (const [field, changeInfo] of Object.entries(changes)) {
      if (changeInfo.action === 'UPDATE_FROM_MONEYHERO') {
        updateData[field] = changeInfo.new;
      }
    }
    
    updateData.updatedAt = new Date().toISOString();
    updateData.lastSyncDate = new Date().toISOString();
    updateData.lastSyncSource = 'moneyhero_website';
    
    await updateDoc(doc(db, 'credit_cards', firebaseCard.firestoreId), updateData);
  }

  // 輔助函數
  normalizeCardName(name) {
    return name ? name.replace(/[^\w\s]/g, '').toLowerCase().trim() : '';
  }

  normalizeValue(value) {
    return value ? value.toString().trim() : '';
  }

  calculateNameSimilarity(str1, str2) {
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

  generateCleanCardId(cardData) {
    const bankCode = this.getBankCode(cardData.bank);
    const cardType = this.getCardType(cardData.name, cardData.category);
    const timestamp = Date.now();
    return `${bankCode}_${cardType}_${timestamp}`.toLowerCase();
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
    const name = cardName.toLowerCase();
    if (name.includes('白金')) return 'platinum';
    if (name.includes('金卡')) return 'gold';
    if (name.includes('學生')) return 'student';
    if (category === '里數') return 'miles';
    return 'standard';
  }

  prepareNewCardData(webCard) {
    return {
      name: webCard.name,
      bank: webCard.bank,
      category: [webCard.category], // 確保是陣列格式
      cashback: webCard.cashback,
      description: webCard.description || `${webCard.name}提供優質的信用卡服務`,
      conditions: '請查看官方條款細則',
      nameVariations: [webCard.name],
      searchKeywords: [webCard.name, webCard.bank, webCard.category],
      minAnnualIncome: webCard.minAnnualIncome || 0,
      annualFee: webCard.annualFee || 0,
      label: 'VISA' // 預設標籤
    };
  }
}

/**
 * 🕐 清潔版定時任務調度器
 */
class CleanSyncScheduler {
  constructor() {
    this.syncManager = new CleanSyncManager();
  }

  /**
   * 啟動MoneyHero定時同步
   */
  startCleanScheduledSync() {
    console.log('🕐 啟動MoneyHero定時同步任務...');
    console.log('📅 同步計劃: 每天凌晨2點和下午2點自動檢查MoneyHero更新');
    console.log('💡 只從MoneyHero同步，確保資料來源純淨');
    
    // 每天凌晨2點執行同步
    cron.schedule('0 2 * * *', async () => {
      console.log('\n🌙 執行凌晨MoneyHero定時同步...');
      try {
        await this.syncManager.performCleanMoneyHeroSync();
      } catch (error) {
        console.error('❌ 凌晨同步失敗:', error);
      }
    });

    // 每天下午2點執行同步  
    cron.schedule('0 14 * * *', async () => {
      console.log('\n☀️ 執行下午MoneyHero定時同步...');
      try {
        await this.syncManager.performCleanMoneyHeroSync();
      } catch (error) {
        console.error('❌ 下午同步失敗:', error);
      }
    });

    console.log('✅ MoneyHero定時任務已啟動，程序將持續運行');
    console.log('💡 按 Ctrl+C 停止定時任務');
  }

  /**
   * 執行單次手動同步
   */
  async runCleanManualSync() {
    console.log('🖐 執行手動MoneyHero同步...');
    try {
      const result = await this.syncManager.performCleanMoneyHeroSync();
      return result;
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
  console.log('🚀 純淨MoneyHero同步系統啟動');
  console.log('💡 系統特色: 單一資料來源、保護手動修改、智能更新檢測');
  console.log('🧹 專為清潔資料庫設計，避免多源衝突');
  console.log('=' .repeat(80));

  const scheduler = new CleanSyncScheduler();
  
  // 檢查命令行參數
  const args = process.argv.slice(2);
  
  if (args.includes('--schedule')) {
    // 啟動定時任務模式
    scheduler.startCleanScheduledSync();
    
    // 保持程序運行
    process.on('SIGINT', () => {
      console.log('\n👋 接收到停止信號，正在關閉MoneyHero同步系統...');
      process.exit(0);
    });
    
  } else {
    // 執行單次同步
    try {
      const result = await scheduler.runCleanManualSync();
      
      if (result.success) {
        console.log('\n🎉 MoneyHero同步完成！程序即將退出');
      } else {
        console.log('\n⚠️ 同步未完全成功，請檢查日誌');
      }
      
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

module.exports = { CleanSyncManager, CleanSyncScheduler };