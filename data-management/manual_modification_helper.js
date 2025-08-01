// data-management/manual_modification_helper.js
// 🛡️ 手動修改保護系統：讓您安心手動調整Firebase資料
// 🔥 修正版：添加缺少的 getDocs 導入

const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  doc, 
  updateDoc,
  getDoc,
  setDoc,           // 🔥 新增
  getDocs,          // 🔥 修正：添加缺少的 getDocs 導入
  collection        // 🔥 新增：添加缺少的 collection 導入
} = require('firebase/firestore');

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
 * 🛡️ 手動修改保護系統
 * 這個系統讓您可以安全地手動修改Firebase資料，而不用擔心被自動同步覆蓋
 */
class ManualModificationProtector {
  
  /**
   * 📝 標記卡片為手動修改
   * 當您在Firebase Console中手動修改某張卡片時，調用這個函數來保護您的修改
   */
  async markAsManuallyModified(cardId, modifiedFields = []) {
    try {
      console.log(`🛡️ 正在標記卡片 ${cardId} 為手動修改...`);
      
      const cardRef = doc(db, 'credit_cards', cardId);
      const cardDoc = await getDoc(cardRef);
      
      if (!cardDoc.exists()) {
        throw new Error(`卡片 ${cardId} 不存在`);
      }
      
      const currentData = cardDoc.data();
      const updateData = {
        // 標記為手動修改
        dataSource: 'manual_entry',
        lastManualUpdate: new Date().toISOString(),
        manuallyModified: {
          ...currentData.manuallyModified,
          timestamp: new Date().toISOString(),
          fields: modifiedFields.length > 0 ? modifiedFields : ['all']
        },
        // 保護標記
        autoSyncProtection: {
          enabled: true,
          reason: 'USER_MANUAL_MODIFICATION',
          protectedAt: new Date().toISOString()
        }
      };
      
      // 如果指定了特定欄位，標記這些欄位為受保護
      if (modifiedFields.length > 0) {
        const fieldProtection = {};
        modifiedFields.forEach(field => {
          fieldProtection[field] = {
            isProtected: true,
            protectedAt: new Date().toISOString(),
            originalValue: currentData[field]
          };
        });
        updateData.fieldProtection = fieldProtection;
      }
      
      await updateDoc(cardRef, updateData);
      
      console.log(`✅ 成功標記卡片 ${cardId} 為手動修改`);
      console.log(`🛡️ 受保護的欄位: ${modifiedFields.length > 0 ? modifiedFields.join(', ') : '全部欄位'}`);
      console.log(`💡 此卡片現在不會被自動同步覆蓋`);
      
      return true;
      
    } catch (error) {
      console.error(`❌ 標記卡片 ${cardId} 失敗:`, error);
      throw error;
    }
  }

  /**
   * 🔓 移除手動修改保護
   * 如果您希望某張卡片重新接受自動同步更新，可以調用這個函數
   */
  async removeManualProtection(cardId) {
    try {
      console.log(`🔓 正在移除卡片 ${cardId} 的手動修改保護...`);
      
      const cardRef = doc(db, 'credit_cards', cardId);
      const cardDoc = await getDoc(cardRef);
      
      if (!cardDoc.exists()) {
        throw new Error(`卡片 ${cardId} 不存在`);
      }
      
      const updateData = {
        dataSource: 'auto_sync',
        autoSyncProtection: {
          enabled: false,
          removedAt: new Date().toISOString(),
          reason: 'USER_REQUEST'
        },
        protectionRemoved: {
          at: new Date().toISOString(),
          reason: 'USER_REQUESTED_AUTO_SYNC'
        },
        updatedAt: new Date().toISOString()
      };
      
      await updateDoc(cardRef, updateData);
      
      console.log(`✅ 成功移除卡片 ${cardId} 的保護`);
      console.log(`🔄 此卡片現在可以接受自動同步更新`);
      
      return true;
      
    } catch (error) {
      console.error(`❌ 移除保護失敗:`, error);
      throw error;
    }
  }

