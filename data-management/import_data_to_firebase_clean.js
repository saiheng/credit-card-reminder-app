// data-management/import_data_to_firebase_clean.js
// 🔥 增強版：徹底清理並重新導入信用卡資料
// 💡 這個腳本會完全清空Firebase資料庫，然後導入乾淨的hk_credit_cards_data

const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDocs,
  deleteDoc,
  writeBatch
} = require('firebase/firestore');

// 🔥 導入您的信用卡數據
const { creditCards } = require('./hk_credit_cards_data.js');

// 🔥 Firebase配置 - 與您現有的firebase.js完全相同
const firebaseConfig = {
  apiKey: "AIzaSyAyP7KAdGvb0r_K30P1BAxnrMhfZlBI4-8",
  authDomain: "credit-card-manager-barry.firebaseapp.com",
  projectId: "credit-card-manager-barry",
  storageBucket: "credit-card-manager-barry.firebasestorage.app",
  messagingSenderId: "941634977022",
  appId: "1:941634977022:web:0af55c0beb12a4e10d39af",
};

// 初始化Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * 🧹 徹底清理整個credit_cards collection
 * 這會刪除所有信用卡資料，包括任何可能造成混亂的資料
 */
async function thoroughDatabaseCleanup() {
  try {
    console.log('\n🧹 開始徹底清理Firebase資料庫...');
    console.log('💡 這會刪除所有現有的信用卡資料，包括可能重複或損壞的資料');
    console.log('🔄 清理完成後，您的資料庫將完全乾淨，準備接收新資料');
    console.log('=' .repeat(80));
    
    // 獲取所有現有文檔
    const querySnapshot = await getDocs(collection(db, 'credit_cards'));
    const totalDocuments = querySnapshot.size;
    
    console.log(`📊 發現 ${totalDocuments} 個現有文檔需要清理`);
    
    if (totalDocuments === 0) {
      console.log('✅ 資料庫已經是空的，可以直接進行導入');
      return;
    }
    
    // 使用批次操作提高效率
    const batchSize = 500; // Firestore批次操作限制
    let processedCount = 0;
    let batchCount = 0;
    
    // 分批處理刪除操作
    const documents = [];
    querySnapshot.forEach((document) => {
      documents.push(document);
    });
    
    // 分批刪除
    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = writeBatch(db);
      const currentBatch = documents.slice(i, i + batchSize);
      batchCount++;
      
      console.log(`🗑️ 處理批次 ${batchCount}：清理 ${currentBatch.length} 個文檔...`);
      
      currentBatch.forEach((document) => {
        batch.delete(doc(db, 'credit_cards', document.id));
        processedCount++;
        
        // 顯示被刪除的文檔ID（用於除錯）
        if (processedCount <= 10) {
          console.log(`   - 刪除: ${document.id} (${document.data().name || 'Unknown'})`);
        }
      });
      
      // 執行批次刪除
      await batch.commit();
      console.log(`✅ 批次 ${batchCount} 完成，已處理 ${processedCount}/${totalDocuments} 個文檔`);
      
      // 顯示進度
      const progress = Math.round((processedCount / totalDocuments) * 100);
      console.log(`📈 清理進度: ${progress}%`);
    }
    
    // 顯示剩餘未顯示的刪除項目統計
    if (processedCount > 10) {
      console.log(`   ... 還有 ${processedCount - 10} 個文檔被成功刪除`);
    }
    
    console.log('\n🎉 資料庫清理完成！');
    console.log(`✅ 成功刪除 ${processedCount} 個文檔`);
    console.log('💡 Firebase資料庫現在完全乾淨，準備接收新的信用卡資料');
    
  } catch (error) {
    console.error('❌ 清理資料庫時發生錯誤:', error);
    throw error;
  }
}

/**
 * 🔄 轉換並標準化信用卡資料
 * 確保每張卡片都符合完美的資料結構標準
 */
