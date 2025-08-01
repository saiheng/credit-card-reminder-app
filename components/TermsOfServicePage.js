// components/TermsOfServicePage.js - 服務條款頁面（完整的Apple風格邊緣滑動實現）
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  PanResponder,
  Dimensions,
  Animated,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import SignUpPage from './SignUpPage'; // 🔥 導入SignUpPage用於背景渲染

const { width: screenWidth } = Dimensions.get('window');

export default function TermsOfServicePage({ onBack, getText }) {
  // 🔥 滑動動畫狀態管理
  const [isSliding, setIsSliding] = useState(false);
  const slideAnimation = useRef(new Animated.Value(0)).current;
  
  // 🔥 Apple風格邊緣滑動系統 - 專為註冊頁面返回設計
  const panResponder = useRef(
    PanResponder.create({
      // 🎯 超精確的手勢開始判斷：只在左邊緣20像素內啟動
      onStartShouldSetPanResponder: (evt, gestureState) => {
        const startX = evt.nativeEvent.pageX;
        return startX <= 20; // 在左邊緣20像素內就啟動
      },
      
      // 🎯 持續追蹤手勢：一旦開始就持續監控
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        const startX = evt.nativeEvent.pageX;
        const deltaX = gestureState.dx;
        // 在邊緣區域且有向右移動趨勢
        return startX <= 20 && deltaX > 0.1;
      },
      
      // 🎯 手勢開始：啟動滑動狀態
      onPanResponderGrant: (evt, gestureState) => {
        setIsSliding(true);
        console.log('🔥 服務條款頁面邊緣滑動開始');
      },
      
      // 🎯 手勢移動：實時跟隨動畫
      onPanResponderMove: (evt, gestureState) => {
        const currentDistance = Math.max(0, gestureState.dx);
        const maxDistance = screenWidth * 0.8; // 最大滑動距離為屏幕寬度的80%
        const clampedDistance = Math.min(currentDistance, maxDistance);
        
        // 🔥 實時動畫：頁面跟隨手指移動
        slideAnimation.setValue(clampedDistance);
        
        console.log('🔥 滑動距離:', clampedDistance);
      },
      
      // 🎯 手勢完成：智能判斷是否返回
      onPanResponderRelease: (evt, gestureState) => {
        const startX = evt.nativeEvent.pageX - gestureState.dx;
        const swipeDistance = gestureState.dx;
        const swipeVelocity = gestureState.vx;
        const returnThreshold = screenWidth * 0.2; // 20%的屏幕寬度作為返回閾值
        
        console.log('🔥 滑動結束 - 距離:', swipeDistance, '速度:', swipeVelocity);
        
        // 🎯 智能返回判斷：距離或速度達到閾值都可以觸發返回
        if (startX <= 20 && (swipeDistance > returnThreshold || swipeVelocity > 0.5)) {
          console.log('✅ 服務條款頁面邊緣滑動返回觸發！');
          
          // 🔥 完成動畫：平滑滑出屏幕
          Animated.timing(slideAnimation, {
            toValue: screenWidth,
            duration: 200, // 快速完成動畫，提供敏捷感
            useNativeDriver: true, // 🔥 關鍵：使用原生驅動器確保60FPS流暢度
          }).start(({ finished }) => {
            if (finished) {
              onBack(); // 🔥 首先執行返回操作
              // 🔥 延遲重置，避免視覺跳躍
              setTimeout(() => {
                setIsSliding(false);
                slideAnimation.setValue(0);
              }, 100);
            }
          });
        } else {
          console.log('❌ 滑動距離不足，執行回彈動畫');
          
          // 🔥 回彈動畫：平滑返回原位
          Animated.spring(slideAnimation, {
            toValue: 0,
            tension: 120, // 適中的張力，創造自然的彈性效果
            friction: 8,  // 適當的摩擦力，避免過度彈跳
            useNativeDriver: true, // 🔥 關鍵：保持流暢性
          }).start(() => {
            setIsSliding(false);
          });
        }
      },
      
      // 🎯 手勢終止：清理狀態
      onPanResponderTerminate: () => {
        console.log('🔥 手勢被中斷，執行清理');
        Animated.spring(slideAnimation, {
          toValue: 0,
          tension: 120,
          friction: 8,
          useNativeDriver: true,
        }).start(() => {
          setIsSliding(false);
        });
      },
    })
  ).current;
  
  // 處理返回按鈕
  const handleBackPress = () => {
    if (onBack && typeof onBack === 'function') {
      onBack();
    }
  };

  return (
    <View style={styles.container}>
      {/* 🔥 背景層：完整的 SignUp Page 渲染 */}
      <View style={styles.backgroundLayer}>
        <SignUpPage
          onSignUp={() => {}} // 空函數，因為這裡只用於預覽
          onBack={() => {}} // 空函數，因為這裡只用於預覽
          onNavigateToLogin={() => {}} // 空函數，因為這裡只用於預覽
          onNavigateToTerms={() => {}} // 空函數，因為這裡只用於預覽
          onNavigateToPrivacy={() => {}} // 空函數，因為這裡只用於預覽
          getText={getText}
        />
      </View>

      {/* 🔥 前景層：當前的服務條款頁面 */}
      <Animated.View 
        style={[
          styles.foregroundLayer,
          {
            transform: [
              {
                translateX: slideAnimation // 🔥 實時跟隨滑動距離
              }
            ]
          }
        ]}
        {...panResponder.panHandlers} // 🔥 應用手勢響應器
      >
        <SafeAreaView style={styles.pageContainer}>
          <View style={styles.header}>
            {/* 🔥 改進的返回按鈕 - 更大的觸摸區域 */}
            <TouchableOpacity 
              style={styles.backButton}
              onPress={handleBackPress}
              activeOpacity={0.7}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }} // 擴大觸摸區域
            >
              <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            
            {/* 標題 */}
            <Text style={styles.headerTitle}>
              {getText ? getText('terms.title') : '服務條款'}
            </Text>
            
            <View style={styles.headerSpacer} />
          </View>

