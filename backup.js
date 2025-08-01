// backup.js - 🔥 簡單的資料備份腳本
import { creditCardService } from './firebase.js';
import fs from 'fs';

// 備份所有信用卡資料
export const backupCreditCards = async () => {
  try {
    console.log('🚀 開始備份信用卡資料...');
    
    // 獲取所有資料
    const allCards = await creditCardService.getAllCards();
    
    // 創建備份對象
    const backupData = {
      timestamp: new Date().toISOString(),
      totalCards: allCards.length,
      cards: allCards,
      metadata: {
        backupVersion: '1.0',
        appVersion: '1.0.0',
        description: '信用卡資料庫完整備份'
      }
    };
    
    // 生成檔案名稱（包含日期時間）
    const now = new Date();
    const dateString = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const timeString = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
    const fileName = `credit_cards_backup_${dateString}_${timeString}.json`;
    
    // 儲存到檔案
    const backupJson = JSON.stringify(backupData, null, 2);
    fs.writeFileSync(fileName, backupJson, 'utf8');
    
    console.log(`✅ 備份完成！`);
    console.log(`📁 檔案位置: ${fileName}`);
    console.log(`📊 備份統計: ${allCards.length} 張信用卡`);
    console.log(`💾 檔案大小: ${(backupJson.length / 1024).toFixed(2)} KB`);
    
    return {
      success: true,
      fileName: fileName,
      cardCount: allCards.length
    };
    
  } catch (error) {
    console.error('❌ 備份失敗:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// 從備份檔案還原資料
export const restoreFromBackup = async (backupFileName) => {
  try {
    console.log('🔄 開始還原資料...');
    
    // 讀取備份檔案
    const backupContent = fs.readFileSync(backupFileName, 'utf8');
    const backupData = JSON.parse(backupContent);
    
    console.log(`📁 讀取備份檔案: ${backupFileName}`);
    console.log(`📅 備份時間: ${backupData.timestamp}`);
    console.log(`📊 卡片數量: ${backupData.totalCards}`);
    
    // 還原每張卡片
    let successCount = 0;
    let failCount = 0;
    
    for (const card of backupData.cards) {
      try {
        const success = await creditCardService.addCard(card);
        if (success) {
          successCount++;
          console.log(`✅ 還原成功: ${card.name}`);
        } else {
          failCount++;
          console.log(`❌ 還原失敗: ${card.name}`);
        }
        
        // 避免過於頻繁的請求
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        failCount++;
        console.error(`❌ 還原 ${card.name} 時發生錯誤:`, error);
      }
    }
    
    console.log('🎉 還原完成！');
    console.log(`📊 統計結果: 成功 ${successCount} 張，失敗 ${failCount} 張`);
    
    return {
      success: true,
      successCount,
      failCount
    };
    
  } catch (error) {
    console.error('❌ 還原失敗:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// 如果您想要立即執行備份，取消下面這行的註釋
// backupCreditCards();