function transformAndStandardizeCardData(card, index) {
  // 🔥 處理分類欄位 - 確保是陣列格式
  let categoryArray;
  if (Array.isArray(card.category)) {
    categoryArray = card.category;
  } else if (typeof card.category === 'string') {
    categoryArray = [card.category];
  } else {
    categoryArray = ['基本回贈']; // 預設分類
  }

  // 🔥 標準化分類名稱，確保與ExplorePage的CATEGORIES匹配
  const categoryMapping = {
    '基本回贈': '基本回贈',
    '旅遊外幣': '外幣',
    '流動支付': '手機支付', 
    '網上購物': '網上購物',
    '超市': '超市購物',
    '餐飲美食': '餐飲美食',
    '學生': '青年學生',
    '里數回贈': '里數'
  };

  const normalizedCategories = categoryArray.map(cat => categoryMapping[cat] || cat);

  // 🔥 生成清潔的卡片ID
  const cleanId = card.id || `card_${index + 1}_${Date.now()}`;

  return {
    // 🔥 基本資訊 - 完全清潔的格式
    id: cleanId,
    name: card.name || '未知信用卡',
    bank: card.bank || '未知銀行',
    
    // 🔥 分類資訊 - 統一陣列格式
    category: normalizedCategories,
    
    // 🔥 回贈資訊 - 標準化格式
    cashback: card.cashback || '請查詢',
    
    // 🔥 描述資訊 - 確保完整性
    description: card.description || `${card.name}提供優質的信用卡服務，詳情請向銀行查詢`,
    conditions: card.conditions || '使用條款請參考銀行官方資訊',
    
    // 🔥 搜尋功能支援 - 增強ExplorePage搜尋體驗
    nameVariations: card.nameVariations || [card.name],
    searchKeywords: card.searchKeywords || [card.name, card.bank],
    
    // 🔥 財務資訊 - 標準化數字格式
    minAnnualIncome: Number(card.minAnnualIncome) || 0,
    annualFee: Number(card.annualFee) || 0,
    
    // 🔥 卡片品牌 - 標準化標籤
    label: card.label || 'VISA',
    
    // 🔥 系統元數據 - 追蹤資料來源和狀態
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    dataSource: 'hk_credit_cards_data_clean_import',
    lastSyncDate: new Date().toISOString(),
    
    // 🔥 版本和狀態管理
    version: '3.0_clean',
    isActive: true,
    importBatch: new Date().toISOString().split('T')[0], // 今天的日期作為批次標識
    
    // 🔥 為ExplorePage優化的額外欄位
    displayOrder: index, // 用於排序
    isPromoted: false,
    tags: normalizedCategories, // 額外的標籤系統
    
    // 🔥 自動同步保護設定（預設為允許自動更新）
    autoSyncProtection: {
      enabled: false,
      reason: 'CLEAN_IMPORT_DEFAULT'
    }
  };
}

/**
 * 📥 批量導入清潔的信用卡資料
 * 使用批次操作提高效率和可靠性
 */
async function importCleanCreditCardsData() {
  try {
    console.log('\n📥 開始導入清潔的信用卡資料...');
    console.log(`📊 準備導入 ${creditCards.length} 張精心整理的信用卡`);
    console.log('💡 每張卡片都會使用統一的資料格式和清潔的ID系統');
    console.log('=' .repeat(80));
    
    const batchSize = 500; // Firestore批次操作限制
    let successCount = 0;
    let errorCount = 0;
    let batchCount = 0;
    
    // 分批處理導入操作
    for (let i = 0; i < creditCards.length; i += batchSize) {
      const batch = writeBatch(db);
      const currentBatch = creditCards.slice(i, i + batchSize);
      batchCount++;
      
      console.log(`\n📦 處理批次 ${batchCount}：導入 ${currentBatch.length} 張信用卡...`);
      
      // 處理當前批次的每張卡片
      currentBatch.forEach((card, batchIndex) => {
        try {
          const globalIndex = i + batchIndex;
          const transformedCard = transformAndStandardizeCardData(card, globalIndex);
          
          // 添加到批次操作
          batch.set(doc(db, 'credit_cards', transformedCard.id), transformedCard);
          
          // 顯示前幾張卡片的詳細資訊
          if (globalIndex < 5) {
            console.log(`✅ 準備導入: ${transformedCard.name} (${transformedCard.bank})`);
            console.log(`   📂 分類: ${transformedCard.category.join(', ')}`);
            console.log(`   💰 回贈: ${transformedCard.cashback}`);
            console.log(`   🆔 ID: ${transformedCard.id}`);
          }
          
        } catch (error) {
          errorCount++;
          console.error(`❌ 處理卡片失敗: ${card.name}`, error.message);
        }
      });
      
      try {
        // 執行批次導入
        await batch.commit();
        successCount += currentBatch.length;
        console.log(`✅ 批次 ${batchCount} 導入成功！`);
        
        // 顯示進度
        const progress = Math.round((successCount / creditCards.length) * 100);
        console.log(`📈 導入進度: ${progress}% (${successCount}/${creditCards.length})`);
        
      } catch (batchError) {
        errorCount += currentBatch.length;
        console.error(`❌ 批次 ${batchCount} 導入失敗:`, batchError.message);
      }
    }
    
    // 顯示導入統計
    console.log('\n' + '='.repeat(60));
    console.log('📊 導入結果統計:');
    console.log(`✅ 成功導入: ${successCount} 張卡片`);
    console.log(`❌ 導入失敗: ${errorCount} 張卡片`);
    console.log(`📈 成功率: ${((successCount / creditCards.length) * 100).toFixed(2)}%`);
    
    if (successCount > 0) {
      console.log(`🎯 資料品質: 所有導入的卡片都使用統一的清潔格式`);
      console.log(`🔄 自動同步: 所有卡片預設為允許MoneyHero自動更新`);
    }
    
    console.log('='.repeat(60));
    
    return { successCount, errorCount };
    
  } catch (error) {
    console.error('❌ 批量導入過程中發生錯誤:', error);
    throw error;
  }
}