  /**
   * 🆕 添加新的手動卡片
   * 當您想要添加一張網站上沒有的信用卡時，使用這個函數
   */
  async addManualCard(cardData) {
    try {
      console.log(`🆕 正在添加手動卡片: ${cardData.name}...`);
      
      const cardId = this.generateManualCardId(cardData);
      const fullCardData = {
        // 基本資訊
        id: cardId,
        name: cardData.name,
        bank: cardData.bank,
        category: Array.isArray(cardData.category) ? cardData.category : [cardData.category],
        cashback: cardData.cashback,
        description: cardData.description || `${cardData.name}提供優質的信用卡服務`,
        conditions: cardData.conditions || '請查看官方條款細則',
        
        // 搜尋相關
        nameVariations: cardData.nameVariations || [cardData.name],
        searchKeywords: cardData.searchKeywords || [cardData.name, cardData.bank],
        
        // 財務資訊
        minAnnualIncome: cardData.minAnnualIncome || 0,
        annualFee: cardData.annualFee || 0,
        label: cardData.label || 'VISA',
        
        // 🛡️ 手動添加標記
        dataSource: 'manual_entry',
        addedBy: 'user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastManualUpdate: new Date().toISOString(),
        
        // 保護設定
        autoSyncProtection: {
          enabled: true,
          reason: 'MANUALLY_ADDED_CARD',
          protectedAt: new Date().toISOString()
        },
        
        // 元數據
        isActive: true,
        version: '2.1',
        manuallyAdded: true
      };
      
      const cardRef = doc(db, 'credit_cards', cardId);
      await setDoc(cardRef, fullCardData);
      
      console.log(`✅ 成功添加手動卡片: ${cardData.name}`);
      console.log(`🛡️ 此卡片已自動設為受保護，不會被自動同步影響`);
      console.log(`🆔 卡片ID: ${cardId}`);
      
      return cardId;
      
    } catch (error) {
      console.error(`❌ 添加手動卡片失敗:`, error);
      throw error;
    }
  }

  /**
   * 📊 查看保護狀態報告
   * 顯示所有受保護的卡片和手動添加的卡片
   */
  async getProtectionStatusReport() {
    try {
      console.log('📊 正在生成保護狀態報告...');
      
      const querySnapshot = await getDocs(collection(db, 'credit_cards'));
      const allCards = [];
      
      querySnapshot.forEach((doc) => {
        allCards.push({ firestoreId: doc.id, ...doc.data() });
      });
      
      const report = {
        total: allCards.length,
        protected: 0,
        manuallyAdded: 0,
        autoSync: 0,
        details: {
          protectedCards: [],
          manualCards: [],
          autoSyncCards: []
        }
      };
      
      allCards.forEach(card => {
        if (card.dataSource === 'manual_entry' || card.autoSyncProtection?.enabled) {
          report.protected++;
          report.details.protectedCards.push({
            id: card.id || card.firestoreId,
            name: card.name,
            bank: card.bank,
            reason: card.autoSyncProtection?.reason || 'UNKNOWN',
            protectedSince: card.autoSyncProtection?.protectedAt || card.lastManualUpdate
          });
          
          if (card.manuallyAdded || card.addedBy === 'user') {
            report.manuallyAdded++;
            report.details.manualCards.push({
              id: card.id || card.firestoreId,
              name: card.name,
              bank: card.bank,
              addedAt: card.createdAt
            });
          }
        } else {
          report.autoSync++;
          report.details.autoSyncCards.push({
            id: card.id || card.firestoreId,
            name: card.name,
            bank: card.bank,
            lastSync: card.lastSyncDate
          });
        }
      });
      
      // 輸出報告
      console.log('\n📊 保護狀態報告');
      console.log('=' .repeat(60));
      console.log(`📈 總卡片數量: ${report.total}`);
      console.log(`🛡️ 受保護卡片: ${report.protected} (${((report.protected/report.total)*100).toFixed(1)}%)`);
      console.log(`🆕 手動添加卡片: ${report.manuallyAdded}`);
      console.log(`🔄 自動同步卡片: ${report.autoSync} (${((report.autoSync/report.total)*100).toFixed(1)}%)`);
      
      if (report.details.protectedCards.length > 0) {
        console.log('\n🛡️ 受保護的卡片:');
        report.details.protectedCards.forEach(card => {
          console.log(`  - ${card.name} (${card.bank}) [ID: ${card.id}]`);
          console.log(`    保護原因: ${card.reason}`);
        });
      }
      
      if (report.details.manualCards.length > 0) {
        console.log('\n🆕 手動添加的卡片:');
        report.details.manualCards.forEach(card => {
          console.log(`  - ${card.name} (${card.bank}) [ID: ${card.id}]`);
        });
      }
      
      if (report.details.autoSyncCards.length > 0) {
        console.log('\n🔄 自動同步卡片 (前10張):');
        report.details.autoSyncCards.slice(0, 10).forEach(card => {
          console.log(`  - ${card.name} (${card.bank}) [ID: ${card.id}]`);
        });
        if (report.details.autoSyncCards.length > 10) {
          console.log(`  ... 還有 ${report.details.autoSyncCards.length - 10} 張卡片`);
        }
      }
      
      console.log('=' .repeat(60));
      
      return report;
      
    } catch (error) {
      console.error('❌ 生成報告失敗:', error);
      throw error;
    }
  }

