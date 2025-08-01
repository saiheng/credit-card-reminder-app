const { ManualModificationProtector } = require('./manual_modification_helper.js');

const missingCards = [
  {
    name: 'Airwallex雲匯Visa卡',
    bank: 'Airwallex',
    category: '基本回贈',
    cashback: '1%',
    description: 'Airwallex雲匯Visa卡提供外幣兑換優惠',
    minAnnualIncome: 0,
    annualFee: 0,
    label: 'VISA'
  },
  {
    name: '香港中文大學信用卡',
    bank: '恒生銀行',
    category: '學生',
    cashback: '學生優惠',
    description: '香港中文大學專屬信用卡',
    minAnnualIncome: 0,
    annualFee: 0,
    label: 'VISA'
  },
  {
    name: '香港恒生大學信用卡',
    bank: '恒生銀行',
    category: '學生',
    cashback: '學生優惠',
    description: '香港恒生大學專屬信用卡',
    minAnnualIncome: 0,
    annualFee: 0,
    label: 'VISA'
  },
  {
    name: '香港浸會大學信用卡',
    bank: '恒生銀行',
    category: '學生',
    cashback: '學生優惠',
    description: '香港浸會大學專屬信用卡',
    minAnnualIncome: 0,
    annualFee: 0,
    label: 'VISA'
  },
  {
    name: 'AEON Visa信用卡',
    bank: 'AEON',
    category: '基本回贈',
    cashback: '0.5%',
    description: 'AEON Visa基本回贈信用卡',
    minAnnualIncome: 0,
    annualFee: 0,
    label: 'VISA'
  },
  {
    name: 'AEON Card JAL萬事達卡',
    bank: 'AEON',
    category: '里數回贈',
    cashback: 'JAL里數',
    description: 'AEON JAL聯營卡，賺取JAL里數',
    minAnnualIncome: 0,
    annualFee: 0,
    label: 'Mastercard'
  },
  {
    name: '滙豐滙財金卡',
    bank: '滙豐銀行',
    category: '基本回贈',
    cashback: '0.4%',
    description: '滙豐滙財金卡基本現金回贈',
    minAnnualIncome: 120000,
    annualFee: 0,
    label: 'VISA'
  }
];

async function addMissingCards() {
  const protector = new ManualModificationProtector();
  
  console.log('🆕 開始添加遺漏的信用卡...');
  
  for (const cardData of missingCards) {
    try {
      const cardId = await protector.addManualCard(cardData);
      console.log(`✅ 成功添加: ${cardData.name}`);
    } catch (error) {
      console.error(`❌ 添加失敗: ${cardData.name}`, error.message);
    }
  }
  
  console.log('🎉 遺漏卡片添加完成！');
}

addMissingCards().catch(console.error);