/**
 * 🔍 驗證導入結果並生成詳細報告
 * 確保所有資料都正確導入並符合ExplorePage需求
 */
async function verifyImportAndGenerateReport() {
  try {
    console.log('\n🔍 開始驗證導入結果...');
    console.log('💡 這將全面檢查Firebase中的資料是否完整且格式正確');
    
    const querySnapshot = await getDocs(collection(db, 'credit_cards'));
    const importedCards = [];
    
    querySnapshot.forEach((doc) => {
      importedCards.push({ firestoreId: doc.id, ...doc.data() });
    });
    
    console.log(`\n📊 基本統計:`);
    console.log(`   總信用卡數量: ${importedCards.length} 張`);
    
    // 🔥 驗證分類分布
    const categoryCount = {};
    importedCards.forEach(card => {
      if (card.category && Array.isArray(card.category)) {
        card.category.forEach(cat => {
          categoryCount[cat] = (categoryCount[cat] || 0) + 1;
        });
      }
    });
    
    console.log('\n📂 分類分布統計 (ExplorePage分類系統):');
    const expectedCategories = ['基本回贈', '外幣', '手機支付', '網上購物', '超市購物', '餐飲美食', '青年學生', '里數'];
    expectedCategories.forEach(category => {
      const count = categoryCount[category] || 0;
      const status = count > 0 ? '✅' : '⚠️';
      console.log(`   ${status} ${category}: ${count} 張卡片`);
    });
    
    // 🔥 驗證銀行分布
    const bankCount = {};
    importedCards.forEach(card => {
      bankCount[card.bank] = (bankCount[card.bank] || 0) + 1;
    });
    
    console.log('\n🏦 銀行分布統計:');
    Object.entries(bankCount)
      .sort(([,a], [,b]) => b - a)
      .forEach(([bank, count]) => {
        console.log(`   💳 ${bank}: ${count} 張卡片`);
      });
    
    // 🔥 驗證資料完整性
    console.log('\n🔧 資料完整性檢查:');
    const requiredFields = ['id', 'name', 'bank', 'category', 'cashback'];
    let completeCards = 0;
    let incompleteCards = [];
    
    importedCards.forEach(card => {
      const missingFields = requiredFields.filter(field => !card[field]);
      if (missingFields.length === 0) {
        completeCards++;
      } else {
        incompleteCards.push({
          name: card.name || 'Unknown',
          missing: missingFields
        });
      }
    });
    
    console.log(`   ✅ 完整資料卡片: ${completeCards} 張`);
    console.log(`   ⚠️ 需要檢查的卡片: ${incompleteCards.length} 張`);
    
    if (incompleteCards.length > 0) {
      console.log('\n   需要檢查的卡片詳情:');
      incompleteCards.slice(0, 3).forEach(card => {
        console.log(`     - ${card.name}: 缺少 ${card.missing.join(', ')}`);
      });
    }
    
    // 🔥 驗證自動同步設定
    const autoSyncEnabledCount = importedCards.filter(card => 
      !card.autoSyncProtection?.enabled
    ).length;
    
    console.log('\n🔄 自動同步狀態:');
    console.log(`   🔄 允許自動更新: ${autoSyncEnabledCount} 張卡片`);
    console.log(`   🛡️ 受保護卡片: ${importedCards.length - autoSyncEnabledCount} 張卡片`);
    
    // 🔥 ExplorePage兼容性檢查
    const explorePageCompatible = importedCards.filter(card => 
      card.category && Array.isArray(card.category) && 
      card.name && card.bank && card.cashback
    ).length;
    
    console.log('\n📱 ExplorePage兼容性:');
    console.log(`   ✅ 完全兼容: ${explorePageCompatible} 張卡片`);
    console.log(`   📈 兼容率: ${((explorePageCompatible / importedCards.length) * 100).toFixed(1)}%`);
    
    return {
      totalCards: importedCards.length,
      categoryCount,
      bankCount,
      completeCards,
      explorePageCompatible,
      autoSyncEnabled: autoSyncEnabledCount
    };
    
  } catch (error) {
    console.error('❌ 驗證過程中發生錯誤:', error);
    throw error;
  }
}

