# CardReminder 專案結構文件

## 📁 專案概覽

**專案名稱：** CardReminder - 信用卡還款提醒應用程式  
**開發平台：** React Native + Expo  
**目標平台：** iOS & Android  
**開發語言：** JavaScript  
**UI框架：** React Native Components + @expo/vector-icons  

## 🏗️ 文件結構

```
CreditCardReminder/
├── App.js                          # 主應用程式文件
├── assets/                         # 資源文件夾
│   ├── login_illustration.png      # 登入頁面插圖
│   └── icon.png                    # 應用程式圖標
├── components/                     # 組件文件夾
│   ├── WelcomePage.js              # 歡迎頁面
│   ├── LoginPage.js                # 登入頁面
│   ├── SignUpPage.js               # 註冊頁面
│   ├── HomePage.js                 # 主頁面
│   ├── ProfilePage.js              # 個人資料頁面
│   ├── MyCardsPage.js              # 我的信用卡頁面
│   ├── AddCardPage.js              # 新增信用卡頁面
│   ├── NotificationsPage.js        # 通知設定頁面
│   ├── HistoryPage.js              # 還款歷史頁面
│   ├── AchievementsPage.js         # 成就頁面
│   ├── StatsDropdown.js            # 統計下拉選單組件
│   └── LanguageSelector.js         # 語言選擇器組件
├── package.json                    # 專案依賴配置
├── app.json                        # Expo 配置文件
└── node_modules/                   # 依賴套件
```

## 🎯 核心組件架構

### 主應用程式 (App.js)
**功能職責：**
- 應用程式狀態管理
- 頁面路由和導航控制
- 數據持久化處理
- 用戶認證管理

**關鍵狀態管理：**
- `currentPage`: 當前顯示頁面
- `userData`: 用戶基本資料
- `creditCards`: 信用卡數據陣列
- `paymentHistory`: 還款歷史記錄
- `notificationSettings`: 通知設定
- `achievements`: 成就系統數據

### 頁面組件層級

#### 第一層：認證頁面
1. **WelcomePage.js** - 應用程式歡迎頁
2. **LoginPage.js** - 用戶登入頁面
3. **SignUpPage.js** - 用戶註冊頁面

#### 第二層：主功能頁面  
4. **HomePage.js** - 主控制面板
5. **ProfilePage.js** - 用戶個人資料管理

#### 第三層：功能子頁面
6. **MyCardsPage.js** - 信用卡列表管理
7. **AddCardPage.js** - 新增信用卡表單
8. **NotificationsPage.js** - 通知設定控制
9. **HistoryPage.js** - 還款記錄查看
10. **AchievementsPage.js** - 成就系統展示

#### 第四層：輔助組件
11. **StatsDropdown.js** - 統計選單組件
12. **LanguageSelector.js** - 語言切換組件

## 📊 數據流架構

### 數據持久化策略
**本地儲存：** 使用 AsyncStorage 進行數據持久化
**儲存內容：**
- 用戶基本資料
- 信用卡資訊
- 還款歷史記錄  
- 通知設定配置
- 成就進度數據

### 狀態更新流程
```
用戶操作 → 組件事件處理 → App.js 狀態更新 → AsyncStorage 保存 → UI重新渲染
```

## 🎨 UI設計系統

### 設計主題
**主要風格：** 現代簡約風格，專業感設計
**色彩系統：**
- 主色調：白色背景 (#FFFFFF)
- 輔助色：深灰色文字 (#333333)
- 強調色：藍色按鈕 (#007AFF)
- 警告色：紅色提醒 (#FF3B30)

### 圖標系統
**圖標庫：** @expo/vector-icons
**主要使用：**
- MaterialIcons: 主要功能圖標
- Ionicons: 導航和操作圖標
- AntDesign: 特殊用途圖標

## 🔧 技術依賴

### 核心依賴
```json
{
  "@react-native-async-storage/async-storage": "本地數據儲存",
  "@expo/vector-icons": "圖標系統", 
  "expo": "開發框架",
  "react": "UI框架",
  "react-native": "跨平台開發"
}
```

### 可選依賴
```json
{
  "expo-notifications": "推送通知功能",
  "expo-device": "設備信息獲取",
  "expo-constants": "應用程式常數"
}
```

## 📱 頁面導航結構

```
WelcomePage
    ↓ (Start Now)
LoginPage ←→ SignUpPage
    ↓ (登入成功)
HomePage
    ├── ProfilePage (右上角頭像)
    ├── MyCardsPage (左上角/中間按鈕)
    ├── AddCardPage (左上角按鈕)
    ├── NotificationsPage (通知按鈕)
    ├── HistoryPage (統計下拉選單)
    └── AchievementsPage (統計下拉選單)
```

## 🚀 開發歷程總結

### 開發階段演進

**第一階段 (Chat 1-2)：** 專案初始化
- Expo環境搭建
- 基礎組件創建
- 初始UI設計

**第二階段 (Chat 3-6)：** 核心功能開發
- 信用卡管理功能
- 通知系統實現
- 數據持久化

**第三階段 (Chat 7)：** UI重新設計
- 專業化界面設計
- 深色主題實現
- 日曆功能整合

**第四階段 (Chat 8-11)：** 功能優化與修復
- Bug修復和功能完善
- 用戶體驗改進
- 性能優化

**第五階段 (Chat 12-17)：** 界面精進
- 各頁面專業化設計
- 圖標系統統一
- 用戶交互完善

## 💡 架構設計亮點

### 組件化設計
每個頁面都是獨立的React組件，便於維護和擴展

### 統一的Props接口  
所有頁面組件都遵循統一的props傳遞模式，確保數據流的一致性

### 模組化狀態管理
集中在App.js中管理全局狀態，避免狀態管理混亂

### 響應式設計
適配不同螢幕尺寸，確保在各種設備上的良好顯示效果

## 🔮 未來擴展方向

### 技術升級可能性
- 引入Redux進行更複雜的狀態管理
- 整合Firebase實現真正的後端服務
- 添加推送通知功能
- 實現數據雲端同步

### 功能擴展空間  
- 多銀行API整合
- 支出分析和統計
- 預算管理功能
- 社交分享功能