  /**
   * 🔧 批量保護操作
   * 一次性保護多張卡片
   */
  async batchProtectCards(cardIds, reason = 'BATCH_MANUAL_PROTECTION') {
    console.log(`🔧 開始批量保護 ${cardIds.length} 張卡片...`);
    
    const results = {
      success: 0,
      failed: 0,
      errors: []
    };
    
    for (const cardId of cardIds) {
      try {
        await this.markAsManuallyModified(cardId);
        results.success++;
        console.log(`✅ 保護成功: ${cardId}`);
      } catch (error) {
        results.failed++;
        results.errors.push({ cardId, error: error.message });
        console.error(`❌ 保護失敗: ${cardId}`, error.message);
      }
    }
    
    console.log(`\n📊 批量保護結果:`);
    console.log(`✅ 成功: ${results.success}`);
    console.log(`❌ 失敗: ${results.failed}`);
    
    return results;
  }

  /**
   * 🔍 查找特定卡片的保護狀態
   */
  async checkCardProtectionStatus(cardId) {
    try {
      const cardRef = doc(db, 'credit_cards', cardId);
      const cardDoc = await getDoc(cardRef);
      
      if (!cardDoc.exists()) {
        console.log(`❌ 找不到卡片: ${cardId}`);
        return null;
      }
      
      const cardData = cardDoc.data();
      const isProtected = cardData.dataSource === 'manual_entry' || cardData.autoSyncProtection?.enabled;
      
      console.log(`🔍 卡片保護狀態: ${cardData.name}`);
      console.log(`🛡️ 受保護: ${isProtected ? '是' : '否'}`);
      if (isProtected) {
        console.log(`📝 保護原因: ${cardData.autoSyncProtection?.reason || '手動修改'}`);
        console.log(`🕐 保護時間: ${cardData.autoSyncProtection?.protectedAt || cardData.lastManualUpdate}`);
      }
      
      return {
        id: cardId,
        name: cardData.name,
        isProtected,
        reason: cardData.autoSyncProtection?.reason,
        protectedAt: cardData.autoSyncProtection?.protectedAt
      };
      
    } catch (error) {
      console.error(`❌ 檢查保護狀態失敗:`, error);
      throw error;
    }
  }

