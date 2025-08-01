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
                {getText ? getText('privacy.effectiveDate') : '生效日期：2024年1月1日'}
              </Text>
              <Text style={styles.lastUpdated}>
                {getText ? getText('privacy.lastUpdated') : '最後更新：2024年1月1日'}
              </Text>
            </View>

            {/* 重要聲明 */}
            <View style={styles.importantNotice}>
              <MaterialIcons name="security" size={24} color="#4A90E2" />
              <Text style={styles.noticeText}>
                您的隱私對我們極其重要。我們承諾保護您的個人資訊並透明地說明我們如何收集、使用和保護您的數據。
              </Text>
            </View>

            {/* 引言 */}
            <View style={styles.section}>
              <Text style={styles.paragraph}>
                本隱私政策說明CardReminder（「我們」、「我們的」或「服務」）如何收集、使用、存儲和保護您在使用我們的信用卡管理應用程式時提供的資訊。
              </Text>
              <Text style={styles.paragraph}>
                使用我們的服務即表示您同意本隱私政策中描述的資訊處理實踐。
              </Text>
            </View>

            {/* 1. 我們收集的資訊 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>1. 我們收集的資訊</Text>
              
              <Text style={styles.subSectionTitle}>1.1 您主動提供的資訊</Text>
              <Text style={styles.paragraph}>
                當您使用我們的服務時，您可能會提供以下資訊：
              </Text>
              <Text style={styles.bulletPoint}>• 註冊資訊：電子郵件地址、用戶名、密碼</Text>
              <Text style={styles.bulletPoint}>• 個人偏好設定：語言選擇、通知設定</Text>
              <Text style={styles.bulletPoint}>• 信用卡偏好資訊：您感興趣的信用卡類型和特徵</Text>
              <Text style={styles.bulletPoint}>• 聯繫資訊：當您聯繫客服時提供的資訊</Text>

              <Text style={styles.subSectionTitle}>1.2 自動收集的資訊</Text>
              <Text style={styles.paragraph}>
                我們可能會自動收集以下技術資訊：
              </Text>
              <Text style={styles.bulletPoint}>• 設備資訊：設備型號、作業系統版本、應用程式版本</Text>
              <Text style={styles.bulletPoint}>• 使用資料：應用程式使用模式、功能使用頻率</Text>
              <Text style={styles.bulletPoint}>• 日誌資訊：錯誤報告、效能資料</Text>
              <Text style={styles.bulletPoint}>• 網絡資訊：IP地址、連接類型（僅用於安全和技術目的）</Text>

              <Text style={styles.subSectionTitle}>1.3 我們不收集的資訊</Text>
              <Text style={styles.importantText}>
                我們明確承諾不收集以下敏感資訊：
              </Text>
              <Text style={styles.bulletPoint}>• 信用卡號碼、CVV或任何實際的信用卡憑證</Text>
              <Text style={styles.bulletPoint}>• 銀行帳戶資訊或財務憑證</Text>
              <Text style={styles.bulletPoint}>• 社會安全號碼或身份證號碼</Text>
              <Text style={styles.bulletPoint}>• 生物識別資料</Text>
            </View>

            {/* 2. 資訊使用方式 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>2. 我們如何使用您的資訊</Text>
              <Text style={styles.paragraph}>
                我們使用收集的資訊來：
              </Text>
              <Text style={styles.bulletPoint}>• 提供和維護我們的服務功能</Text>
              <Text style={styles.bulletPoint}>• 個人化您的用戶體驗和推薦</Text>
              <Text style={styles.bulletPoint}>• 發送服務相關的通知和更新</Text>
              <Text style={styles.bulletPoint}>• 改善應用程式效能和用戶體驗</Text>
              <Text style={styles.bulletPoint}>• 提供客戶支援服務</Text>
              <Text style={styles.bulletPoint}>• 防止欺詐和確保服務安全</Text>
              <Text style={styles.bulletPoint}>• 遵守法律要求和保護我們的權利</Text>
            </View>

            {/* 3. 資訊共享 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>3. 資訊共享政策</Text>
              <Text style={styles.importantText}>
                我們不會出售、出租或以其他方式商業化您的個人資訊。
              </Text>
              <Text style={styles.paragraph}>
                我們僅在以下有限情況下共享您的資訊：
              </Text>
              
              <Text style={styles.subSectionTitle}>3.1 服務提供商</Text>
              <Text style={styles.paragraph}>
                我們與可信賴的第三方服務提供商合作：
              </Text>
              <Text style={styles.bulletPoint}>• Firebase（Google）：用於身份驗證、資料存儲和分析</Text>
              <Text style={styles.bulletPoint}>• 雲端服務提供商：用於安全的資料存儲和備份</Text>
              <Text style={styles.bulletPoint}>• 分析服務：用於了解應用程式使用模式（僅限匿名資料）</Text>

              <Text style={styles.subSectionTitle}>3.2 法律要求</Text>
              <Text style={styles.paragraph}>
                我們可能在以下情況下披露資訊：
              </Text>
              <Text style={styles.bulletPoint}>• 法律要求或法院命令</Text>
              <Text style={styles.bulletPoint}>• 保護我們的權利、財產或安全</Text>
              <Text style={styles.bulletPoint}>• 保護其他用戶或公眾的安全</Text>
              <Text style={styles.bulletPoint}>• 防止欺詐或其他非法活動</Text>
            </View>

            {/* 4. 資料安全 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>4. 資料安全措施</Text>
              <Text style={styles.paragraph}>
                我們實施多層次的安全措施來保護您的資訊：
              </Text>
              
              <Text style={styles.subSectionTitle}>4.1 技術安全措施</Text>
              <Text style={styles.bulletPoint}>• 端到端加密：所有敏感資料都經過加密處理</Text>
              <Text style={styles.bulletPoint}>• 安全傳輸：使用HTTPS/TLS協議進行資料傳輸</Text>
              <Text style={styles.bulletPoint}>• 存取控制：嚴格限制對您資料的存取權限</Text>
              <Text style={styles.bulletPoint}>• 定期安全審計：持續監控和改善安全措施</Text>

              <Text style={styles.subSectionTitle}>4.2 操作安全措施</Text>
              <Text style={styles.bulletPoint}>• 員工培訓：所有員工都接受隱私和安全培訓</Text>
              <Text style={styles.bulletPoint}>• 最小權限原則：員工僅能存取執行工作所需的資料</Text>
              <Text style={styles.bulletPoint}>• 安全監控：24/7監控可疑活動</Text>
              <Text style={styles.bulletPoint}>• 事件回應：建立完善的安全事件回應程序</Text>
            </View>

            {/* 5. 資料保存 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>5. 資料保存政策</Text>
              <Text style={styles.paragraph}>
                我們僅在必要期間保存您的資訊：
              </Text>
              <Text style={styles.bulletPoint}>• 用戶帳戶：在您的帳戶有效期間及其後合理期間</Text>
              <Text style={styles.bulletPoint}>• 使用資料：通常保存不超過2年</Text>
              <Text style={styles.bulletPoint}>• 法律要求：根據適用法律要求的保存期間</Text>
              <Text style={styles.paragraph}>
                您可以隨時要求刪除您的帳戶和相關資料。
              </Text>
            </View>

            {/* 6. 您的權利 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>6. 您的隱私權利</Text>
              <Text style={styles.paragraph}>
                您對自己的個人資訊享有以下權利：
              </Text>
              <Text style={styles.bulletPoint}>• 存取權：要求查看我們持有的您的個人資訊</Text>
              <Text style={styles.bulletPoint}>• 更正權：要求更正不準確或不完整的資訊</Text>
              <Text style={styles.bulletPoint}>• 刪除權：要求刪除您的個人資訊</Text>
              <Text style={styles.bulletPoint}>• 限制處理權：在特定情況下限制對您資訊的處理</Text>
              <Text style={styles.bulletPoint}>• 可攜權：以結構化格式接收您的資料</Text>
              <Text style={styles.bulletPoint}>• 反對權：反對我們處理您的資訊</Text>
              <Text style={styles.paragraph}>
                要行使這些權利，請通過應用程式內的設定功能或聯繫我们的客服。
              </Text>
            </View>

            {/* 7. 兒童隱私 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>7. 兒童隱私保護</Text>
              <Text style={styles.paragraph}>
                我們的服務面向18歲以上的成年人。我們不會故意收集18歲以下兒童的個人資訊。如果我們發現無意中收集了兒童的個人資訊，我們將立即刪除該資訊。
              </Text>
              <Text style={styles.paragraph}>
                如果您是父母或監護人，並且知道您的孩子向我們提供了個人資訊，請聯繫我們，我們將採取措施從我們的系統中刪除該資訊。
              </Text>
            </View>

            {/* 8. 第三方服務 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>8. 第三方服務</Text>
              <Text style={styles.paragraph}>
                我們的應用程式使用以下主要第三方服務：
              </Text>
              
              <Text style={styles.subSectionTitle}>8.1 Firebase（Google）</Text>
              <Text style={styles.bulletPoint}>• 用途：身份驗證、資料存儲、應用程式分析</Text>
              <Text style={styles.bulletPoint}>• 隱私政策：https://policies.google.com/privacy</Text>
              <Text style={styles.bulletPoint}>• 資料處理：遵循Google的隱私標準和GDPR要求</Text>

              <Text style={styles.paragraph}>
                這些第三方服務有其自己的隱私政策，我們建議您查閱這些政策以了解它們如何處理您的資訊。
              </Text>
            </View>

            {/* 9. 國際資料傳輸 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>9. 國際資料傳輸</Text>
              <Text style={styles.paragraph}>
                您的資訊可能會被傳輸到並存儲在您所在國家/地區以外的伺服器上。我們確保：
              </Text>
              <Text style={styles.bulletPoint}>• 所有資料傳輸都使用適當的安全措施</Text>
              <Text style={styles.bulletPoint}>• 接收國具有充分的資料保護水平</Text>
              <Text style={styles.bulletPoint}>• 與第三方簽署適當的資料處理協議</Text>
              <Text style={styles.bulletPoint}>• 遵守適用的國際資料保護法規</Text>
            </View>

            {/* 10. 隱私政策更新 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>10. 隱私政策更新</Text>
              <Text style={styles.paragraph}>
                我們可能會不時更新本隱私政策以反映：
              </Text>
              <Text style={styles.bulletPoint}>• 我們的資訊處理實踐變化</Text>
              <Text style={styles.bulletPoint}>• 法律或監管要求的變化</Text>
              <Text style={styles.bulletPoint}>• 新功能或服務的添加</Text>
              <Text style={styles.paragraph}>
                重大變更將通過以下方式通知您：
              </Text>
              <Text style={styles.bulletPoint}>• 應用程式內通知</Text>
              <Text style={styles.bulletPoint}>• 電子郵件通知（如適用）</Text>
              <Text style={styles.bulletPoint}>• 在政策生效前至少30天通知</Text>
            </View>

            {/* 11. 聯繫我們 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>11. 聯繫我們</Text>
              <Text style={styles.paragraph}>
                如果您對本隱私政策或我們的隱私實踐有任何疑問、意見或投訴，請通過以下方式聯繫我們：
              </Text>
              <Text style={styles.bulletPoint}>• 應用程式內的隱私設定頁面</Text>
              <Text style={styles.bulletPoint}>• 電子郵件：privacy@cardreminder.app</Text>
              <Text style={styles.bulletPoint}>• 客服功能：應用程式內的幫助中心</Text>
              <Text style={styles.paragraph}>
                我們承諾在收到您的詢問後30天內回應。
              </Text>
            </View>

            {/* 感謝段落 */}
            <View style={styles.section}>
              <Text style={styles.paragraph}>
                感謝您信任CardReminder。保護您的隱私是我們的首要任務，我們將持續努力確保您的個人資訊得到最高水平的保護。
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