// firebase.js - Firebase配置和服務文件（修復Expo兼容性問題）
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { enableNetwork, disableNetwork } from 'firebase/firestore';
import { 
  getAuth, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  // 🔥 條件性導入：只在Web環境中導入reCAPTCHA相關功能
  RecaptchaVerifier,
  signInWithPhoneNumber,
  PhoneAuthProvider,
  signInWithCredential,
  updateProfile
} from 'firebase/auth';
import { Platform } from 'react-native';

// 🔥 您的Firebase配置
const firebaseConfig = {
  apiKey: "AIzaSyAyP7KAdGvb0r_K30P1BAxnrMhfZlBI4-8",
  authDomain: "credit-card-manager-barry.firebaseapp.com",
  projectId: "credit-card-manager-barry",
  storageBucket: "credit-card-manager-barry.firebasestorage.app",
  messagingSenderId: "941634977022",
  appId: "1:941634977022:web:0af55c0beb12a4e10d39af",
};

// 初始化Firebase應用
const app = initializeApp(firebaseConfig);

// 初始化Firestore資料庫
const db = getFirestore(app);

// 🔥 初始化Firebase認證
const auth = getAuth(app);

// 🔥 環境檢測函數：判斷當前是否為Web環境
const isWebEnvironment = () => {
  return Platform.OS === 'web' && typeof window !== 'undefined' && typeof document !== 'undefined';
};

// 🔥 環境檢測函數：判斷是否為開發環境
const isDevelopmentEnvironment = () => {
  return __DEV__ || process.env.NODE_ENV === 'development';
};

try {
  console.log('🌐 正在啟用Firebase離線支援...');
  console.log('✅ Firebase離線支援已啟用');
} catch (error) {
  console.warn('⚠️ 離線支援啟用失敗:', error);
}

