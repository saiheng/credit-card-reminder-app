// data-management/verify_database.js
// 🔥 驗證Firebase數據庫的完整性和正確性

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs,
  doc,
  getDoc 
} from 'firebase/firestore';

// 🔥 Firebase配置
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
 * 🔍 驗證基本數據結構
 */
async function verifyBasicStructure() {
  try {
    console.log('🔍 開始驗證基本數據結構...');
    
    const querySnapshot = await getDocs(collection(db, 'credit_cards'));
    const cards = [];
    
    querySnapshot.forEach((doc) => {
      cards.push({ id: doc.id, ...doc.data() });
    });
    
    console.log(`📊 基本統計:`);
    console.log(`   總信用卡數量: ${cards.length}`);
    
    if (cards.length === 0) {
      console.log('❌ 警告: 資料庫中沒有任何信用卡！');
      console.log('💡 請先執行 npm run import-data 導入數據');
      return false;
    }
    
    // 檢查必要欄位
    const requiredFields = ['id', 'name', 'bank', 'category', 'cashback'];
    let invalidCards = 0;
    
    cards.forEach((card, index) => {
      const missingFields = requiredFields.filter(field => !card[field]);
      if (missingFields.length > 0) {
        invalidCards++;
        console.log(`⚠️ 卡片 ${index + 1} (${card.name || 'Unknown'}) 缺少欄位: ${missingFields.join(', ')}`);
      }
    });
    
    if (invalidCards === 0) {
      console.log('✅ 所有信用卡都包含必要欄位');
    } else {
      console.log(`❌ ${invalidCards} 張信用卡缺少必要欄位`);
    }
    
    return cards;
    
  } catch (error) {
    console.error('❌ 驗證基本結構時發生錯誤:', error);
    return false;
  }
}

/**
 * 🏷️ 驗證分類系統
 */
function verifyCategories(cards) {
  console.log('\n🏷️ 開始驗證分類系統...');
  
  const expectedCategories = [
    '基本回贈', '外幣', '手機支付', '網上購物', 
    '超市購物', '餐飲美食', '青年學生', '里數'
  ];
  
  const categoryCount = {};
  const unexpectedCategories = new Set();
  
  cards.forEach(card => {
    if (card.category && Array.isArray(card.category)) {
      card.category.forEach(cat => {
        categoryCount[cat] = (categoryCount[cat] || 0) + 1;
        if (!expectedCategories.includes(cat)) {
          unexpectedCategories.add(cat);
        }
      });
    } else if (card.category && typeof card.category === 'string') {
      // 處理字符串類型的分類
      categoryCount[card.category] = (categoryCount[card.category] || 0) + 1;
      if (!expectedCategories.includes(card.category)) {
        unexpectedCategories.add(card.category);
      }
    }
  });
  
  console.log('📂 分類分布統計:');
  expectedCategories.forEach(category => {
    const count = categoryCount[category] || 0;
    const status = count > 0 ? '✅' : '⚠️';
    console.log(`   ${status} ${category}: ${count} 張卡片`);
  });
  
  if (unexpectedCategories.size > 0) {
    console.log('\n⚠️ 發現未預期的分類:');
    unexpectedCategories.forEach(cat => {
      console.log(`   - ${cat}: ${categoryCount[cat]} 張卡片`);
    });
    console.log('💡 建議檢查這些分類是否需要標準化');
  } else {
    console.log('✅ 所有分類都符合預期標準');
  }
  
  return categoryCount;
}

/**
 * 🏦 驗證銀行分布
 */
function verifyBanks(cards) {
  console.log('\n🏦 開始驗證銀行分布...');
  
  const bankCount = {};
  const expectedBanks = [
    '恒生銀行', '滙豐銀行', '渣打銀行', '星展銀行', '花旗銀行',
    '安信', 'Mox Bank', 'AEON', '東亞銀行', '大新銀行',
    '信銀國際', '美國運通', '建行(亞洲)', 'SIM'
  ];
  
  cards.forEach(card => {
    if (card.bank) {
      bankCount[card.bank] = (bankCount[card.bank] || 0) + 1;
    }
  });
  
  console.log('🏦 銀行分布統計:');
  Object.entries(bankCount)
    .sort(([,a], [,b]) => b - a)  // 按數量排序
    .forEach(([bank, count]) => {
      const isExpected = expectedBanks.includes(bank);
      const status = isExpected ? '✅' : '🔍';
      console.log(`   ${status} ${bank}: ${count} 張卡片`);
    });
  
  return bankCount;
}

