const { ManualModificationProtector } = require('./manual_modification_helper.js');

async function batchUnprotect() {
  const protector = new ManualModificationProtector();
  
  // 列出您想要移除保護的卡片ID
  // 例如：['mox_credit_cashback', 'another_card_id']
  const cardsToUnprotect = [

    // 添加更多卡片ID
  ];
  
  for (const cardId of cardsToUnprotect) {
    try {
      await protector.removeManualProtection(cardId);
      console.log(`✅ 成功移除 ${cardId} 的保護`);
    } catch (error) {
      console.error(`❌ 移除 ${cardId} 保護失敗:`, error.message);
    }
  }
}

batchUnprotect().catch(console.error);