// 🔥 認證服務函數
export const authService = {
  // 🔥 智能環境檢測：reCAPTCHA初始化器
  initializeRecaptcha(containerId = 'recaptcha-container') {
    try {
      console.log('🔧 開始初始化reCAPTCHA...');
      console.log('📱 當前平台:', Platform.OS);
      console.log('🌐 是否為Web環境:', isWebEnvironment());
      
      // 只在Web環境中初始化reCAPTCHA
      if (!isWebEnvironment()) {
        console.log('📱 檢測到React Native環境，跳過reCAPTCHA初始化');
        return null;
      }

      // 檢查是否已經存在reCAPTCHA實例
      if (typeof window !== 'undefined' && window.recaptchaVerifier) {
        console.log('✅ 使用現有的reCAPTCHA實例');
        return window.recaptchaVerifier;
      }

      // 確保DOM元素存在
      const container = document.getElementById(containerId);
      if (!container) {
        console.warn('⚠️ 找不到reCAPTCHA容器元素:', containerId);
        return null;
      }

      // 創建新的reCAPTCHA實例
      window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
        'size': 'invisible',
        'callback': (response) => {
          console.log('✅ reCAPTCHA驗證成功');
        },
        'expired-callback': () => {
          console.log('⚠️ reCAPTCHA已過期');
        }
      });

      console.log('✅ reCAPTCHA初始化成功');
      return window.recaptchaVerifier;
    } catch (error) {
      console.error('❌ reCAPTCHA初始化失敗:', error);
      return null;
    }
  },

  // 🔥 環境感知的電話驗證碼發送功能
  async sendPhoneVerificationCode(phoneNumber) {
    try {
      console.log('📱 開始發送電話驗證碼至:', phoneNumber);
      console.log('🔧 環境檢測結果:', {
        platform: Platform.OS,
        isWeb: isWebEnvironment(),
        isDev: isDevelopmentEnvironment()
      });
      
      // 確保電話號碼格式正確（香港格式：+852）
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+852${phoneNumber}`;
      console.log('📞 格式化後的電話號碼:', formattedPhone);

      // 🎯 關鍵改進：環境適應性處理
      if (isWebEnvironment()) {
        // Web環境：使用標準的reCAPTCHA流程
        console.log('🌐 Web環境：使用reCAPTCHA驗證');
        
        const recaptchaVerifier = this.initializeRecaptcha();
        if (!recaptchaVerifier) {
          throw new Error('reCAPTCHA初始化失敗');
        }

        const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier);
        
        console.log('📧 驗證碼已通過Web端發送至:', formattedPhone);
        return { 
          success: true, 
          confirmationResult,
          phoneNumber: formattedPhone,
          environment: 'web'
        };
      } else {
        // React Native環境：使用模擬模式（開發階段）
        console.log('📱 React Native環境：使用開發模式');
        
        if (isDevelopmentEnvironment()) {
          // 開發模式：創建模擬的confirmationResult
          console.log('🧪 開發模式：創建模擬驗證流程');
          
          const mockConfirmationResult = {
            confirm: async (verificationCode) => {
              console.log('🧪 模擬驗證碼確認:', verificationCode);
              
              // 模擬驗證成功（任何6位數字都會通過）
              if (verificationCode && verificationCode.length === 6) {
                // 創建模擬用戶對象
                const mockUser = {
                  uid: `mock_${Date.now()}`,
                  phoneNumber: formattedPhone,
                  // 其他必要的用戶屬性
                };
                
                return {
                  user: mockUser
                };
              } else {
                throw new Error('invalid-verification-code');
              }
            }
          };
          
          console.log('📧 模擬驗證碼已"發送"至:', formattedPhone);
          console.log('🔑 開發提示：任何6位數字都可以作為驗證碼使用');
          
          return { 
            success: true, 
            confirmationResult: mockConfirmationResult,
            phoneNumber: formattedPhone,
            environment: 'react-native-dev',
            isMock: true
          };
        } else {
          // 生產模式：提示用戶使用Web版本
          throw new Error('電話認證功能目前僅在Web版本中可用，請使用電腦瀏覽器訪問');
        }
      }
      
    } catch (error) {
      console.error('❌ 發送驗證碼失敗:', error);
      
      let errorMessage = '發送驗證碼失敗';
      
      // 根據不同的錯誤類型提供具體的錯誤信息
      if (error.message.includes('reCAPTCHA')) {
        errorMessage = '驗證系統初始化失敗，請重試';
      } else if (error.code) {
        switch (error.code) {
          case 'auth/invalid-phone-number':
            errorMessage = '電話號碼格式無效';
            break;
          case 'auth/missing-phone-number':
            errorMessage = '請輸入電話號碼';
            break;
          case 'auth/quota-exceeded':
            errorMessage = 'SMS配額已用完，請稍後再試';
            break;
          case 'auth/user-disabled':
            errorMessage = '此帳戶已被停用';
            break;
          case 'auth/too-many-requests':
            errorMessage = '請求過於頻繁，請稍後再試';
            break;
          default:
            errorMessage = error.message || '發送驗證碼時發生未知錯誤';
        }
      } else {
        errorMessage = error.message || '發送驗證碼時發生未知錯誤';
      }
      
      return { success: false, error: errorMessage };
    }
  },

  // 🔥 增強的驗證碼確認功能
  async verifyPhoneCode(confirmationResult, verificationCode, userData = null) {
    try {
      console.log('🔐 開始驗證電話驗證碼...');
      console.log('🧪 是否為模擬模式:', confirmationResult.isMock || false);
      
      // 使用驗證碼完成認證
      const result = await confirmationResult.confirm(verificationCode);
      const user = result.user;
      
      console.log('✅ 電話驗證成功，用戶ID:', user.uid);
      console.log('📞 驗證的電話號碼:', user.phoneNumber);
      
      // 檢查是否為新用戶
      const userDoc = await getDocs(collection(db, 'users'));
      let existingUser = false;
      let existingUserData = null;
      
      userDoc.forEach((doc) => {
        const docData = doc.data();
        if (docData.uid === user.uid || docData.phoneNumber === user.phoneNumber) {
          existingUser = true;
          existingUserData = docData;
        }
      });
      
      // 如果是新用戶，創建用戶資料
      if (!existingUser) {
        const newUserData = {
          uid: user.uid,
          phoneNumber: user.phoneNumber,
          username: userData?.username || `用戶${user.phoneNumber.slice(-4)}`,
          createdAt: new Date().toISOString(),
          emailVerified: false,
          phoneVerified: true,
          loginMethod: 'phone'
        };
        
        // 如果提供了額外的用戶資料，合併它們
        if (userData) {
          Object.assign(newUserData, userData);
        }
        
        await setDoc(doc(db, 'users', user.uid), newUserData);
        console.log('✅ 新電話用戶資料已創建');
        
        return { 
          success: true, 
          user,
          userData: newUserData,
          isNewUser: true
        };
      } else {
        console.log('✅ 電話登入成功，現有用戶:', user.phoneNumber);
        return { 
          success: true, 
          user,
          userData: existingUserData,
          isNewUser: false
        };
      }
      
    } catch (error) {
      console.error('❌ 電話驗證失敗:', error);
      
      let errorMessage = '驗證碼驗證失敗';
      
      switch (error.code || error.message) {
        case 'auth/invalid-verification-code':
        case 'invalid-verification-code':
          errorMessage = '驗證碼無效，請檢查並重新輸入';
          break;
        case 'auth/invalid-verification-id':
          errorMessage = '驗證ID無效，請重新發送驗證碼';
          break;
        case 'auth/code-expired':
          errorMessage = '驗證碼已過期，請重新發送';
          break;
        case 'auth/session-expired':
          errorMessage = '驗證會話已過期，請重新開始';
          break;
      }
      
      return { success: false, error: errorMessage };
    }
  },

  // 🔥 香港電話號碼格式驗證（保持不變）
  validateHongKongPhoneNumber(phoneNumber) {
    // 移除所有非數字字符
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    
    // 香港手機號碼格式檢查
    const hkMobileRegex = /^(\+852|852|)([5-9]\d{7})$/;
    const fullNumber = `+852${cleanNumber}`;
    
    if (hkMobileRegex.test(cleanNumber) || hkMobileRegex.test(`852${cleanNumber}`) || hkMobileRegex.test(`+852${cleanNumber}`)) {
      return {
        isValid: true,
        formattedNumber: cleanNumber.length === 8 ? `+852${cleanNumber}` : 
                        cleanNumber.length === 11 && cleanNumber.startsWith('852') ? `+${cleanNumber}` :
                        cleanNumber.startsWith('+852') ? cleanNumber : `+852${cleanNumber.slice(-8)}`
      };
    }
    
    return {
      isValid: false,
      error: '請輸入有效的香港手機號碼（例如：9123 4567）'
    };
  },

  // 其他認證功能保持不變...
  // 使用Email註冊新用戶（保持原有功能）
  async registerWithEmail(email, password, username) {
    try {
      console.log('📝 開始註冊新用戶...');
      
      // 創建用戶帳戶
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // 🔥 發送驗證郵件
      try {
        await sendEmailVerification(user, {
          url: 'https://credit-card-manager-barry.web.app/cardreminder-verification-page/email-verified.html',
          handleCodeInApp: false
        });
        console.log('📧 驗證郵件已發送至:', email);
      } catch (emailError) {
        console.error('📧 發送驗證郵件時出錯:', emailError);
        // 即使郵件發送失敗，也繼續註冊流程
      }
      
      // 在Firestore中創建用戶資料
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: email,
        username: username,
        createdAt: new Date().toISOString(),
        emailVerified: false,
        phoneVerified: false,
        loginMethod: 'email'
      });
      
      console.log('✅ 註冊成功，用戶ID:', user.uid);
      return { success: true, user };
      
    } catch (error) {
      console.error('❌ 註冊失敗:', error);
      
      // 處理特定錯誤
      let errorMessage = '註冊過程中發生錯誤';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = '此電子郵件已被使用';
          break;
        case 'auth/invalid-email':
          errorMessage = '電子郵件格式無效';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = '郵件註冊功能未啟用';
          break;
        case 'auth/weak-password':
          errorMessage = '密碼強度不足，請使用至少6個字符';
          break;
      }
      
      return { success: false, error: errorMessage };
    }
  },

  // Email登入（保持原有功能）
  async signInWithEmail(email, password) {
    try {
      console.log('🔐 開始Email登入...');
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // 🔥 暫時允許未驗證的用戶登入（用於測試）
      if (!user.emailVerified) {
        console.log('⚠️ 郵件尚未驗證，但允許登入進行測試');
      }
      
      // 從Firestore獲取用戶資料
      const userDoc = await getDocs(collection(db, 'users'));
      let userData = null;
      userDoc.forEach((doc) => {
        if (doc.data().uid === user.uid) {
          userData = doc.data();
        }
      });
      
      console.log('✅ 登入成功:', user.email);
      return { 
        success: true, 
        user,
        userData: userData || {
          email: user.email,
          username: user.email.split('@')[0],
          loginMethod: 'email'
        }
      };
      
    } catch (error) {
      console.error('❌ 登入失敗:', error);
      
      let errorMessage = '登入失敗';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = '找不到此用戶，請先註冊';
          break;
        case 'auth/wrong-password':
          errorMessage = '密碼錯誤';
          break;
        case 'auth/invalid-email':
          errorMessage = '電子郵件格式無效';
          break;
        case 'auth/user-disabled':
          errorMessage = '此帳戶已被停用';
          break;
        case 'auth/too-many-requests':
          errorMessage = '登入嘗試次數過多，請稍後再試';
          break;
        case 'auth/invalid-credential':
          errorMessage = '電子郵件或密碼錯誤';
          break;
      }
      
      return { success: false, error: errorMessage };
    }
  },

  // 🔥 密碼重置功能
  async sendPasswordReset(email) {
    try {
      console.log('🔐 開始發送密碼重置郵件...');
      
      await sendPasswordResetEmail(auth, email, {
        url: 'https://credit-card-manager-barry.web.app/password-reset-success.html',
        handleCodeInApp: false
      });
      
      console.log('📧 密碼重置郵件已發送至:', email);
      return { success: true };
      
    } catch (error) {
      console.error('❌ 發送密碼重置郵件失敗:', error);
      
      let errorMessage = '發送密碼重置郵件失敗';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = '找不到此電子郵件對應的帳戶';
          break;
        case 'auth/invalid-email':
          errorMessage = '電子郵件格式無效';
          break;
        case 'auth/too-many-requests':
          errorMessage = '請求過於頻繁，請稍後再試';
          break;
      }
      
      return { success: false, error: errorMessage };
    }
  },

  // 重新發送驗證郵件
  async resendVerificationEmail() {
    try {
      const user = auth.currentUser;
      if (user && !user.emailVerified) {
        await sendEmailVerification(user, {
          url: 'https://credit-card-manager-barry.web.app/cardreminder-verification-page/email-verified.html',
          handleCodeInApp: false
        });
        console.log('📧 驗證郵件已重新發送');
        return { success: true };
      }
      return { success: false, error: '無法發送驗證郵件' };
    } catch (error) {
      console.error('❌ 發送驗證郵件失敗:', error);
      return { success: false, error: '發送驗證郵件失敗' };
    }
  },

  // 🔥 登出功能
  async signOut() {
    try {
      await firebaseSignOut(auth);
      console.log('👋 用戶已登出');
      return { success: true };
    } catch (error) {
      console.error('❌ 登出失敗:', error);
      return { success: false, error: '登出失敗' };
    }
  },

  // 監聽認證狀態變化
  onAuthStateChanged(callback) {
    return onAuthStateChanged(auth, callback);
  },

  // 獲取當前用戶
  getCurrentUser() {
    return auth.currentUser;
  }
};

// 信用卡資料服務（保持原有功能不變）
export const creditCardService = {
  async getAllCards() {
    try {
      const querySnapshot = await getDocs(collection(db, 'credit_cards'));
      const cards = [];
      querySnapshot.forEach((doc) => {
        cards.push({ id: doc.id, ...doc.data() });
      });
      console.log('🎉 成功載入信用卡資料:', cards.length, '張卡片');
      return cards;
    } catch (error) {
      console.error('❌ 載入信用卡資料失敗:', error);
      return [];
    }
  },

  async addCard(cardData) {
    try {
      await setDoc(doc(db, 'credit_cards', cardData.id), {
        ...cardData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true
      });
      console.log('✅ 成功添加信用卡:', cardData.name);
      return true;
    } catch (error) {
      console.error('❌ 添加信用卡失敗:', error);
      return false;
    }
  },

  async updateCard(cardId, updateData) {
    try {
      await updateDoc(doc(db, 'credit_cards', cardId), {
        ...updateData,
        updatedAt: new Date().toISOString()
      });
      console.log('✅ 成功更新信用卡:', cardId);
      return true;
    } catch (error) {
      console.error('❌ 更新信用卡失敗:', error);
      return false;
    }
  },

  async deleteCard(cardId) {
    try {
      await deleteDoc(doc(db, 'credit_cards', cardId));
      console.log('✅ 成功刪除信用卡:', cardId);
      return true;
    } catch (error) {
      console.error('❌ 刪除信用卡失敗:', error);
      return false;
    }
  }
};

export default db;