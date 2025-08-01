# 信用卡管理應用 - 項目結構與規格文檔

## 項目概述

**應用名稱**: CardReminder (信用卡管家)  
**類型**: React Native 移動應用程序  
**平台**: iOS & Android  
**主要功能**: 信用卡付款提醒、管理和追蹤系統

這是一個專為管理多張信用卡付款而設計的智能移動應用，提供及時提醒、付款追蹤、成就系統等功能，幫助用戶避免逾期付款並建立良好的信用記錄。

## 技術架構

### 核心技術棧
- **框架**: React Native 0.79.5 + Expo SDK ~53.0.20
- **狀態管理**: React Hooks (useState, useEffect)
- **本地存儲**: @react-native-async-storage/async-storage
- **通知系統**: expo-notifications
- **圖標庫**: @expo/vector-icons (MaterialIcons, Ionicons, FontAwesome5)
- **日期處理**: date-fns
- **圖片選擇**: expo-image-picker

### 開發依賴
- **核心**: React 19.0.0
- **構建工具**: Babel, Expo CLI
- **手勢處理**: react-native-gesture-handler
- **SVG支持**: react-native-svg

## 項目文件結構

```
CreditCardReminder/
├── App.js                          # 主應用入口，狀態管理和路由
├── index.js                        # Expo 註冊入口
├── package.json                    # 項目配置和依賴
├── languages.js                    # 多語言翻譯文件
├── components/                     # UI組件目錄
│   ├── WelcomePage.js             # 歡迎頁面
│   ├── LoginPage.js               # 登入頁面
│   ├── SignUpPage.js              # 註冊頁面（開發中）
│   ├── HomePage.js                # 主頁面/儀表板
│   ├── ProfilePage.js             # 用戶資料頁面
│   ├── MyCardsPage.js             # 我的信用卡頁面
│   ├── AddCardPage.js             # 添加信用卡頁面
│   ├── NotificationsPage.js       # 通知設定頁面
│   ├── HistoryPage.js             # 付款歷史頁面
│   ├── AchievementsPage.js        # 成就系統頁面
│   ├── LanguageSelector.js        # 語言選擇組件
│   └── NotificationManager.js     # 通知管理工具類
├── assets/                        # 靜態資源
│   └── welcome_page_photo.png     # 歡迎頁面插圖
├── .gitignore                     # Git忽略文件配置
└── node_modules/                  # 依賴包（自動生成）
```

## 核心功能模塊

### 1. 用戶認證系統
**文件**: `LoginPage.js`, `SignUpPage.js`
- **Google OAuth 集成**: 支持Google賬號快速登入
- **郵箱密碼登入**: 傳統登入方式（開發中）
- **用戶數據持久化**: 登入狀態和用戶資料本地保存

### 2. 信用卡管理系統
**文件**: `MyCardsPage.js`, `AddCardPage.js`

**支持銀行**:
- 匯豐銀行 (HSBC)
- 恒生銀行 (Hang Seng Bank)
- 中國銀行香港 (Bank of China Hong Kong)
- 工商銀行亞洲 (ICBC Asia)
- 渣打銀行 (Standard Chartered)
- 星展銀行 (DBS Bank)
- 花旗銀行 (Citibank)
- 建設銀行亞洲 (CCB Asia)
- 東亞銀行 (Bank of East Asia)
- 其他銀行

**卡片數據結構**:
```javascript
{
  id: "唯一標識符",
  lastFourDigits: "卡號後四位",
  cardName: "卡片名稱",
  dueDate: "每月到期日(1-31)",
  bank: "發卡銀行",
  isNotificationEnabled: "是否啟用通知",
  isPaidThisMonth: "本月是否已付款",
  createdAt: "創建時間"
}
```

### 3. 智能通知系統
**文件**: `NotificationsPage.js`, `NotificationManager.js`

**通知類型**:
- **到期提醒**: 可設定提前7天、3天、1天提醒
- **當日提醒**: 到期日當天提醒
- **逾期提醒**: 逾期後每日提醒直到標記為已付款

**通知設定功能**:
- 全局設定和個別卡片設定
- 自定義提醒時間（早上、下午、晚上）
- 逾期提醒時間設定
- 通知權限管理

### 4. 付款歷史追蹤
**文件**: `HistoryPage.js`

**歷史記錄功能**:
- 付款記錄查看和搜索
- 按時付款統計
- 逾期付款記錄
- 按時付款率計算
- 按卡片名稱搜索

### 5. 成就系統
**文件**: `AchievementsPage.js`

**成就類型**:
- **入門成就**: 添加第一張卡片、首次付款
- **收藏家**: 管理多張信用卡
- **守時達人**: 連續按時付款記錄
- **長期用戶**: 持續使用應用
- **完美主義者**: 100%按時付款率

### 6. 多語言系統
**文件**: `languages.js`, `LanguageSelector.js`

**支持語言**:
- 英文 (English)
- 繁體中文 (Traditional Chinese)

**實現特點**:
- 動態語言切換
- 用戶偏好保存
- 全應用程序翻譯覆蓋

## 數據持久化架構

### AsyncStorage 數據結構

```javascript
// 用戶數據
userData: {
  name: "用戶姓名",
  email: "郵箱地址", 
  phone: "電話號碼",
  loginMethod: "登入方式",
  language: "偏好語言",
  isLoggedIn: "登入狀態",
  avatar: "頭像URI"
}

// 信用卡數據
creditCards: [卡片對象數組]

// 付款歷史
paymentHistory: [
  {
    id: "記錄ID",
    cardId: "關聯卡片ID",
    dueDate: "到期日期",
    paymentDate: "實際付款日期",
    onTime: "是否按時付款",
    createdAt: "記錄創建時間"
  }
]

// 通知設定
notificationSettings: {
  全局設定和個別卡片設定
}

// 成就數據
achievements: [成就進度數組]

// 當前語言
currentLanguage: "語言代碼"
```

