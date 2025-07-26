// components/ProfilePage.js - 不需要 expo-image-picker 的版本
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
  Image
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

export default function ProfilePage({ 
  userData = {},
  onUpdateUserData,
  onNavigate,
  onLogout,
  onBack // 明確聲明 onBack prop
}) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(userData.name || 'Alex Taylor');
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

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
      Alert.alert('錯誤', '名字不能為空');
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
    Alert.alert('成功', '個人資料已更新');
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
        Alert.alert('需要權限', '需要相簿權限才能上傳頭像！');
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

        Alert.alert('成功', '頭像已更新');
      }
    } catch (error) {
      console.error('選擇圖片錯誤:', error);
      Alert.alert('錯誤', '無法更新頭像');
    }
  };

  // 處理編輯按鈕點擊
  const handleEditPress = () => {
    Alert.alert(
      'Edit Profile',
      'Choose what you want to edit',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Change Name',
          onPress: () => setIsEditingName(true)
        },
        {
          text: 'Change Avatar',
          onPress: handleAvatarUpload
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Back Button */}
      <View style={styles.headerNav}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => {
            // 防御性編程：檢查 onBack 函數是否存在
            if (onBack && typeof onBack === 'function') {
              onBack();
            } else {
              // 如果 onBack 不存在，顯示警告並提供替代方案
              Alert.alert(
                '導航錯誤', 
                '返回功能未正確配置。請檢查 App.js 中的 onBack prop 傳遞。',
                [{ text: '確定', style: 'default' }]
              );
              console.warn('ProfilePage: onBack prop is missing or not a function');
            }
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color="#000000" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Profile</Text>
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
                    placeholder="輸入您的名字"
                    autoFocus
                  />
                  <View style={styles.editButtons}>
                    <TouchableOpacity 
                      style={styles.saveButton} 
                      onPress={handleSaveName}
                    >
                      <Text style={styles.saveButtonText}>儲存</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.cancelButton} 
                      onPress={() => setIsEditingName(false)}
                    >
                      <Text style={styles.cancelButtonText}>取消</Text>
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
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => setShowLanguageModal(true)}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <MaterialIcons name="language" size={24} color="#000000" />
              <Text style={styles.settingText}>Language Settings</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666666" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => setShowPrivacyModal(true)}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <MaterialIcons name="security" size={24} color="#000000" />
              <Text style={styles.settingText}>Privacy & Security</Text>
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
              <Text style={styles.settingText}>Help & Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666666" />
          </TouchableOpacity>
        </View>

        {/* Get Reminders Now Card */}
        <View style={styles.reminderCard}>
          <Text style={styles.reminderTitle}>Get reminders now!</Text>
          <Text style={styles.reminderSubtitle}>
            Set reminders for your payments today!
          </Text>
          <TouchableOpacity 
            style={styles.shareButton}
            onPress={() => Alert.alert('Share App', 'Share app functionality would be implemented here')}
            activeOpacity={0.8}
          >
            <Text style={styles.shareButtonText}>Share app</Text>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={() => {
            Alert.alert(
              'Log Out',
              'Are you sure you want to log out?',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Log Out', 
                  style: 'destructive',
                  onPress: onLogout 
                }
              ]
            );
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Language Settings</Text>
            
            <TouchableOpacity style={styles.languageOption}>
              <Text style={styles.languageText}>English</Text>
              <MaterialIcons name="check" size={20} color="#4CAF50" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.languageOption}>
              <Text style={styles.languageText}>繁體中文</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowLanguageModal(false)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
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
            <Text style={styles.modalTitle}>Privacy & Security</Text>
            <ScrollView style={styles.modalScroll}>
              <Text style={styles.privacyText}>
                Your privacy is important to us. This app stores your credit card information locally on your device and does not transmit sensitive financial data to external servers.
                {'\n\n'}
                We collect only the minimum information necessary to provide our services:
                {'\n'}• Credit card names and due dates (no card numbers)
                {'\n'}• Payment reminder preferences
                {'\n'}• Usage statistics for app improvement
                {'\n\n'}
                Your data is encrypted and stored securely on your device. We do not share your personal information with third parties without your explicit consent.
              </Text>
            </ScrollView>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowPrivacyModal(false)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
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
            <Text style={styles.modalTitle}>Help & Support</Text>
            <ScrollView style={styles.modalScroll}>
              <Text style={styles.helpText}>
                <Text style={styles.helpSectionTitle}>Frequently Asked Questions{'\n\n'}</Text>
                
                <Text style={styles.helpQuestion}>How do I add a credit card?{'\n'}</Text>
                <Text style={styles.helpAnswer}>Tap the '+' button on the home screen and fill in your card details. We only store the card name, bank, and due date - never your card number.{'\n\n'}</Text>
                
                <Text style={styles.helpQuestion}>How do notifications work?{'\n'}</Text>
                <Text style={styles.helpAnswer}>The app sends local notifications based on your settings. You can customize reminder times in the Notifications section.{'\n\n'}</Text>
                
                <Text style={styles.helpQuestion}>Is my data secure?{'\n'}</Text>
                <Text style={styles.helpAnswer}>Yes, all data is stored locally on your device and encrypted. We never store sensitive financial information.{'\n\n'}</Text>
                
                <Text style={styles.helpQuestion}>Need more help?{'\n'}</Text>
                <Text style={styles.helpAnswer}>Contact our support team at support@cardreminder.app for additional assistance.</Text>
              </Text>
            </ScrollView>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowHelpModal(false)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5', // Light gray background like in image
  },
  headerNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 30, // Raised to 30px as requested
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
    paddingTop: 20, // 減少上方間距，因為已有導航 header
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
  reminderCard: {
    backgroundColor: '#2C2C2C', // Dark background like in image
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
    backgroundColor: '#2C2C2C', // Dark background like in image
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
  languageOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  languageText: {
    fontSize: 16,
    color: '#000000',
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
  helpSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  helpQuestion: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2196F3',
  },
  helpAnswer: {
    fontSize: 14,
    color: '#333333',
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
});