# 信用卡管家應用程式 - 完整文件結構與維護指南

## 📁 項目文件結構

```
CreditCardReminder/
├── 📄 App.js                           # 主應用程式入口，導航管理
├── 📄 app.json                         # Expo 配置文件
├── 📄 babel.config.js                  # Babel 編譯配置
├── 📄 package.json                     # 項目依賴和腳本
├── 📄 package-lock.json                # 鎖定依賴版本
├── 📁 .expo/                           # Expo 緩存文件夾（自動生成）
├── 📁 node_modules/                    # 依賴包文件夾（自動生成）
│
├── 📁 components/                      # 所有 React 組件
│   ├── 📄 WelcomePage.js               # 歡迎頁面（首次啟動）
│   ├── 📄 LoginPage.js                 # 登入頁面（認證界面）
│   ├── 📄 HomePage.js                  # 主頁面（日曆+概覽）
│   ├── 📄 ProfilePage.js               # 個人資料頁面
│   ├── 📄 MyCardsPage.js               # 我的信用卡管理
│   ├── 📄 AddCardPage.js               # 新增信用卡表單
│   ├── 📄 NotificationsPage.js         # 通知設定管理
│   ├── 📄 HistoryPage.js               # 還款歷史記錄
│   └── 📄 AchievementsPage.js          # 成就系統
│
└── 📁 utils/                           # 工具函數（如需要）
    └── 📄 NotificationManager.js       # 通知管理器（如果使用）
```

## 🔧 核心技術棧

### **開發框架**
- **React Native** - 跨平台移動應用開發
- **Expo** - 開發工具包和運行環境
- **JavaScript** - 主要編程語言

### **關鍵依賴包**
```json
{
  "dependencies": {
    "@react-native-async-storage/async-storage": "^1.x.x",
    "expo": "~49.0.0",
    "expo-notifications": "~0.20.0",
    "expo-device": "~5.4.0",
    "expo-constants": "~14.4.0",
    "react": "18.2.0",
    "react-native": "0.72.0",
    "date-fns": "^2.x.x"
  }
}
```

## 📱 應用程式頁面架構

### **用戶流程圖**
```
WelcomePage (歡迎頁)
    ↓ (點擊 "Start Now")
LoginPage (登入頁)
    ↓ (登入成功)
HomePage (主頁面)
    ├─ MyCardsPage (我的卡片)
    ├─ AddCardPage (新增卡片)
    ├─ NotificationsPage (通知設定)
    ├─ HistoryPage (歷史記錄)
    ├─ AchievementsPage (成就系統)
    └─ ProfilePage (個人資料)
```

### **頁面功能說明**

| 頁面名稱 | 主要功能 | 關鍵特色 |
|---------|---------|---------|
| **WelcomePage** | 歡迎界面 | 品牌展示、首次引導 |
| **LoginPage** | 用戶認證 | Gmail/Apple ID/SMS 登入 |
| **HomePage** | 主控制台 | 日曆顯示、快速概覽 |
| **MyCardsPage** | 卡片管理 | 查看、編輯、刪除信用卡 |
| **AddCardPage** | 新增卡片 | 表單輸入、銀行選擇 |
| **NotificationsPage** | 通知設定 | 自定義提醒時間 |
| **HistoryPage** | 還款記錄 | 歷史統計、搜尋功能 |
| **AchievementsPage** | 成就系統 | 用戶激勵、進度追蹤 |
| **ProfilePage** | 用戶設定 | 個人資料、語言切換 |

## 🎨 UI/UX 設計規範

### **設計主題**
- **風格**：現代專業，深色主題
- **主色調**：#1a1a1a (背景), #2a2a2a (卡片)
- **強調色**：#007AFF (主按鈕), #FF3B30 (警告)
- **文字色**：#FFFFFF (主文字), #999999 (輔助文字)

### **組件規範**
- **圓角半徑**：8px (小組件), 12px (卡片), 20px (按鈕)
- **陰影效果**：使用一致的 shadowOffset 和 shadowOpacity
- **間距系統**：8px, 16px, 24px, 32px 的倍數系統
- **字體大小**：12px (小字), 16px (正文), 20px (標題), 24px (大標題)

## 🔔 通知系統配置

### **預設通知規則**
```javascript
默認提醒時間：
├── 還款日前 7 天：早上 9:00、下午 6:00
├── 還款日前 3 天：早上 9:00、下午 6:00  
├── 還款日前 1 天：早上 9:00、下午 6:00
├── 還款當日：早上 9:00
└── 逾期後：每日早上 9:00（直到標記已還款）
```

### **自定義選項**
- 用戶可調整每個提醒的具體時間
- 支援開啟/關閉個別信用卡的通知
- 測試通知功能驗證設定

## 💾 數據存儲結構