/**
 * 💰 驗證回贈格式
 */
function verifyCashbackFormats(cards) {
  console.log('\n💰 開始驗證回贈格式...');
  
  const cashbackTypes = {
    percentage: 0,    // 百分比格式 (如: 2%, 5%)
    miles: 0,         // 里數格式 (如: $2/里, $4/里)
    points: 0,        // 積分格式
    other: 0          // 其他格式
  };
  
  const invalidFormats = [];
  
  cards.forEach(card => {
    if (!card.cashback) {
      invalidFormats.push(`${card.name}: 無回贈資訊`);
      return;
    }
    
    const cashback = card.cashback.toString();
    
    if (cashback.includes('%')) {
      cashbackTypes.percentage++;
    } else if (cashback.includes('/里') || cashback.includes('里數')) {
      cashbackTypes.miles++;
    } else if (cashback.includes('積分') || cashback.includes('points')) {
      cashbackTypes.points++;
    } else {
      cashbackTypes.other++;
      if (!cashback.includes('多倍') && !cashback.includes('優惠') && cashback.length > 20) {
        invalidFormats.push(`${card.name}: ${cashback}`);
      }
    }
  });
  
  console.log('💰 回贈格式統計:');
  console.log(`   ✅ 百分比格式: ${cashbackTypes.percentage} 張卡片`);
  console.log(`   ✈️ 里數格式: ${cashbackTypes.miles} 張卡片`);
  console.log(`   🎯 積分格式: ${cashbackTypes.points} 張卡片`);
  console.log(`   📝 其他格式: ${cashbackTypes.other} 張卡片`);
  
  if (invalidFormats.length > 0) {
    console.log('\n⚠️ 需要檢查的回贈格式:');
    invalidFormats.slice(0, 5).forEach(format => {  // 只顯示前5個
      console.log(`   - ${format}`);
    });
    if (invalidFormats.length > 5) {
      console.log(`   ... 還有 ${invalidFormats.length - 5} 個需要檢查`);
    }
  }
  
  return cashbackTypes;
}

/**
 * 🔧 驗證ExplorePage兼容性
 */
function verifyExplorePageCompatibility(cards) {
  console.log('\n🔧 開始驗證ExplorePage兼容性...');
  
  let compatibleCards = 0;
  let incompatibleCards = [];
  
  cards.forEach(card => {
    // 檢查ExplorePage需要的關鍵欄位
    const requiredForExplore = [
      'id', 'name', 'bank', 'category', 'cashback', 
      'description', 'conditions'
    ];
    
    const missingFields = requiredForExplore.filter(field => !card[field]);
    
    if (missingFields.length === 0) {
      compatibleCards++;
    } else {
      incompatibleCards.push({
        name: card.name || 'Unknown',
        missing: missingFields
      });
    }
  });
  
  console.log(`📱 ExplorePage兼容性統計:`);
  console.log(`   ✅ 完全兼容: ${compatibleCards} 張卡片`);
  console.log(`   ⚠️ 需要修復: ${incompatibleCards.length} 張卡片`);
  
  if (incompatibleCards.length > 0) {
    console.log('\n需要修復的卡片:');
    incompatibleCards.slice(0, 3).forEach(card => {
      console.log(`   - ${card.name}: 缺少 ${card.missing.join(', ')}`);
    });
    if (incompatibleCards.length > 3) {
      console.log(`   ... 還有 ${incompatibleCards.length - 3} 張卡片需要修復`);
    }
  }
  
  return compatibleCards === cards.length;
}

/**
 * 📊 生成完整報告
 */
function generateReport(cards, categoryCount, bankCount, cashbackTypes, isCompatible) {
  console.log('\n' + '='.repeat(80));
  console.log('📊 完整驗證報告');
  console.log('='.repeat(80));
  
  console.log(`\n📈 總體統計:`);
  console.log(`   信用卡總數: ${cards.length} 張`);
  console.log(`   支援分類數: ${Object.keys(categoryCount).length} 個`);
  console.log(`   銀行數量: ${Object.keys(bankCount).length} 家`);
  console.log(`   ExplorePage兼容: ${isCompatible ? '✅ 完全兼容' : '⚠️ 需要修復'}`);
  
  console.log(`\n🎯 數據品質評估:`);
  const totalExpectedCards = 50; // 預期的卡片數量
  const qualityScore = Math.round((cards.length / totalExpectedCards) * 100);
  
  if (qualityScore >= 90) {
    console.log(`   ✅ 優秀 (${qualityScore}%) - 數據完整度很高`);
  } else if (qualityScore >= 70) {
    console.log(`   🟡 良好 (${qualityScore}%) - 數據基本完整`);
  } else {
    console.log(`   🔴 需要改進 (${qualityScore}%) - 數據不夠完整`);
  }
  
  console.log(`\n🚀 下一步建議:`);
  if (cards.length === 0) {
    console.log(`   1. 執行 npm run import-data 導入信用卡數據`);
    console.log(`   2. 再次執行驗證確認數據導入成功`);
  } else if (!isCompatible) {
    console.log(`   1. 檢查並修復數據完整性問題`);
    console.log(`   2. 重新導入有問題的信用卡數據`);
  } else {
    console.log(`   1. ✅ 數據驗證通過，可以啟動應用測試`);
    console.log(`   2. 🔄 設置自動同步系統 (npm run sync-data)`);
    console.log(`   3. 📱 在ExplorePage中測試所有功能`);
  }
  
  console.log('='.repeat(80));
}