<ScrollView 
  style={styles.content}
  showsVerticalScrollIndicator={false}
>
  {/* 生效日期 */}
  <View style={styles.dateSection}>
    <Text style={styles.effectiveDate}>
      {getText ? getText('terms.effectiveDate') : '生效日期：2025年8月2日'}
    </Text>
    <Text style={styles.lastUpdated}>
      {getText ? getText('terms.lastUpdated') : '最後更新：2025年8月2日'}
    </Text>
  </View>

  {/* 歡迎段落 */}
  <View style={styles.section}>
    <Text style={styles.paragraph}>
      歡迎使用CardReminder（「本應用程式」、「我們」或「服務」）。CardReminder是一個信用卡管理應用程式，專門幫助用戶管理信用卡到期日並接收付款提醒。
    </Text>
    <Text style={styles.paragraph}>
      使用我們的服務即表示您同意受這些服務條款（「條款」）的約束。請仔細閱讀這些條款。
    </Text>
  </View>

  {/* 1. 服務描述 */}
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>1. 服務描述</Text>
    <Text style={styles.paragraph}>
      CardReminder提供以下核心功能：
    </Text>
    <Text style={styles.bulletPoint}>• 信用卡到期日管理和提醒通知</Text>
    <Text style={styles.bulletPoint}>• 付款狀態追蹤和歷史記錄</Text>
    <Text style={styles.bulletPoint}>• 信用卡產品資訊展示和比較</Text>
    <Text style={styles.bulletPoint}>• 個人化設定和偏好管理</Text>
    <Text style={styles.bulletPoint}>• 雙語介面支援（英文/繁體中文）</Text>
    <Text style={styles.paragraph}>
      我們保留隨時修改、暫停或終止任何服務功能的權利，但會盡可能提前通知用戶。
    </Text>
  </View>

  {/* 2. 用戶責任 */}
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>2. 用戶責任與義務</Text>
    <Text style={styles.paragraph}>
      作為用戶，您同意：
    </Text>
    <Text style={styles.bulletPoint}>• 僅輸入您本人擁有的信用卡資訊</Text>
    <Text style={styles.bulletPoint}>• 提供準確的卡片到期日和相關資訊</Text>
    <Text style={styles.bulletPoint}>• 保護您的帳戶登入憑證安全</Text>
    <Text style={styles.bulletPoint}>• 不與他人分享您的帳戶存取權</Text>
    <Text style={styles.bulletPoint}>• 遵守所有適用的法律法規</Text>
    <Text style={styles.bulletPoint}>• 不將服務用於非法或未經授權的目的</Text>
    <Text style={styles.paragraph}>
      您對在您帳戶下發生的所有活動承擔完全責任。
    </Text>
  </View>

  {/* 3. 數據收集與隱私 */}
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>3. 數據收集與隱私保護</Text>
    <Text style={styles.paragraph}>
      我們承諾保護您的隱私並僅收集必要的資訊：
    </Text>
    <Text style={styles.bulletPoint}>• 我們不收集完整的信用卡號碼或CVV代碼</Text>
    <Text style={styles.bulletPoint}>• 僅存儲卡片名稱、銀行名稱和到期日資訊</Text>
    <Text style={styles.bulletPoint}>• 使用Firebase進行安全的數據存儲和身份驗證</Text>
    <Text style={styles.bulletPoint}>• 遵守適用的數據保護法規（GDPR、CCPA等）</Text>
    <Text style={styles.bulletPoint}>• 不會將您的個人資訊出售給第三方</Text>
    <Text style={styles.paragraph}>
      詳細的隱私保護措施請參閱我們的隱私政策。
    </Text>
  </View>

  {/* 4. 免責聲明 */}
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>4. 免責聲明</Text>
    <Text style={styles.paragraph}>
      重要聲明：
    </Text>
    <Text style={styles.bulletPoint}>• CardReminder是提醒工具，不是金融顧問服務</Text>
    <Text style={styles.bulletPoint}>• 我們不保證通知的準確性或及時性</Text>
    <Text style={styles.bulletPoint}>• 用戶有責任確認實際付款日期和金額</Text>
    <Text style={styles.bulletPoint}>• 我們不對因使用本服務而產生的財務損失負責</Text>
    <Text style={styles.bulletPoint}>• 應用程式中的信用卡資訊僅供參考</Text>
    <Text style={styles.paragraph}>
      請務必直接與您的銀行確認所有付款詳情。
    </Text>
  </View>

  {/* 5. 智慧財產權 */}
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>5. 智慧財產權</Text>
    <Text style={styles.paragraph}>
      CardReminder應用程式及其內容均受智慧財產權法律保護：
    </Text>
    <Text style={styles.bulletPoint}>• 應用程式設計、代碼和功能為我們的財產</Text>
    <Text style={styles.bulletPoint}>• 信用卡資訊和圖像版權歸其各自所有者</Text>
    <Text style={styles.bulletPoint}>• 您不得複製、修改或分發應用程式</Text>
    <Text style={styles.bulletPoint}>• 禁止逆向工程或提取原始碼</Text>
  </View>

  {/* 6. 服務終止 */}
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>6. 服務終止</Text>
    <Text style={styles.paragraph}>
      以下情況下我們可能暫停或終止您的帳戶：
    </Text>
    <Text style={styles.bulletPoint}>• 違反這些服務條款</Text>
    <Text style={styles.bulletPoint}>• 從事可疑或非法活動</Text>
    <Text style={styles.bulletPoint}>• 長期不活躍的帳戶（超過2年）</Text>
    <Text style={styles.bulletPoint}>• 技術或安全考量</Text>
    <Text style={styles.paragraph}>
      您也可以隨時透過應用程式設定刪除您的帳戶。
    </Text>
  </View>

  {/* 7. App Store 合規性 */}
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>7. App Store 合規性</Text>
    <Text style={styles.paragraph}>
      本應用程式遵守Apple App Store和Google Play Store的所有規範：
    </Text>
    <Text style={styles.bulletPoint}>• 不包含任何違禁或不當內容</Text>
    <Text style={styles.bulletPoint}>• 遵守兒童隱私保護法規（COPPA）</Text>
    <Text style={styles.bulletPoint}>• 符合無障礙功能要求</Text>
    <Text style={styles.bulletPoint}>• 透明的數據使用政策</Text>
  </View>

  {/* 8. 條款修改 */}
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>8. 條款修改</Text>
    <Text style={styles.paragraph}>
      我們可能會更新這些服務條款。重大變更將通過以下方式通知您：
    </Text>
    <Text style={styles.bulletPoint}>• 應用程式內通知</Text>
    <Text style={styles.bulletPoint}>• 電子郵件通知（如果您提供了電子郵件）</Text>
    <Text style={styles.bulletPoint}>• 應用程式商店更新說明</Text>
    <Text style={styles.paragraph}>
      繼續使用服務即表示您接受修改後的條款。
    </Text>
  </View>

  {/* 9. 聯繫我們 */}
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>9. 聯繫我們</Text>
    <Text style={styles.paragraph}>
      如果您對這些服務條款有任何疑問，請聯繫我們：
    </Text>
    <Text style={styles.bulletPoint}>• 電子郵件：support@cardreminder.app</Text>
    <Text style={styles.bulletPoint}>• 應用程式內意見反饋功能</Text>
    <Text style={styles.paragraph}>
      我們將在收到您的詢問後5個工作日內回覆。
    </Text>
  </View>

  {/* 感謝段落 */}
  <View style={styles.section}>
    <Text style={styles.paragraph}>
      感謝您選擇CardReminder。我們致力於為您提供安全可靠的信用卡管理服務。
    </Text>
  </View>

  {/* 底部間距 */}
  <View style={styles.bottomSpacer} />
</ScrollView></SafeAreaView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  // 🔥 新增：背景層樣式 - 用於渲染完整的 SignUp Page
  backgroundLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  // 🔥 新增：前景層樣式 - 當前頁面內容
  foregroundLayer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    zIndex: 2,
  },
  pageContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4A90E2',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  // 🔥 改進：返回按鈕樣式 - 增大尺寸以便於點擊
  backButton: {
    width: 44, // 增大到推薦的最小觸摸尺寸
    height: 44, // 增大到推薦的最小觸摸尺寸
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginLeft: -44, // 調整以配合新的按鈕尺寸
  },
  headerSpacer: {
    width: 44, // 調整以配合新的按鈕尺寸
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  dateSection: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
    marginBottom: 24,
  },
  effectiveDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A90E2',
    marginBottom: 4,
  },
  lastUpdated: {
    fontSize: 12,
    color: '#666666',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    color: '#333333',
    marginBottom: 12,
    textAlign: 'justify',
  },
  bulletPoint: {
    fontSize: 14,
    lineHeight: 22,
    color: '#333333',
    marginBottom: 8,
    marginLeft: 8,
  },
  bottomSpacer: {
    height: 40,
  },
});