### **AsyncStorage 數據格式**
```javascript
// 用戶數據
userData: {
  name: "用戶名稱",
  email: "email@example.com",
  phone: "手機號碼",
  loginMethod: "gmail|apple|sms",
  language: "zh-TW|en",
  isLoggedIn: true
}

// 信用卡數據
creditCards: [
  {
    id: "unique_id",
    name: "卡片名稱",
    bank: "銀行名稱", 
    dueDay: "還款日期(1-31)",
    color: "#顏色代碼",
    notificationEnabled: true,
    isMarkedPaid: false,
    createdAt: "創建時間"
  }
]

// 還款歷史
paymentHistory: [
  {
    cardId: "信用卡ID",
    date: "還款日期",
    markedDate: "標記日期",
    onTime: true,
    month: "年-月"
  }
]

// 通知設定
notificationSettings: {
  [cardId]: {
    enabled: true,
    customTimes: [
      { days: 7, time: "09:00" },
      { days: 3, time: "18:00" }
    ]
  }
}

// 成就數據
achievements: [
  {
    id: "achievement_id",
    name: "成就名稱",
    description: "成就描述", 
    unlocked: true,
    unlockedDate: "解鎖日期",
    progress: 1.0
  }
]
```

## 🏦 香港銀行支援列表

### **支援的銀行**
```javascript
const HONG_KONG_BANKS = [
  { value: 'hsbc', label: '匯豐銀行 HSBC', color: '#db0011' },
  { value: 'hangseng', label: '恒生銀行 Hang Seng', color: '#0066cc' },
  { value: 'boc', label: '中國銀行 BOC', color: '#8B0000' },
  { value: 'icbc', label: '工商銀行 ICBC', color: '#c41e3a' },
  { value: 'scb', label: '渣打銀行 Standard Chartered', color: '#0f7ec6' },
  { value: 'dbs', label: '星展銀行 DBS', color: '#e31837' },
  { value: 'citibank', label: '花旗銀行 Citibank', color: '#1976d2' },
  { value: 'ccb', label: '建設銀行 CCB', color: '#003d7a' },
  { value: 'bea', label: '東亞銀行 BEA', color: '#0066cc' },
  { value: 'other', label: '其他銀行', color: '#666666' }
];
```

## 🔄 開發與部署流程

### **開發環境設置**
```bash
# 1. 安裝 Node.js (版本 v18+)
# 2. 安裝 Expo CLI
npm install -g expo-cli

# 3. 克隆或創建項目
expo init CreditCardReminder

# 4. 安裝依賴
cd CreditCardReminder
npm install

# 5. 啟動開發服務器
npm start
```

### **測試清單**
- [ ] 所有頁面正常載入
- [ ] 信用卡 CRUD 操作
- [ ] 通知發送測試
- [ ] 數據持久化驗證
- [ ] 不同屏幕尺寸適配
- [ ] 語言切換功能
- [ ] 登入登出流程

### **構建和發布**
```bash
# 安裝 EAS CLI
npm install -g @expo/eas-cli

# 登入 Expo 帳戶
eas login

# 配置構建
eas build:configure

# 構建 iOS 版本
eas build --platform ios

# 構建 Android 版本  
eas build --platform android
```

## 🐛 常見問題解決

### **編譯錯誤**
- **Slider 組件不存在** → 已改用自定義時間選擇器
- **date-fns 未安裝** → `npm install date-fns`
- **AsyncStorage 錯誤** → `npm install @react-native-async-storage/async-storage`

### **運行時錯誤**
- **Cannot read property 'xxx' of undefined** → 增加空值檢查和預設值
- **Navigation 錯誤** → 確保所有頁面都正確導入
- **通知權限被拒絕** → 在設定中手動開啟通知權限

## 📈 未來擴展規劃

### **短期優化（1-2個月）**
- [ ] 應用程式圖標和啟動畫面優化
- [ ] 更多銀行品牌支援
- [ ] 通知內容個人化
- [ ] 資料備份和恢復功能

### **中期功能（3-6個月）**
- [ ] 雲端同步功能
- [ ] 多裝置數據同步
- [ ] 生物識別登入
- [ ] 智能還款建議

### **長期願景（6個月+）**
- [ ] AI 智能分析
- [ ] 社群功能
- [ ] 積分商店系統
- [ ] 開放 API 接口

## 🛡️ 安全和隱私

### **數據保護**
- 所有敏感數據僅存儲在本地裝置
- 不收集用戶真實信用卡號碼
- 支援生物識別認證（未來功能）

### **權限需求**
- **通知權限** - 發送還款提醒
- **存儲權限** - 保存應用程式數據
- **網絡權限** - 用戶認證（如使用）

## 💡 維護建議

### **定期檢查**
- 每月檢查 Expo SDK 更新
- 每季度檢查依賴包更新
- 監控用戶反饋和錯誤報告

### **版本控制**
建議使用 Git 進行版本控制：
```bash
git init
git add .
git commit -m "Initial commit - Credit Card Manager App"
```

### **備份策略**
- 定期備份整個項目文件夾
- 保存關鍵配置文件和數據結構
- 記錄重要的功能變更和修復

---

**項目創建日期**：2025年7月  
**最後更新**：根據聊天記錄整理  
**版本**：1.0.0  
**作者**：基於 Claude AI 協助開發