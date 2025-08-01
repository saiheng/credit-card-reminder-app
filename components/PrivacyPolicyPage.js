// components/PrivacyPolicyPage.js - 隱私政策頁面（完整的Apple風格邊緣滑動實現）
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

export default function PrivacyPolicyPage({ onBack, getText }) {
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
        console.log('🔥 隱私政策頁面邊緣滑動開始');
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
          console.log('✅ 隱私政策頁面邊緣滑動返回觸發！');
          
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

      {/* 🔥 前景層：當前的隱私政策頁面 */}
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
              {getText ? getText('privacy.title') : '隱私政策'}
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
      {getText ? getText('privacy.effectiveDate') : '生效日期：2024年8月2日'}
    </Text>
    <Text style={styles.lastUpdated}>
      {getText ? getText('privacy.lastUpdated') : '最後更新：2024年8月2日'}
    </Text>
  </View>

  {/* 重要聲明 */}
  <View style={styles.importantNotice}>
    <MaterialIcons name="security" size={24} color="#4A90E2" />
    <Text style={styles.noticeText}>
      您的隱私對我們至關重要。我們承諾透明地說明資料收集和使用方式，並採用最高標準保護您的個人資訊。
    </Text>
  </View>

  {/* 引言 */}
  <View style={styles.section}>
    <Text style={styles.paragraph}>
      本隱私政策說明CardReminder（「我們」、「應用程式」或「服務」）如何收集、使用、存儲和保護您的個人資訊。
    </Text>
    <Text style={styles.paragraph}>
      使用我們的服務即表示您同意本隱私政策中描述的資料處理方式。
    </Text>
  </View>

  {/* 1. 我們收集的資訊 */}
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>1. 我們收集的資訊</Text>
    
    <Text style={styles.subSectionTitle}>1.1 您主動提供的資訊</Text>
    <Text style={styles.bulletPoint}>• 帳戶資訊：電子郵件地址、用戶名</Text>
    <Text style={styles.bulletPoint}>• 信用卡管理資訊：卡片名稱、發卡銀行、到期日</Text>
    <Text style={styles.bulletPoint}>• 偏好設定：語言選擇、通知設定、提醒時間</Text>
    <Text style={styles.bulletPoint}>• 意見反饋：您透過應用程式提供的建議或問題</Text>

    <Text style={styles.subSectionTitle}>1.2 自動收集的技術資訊</Text>
    <Text style={styles.bulletPoint}>• 設備資訊：作業系統、應用程式版本、設備型號</Text>
    <Text style={styles.bulletPoint}>• 使用統計：功能使用頻率、應用程式使用時間</Text>
    <Text style={styles.bulletPoint}>• 錯誤日誌：用於改善應用程式效能的技術資料</Text>

    <Text style={styles.subSectionTitle}>1.3 我們不收集的敏感資訊</Text>
    <Text style={styles.importantText}>
      我們明確承諾不收集以下敏感資訊：
    </Text>
    <Text style={styles.bulletPoint}>• 完整信用卡號碼或CVV安全碼</Text>
    <Text style={styles.bulletPoint}>• 銀行帳戶資訊或網上銀行密碼</Text>
    <Text style={styles.bulletPoint}>• 身份證號碼或政府身份證件</Text>
    <Text style={styles.bulletPoint}>• 生物識別資料（指紋、面部識別等）</Text>
    <Text style={styles.bulletPoint}>• 精確位置資訊或GPS追蹤</Text>
  </View>

  {/* 2. 資訊使用方式 */}
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>2. 我們如何使用您的資訊</Text>
    <Text style={styles.paragraph}>
      我們僅在必要時使用您的資訊：
    </Text>
    <Text style={styles.bulletPoint}>• 提供信用卡到期日提醒服務</Text>
    <Text style={styles.bulletPoint}>• 維護和改善應用程式功能</Text>
    <Text style={styles.bulletPoint}>• 個人化您的用戶體驗</Text>
    <Text style={styles.bulletPoint}>• 發送重要的服務更新通知</Text>
    <Text style={styles.bulletPoint}>• 提供客戶支援服務</Text>
    <Text style={styles.bulletPoint}>• 防止欺詐和確保帳戶安全</Text>
    <Text style={styles.bulletPoint}>• 遵守法律義務和保護我們的合法權益</Text>
  </View>

  {/* 3. 資訊分享政策 */}
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>3. 資訊分享政策</Text>
    <Text style={styles.importantText}>
      我們不會出售、出租或商業化您的個人資訊。
    </Text>
    
    <Text style={styles.subSectionTitle}>3.1 授權的第三方服務</Text>
    <Text style={styles.paragraph}>
      我們與以下可信賴的服務提供商合作：
    </Text>
    <Text style={styles.bulletPoint}>• Firebase（Google）：身份驗證、資料存儲和應用程式分析</Text>
    <Text style={styles.bulletPoint}>• Expo：應用程式開發和分發平台</Text>
    <Text style={styles.bulletPoint}>• 雲端服務：安全的資料備份和同步</Text>

    <Text style={styles.subSectionTitle}>3.2 法律要求</Text>
    <Text style={styles.paragraph}>
      我們可能在以下情況下披露資訊：
    </Text>
    <Text style={styles.bulletPoint}>• 法律要求或法院命令</Text>
    <Text style={styles.bulletPoint}>• 保護用戶和公眾安全</Text>
    <Text style={styles.bulletPoint}>• 防止欺詐或非法活動</Text>
    <Text style={styles.bulletPoint}>• 保護我們的合法權利和財產</Text>
  </View>

  {/* 4. 資料安全措施 */}
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>4. 資料安全措施</Text>
    
    <Text style={styles.subSectionTitle}>4.1 技術安全措施</Text>
    <Text style={styles.bulletPoint}>• 端到端加密：所有敏感資料經過加密處理</Text>
    <Text style={styles.bulletPoint}>• HTTPS/TLS：安全的資料傳輸協議</Text>
    <Text style={styles.bulletPoint}>• Firebase安全規則：嚴格的資料存取控制</Text>
    <Text style={styles.bulletPoint}>• 定期安全審計：持續監控和改善安全措施</Text>

    <Text style={styles.subSectionTitle}>4.2 操作安全措施</Text>
    <Text style={styles.bulletPoint}>• 最小權限原則：員工僅能存取必要的資料</Text>
    <Text style={styles.bulletPoint}>• 安全培訓：定期的隱私和安全培訓</Text>
    <Text style={styles.bulletPoint}>• 事件回應：完善的安全事件處理程序</Text>
    <Text style={styles.bulletPoint}>• 24/7監控：持續監控可疑活動</Text>
  </View>

  {/* 5. 您的隱私權利 */}
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>5. 您的隱私權利</Text>
    <Text style={styles.paragraph}>
      您對自己的個人資訊享有以下權利：
    </Text>
    <Text style={styles.bulletPoint}>• 存取權：查看我們持有的您的個人資訊</Text>
    <Text style={styles.bulletPoint}>• 更正權：更正不準確或過時的資訊</Text>
    <Text style={styles.bulletPoint}>• 刪除權：要求刪除您的個人資訊</Text>
    <Text style={styles.bulletPoint}>• 限制處理權：限制某些資料處理活動</Text>
    <Text style={styles.bulletPoint}>• 資料可攜權：以標準格式獲取您的資料</Text>
    <Text style={styles.bulletPoint}>• 反對權：反對某些資料處理活動</Text>
    <Text style={styles.paragraph}>
      要行使這些權利，請透過應用程式設定或聯繫我們的客服。
    </Text>
  </View>

  {/* 6. 資料保存政策 */}
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>6. 資料保存政策</Text>
    <Text style={styles.paragraph}>
      我們僅在必要期間保存您的資訊：
    </Text>
    <Text style={styles.bulletPoint}>• 用戶帳戶資料：帳戶活躍期間及其後6個月</Text>
    <Text style={styles.bulletPoint}>• 使用統計資料：最多保存24個月</Text>
    <Text style={styles.bulletPoint}>• 客服記錄：解決問題後保存12個月</Text>
    <Text style={styles.bulletPoint}>• 法律要求：根據適用法律的保存期間</Text>
    <Text style={styles.paragraph}>
      您可以隨時要求刪除您的帳戶和所有相關資料。
    </Text>
  </View>

  {/* 7. 兒童隱私保護 */}
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>7. 兒童隱私保護</Text>
    <Text style={styles.paragraph}>
      CardReminder面向18歲以上的成年用戶。我們不會故意收集18歲以下兒童的個人資訊。
    </Text>
    <Text style={styles.paragraph}>
      如果我們發現無意中收集了兒童的個人資訊，我們將立即刪除相關資料。如果您是父母或監護人，並且發現您的孩子向我們提供了個人資訊，請立即聯繫我們。
    </Text>
  </View>

  {/* 8. 國際資料傳輸 */}
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>8. 國際資料傳輸</Text>
    <Text style={styles.paragraph}>
      由於我們使用Firebase等國際服務，您的資料可能被傳輸到其他國家或地區。我們確保：
    </Text>
    <Text style={styles.bulletPoint}>• 所有資料傳輸使用加密保護</Text>
    <Text style={styles.bulletPoint}>• 接收國具有適當的資料保護水平</Text>
    <Text style={styles.bulletPoint}>• 遵守GDPR、CCPA等國際資料保護法規</Text>
    <Text style={styles.bulletPoint}>• 與第三方簽署適當的資料處理協議</Text>
  </View>

  {/* 9. Cookie和追蹤技術 */}
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>9. Cookie和追蹤技術</Text>
    <Text style={styles.paragraph}>
      我們使用有限的追蹤技術來改善服務：
    </Text>
    <Text style={styles.bulletPoint}>• Firebase Analytics：匿名使用統計</Text>
    <Text style={styles.bulletPoint}>• 錯誤追蹤：應用程式崩潰報告</Text>
    <Text style={styles.bulletPoint}>• 效能監控：應用程式載入時間統計</Text>
    <Text style={styles.paragraph}>
      您可以在設備設定中控制這些功能。
    </Text>
  </View>

  {/* 10. 隱私政策更新 */}
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>10. 隱私政策更新</Text>
    <Text style={styles.paragraph}>
      我們可能會更新本隱私政策。重大變更將提前30天通過以下方式通知您：
    </Text>
    <Text style={styles.bulletPoint}>• 應用程式內醒目通知</Text>
    <Text style={styles.bulletPoint}>• 電子郵件通知（如果您提供了電子郵件）</Text>
    <Text style={styles.bulletPoint}>• 應用程式商店更新說明</Text>
    <Text style={styles.paragraph}>
      繼續使用服務即表示您接受更新後的隱私政策。
    </Text>
  </View>

  {/* 11. 聯繫我們 */}
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>11. 聯繫我們</Text>
    <Text style={styles.paragraph}>
      如有隱私相關問題或行使您的權利，請聯繫我們：
    </Text>
    <Text style={styles.bulletPoint}>• 電子郵件：privacy@cardreminder.app</Text>
    <Text style={styles.bulletPoint}>• 應用程式內隱私設定頁面</Text>
    <Text style={styles.bulletPoint}>• 客服功能：應用程式內幫助中心</Text>
    <Text style={styles.paragraph}>
      我們承諾在收到您的詢問後7個工作日內回應。
    </Text>
  </View>

  {/* 感謝段落 */}
  <View style={styles.section}>
    <Text style={styles.paragraph}>
      感謝您信任CardReminder。保護您的隱私是我們持續的承諾，我們將不斷改善我們的隱私保護措施。
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
    marginBottom: 16,
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
  importantNotice: {
    backgroundColor: '#E3F2FD',
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#4A90E2',
  },
  noticeText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: '#1565C0',
    marginLeft: 12,
    fontWeight: '500',
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
  subSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A90E2',
    marginBottom: 8,
    marginTop: 12,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    color: '#333333',
    marginBottom: 12,
    textAlign: 'justify',
  },
  importantText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#2C3E50',
    marginBottom: 12,
    fontWeight: '600',
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#FF9800',
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