/**
 * 🔥 測試特定卡片的詳細資訊
 */
async function testSpecificCard() {
  try {
    console.log('\n🔍 測試特定卡片的詳細資訊...');
    
    // 測試一張知名的信用卡
    const testCardId = 'mox_credit_cashback';
    const docRef = doc(db, 'credit_cards', testCardId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const cardData = docSnap.data();
      console.log(`✅ 成功讀取測試卡片: ${cardData.name}`);
      console.log(`   銀行: ${cardData.bank}`);
      console.log(`   分類: ${Array.isArray(cardData.category) ? cardData.category.join(', ') : cardData.category}`);
      console.log(`   回贈: ${cardData.cashback}`);
      console.log(`   描述: ${cardData.description?.substring(0, 50)}...`);
      return true;
    } else {
      console.log(`❌ 測試卡片 ${testCardId} 不存在`);
      console.log(`💡 這可能表示數據導入不完整`);
      return false;
    }
    
  } catch (error) {
    console.error('❌ 測試特定卡片時發生錯誤:', error);
    return false;
  }
}

/**
 * 🚀 主驗證函數
 */
async function main() {
  console.log('🚀 開始Firebase數據庫完整性驗證');
  console.log('💡 這將檢查您的數據是否正確導入並適合ExplorePage使用');
  console.log('=' .repeat(80));
  
  try {
    // 步驟1: 驗證基本結構
    console.log('\n📋 步驟 1/6: 驗證基本數據結構');
    const cards = await verifyBasicStructure();
    
    if (!cards || cards.length === 0) {
      console.log('\n💥 基本驗證失敗，無法繼續');
      process.exit(1);
    }
    
    // 步驟2: 驗證分類系統
    console.log('\n📋 步驟 2/6: 驗證分類系統');
    const categoryCount = verifyCategories(cards);
    
    // 步驟3: 驗證銀行分布
    console.log('\n📋 步驟 3/6: 驗證銀行分布');
    const bankCount = verifyBanks(cards);
    
    // 步驟4: 驗證回贈格式
    console.log('\n📋 步驟 4/6: 驗證回贈格式');
    const cashbackTypes = verifyCashbackFormats(cards);
    
    // 步驟5: 驗證ExplorePage兼容性
    console.log('\n📋 步驟 5/6: 驗證ExplorePage兼容性');
    const isCompatible = verifyExplorePageCompatibility(cards);
    
    // 步驟6: 測試特定卡片
    console.log('\n📋 步驟 6/6: 測試特定卡片讀取');
    const cardTestPassed = await testSpecificCard();
    
    // 生成完整報告
    generateReport(cards, categoryCount, bankCount, cashbackTypes, isCompatible && cardTestPassed);
    
    if (isCompatible && cardTestPassed) {
      console.log('\n🎉 所有驗證項目都通過了！');
      console.log('✅ 您的Firebase數據庫已準備好供ExplorePage使用');
      console.log('🚀 現在可以啟動您的React Native應用程式進行測試');
    } else {
      console.log('\n⚠️ 發現一些需要修復的問題');
      console.log('🔧 請根據上述建議修復後重新驗證');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n💥 驗證過程中發生錯誤:', error);
    console.log('\n🔧 故障排除建議:');
    console.log('1. 🌐 檢查網絡連接是否正常');
    console.log('2. 🔑 確認Firebase配置是否正確');
    console.log('3. 🛡️ 檢查Firebase權限設置');
    console.log('4. 📁 確認已成功執行數據導入');
    
    process.exit(1);
  }
}

// 🔥 如果直接運行此腳本，執行主函數
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main as verifyDatabase };