## 狀態管理架構

### 主要狀態變量
**文件**: `App.js`

```javascript
const [currentPage, setCurrentPage] = useState('Welcome');
const [currentLanguage, setCurrentLanguage] = useState('en');
const [userData, setUserData] = useState({...});
const [creditCards, setCreditCards] = useState([]);
const [paymentHistory, setPaymentHistory] = useState([]);
const [notificationSettings, setNotificationSettings] = useState({});
const [achievements, setAchievements] = useState([]);
```

### 核心業務邏輯函數

**用戶管理**:
- `handleLogin()`: 處理用戶登入
- `handleLogout()`: 處理用戶登出
- `handleUpdateUserData()`: 更新用戶資料

**信用卡管理**:
- `handleAddCard()`: 添加新信用卡
- `handleUpdateCard()`: 更新卡片資料
- `handleDeleteCard()`: 刪除信用卡
- `handleMarkPayment()`: 標記付款狀態

**通知管理**:
- `handleUpdateNotificationSettings()`: 更新通知設定

**成就系統**:
- `handleUpdateAchievements()`: 更新成就進度

## UI/UX 設計規範

### 色彩系統
- **主色調**: 黑色 (#000000) - 現代簡約風格
- **輔助色**: 藍色 (#2196F3) - 信任和專業
- **成功色**: 綠色 (#4CAF50) - 完成狀態
- **警告色**: 橙色 (#FF9800) - 注意事項
- **背景色**: 白色和淺灰色系

### 設計原則
- **簡約設計**: 清晰的層次結構和充足的留白
- **直觀操作**: 符合用戶直覺的交互設計
- **視覺反饋**: 適當的動畫和狀態提示
- **響應式布局**: 適配不同屏幕尺寸

## 通知系統詳細規格

### 通知排程邏輯
1. **權限檢查**: 應用啟動時檢查通知權限
2. **智能排程**: 根據卡片到期日和用戶設定自動安排通知
3. **動態更新**: 卡片狀態變更時重新排程通知
4. **逾期管理**: 逾期卡片每日提醒直到付款

### 通知內容個性化
- **可愛風格**: 使用寵物主題的表情符號
- **情境化文案**: 根據不同時間點調整通知內容
- **多語言支持**: 根據用戶語言偏好顯示通知

## 性能優化策略

### 數據管理優化
- **本地緩存**: 所有數據本地存儲，減少重複計算
- **狀態同步**: 統一的狀態更新機制避免不一致
- **懶加載**: 非關鍵數據按需加載

### 用戶體驗優化
- **快速啟動**: 緩存登入狀態，直接進入主頁
- **流暢動畫**: 使用原生動畫提升交互體驗
- **錯誤處理**: 完善的錯誤捕獲和用戶提示

## 安全性考慮

### 數據安全
- **本地存儲**: 敏感數據僅存儲在設備本地
- **權限管理**: 最小權限原則，僅請求必要權限
- **數據加密**: 考慮對敏感資料進行加密存儲

### 隱私保護
- **無服務器依賴**: 完全離線運行，保護用戶隱私
- **最小數據收集**: 僅收集功能必需的數據

## 測試策略

### 功能測試重點
1. **信用卡 CRUD 操作**: 添加、編輯、刪除卡片
2. **通知系統**: 通知排程和觸發準確性
3. **付款標記**: 付款狀態更新和歷史記錄
4. **多語言切換**: 語言切換的完整性
5. **數據持久化**: 應用重啟後數據保持

### 用戶體驗測試
- **導航流程**: 頁面間導航的直觀性
- **錯誤處理**: 異常情況的用戶友好提示
- **響應速度**: 操作響應時間和動畫流暢度

## 部署和維護

### 構建配置
- **Expo 構建**: 使用 Expo 服務進行應用構建
- **版本管理**: 語義化版本控制
- **環境配置**: 開發、測試、生產環境分離

### 維護建議
1. **定期依賴更新**: 保持依賴包的安全性和兼容性
2. **性能監控**: 監控應用性能和用戶反饋
3. **功能迭代**: 根據用戶需求持續改進功能
4. **錯誤日誌**: 完善的錯誤記錄和分析系統

## 未來發展規劃

### 短期優化
- **註冊功能完善**: 完成郵箱密碼註冊流程
- **數據導出**: 付款歷史和統計報告導出
- **主題系統**: 深色模式和主題定制

### 長期擴展
- **雲端同步**: 跨設備數據同步功能
- **智能分析**: 消費習慣分析和建議
- **社交功能**: 付款提醒分享和團隊管理
- **開放API**: 與銀行系統集成的可能性

## 故障排除指南

### 常見問題
1. **通知不工作**: 檢查設備通知權限和應用通知設定
2. **數據丟失**: 確認 AsyncStorage 權限和存儲空間
3. **語言切換失效**: 檢查語言文件完整性和狀態更新
4. **卡片添加失敗**: 驗證輸入數據格式和必填欄位

### 調試工具
- **Console 日誌**: 詳細的操作日誌記錄
- **React Native Debugger**: 開發時狀態調試
- **Expo DevTools**: 性能和網絡監控

---

**文檔版本**: v1.0  
**最後更新**: 2025年7月  
**維護者**: 開發團隊  

此文檔將根據項目發展持續更新，建議定期檢查以獲取最新的項目資訊和開發指南。