/**
 * 🚀 主要執行函數 - 完整的清理和重新導入流程
 */
async function main() {
  console.log('🚀 開始Firebase資料庫完整重置和清潔導入流程');
  console.log('💡 這個過程會徹底清理混亂的資料，並導入完美整理的信用卡資料');
  console.log('🔄 同時確保MoneyHero自動同步功能正常工作');
  console.log('=' .repeat(90));
  
  try {
    // 步驟1: 徹底清理資料庫
    console.log('\n📋 步驟 1/3: 徹底清理混亂的資料庫');
    await thoroughDatabaseCleanup();
    
    // 稍微暫停，確保清理操作完全完成
    console.log('\n⏳ 等待清理操作完全完成...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 步驟2: 導入清潔的資料
    console.log('\n📋 步驟 2/3: 導入清潔整理的信用卡資料');
    const importResult = await importCleanCreditCardsData();
    
    // 步驟3: 驗證結果
    console.log('\n📋 步驟 3/3: 驗證導入結果');
    const verificationResult = await verifyImportAndGenerateReport();
    
    // 最終報告
    console.log('\n' + '🎉'.repeat(30));
    console.log('🎉 Firebase資料庫重置完成！');
    console.log('=' .repeat(90));
    console.log('✅ 成就解鎖：');
    console.log(`   📊 導入了 ${verificationResult.totalCards} 張完美整理的信用卡`);
    console.log(`   🏦 涵蓋 ${Object.keys(verificationResult.bankCount).length} 家銀行`);
    console.log(`   📂 包含 ${Object.keys(verificationResult.categoryCount).length} 個分類`);
    console.log(`   📱 ${verificationResult.explorePageCompatible} 張卡片與ExplorePage完全兼容`);
    console.log(`   🔄 ${verificationResult.autoSyncEnabled} 張卡片已準備好接受MoneyHero自動更新`);
    
    console.log('\n🚀 下一步操作建議：');
    console.log('   1. ✅ 啟動您的React Native應用程式測試ExplorePage');
    console.log('   2. 🔄 運行 npm run sync 測試MoneyHero自動同步功能');
    console.log('   3. 📱 在MyCardsPage中測試所有功能是否正常');
    console.log('   4. 🛡️ 如需保護特定卡片，使用 npm run protect [卡片ID]');
    
    console.log('\n💡 您的資料庫現在完全乾淨，所有功能都應該正常工作！');
    console.log('🎉'.repeat(30));
    
  } catch (error) {
    console.error('\n💥 重置流程失敗:', error);
    console.log('\n🔧 故障排除建議:');
    console.log('1. 🌐 檢查您的網絡連接是否穩定');
    console.log('2. 🔑 確認Firebase配置和權限正確');
    console.log('3. 💾 確認有足夠的Firebase配額');
    console.log('4. 🔄 嘗試重新運行腳本');
    console.log('5. 📞 如問題持續，請查看Firebase Console的錯誤日誌');
    
    process.exit(1);
  }
}

// 🔥 直接執行主函數
main().catch(console.error);