  // 輔助函數
  generateManualCardId(cardData) {
    const bankCode = this.getBankCode(cardData.bank);
    const timestamp = Date.now();
    return `manual_${bankCode}_${timestamp}`.toLowerCase();
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
      '建行(亞洲)': 'ccb',
      'Airwallex': 'airwallex',
      '香港中文大學': 'cuhk',
      '香港恒生大學': 'hsu',
      '香港浸會大學': 'hkbu'
    };
    return bankCodes[bankName] || 'unknown';
  }
}

/**
 * 🚀 實用工具函數
 */

// 快速保護單張卡片
async function protectCard(cardId, fields = []) {
  const protector = new ManualModificationProtector();
  return await protector.markAsManuallyModified(cardId, fields);
}

// 快速移除保護
async function unprotectCard(cardId) {
  const protector = new ManualModificationProtector();
  return await protector.removeManualProtection(cardId);
}

// 快速查看狀態
async function showProtectionStatus() {
  const protector = new ManualModificationProtector();
  return await protector.getProtectionStatusReport();
}

// 檢查特定卡片狀態
async function checkCardStatus(cardId) {
  const protector = new ManualModificationProtector();
  return await protector.checkCardProtectionStatus(cardId);
}

// 🚀 命令行界面
async function main() {
  const args = process.argv.slice(2);
  const protector = new ManualModificationProtector();
  
  try {
    if (args[0] === 'protect' && args[1]) {
      // 保護特定卡片: node manual_modification_helper.js protect [cardId] [field1,field2,...]
      const cardId = args[1];
      const fields = args[2] ? args[2].split(',') : [];
      await protector.markAsManuallyModified(cardId, fields);
      
    } else if (args[0] === 'unprotect' && args[1]) {
      // 移除保護: node manual_modification_helper.js unprotect [cardId]
      const cardId = args[1];
      await protector.removeManualProtection(cardId);
      
    } else if (args[0] === 'status') {
      // 查看狀態: node manual_modification_helper.js status
      await protector.getProtectionStatusReport();
      
    } else if (args[0] === 'check' && args[1]) {
      // 檢查特定卡片: node manual_modification_helper.js check [cardId]
      const cardId = args[1];
      await protector.checkCardProtectionStatus(cardId);
      
    } else if (args[0] === 'add') {
      // 添加手動卡片: node manual_modification_helper.js add
      console.log('📝 手動添加卡片功能');
      console.log('💡 請通過代碼調用 addManualCard() 函數');
      console.log('💡 或者使用Firebase Console直接添加後調用 protect 命令');
      
    } else {
      // 顯示使用說明
      console.log('🛡️ 手動修改保護系統使用說明');
      console.log('=' .repeat(50));
      console.log('📌 可用命令:');
      console.log('  node manual_modification_helper.js protect [卡片ID] [欄位1,欄位2,...]');
      console.log('  node manual_modification_helper.js unprotect [卡片ID]');
      console.log('  node manual_modification_helper.js status');
      console.log('  node manual_modification_helper.js check [卡片ID]');
      console.log('');
      console.log('📌 使用範例:');
      console.log('  node manual_modification_helper.js protect mox_credit_cashback');
      console.log('  node manual_modification_helper.js protect hsbc_red name,cashback');
      console.log('  node manual_modification_helper.js unprotect mox_credit_cashback');
      console.log('  node manual_modification_helper.js status');
      console.log('  node manual_modification_helper.js check mox_credit_cashback');
      console.log('');
      console.log('💡 提示: 保護後的卡片不會被自動同步覆蓋');
    }
    
  } catch (error) {
    console.error('❌ 操作失敗:', error);
    process.exit(1);
  }
}

// 🔥 直接執行主函數
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { 
  ManualModificationProtector, 
  protectCard, 
  unprotectCard, 
  showProtectionStatus,
  checkCardStatus
};