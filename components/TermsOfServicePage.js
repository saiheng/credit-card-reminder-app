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
                {getText ? getText('terms.effectiveDate') : '生效日期：2024年1月1日'}
              </Text>
              <Text style={styles.lastUpdated}>
                {getText ? getText('terms.lastUpdated') : '最後更新：2024年1月1日'}
              </Text>
            </View>

            {/* 歡迎段落 */}
            <View style={styles.section}>
              <Text style={styles.paragraph}>
                歡迎使用CardReminder（以下稱「本應用程式」、「我們」或「服務」）。CardReminder是一個信用卡管理應用程式，旨在幫助用戶更好地管理和追蹤他們的信用卡資訊。
              </Text>
              <Text style={styles.paragraph}>
                這些服務條款（以下稱「條款」）構成您與CardReminder之間具有法律約束力的協議。使用我們的服務即表示您同意受這些條款的約束。
              </Text>
            </View>

            {/* 1. 服務描述 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>1. 服務描述</Text>
              <Text style={styles.paragraph}>
                CardReminder提供以下服務：
              </Text>
              <Text style={styles.bulletPoint}>• 信用卡資訊管理和組織</Text>
              <Text style={styles.bulletPoint}>• 信用卡優惠和促銷資訊展示</Text>
              <Text style={styles.bulletPoint}>• 個人化的信用卡推薦</Text>
              <Text style={styles.bulletPoint}>• 用戶偏好設定和帳戶管理</Text>
              <Text style={styles.paragraph}>
                我們保留隨時修改、暫停或終止任何服務功能的權利，無需事先通知。
              </Text>
            </View>

            {/* 2. 用戶責任 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>2. 用戶責任</Text>
              <Text style={styles.paragraph}>
                作為用戶，您同意：
              </Text>
              <Text style={styles.bulletPoint}>• 提供準確、完整和最新的帳戶資訊</Text>
              <Text style={styles.bulletPoint}>• 維護您帳戶和密碼的安全性</Text>
              <Text style={styles.bulletPoint}>• 不與他人分享您的帳戶憑證</Text>
              <Text style={styles.bulletPoint}>• 遵守所有適用的法律法規</Text>
              <Text style={styles.bulletPoint}>• 不將服務用於非法或未經授權的目的</Text>
              <Text style={styles.paragraph}>
                您對在您帳戶下發生的所有活動承擔責任。
              </Text>
            </View>

            {/* 3. 隱私與數據安全 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>3. 隱私與數據安全</Text>
              <Text style={styles.paragraph}>
                我們深知您的隱私對您的重要性。我們承諾：
              </Text>
              <Text style={styles.bulletPoint}>• 採用行業標準的加密技術保護您的數據</Text>
              <Text style={styles.bulletPoint}>• 僅收集為提供服務所必需的資訊</Text>
              <Text style={styles.bulletPoint}>• 不會將您的個人資訊出售給第三方</Text>
              <Text style={styles.bulletPoint}>• 遵守相關的數據保護法規</Text>
              <Text style={styles.paragraph}>
                有關我們如何收集、使用和保護您的資訊的詳細資訊，請參閱我們的隱私政策。
              </Text>
            </View>

            {/* 4. 智慧財產權 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>4. 智慧財產權</Text>
              <Text style={styles.paragraph}>
                CardReminder應用程式及其所有內容、功能和設計均受版權、商標和其他智慧財產權法律保護。您同意：
              </Text>
              <Text style={styles.bulletPoint}>• 不複製、修改或分發我們的應用程式</Text>
              <Text style={styles.bulletPoint}>• 不逆向工程或試圖提取原始碼</Text>
              <Text style={styles.bulletPoint}>• 尊重第三方的智慧財產權</Text>
              <Text style={styles.bulletPoint}>• 僅將服務用於個人、非商業目的</Text>
            </View>

            {/* 5. 免責聲明 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>5. 免責聲明</Text>
              <Text style={styles.paragraph}>
                CardReminder按「現狀」提供服務。我們明確聲明：
              </Text>
              <Text style={styles.bulletPoint}>• 我們不是金融顧問或信用卡發行機構</Text>
              <Text style={styles.bulletPoint}>• 應用程式中的資訊僅供參考，不構成財務建議</Text>
              <Text style={styles.bulletPoint}>• 我們不保證服務的持續可用性或無錯誤性</Text>
              <Text style={styles.bulletPoint}>• 用戶應自行驗證所有信用卡資訊的準確性</Text>
              <Text style={styles.paragraph}>
                我們強烈建議您在做出任何財務決定之前諮詢合格的財務顧問。
              </Text>
            </View>

            {/* 6. 責任限制 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>6. 責任限制</Text>
              <Text style={styles.paragraph}>
                在法律允許的最大範圍內，CardReminder不對以下情況承擔責任：
              </Text>
              <Text style={styles.bulletPoint}>• 因使用或無法使用服務而導致的任何損失</Text>
              <Text style={styles.bulletPoint}>• 資料丟失或安全漏洞</Text>
              <Text style={styles.bulletPoint}>• 第三方服務的中斷或故障</Text>
              <Text style={styles.bulletPoint}>• 因信賴應用程式資訊而做出的財務決定</Text>
            </View>

            {/* 7. 服務終止 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>7. 服務終止</Text>
              <Text style={styles.paragraph}>
                我們保留在以下情況下暫停或終止您的帳戶的權利：
              </Text>
              <Text style={styles.bulletPoint}>• 違反這些服務條款</Text>
              <Text style={styles.bulletPoint}>• 從事欺詐或非法活動</Text>
              <Text style={styles.bulletPoint}>• 長期不活躍的帳戶</Text>
              <Text style={styles.bulletPoint}>• 技術或商業原因</Text>
              <Text style={styles.paragraph}>
                您也可以隨時刪除您的帳戶來終止服務。
              </Text>
            </View>

            {/* 8. 條款修改 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>8. 條款修改</Text>
              <Text style={styles.paragraph}>
                我們可能會不時更新這些服務條款。重大變更將通過以下方式通知您：
              </Text>
              <Text style={styles.bulletPoint}>• 應用程式內通知</Text>
              <Text style={styles.bulletPoint}>• 電子郵件通知（如適用）</Text>
              <Text style={styles.bulletPoint}>• 在我們的網站上發佈通知</Text>
              <Text style={styles.paragraph}>
                繼續使用服務即表示您接受修改後的條款。
              </Text>
            </View>

            {/* 9. 適用法律 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>9. 適用法律</Text>
              <Text style={styles.paragraph}>
                這些條款受香港特別行政區法律管轄，任何爭議將由香港特別行政區的法院處理。
              </Text>
            </View>

            {/* 10. 聯繫我們 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>10. 聯繫我們</Text>
              <Text style={styles.paragraph}>
                如果您對這些服務條款有任何疑問或建議，請通過以下方式聯繫我們：
              </Text>
              <Text style={styles.bulletPoint}>• 應用程式內的客服功能</Text>
              <Text style={styles.bulletPoint}>• 電子郵件：support@cardreminder.app</Text>
              <Text style={styles.paragraph}>
                我們將盡力在合理時間內回應您的詢問。
              </Text>
            </View>

            {/* 感謝段落 */}
            <View style={styles.section}>
              <Text style={styles.paragraph}>
                感謝您選擇CardReminder。我們致力於為您提供優質的信用卡管理服務。
              </Text>
            </View>

            {/* 底部間距 */}
            <View style={styles.bottomSpacer} />
          </ScrollView>
        </SafeAreaView>
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