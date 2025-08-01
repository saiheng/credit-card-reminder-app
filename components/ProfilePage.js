// components/ProfilePage.js - 具備完整語言切換功能的個人資料頁面（增加邊緣滑動返回功能）
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
  Alert,
  Modal,
  Image,
  PanResponder,
  Dimensions,
  Animated
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import HomePage from './HomePage';

export default function ProfilePage({ 
  userData = {},
  onUpdateUserData,
  onNavigate,
  onLogout,
  onBack,
  currentLanguage = 'en',
  onLanguageChange,
  getText,
  // 🔥 新增：HomePage 完整渲染所需的 props
  creditCards = [],
  paymentHistory = [],
  notificationSettings = {}
}) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(userData.name || 'Alex Taylor');
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  // 🔥 簡化的管理員檢查函數
const isAdmin = (userEmail) => {
  const adminEmails = [
    'saihengleung101@gmail.com',
    // 如果日後需要添加其他管理員，在這裡添加Email
  ];
  return adminEmails.includes(userEmail);
};

  // 🔥 Apple風格邊緣滑動返回功能：漸進式頁面過渡（完全修復版本）
  const screenWidth = Dimensions.get('window').width;
  const edgeWidth = 20; // 左邊緣感應區域寬度
  const swipeThreshold = screenWidth * 0.3; // 30%的屏幕寬度觸發返回
  
  // 動畫值：控制頁面滑動位置
  const [slideAnimation] = useState(new Animated.Value(0));
  const [isSliding, setIsSliding] = useState(false);
  
  const panResponder = PanResponder.create({
    // 🎯 只在左邊緣區域啟動手勢識別
    onStartShouldSetPanResponder: (evt, gestureState) => {
      const startX = evt.nativeEvent.pageX;
      return startX <= edgeWidth;
    },
    
    // 🎯 持續追蹤手勢
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      const startX = evt.nativeEvent.pageX;
      const deltaX = gestureState.dx;
      return startX <= edgeWidth && deltaX > 0.5;
    },
    
    // 🎯 手勢開始時的初始化
    onPanResponderGrant: (evt, gestureState) => {
      const startX = evt.nativeEvent.pageX;
      if (startX <= edgeWidth) {
        setIsSliding(true);
        slideAnimation.setValue(0);
        console.log('🔥 個人資料頁面Apple風格滑動開始');
      }
    },
    
    // 🎯 滑動過程中的實時更新
    onPanResponderMove: (evt, gestureState) => {
      if (!isSliding) return;
      
      const swipeDistance = Math.max(0, gestureState.dx);
      const maxSlide = screenWidth * 0.8; // 最大滑動距離為屏幕寬度的80%
      const clampedDistance = Math.min(swipeDistance, maxSlide);
      
      // 實時更新動畫值，讓頁面跟隨手指移動
      slideAnimation.setValue(clampedDistance);
      
      console.log(`👤 個人資料頁面滑動進度: ${Math.round((clampedDistance / swipeThreshold) * 100)}%`);
    },
    
    // 🎯 手勢結束時的判斷和動畫（修復抖動問題）
    onPanResponderRelease: (evt, gestureState) => {
      if (!isSliding) return;
      
      const swipeDistance = gestureState.dx;
      const swipeVelocity = gestureState.vx;
      
      // 判斷是否應該執行返回操作
      const shouldReturn = swipeDistance > swipeThreshold || swipeVelocity > 0.5;
      
      if (shouldReturn) {
        // 🔥 修復抖動：執行平滑的返回動畫，完成後直接切換頁面
        console.log('✅ 個人資料頁面滑動距離足夠，執行返回動畫');
        Animated.timing(slideAnimation, {
          toValue: screenWidth,
          duration: 180, // 快速完成，避免衝突
          useNativeDriver: true, // 🔥 使用原生驅動器，提供更流暢的動畫
        }).start(({ finished }) => {
          // 🔥 關鍵修復：只有在動畫真正完成時才執行返回操作
          if (finished) {
            // 先執行返回操作，讓頁面切換開始
            onBack();
            // 🔥 延遲重置動畫狀態，避免視覺抖動
            setTimeout(() => {
              setIsSliding(false);
              slideAnimation.setValue(0);
            }, 100);
          }
        });
      } else {
        // 返回原位動畫
        console.log('↩️ 個人資料頁面滑動距離不足，返回原位');
        Animated.spring(slideAnimation, {
          toValue: 0,
          tension: 150,
          friction: 10,
          useNativeDriver: true, // 🔥 使用原生驅動器
        }).start(() => {
          setIsSliding(false);
        });
      }
    },
    
    // 🎯 手勢被取消時的處理
    onPanResponderTerminate: (evt, gestureState) => {
      if (isSliding) {
        Animated.spring(slideAnimation, {
          toValue: 0,
          tension: 150,
          friction: 10,
          useNativeDriver: true, // 🔥 使用原生驅動器
        }).start(() => {
          setIsSliding(false);
        });
      }
    },
  });

  // 生成用戶ID
  const generateUserId = (name) => {
    if (!name) return 'carduser001';
    const cleanName = name.toLowerCase().replace(/[^a-z]/g, '');
    const randomNum = Math.floor(Math.random() * 999) + 1;
    return `@${cleanName}${randomNum.toString().padStart(3, '0')}`;
  };

  const currentUserId = userData.userId || generateUserId(userData.name || 'carduser');

  // 處理名字儲存
  const handleSaveName = () => {
    if (newName.trim().length === 0) {
      Alert.alert(getText('common.error'), getText('profile.nameCannotBeEmpty'));
      return;
    }

    const updatedUserData = {
      ...userData,
      name: newName.trim(),
      userId: generateUserId(newName.trim())
    };

    if (onUpdateUserData) {
      onUpdateUserData(updatedUserData);
    }

    setIsEditingName(false);
    Alert.alert(getText('common.success'), getText('profile.profileUpdated'));
  };

  // 處理頭像查看（顯示放大版本）
  const handleAvatarView = () => {
    setShowAvatarModal(true);
  };

  // 處理頭像上傳
  const handleAvatarUpload = async () => {
    try {
      // 請求權限
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert(getText('profile.permissionRequired'), getText('profile.cameraPermissionMessage'));
        return;
      }

      // 打開圖片選擇器
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const updatedUserData = {
          ...userData,
          avatar: result.assets[0].uri
        };

        if (onUpdateUserData) {
          onUpdateUserData(updatedUserData);
        }

        Alert.alert(getText('common.success'), getText('profile.avatarUpdated'));
      }
    } catch (error) {
      console.error('Image selection error:', error);
      Alert.alert(getText('common.error'), getText('profile.failedToUpdateAvatar'));
    }
  };

  // 處理編輯按鈕點擊
  const handleEditPress = () => {
    Alert.alert(
      getText('profile.editProfile'),
      getText('profile.editProfile'),
      [
        {
          text: getText('common.cancel'),
          style: 'cancel'
        },
        {
          text: getText('profile.changeName'),
          onPress: () => setIsEditingName(true)
        },
        {
          text: getText('profile.changeAvatar'),
          onPress: handleAvatarUpload
        }
      ]
    );
  };

  // 處理語言切換
  const handleLanguageSelect = (languageCode) => {
    if (onLanguageChange) {
      onLanguageChange(languageCode);
    }
    setShowLanguageModal(false);
  };

  return (
    <View style={styles.rootContainer} {...panResponder.panHandlers}>
      {/* 🔥 背景層：完整的 Home Page 渲染 */}
      <View style={styles.backgroundLayer}>
        <HomePage
          userData={userData}
          creditCards={creditCards}
          paymentHistory={paymentHistory}
          notificationSettings={notificationSettings}
          onNavigate={onNavigate || (() => {})}
          getText={getText}
          currentLanguage={currentLanguage}
        />
      </View>
      
      {/* 🔥 前景層：當前頁面內容，支持滑動動畫 */}
      <Animated.View 
        style={[
          styles.foregroundLayer,
          {
            transform: [{
              translateX: slideAnimation
            }]
          }
        ]}
      >
        <SafeAreaView style={styles.container}>
          {/* Header with Back Button */}
          <View style={styles.headerNav}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => {
                if (onBack && typeof onBack === 'function') {
                  onBack();
                } else {
                  Alert.alert(
                    'Navigation Error', 
                    'Back function is not properly configured. Please check the onBack prop in App.js.',
                    [{ text: getText('common.ok'), style: 'default' }]
                  );
                  console.warn('ProfilePage: onBack prop is missing or not a function');
                }
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={24} color="#000000" />
            </TouchableOpacity>
            
            <Text style={styles.headerTitle}>{getText('profile.title')}</Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* Header with Avatar and Name */}
            <View style={styles.header}>
              <View style={styles.profileSection}>
                <TouchableOpacity onPress={handleAvatarView} activeOpacity={0.7}>
                  <View style={styles.avatarContainer}>
                    {userData.avatar ? (
                      <Image source={{ uri: userData.avatar }} style={styles.avatar} />
                    ) : (
                      <View style={styles.defaultAvatar}>
                        <MaterialIcons name="person" size={32} color="#666666" />
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
                
                <View style={styles.nameSection}>
                  {isEditingName ? (
                    <View style={styles.editingContainer}>
                      <TextInput
                        style={styles.nameInput}
                        value={newName}
                        onChangeText={setNewName}
                        placeholder={getText('profile.enterYourName') || 'Enter your name'}
                        autoFocus
                      />
                      <View style={styles.editButtons}>
                        <TouchableOpacity 
                          style={styles.saveButton} 
                          onPress={handleSaveName}
                        >
                          <Text style={styles.saveButtonText}>{getText('common.save')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.cancelButton} 
                          onPress={() => setIsEditingName(false)}
                        >
                          <Text style={styles.cancelButtonText}>{getText('common.cancel')}</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <View>
                      <Text style={styles.userName}>{userData.name || 'Alex Taylor'}</Text>
                      <Text style={styles.userId}>{currentUserId}</Text>
                    </View>
                  )}
                </View>
              </View>
              
              <TouchableOpacity 
                style={styles.editButton} 
                onPress={handleEditPress}
                activeOpacity={0.7}
              >
                <MaterialIcons name="edit" size={20} color="#000000" />
              </TouchableOpacity>
            </View>

            {/* Settings Section */}
            <View style={styles.settingsSection}>
              <Text style={styles.sectionTitle}>{getText('profile.settings')}</Text>
              
              <TouchableOpacity 
                style={styles.settingItem}
                onPress={() => setShowLanguageModal(true)}
                activeOpacity={0.7}
              >
                <View style={styles.settingLeft}>
                  <MaterialIcons name="language" size={24} color="#000000" />
                  <Text style={styles.settingText}>{getText('profile.languageSettings')}</Text>
                </View>
                <View style={styles.settingRight}>
                  <Text style={styles.currentLanguageText}>
                    {currentLanguage === 'en' ? 'English' : '繁體中文'}
                  </Text>
                  <Ionicons name="chevron-forward" size={20} color="#666666" />
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.settingItem}
                onPress={() => setShowPrivacyModal(true)}
                activeOpacity={0.7}
              >
                <View style={styles.settingLeft}>
                  <MaterialIcons name="security" size={24} color="#000000" />
                  <Text style={styles.settingText}>{getText('profile.privacySecurity')}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#666666" />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.settingItem}
                onPress={() => setShowHelpModal(true)}
                activeOpacity={0.7}
              >
                <View style={styles.settingLeft}>
                  <MaterialIcons name="help" size={24} color="#000000" />
                  <Text style={styles.settingText}>{getText('profile.helpSupport')}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#666666" />
              </TouchableOpacity>
            </View>

            {/* Get Reminders Now Card */}
            <View style={styles.reminderCard}>
              <Text style={styles.reminderTitle}>{getText('profile.reminderTitle')}</Text>
              <Text style={styles.reminderSubtitle}>
                {getText('profile.reminderSubtitle')}
              </Text>
              <TouchableOpacity 
                style={styles.shareButton}
                onPress={() => Alert.alert(
                  getText('profile.shareApp'),
                  getText('profile.comingSoon')
                )}
                activeOpacity={0.8}
              >
                <Text style={styles.shareButtonText}>{getText('profile.shareApp')}</Text>
              </TouchableOpacity>
            </View>

            {/* Logout Button */}
            <TouchableOpacity 
              style={styles.logoutButton}
              onPress={() => {
                Alert.alert(
                  getText('profile.logout'),
                  getText('profile.logoutConfirm'),
                  [
                    { text: getText('common.cancel'), style: 'cancel' },
                    { 
                      text: getText('profile.logout'), 
                      style: 'destructive',
                      onPress: onLogout 
                    }
                  ]
                );
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.logoutText}>{getText('profile.logout')}</Text>
            </TouchableOpacity>
            {/* 🔥 管理員專用功能區域 - 只有管理員可見 */}
{isAdmin(userData.email) && (
  <View style={styles.adminSection}>
    <Text style={styles.adminSectionTitle}>
      {currentLanguage === 'zh-TW' ? '管理員功能' : 'Admin Functions'}
    </Text>
    
    <TouchableOpacity 
      style={styles.adminButton}
      onPress={() => onNavigate('Admin')}
      activeOpacity={0.7}
    >
      <View style={styles.adminButtonContent}>
        <MaterialIcons name="admin-panel-settings" size={24} color="#FF6B35" />
        <View style={styles.adminButtonText}>
          <Text style={styles.adminButtonTitle}>
            {currentLanguage === 'zh-TW' ? '資料庫管理' : 'Database Management'}
          </Text>
          <Text style={styles.adminButtonSubtitle}>
            {currentLanguage === 'zh-TW' ? '管理信用卡資料和系統設定' : 'Manage credit card data and system settings'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#666666" />
      </View>
    </TouchableOpacity>
  </View>
)}
          </ScrollView>

          {/* Language Selection Modal - 統一樣式 */}
          <Modal
            visible={showLanguageModal}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowLanguageModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>{getText('profile.languageSettings')}</Text>
                
                <View style={styles.languageOptionsContainer}>
                  <TouchableOpacity 
                    style={[
                      styles.languageOption,
                      currentLanguage === 'en' && styles.selectedLanguageOption
                    ]}
                    onPress={() => handleLanguageSelect('en')}
                    activeOpacity={0.7}
                  >
                    <View style={styles.languageOptionContent}>
                      <View>
                        <Text style={[
                          styles.languageOptionTitle,
                          currentLanguage === 'en' && styles.selectedLanguageTitle
                        ]}>
                          English
                        </Text>
                        <Text style={styles.languageOptionSubtitle}>English</Text>
                      </View>
                      {currentLanguage === 'en' && (
                        <MaterialIcons name="check" size={24} color="#2196F3" />
                      )}
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[
                      styles.languageOption,
                      currentLanguage === 'zh-TW' && styles.selectedLanguageOption
                    ]}
                    onPress={() => handleLanguageSelect('zh-TW')}
                    activeOpacity={0.7}
                  >
                    <View style={styles.languageOptionContent}>
                      <View>
                        <Text style={[
                          styles.languageOptionTitle,
                          currentLanguage === 'zh-TW' && styles.selectedLanguageTitle
                        ]}>
                          Traditional Chinese
                        </Text>
                        <Text style={styles.languageOptionSubtitle}>繁體中文</Text>
                      </View>
                      {currentLanguage === 'zh-TW' && (
                        <MaterialIcons name="check" size={24} color="#2196F3" />
                      )}
                    </View>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity 
                  style={styles.modalCloseButton}
                  onPress={() => setShowLanguageModal(false)}
                >
                  <Text style={styles.modalCloseText}>{getText('common.cancel')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {/* Privacy & Security Modal */}
          <Modal
            visible={showPrivacyModal}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowPrivacyModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>{getText('profile.privacySecurity')}</Text>
                <ScrollView style={styles.modalScroll}>
<Text style={styles.privacyText}>
  {currentLanguage === 'en' 
    ? `Privacy & Data Security

Your privacy and data security are our top priorities. Here's how we protect your information:

Data We Collect:
- Account information (email, username)
- Credit card preferences (card names, due dates - NOT card numbers)
- App usage statistics and preferences
- Device information for technical support

Data We DON'T Collect:
- Full credit card numbers or CVV codes
- Banking credentials or passwords
- Social security numbers or government IDs
- Biometric data or location tracking

How We Protect Your Data:
- All data is encrypted during transmission and storage
- Firebase security rules protect your information
- Local device storage with encryption
- Regular security audits and updates
- No sharing with third parties without consent

Your Rights:
- Access your personal data anytime
- Request data correction or deletion
- Export your data in standard formats
- Withdraw consent for data processing

Third-Party Services:
- Firebase (Google): Authentication and data storage
- Expo: App development and distribution platform
- We comply with their respective privacy policies

Contact Us:
For privacy concerns, contact support@cardreminder.app

Last updated: August 2, 2025`
    : `隱私與數據安全

您的隱私和數據安全是我們的首要考慮。以下是我們如何保護您的資訊：

我們收集的數據：
- 帳戶資訊（電子郵件、用戶名）
- 信用卡偏好設定（卡片名稱、到期日 - 不包括卡號）
- 應用程式使用統計和偏好設定
- 設備資訊（用於技術支援）

我們不收集的數據：
- 完整信用卡號碼或CVV安全碼
- 銀行憑證或密碼
- 身份證號碼或政府身份證件
- 生物識別數據或位置追蹤

我們如何保護您的數據：
- 所有數據在傳輸和存儲過程中都經過加密
- Firebase安全規則保護您的資訊
- 本地設備存儲採用加密技術
- 定期進行安全審計和更新
- 未經同意不與第三方分享

您的權利：
- 隨時訪問您的個人數據
- 要求更正或刪除數據
- 以標準格式匯出您的數據
- 撤回數據處理同意

第三方服務：
- Firebase（Google）：身份驗證和數據存儲
- Expo：應用程式開發和分發平台
- 我們遵守其各自的隱私政策

聯繫我們：
如有隱私問題，請聯繫 support@cardreminder.app

最後更新：2025年8月2日`
  }
</Text>
                </ScrollView>
                <TouchableOpacity 
                  style={styles.modalCloseButton}
                  onPress={() => setShowPrivacyModal(false)}
                >
                  <Text style={styles.modalCloseText}>{getText('common.close')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {/* Help & Support Modal */}
          <Modal
            visible={showHelpModal}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowHelpModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>{getText('profile.helpSupport')}</Text>
                <ScrollView style={styles.modalScroll}>
                  <Text style={styles.helpText}>
                    {currentLanguage === 'en'
                      ? `Frequently Asked Questions

How do I add a credit card?
Tap the '+' button on the home screen and fill in your card details. We only store the card name, bank, and due date - never your card number.

How do notifications work?
The app sends local notifications based on your settings. You can customize reminder times in the Notifications section.

Is my data secure?
Yes, all data is stored locally on your device and encrypted. We never store sensitive financial information.

Need more help?
Contact our support team at support@cardreminder.app for additional assistance.`
                      : `常見問題

如何新增信用卡？
點擊主畫面上的「+」按鈕並填寫您的卡片詳細資料。我們僅儲存卡片名稱、銀行和到期日 - 絕不儲存您的卡號。

通知如何運作？
應用程式根據您的設定發送本地通知。您可以在通知部分自訂提醒時間。

我的資料安全嗎？
是的，所有資料都本地儲存在您的設備上並經過加密。我們絕不儲存敏感的財務資訊。

需要更多幫助？
請聯絡我們的支援團隊 support@cardreminder.app 以獲得額外協助。`
                    }
                  </Text>
                </ScrollView>
                <TouchableOpacity 
                  style={styles.modalCloseButton}
                  onPress={() => setShowHelpModal(false)}
                >
                  <Text style={styles.modalCloseText}>{getText('common.close')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {/* Avatar View Modal */}
          <Modal
            visible={showAvatarModal}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowAvatarModal(false)}
          >
            <View style={styles.avatarModalOverlay}>
              <TouchableOpacity 
                style={styles.avatarModalBackground}
                onPress={() => setShowAvatarModal(false)}
                activeOpacity={1}
              >
                <View style={styles.avatarModalContent}>
                  <TouchableOpacity 
                    style={styles.avatarCloseButton}
                    onPress={() => setShowAvatarModal(false)}
                    activeOpacity={0.7}
                  >
                    <MaterialIcons name="close" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                  
                  <View style={styles.enlargedAvatarContainer}>
                    {userData.avatar ? (
                      <Image source={{ uri: userData.avatar }} style={styles.enlargedAvatar} />
                    ) : (
                      <View style={styles.enlargedDefaultAvatar}>
                        <MaterialIcons name="person" size={80} color="#666666" />
                      </View>
                    )}
                  </View>
                  
                  <Text style={styles.avatarModalName}>{userData.name || 'Alex Taylor'}</Text>
                </View>
              </TouchableOpacity>
            </View>
          </Modal>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  // 🔥 Apple風格邊緣滑動的新增樣式
  rootContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  backgroundLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#F5F5F5',
  },
  foregroundLayer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  headerNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 30,
    paddingBottom: 12,
    backgroundColor: '#F5F5F5',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    backgroundColor: '#F5F5F5',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  defaultAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameSection: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  userId: {
    fontSize: 16,
    color: '#666666',
  },
  editingContainer: {
    flex: 1,
  },
  nameInput: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    borderBottomWidth: 2,
    borderBottomColor: '#2196F3',
    paddingVertical: 4,
    marginBottom: 12,
  },
  editButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  saveButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  cancelButton: {
    backgroundColor: '#E0E0E0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  cancelButtonText: {
    color: '#666666',
    fontWeight: '500',
  },
  editButton: {
    padding: 8,
  },
  settingsSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    fontSize: 16,
    color: '#000000',
    marginLeft: 12,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentLanguageText: {
    fontSize: 14,
    color: '#666666',
    marginRight: 8,
  },
  reminderCard: {
    backgroundColor: '#2C2C2C',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  reminderTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  reminderSubtitle: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 16,
    lineHeight: 20,
  },
  shareButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    alignSelf: 'flex-start',
  },
  shareButtonText: {
    color: '#000000',
    fontWeight: '500',
    fontSize: 16,
  },
  logoutButton: {
    backgroundColor: '#2C2C2C',
    marginHorizontal: 16,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 32,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalScroll: {
    maxHeight: 300,
  },
  modalCloseButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  modalCloseText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  privacyText: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
  },
  helpText: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
  },
  // 新增：語言選擇相關樣式
  languageOptionsContainer: {
    marginBottom: 16,
  },
  languageOption: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectedLanguageOption: {
    borderColor: '#2196F3',
    backgroundColor: '#F3F9FF',
  },
  languageOptionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  languageOptionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 2,
  },
  selectedLanguageTitle: {
    color: '#2196F3',
  },
  languageOptionSubtitle: {
    fontSize: 14,
    color: '#666666',
  },
  avatarModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarModalBackground: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarModalContent: {
    alignItems: 'center',
    position: 'relative',
  },
  avatarCloseButton: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  enlargedAvatarContainer: {
    marginBottom: 20,
  },
  enlargedAvatar: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  enlargedDefaultAvatar: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  avatarModalName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  // 🔥 管理員功能區域的新樣式
adminSection: {
  backgroundColor: '#FFF8F0',
  marginHorizontal: 16,
  borderRadius: 12,
  padding: 20,
  marginBottom: 32,
  borderWidth: 1,
  borderColor: '#FFE0B2',
},
adminSectionTitle: {
  fontSize: 16,
  fontWeight: '600',
  color: '#FF6B35',
  marginBottom: 12,
  textAlign: 'center',
},
adminButton: {
  backgroundColor: '#FFFFFF',
  borderRadius: 8,
  padding: 16,
  borderWidth: 1,
  borderColor: '#FFE0B2',
},
adminButtonContent: {
  flexDirection: 'row',
  alignItems: 'center',
},
adminButtonText: {
  flex: 1,
  marginLeft: 12,
},
adminButtonTitle: {
  fontSize: 16,
  fontWeight: '600',
  color: '#333333',
  marginBottom: 2,
},
adminButtonSubtitle: {
  fontSize: 12,
  color: '#666666',
  lineHeight: 16,
},
});