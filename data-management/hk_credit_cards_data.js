// data-management/hk_credit_cards_data.js
// 🔥 修正版：使用CommonJS格式以兼容Expo環境
// 香港信用卡完整資料庫 - 按8大分類整理

const creditCards = [
  // === 基本回贈卡 ===
  {
    id: 'mox_credit_cashback',
    name: 'Mox 信用卡',
    bank: 'Mox Bank',
    category: '基本回贈',
    cashback: '2%',
    description: '全方位消費無上限2%現金回贈，虛擬銀行創新體驗，儲蓄卡前有25萬餘額享受更多優惠',
    conditions: '無上限回贈，儲卡前有25萬餘額可享2%，否則1%',
    nameVariations: ['mox', 'mox credit', 'mox cashback', 'mox 信用卡', 'mox bank'],
    searchKeywords: ['mox', 'cashback', '虛擬銀行', '2%', '無上限', '基本回贈'],
    minAnnualIncome: 0,
    annualFee: 0,
    label: 'Mastercard'
  },
  {
    id: 'anx_earnmore',
    name: '安信EarnMORE銀聯信用卡',
    bank: '安信',
    category: '基本回贈',
    cashback: '2%',
    description: '所有簽賬2%現金回贈，八達通自動增值都有回贈，特別適合日常消費',
    conditions: '首15萬簽賬可享2%回贈，其後1%回贈',
    nameVariations: ['earnmore', 'earn more', 'anx earnmore', '安信earnmore'],
    searchKeywords: ['anx', '安信', 'earnmore', '銀聯', '2%', '八達通'],
    minAnnualIncome: 150000,
    annualFee: 0,
    label: '銀聯'
  },
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
  },
  {
    id: 'citi_cashback',
    name: 'Citi Cash Back信用卡',
    bank: '花旗銀行',
    category: '基本回贈',
    cashback: '2%',
    description: '海外消費2%現金回贈，本地簽賬1%現金回贈，無簽賬上限',
    conditions: '無簽賬上限，海外消費享更高回贈',
    nameVariations: ['citi cashback', 'cash back', 'citicashback'],
    searchKeywords: ['citi', 'cashback', '花旗', '海外', '2%'],
    minAnnualIncome: 120000,
    annualFee: 1800,
    label: 'Mastercard'
  },
    {
    id: 'compass_visa',
    name: 'COMPASS VISA信用卡',
    bank: 'COMPASS',
    category: '基本回贈',
    cashback: '0.55%',
    description: '基本消費回贈',
    conditions: '一般簽賬條件',
    nameVariations: ['compass', 'compass visa'],
    searchKeywords: ['compass', 'visa', '基本回贈'],
    minAnnualIncome: 96000,
    annualFee: 0,
    label: 'VISA'
  },
  {
    id: 'ccb_travo',
    name: '建行(亞洲)TRAVO World Mastercard',
    bank: '建行(亞洲)',
    category: '基本回贈',
    cashback: '1%',
    description: '本地簽賬1%回贈，海外簽賬4%回贈，餐飲簽賬2%回贈',
    conditions: '無最低簽賬要求',
    nameVariations: ['ccb travo', 'travo', '建行travo'],
    searchKeywords: ['建行', 'ccb', 'travo', '海外', '餐飲'],
    minAnnualIncome: 150000,
    annualFee: 0,
    label: 'Mastercard'
  },
  {
    id: 'cncbi_gba_dual',
    name: '信銀國際大灣區雙幣信用卡',
    bank: '信銀國際',
    category: '基本回贈',
    cashback: '4%',
    description: '人民幣及指定電子錢包簽賬4%現金回贈，單筆人民幣消費滿CNY3,000享額外6%回贈，特別適合北上消費',
    conditions: '人民幣消費每日最高回贈HK$120，每月最高HK$200',
    nameVariations: ['cncbi gba', '信銀大灣區', 'gba dual currency', '大灣區雙幣'],
    searchKeywords: ['信銀', 'cncbi', '大灣區', '人民幣', '4%', '雙幣'],
    minAnnualIncome: 96000,
    annualFee: 0,
    label: '銀聯'
  },

  // === 旅遊外幣卡 ===
  {
    id: 'dbs_black_world',
    name: 'DBS Black World Mastercard',
    bank: '星展銀行',
    category: '旅遊外幣',
    cashback: '2%',
    description: '外幣簽賬2%回贈，0%外幣交易手續費，全年旅遊保險保障，機場貴賓室服務',
    conditions: '無簽賬上限，0%外幣手續費',
    nameVariations: ['dbs black', 'black world', 'dbs black world'],
    searchKeywords: ['dbs', 'black', 'world', '外幣', '旅遊', '免手續費'],
    minAnnualIncome: 240000,
    annualFee: 3600,
    label: 'Mastercard'
  },
  {
    id: 'hang_seng_travel_plus',
    name: '恒生Travel+ Visa Signature卡',
    bank: '恒生銀行',
    category: '旅遊外幣',
    cashback: '7%',
    description: '指定外幣簽賬高達7%回贈(日本、韓國、泰國、新加坡、澳洲)，其他外幣5%回贈，旅遊達人首選',
    conditions: '每月簽賬滿HK$6,000，每月回贈上限$500',
    nameVariations: ['travel plus', 'travel+', '恒生travel', 'travel+ card'],
    searchKeywords: ['恒生', 'travel', 'plus', '外幣', '7%', '日本', '韓國'],
    minAnnualIncome: 150000,
    annualFee: 0,
    label: 'VISA'
  },
    {
    id: 'hsbc_everymile',
    name: '滙豐EveryMile信用卡',
    bank: '滙豐銀行',
    category: '旅遊外幣',
    cashback: '2%',
    description: '旅遊服務簽賬2%回贈，全年旅遊保險',
    conditions: '指定旅遊類別簽賬',
    nameVariations: ['hsbc everymile', 'everymile', '滙豐every mile'],
    searchKeywords: ['hsbc', '滙豐', 'everymile', 'every mile', '旅遊'],
    minAnnualIncome: 240000,
    annualFee: 3000,
    label: 'Mastercard'
  },
  {
    id: 'hsbc_pulse_unionpay',
    name: '滙豐Pulse銀聯雙幣鑽石信用卡',
    bank: '滙豐銀行',
    category: '旅遊外幣',
    cashback: '6%',
    description: '外幣簽賬最高額外6%回贈，配合最紅自主獎賞可高達8.4%回贈，Travel Guru會員專享優惠',
    conditions: '需配合最紅自主獎賞，Travel Guru會員有額外優惠',
    nameVariations: ['hsbc pulse', 'pulse 銀聯', '滙豐pulse', '銀聯雙幣'],
    searchKeywords: ['hsbc', '滙豐', 'pulse', '銀聯', '外幣', '6%'],
    minAnnualIncome: 240000,
    annualFee: 2000,
    label: '銀聯'
  },
  {
    id: 'hsbc_visa_signature',
    name: '滙豐Visa Signature卡',
    bank: '滙豐銀行',
    category: '旅遊外幣',
    cashback: '2.4%',
    description: '指定消費類別高達2.4%現金回贈，旅遊保險，機場貴賓室禮遇，高端客戶專屬服務',
    conditions: '配合最紅自主獎賞計劃',
    nameVariations: ['hsbc visa signature', '滙豐signature', 'visa signature'],
    searchKeywords: ['hsbc', '滙豐', 'visa', 'signature', '高端'],
    minAnnualIncome: 360000,
    annualFee: 2000,
    label: 'VISA'
  },

  // === 流動支付卡 ===
  {
    id: 'hang_seng_mmpower',
    name: '恒生MMPOWER World Mastercard',
    bank: '恒生銀行',
    category: '流動支付',
    cashback: '5%',
    description: '流動支付5%回贈，網上零售簽賬5%回贈，海外簽賬6%回贈，現代生活首選',
    conditions: '每月簽賬滿HK$5,000，不同類別有簽賬上限',
    nameVariations: ['mmpower', 'mm power', '恒生mmpower'],
    searchKeywords: ['恒生', 'mmpower', '流動支付', 'apple pay', 'google pay'],
    minAnnualIncome: 150000,
    annualFee: 0,
    label: 'Mastercard'
  },
  {
    id: 'anx_wewa',
    name: '安信WeWa信用卡',
    bank: '安信',
    category: '流動支付',
    cashback: '6%',
    description: '手機支付6%回贈，娛樂消費4%回贈，年輕人生活必備卡',
    conditions: '手機支付每月最多HK$200回贈',
    nameVariations: ['wewa', 'we wa', 'anx wewa'],
    searchKeywords: ['anx', '安信', 'wewa', '手機支付', 'apple pay'],
    minAnnualIncome: 150000,
    annualFee: 0,
    label: 'VISA'
  },

  // === 網上購物卡 ===
  {
    id: 'sim_credit_card',
    name: 'sim Credit Card',
    bank: 'SIM',
    category: '網上購物',
    cashback: '8%',
    description: '網購消費高達8%現金回贈，本地交通8%回贈，指定商戶3%回贈，免入息要求',
    conditions: '每月累積非網購簽賬滿HK$1,000後，單筆網購HK$500+享8%回贈，每月回贈上限HK$200',
    nameVariations: ['sim', 'sim card', 'sim credit'],
    searchKeywords: ['sim', '網購', '8%', '交通', '免入息'],
    minAnnualIncome: 0,
    annualFee: 0,
    label: 'Mastercard'
  },
  {
    id: 'hsbc_red',
    name: '滙豐Red信用卡',
    bank: '滙豐銀行',
    category: '網上購物',
    cashback: '4%',
    description: '網上購物簽賬4%回贈，超市簽賬2%回贈，年輕人理財首選',
    conditions: '網購每月回贈上限HK$10,000',
    nameVariations: ['hsbc red', 'red card', '滙豐red'],
    searchKeywords: ['hsbc', '滙豐', 'red', '網購', '4%', '超市'],
    minAnnualIncome: 120000,
    annualFee: 0,
    label: 'Mastercard'
  },
  {
    id: 'dbs_live_fresh',
    name: 'DBS Live Fresh Card',
    bank: '星展銀行',
    category: '網上購物',
    cashback: '6%',
    description: '網購高達6%回贈，每月自選回贈類別，靈活配合您的消費習慣',
    conditions: '每月自選類別，有簽賬上限',
    nameVariations: ['dbs live fresh', 'live fresh'],
    searchKeywords: ['dbs', 'live fresh', '網購', '自選', '6%'],
    minAnnualIncome: 150000,
    annualFee: 0,
    label: 'VISA'
  },
    {
    id: 'dbs_compass_visa',
    name: 'DBS COMPASS VISA',
    bank: '星展銀行',
    category: '網上購物',
    cashback: '1%',
    description: 'Flexi Shopping分期優惠，DBS咖啡店優惠',
    conditions: '基本回贈，適合一般消費',
    nameVariations: ['dbs compass', 'compass visa', 'dbs compass visa'],
    searchKeywords: ['dbs', 'compass', 'visa', 'flexi'],
    minAnnualIncome: 96000,
    annualFee: 0,
    label: 'VISA'
  },

  // === 超市卡 ===
  {
    id: 'scb_smart',
    name: '渣打Smart信用卡',
    bank: '渣打銀行',
    category: '超市',
    cashback: '5%',
    description: '指定商戶5%現金回贈，包括PARKnSHOP、HKTVmall等，家庭主婦必備',
    conditions: '每月簽賬滿HK$4,000後，指定商戶簽賬上限HK$15,000',
    nameVariations: ['scb smart', 'smart card', '渣打smart'],
    searchKeywords: ['渣打', 'scb', 'smart', 'parknshop', '百佳', '5%'],
    minAnnualIncome: 96000,
    annualFee: 0,
    label: 'VISA'
  },
  {
    id: 'hsbc_easy',
    name: '滙豐easy信用卡',
    bank: '滙豐銀行',
    category: '超市',
    cashback: '2.4%',
    description: '指定消費類別高達2.4%現金回贈，配合最紅自主獎賞計劃，超市購物首選',
    conditions: '配合最紅自主獎賞計劃',
    nameVariations: ['hsbc easy', 'easy card', '滙豐easy'],
    searchKeywords: ['hsbc', '滙豐', 'easy', '超市', '自主獎賞'],
    minAnnualIncome: 150000,
    annualFee: 0,
    label: 'VISA'
  },

  // === 餐飲美食卡 ===
  {
    id: 'dbs_eminent_signature',
    name: 'DBS Eminent Visa Signature Card',
    bank: '星展銀行',
    category: '餐飲美食',
    cashback: '5%',
    description: '餐飲、醫療服務、健身中心簽賬5%回贈，其他簽賬1%回贈，生活品質提升首選',
    conditions: '單筆簽賬滿HK$300享5%回贈，否則1%回贈',
    nameVariations: ['dbs eminent signature', 'eminent signature', 'dbs eminent'],
    searchKeywords: ['dbs', 'eminent', 'signature', '餐飲', '5%', '醫療'],
    minAnnualIncome: 240000,
    annualFee: 1800,
    label: 'VISA'
  },
    {
    id: 'dbs_eminent_platinum',
    name: 'DBS Eminent Visa Platinum Card',
    bank: '星展銀行',
    category: '餐飲美食',
    cashback: '5%',
    description: '餐飲、醫療服務、健身中心簽賬5%回贈，其他簽賬1%回贈',
    conditions: '單筆簽賬滿HK$300享5%回贈，否則1%回贈',
    nameVariations: ['dbs eminent platinum', 'eminent platinum', 'dbs eminent'],
    searchKeywords: ['dbs', 'eminent', 'platinum', '餐飲', '5%', '醫療'],
    minAnnualIncome: 120000,
    annualFee: 1800,
    label: 'VISA'
  },
  {
    id: 'hang_seng_enjoy',
    name: '恒生enJoy卡',
    bank: '恒生銀行',
    category: '餐飲美食',
    cashback: '2%',
    description: '2000+間特約商戶高達2%回贈，yuu積分計劃，餐飲購物兩不誤',
    conditions: '特約商戶簽賬，yuu積分可當現金使用',
    nameVariations: ['恒生enjoy', 'hang seng enjoy', 'enjoy card'],
    searchKeywords: ['恒生', 'enjoy', 'yuu', '餐飲', '特約商戶'],
    minAnnualIncome: 150000,
    annualFee: 0,
    label: 'VISA'
  },
    {
    id: 'bea_unionpay_dual',
    name: '東亞銀行銀聯雙幣白金信用卡',
    bank: '東亞銀行',
    category: '餐飲美食',
    cashback: '1.2%',
    description: '全港餐廳食肆3X獎分(1.2%回贈)，本地消費2X獎分(0.8%回贈)',
    conditions: '餐飲簽賬享較高回贈',
    nameVariations: ['東亞銀聯', 'bea unionpay', '東亞雙幣'],
    searchKeywords: ['東亞', 'bea', '銀聯', '餐飲', '1.2%'],
    minAnnualIncome: 96000,
    annualFee: 0,
    label: '銀聯'
  },

  // === 學生卡 ===
  {
    id: 'aeon_wakuwaku',
    name: 'AEON CARD WAKUWAKU',
    bank: 'AEON',
    category: '學生',
    cashback: '6%',
    description: '日本簽賬6%回贈，生日月份日本簽賬10%回贈，適合經常赴日的學生',
    conditions: '適合經常赴日消費的學生',
    nameVariations: ['aeon wakuwaku', 'wakuwaku', 'aeon waku'],
    searchKeywords: ['aeon', 'wakuwaku', '日本', '6%', '生日月'],
    minAnnualIncome: 0,
    annualFee: 0,
    label: 'JCB'
  },
    {
    id: 'cuhk_credit_card',
    name: '香港城市大學信用卡',
    bank: '恒生銀行',
    category: '學生',
    cashback: '學生優惠',
    description: '香港城市大學專屬信用卡，學生專享優惠',
    conditions: '香港城市大學學生專用',
    nameVariations: ['cuhk card', '城大信用卡', '城市大學卡'],
    searchKeywords: ['城大', 'cuhk', '城市大學', '學生', '大學'],
    minAnnualIncome: 0,
    annualFee: 0,
    label: 'VISA'
  },
  {
    id: 'ccb_aeon',
    name: '建行(亞洲)AEON信用卡',
    bank: '建行(亞洲)',
    category: '學生',
    cashback: '多類別回贈',
    description: 'AEON購物優惠，學生可申請，首5年免年費',
    conditions: 'AEON商店有特別優惠',
    nameVariations: ['ccb aeon', 'aeon card', '建行aeon'],
    searchKeywords: ['建行', 'ccb', 'aeon', '學生', '免年費'],
    minAnnualIncome: 0,
    annualFee: 0,
    label: 'AEON聯營卡'
  },
  {
    id: 'hang_seng_mmpower_student',
    name: '恒生MMPOWER World Mastercard (學生版)',
    bank: '恒生銀行',
    category: '學生',
    cashback: '5%',
    description: '學生專用，網購5%回贈，流動支付5%回贈，年輕人數位生活必備',
    conditions: '全日制大學/大專學生，簽賬滿HK$2,000享迎新',
    nameVariations: ['mmpower student', '恒生學生卡'],
    searchKeywords: ['恒生', 'mmpower', '學生', '大學', '網購'],
    minAnnualIncome: 0,
    annualFee: 0,
    label: 'Mastercard'
  },

  // === 里數回贈卡 ===
  {
    id: 'cncbi_hk_airlines',
    name: '信銀國際香港航空Mastercard信用卡',
    bank: '信銀國際',
    category: '里數回贈',
    cashback: '$2/里',
    description: '低至$2=1 FWC積分，迎新積分可換沖繩來回機票，免費入香港航空機場貴賓室',
    conditions: '需要香港航空會員身份',
    nameVariations: ['cncbi hk airlines', '信銀香港航空', 'hk airlines mastercard'],
    searchKeywords: ['信銀', 'cncbi', '香港航空', 'fwc', '沖繩', '機場'],
    minAnnualIncome: 150000,
    annualFee: 1800,
    label: 'Mastercard'
  },
  {
    id: 'citi_rewards',
    name: 'Citi Rewards信用卡',
    bank: '花旗銀行',
    category: '里數回贈',
    cashback: '$3/里',
    description: '本地簽賬$3=1里，外幣簽賬$3=1里，積分永久有效，里數換獎首選',
    conditions: '可選擇兌換里數或現金回贈',
    nameVariations: ['citi rewards', 'rewards card'],
    searchKeywords: ['citi', 'rewards', '花旗', '里數', '$3/里'],
    minAnnualIncome: 120000,
    annualFee: 1800,
    label: 'Mastercard'
  },
  {
    id: 'scb_cathay',
    name: '渣打國泰Mastercard',
    bank: '渣打銀行',
    category: '里數回贈',
    cashback: '$4/里',
    description: '食肆、酒店及海外簽賬$4=1里，其他簽賬$6=1里，國泰航空禮遇，飛行常客必備',
    conditions: '需要國泰會員身份',
    nameVariations: ['scb cathay', '渣打國泰', 'cathay mastercard'],
    searchKeywords: ['渣打', 'cathay', '國泰', '里數', 'miles', '食肆'],
    minAnnualIncome: 96000,
    annualFee: 2000,
    label: 'Mastercard'
  },
  {
    id: 'hsbc_everymile_miles',
    name: '滙豐EveryMile信用卡',
    bank: '滙豐銀行',
    category: '里數回贈',
    cashback: '$2/里',
    description: '指定日常及旅遊消費$2=1里，Netflix、Spotify等$2=1里，免費機場貴賓室',
    conditions: '指定商戶類別',
    nameVariations: ['hsbc everymile miles', 'everymile里數'],
    searchKeywords: ['hsbc', '滙豐', 'everymile', 'miles', 'netflix', '機場'],
    minAnnualIncome: 240000,
    annualFee: 3000,
    label: 'Mastercard'
  },
  {
    id: 'ae_platinum',
    name: '美國運通白金卡',
    bank: '美國運通',
    category: '里數回贈',
    cashback: '多倍積分',
    description: '多倍積分獎賞，全年旅遊保險，機場貴賓室，酒店禮遇，頂級卡片體驗',
    conditions: '不同消費類別有不同倍數',
    nameVariations: ['ae platinum', 'amex platinum', '美運白金'],
    searchKeywords: ['amex', 'ae', 'platinum', '白金', '美國運通', '機場'],
    minAnnualIncome: 0,
    annualFee: 9500,
    label: 'AE'
  },
    {
    id: 'ae_explorer',
    name: 'American Express Explorer信用卡',
    bank: '美國運通',
    category: '里數回贈',
    cashback: '$3/里',
    description: '里數回贈高達$3=1里，免費入機場貴賓室',
    conditions: '年簽賬達標可享更多禮遇',
    nameVariations: ['ae explorer', 'amex explorer', 'explorer card'],
    searchKeywords: ['amex', 'ae', 'explorer', '里數', '機場', '$3/里'],
    minAnnualIncome: 300000,
    annualFee: 1800,
    label: 'AE'
  },
  {
    id: 'dah_sing_one_plus',
    name: '大新ONE+信用卡',
    bank: '大新銀行',
    category: '里數回贈',
    cashback: '$4/里',
    description: '所有消費$4=1里，無限里、無限飛，0%外幣交易手續費，里數愛好者首選',
    conditions: '0%外幣交易手續費',
    nameVariations: ['dah sing one plus', 'one plus', 'one+'],
    searchKeywords: ['大新', 'one plus', 'one+', '里數', '$4/里'],
    minAnnualIncome: 120000,
    annualFee: 1800,
    label: 'Mastercard'
  },
  {
    id: 'bea_flyer_world',
    name: '東亞Flyer World Mastercard',
    bank: '東亞銀行',
    category: '里數回贈',
    cashback: '$5/里',
    description: '外幣簽賬$5=1里，本地簽賬$8=1里',
    conditions: '里數兌換有手續費',
    nameVariations: ['bea flyer', 'flyer world', '東亞flyer'],
    searchKeywords: ['東亞', 'bea', 'flyer', '里數', '$5/里'],
    minAnnualIncome: 240000,
    annualFee: 1800,
    label: 'Mastercard'
  },
  {
    id: 'dah_sing_ana',
    name: '大新ANA World萬事達卡',
    bank: '大新銀行',
    category: '里數回贈',
    cashback: 'ANA里數',
    description: 'ANA里數兌換，日本簽賬優惠',
    conditions: 'ANA會員專屬',
    nameVariations: ['dah sing ana', 'ana card'],
    searchKeywords: ['大新', 'ana', '全日空', '日本', '里數'],
    minAnnualIncome: 150000,
    annualFee: 2000,
    label: 'Mastercard'
  },
  {
    id: 'dah_sing_ba',
    name: '大新英國航空白金卡',
    bank: '大新銀行',
    category: '里數回贈',
    cashback: 'Avios里數',
    description: '英航里數兌換，歐洲簽賬優惠',
    conditions: '英航會員專屬',
    nameVariations: ['dah sing ba', 'british airways card'],
    searchKeywords: ['大新', 'ba', '英航', 'avios', '里數'],
    minAnnualIncome: 200000,
    annualFee: 2500,
    label: 'Mastercard'
  },
  {
    id: 'citic_motion',
    name: '信銀國際MOTION信用卡',
    bank: '信銀國際',
    category: '里數回贈',
    cashback: '自選類別',
    description: '自選簽賬類別，靈活賺取里數或回贈',
    conditions: '需登記自選類別',
    nameVariations: ['citic motion', 'motion card'],
    searchKeywords: ['信銀', 'citic', 'motion', '自選', '里數'],
    minAnnualIncome: 150000,
    annualFee: 0,
    label: 'Mastercard'
  },
  {
    id: 'citi_premiermiles',
    name: 'Citi PremierMiles信用卡',
    bank: '花旗銀行',
    category: '里數回贈',
    cashback: '$8/里',
    description: '本地簽賬$8=1里，外幣簽賬$4=1里',
    conditions: '里數兌換免手續費',
    nameVariations: ['citi premiermiles', 'premier miles'],
    searchKeywords: ['citi', 'premiermiles', '花旗', '里數', '外幣'],
    minAnnualIncome: 120000,
    annualFee: 1800,
    label: 'VISA'
  }
];

// 按分類整理的輔助函數
const getCreditCardsByCategory = (category) => {
  return creditCards.filter(card => card.category === category);
};

// 按銀行整理的輔助函數
const getCreditCardsByBank = (bank) => {
  return creditCards.filter(card => card.bank === bank);
};

// 搜索功能
const searchCreditCards = (keyword) => {
  const lowerKeyword = keyword.toLowerCase();
  return creditCards.filter(card => 
    card.name.toLowerCase().includes(lowerKeyword) ||
    card.bank.toLowerCase().includes(lowerKeyword) ||
    card.searchKeywords.some(kw => kw.toLowerCase().includes(lowerKeyword)) ||
    card.nameVariations.some(nv => nv.toLowerCase().includes(lowerKeyword))
  );
};

// 🔥 使用CommonJS格式導出
module.exports = {
  creditCards,
  getCreditCardsByCategory,
  getCreditCardsByBank,
  searchCreditCards
};