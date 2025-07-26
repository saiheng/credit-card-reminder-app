// components/ProfilePage.js - 完全重建，修復語法錯誤
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
  Modal
} from 'react-native';
import LanguageSelector from './LanguageSelector';

export default function ProfilePage({ 
  userData = {}, 
  onBack, 
  onUpdateUserData,
  onNavigate 
}) {
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(userData.name || '');
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);

  const handleSaveName = () => {
    if (newName.trim().length === 0) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }
    
    if (onUpdateUserData) {
      onUpdateUserData({
        ...userData,
        name: newName.trim()
      });
    }
    setEditingName(false);
    Alert.alert('Success', 'Name updated successfully');
  };

  const handleLanguageChange = (languageCode) => {
    if (onUpdateUserData) {
      onUpdateUserData({
        ...userData,
        language: languageCode
      });
    }
    Alert.alert('Success', 'Language updated successfully');
  };

  const handleLogout = () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: () => {
            if (onUpdateUserData) {
              onUpdateUserData({ ...userData, isLoggedIn: false });
            }
            if (onNavigate) {
              onNavigate('Login');
            }
          }
        }
      ]
    );
  };

  const PrivacyContent = () => (
    <Modal
      visible={showPrivacyModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowPrivacyModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.modalTitle}>Privacy Policy & Security Terms</Text>
            
            <Text style={styles.sectionHeader}>Data Collection & Usage</Text>
            <Text style={styles.policyText}>
              • We only collect basic information that you voluntarily provide (name, email){'\n'}
              • All credit card data is stored locally on your device only{'\n'}
              • We do not store your actual credit card numbers or sensitive financial information{'\n'}
              • The app does not transmit your personal data to external servers
            </Text>

            <Text style={styles.sectionHeader}>Data Security</Text>
            <Text style={styles.policyText}>
              • All data is protected using encryption technology{'\n'}
              • We recommend updating the app regularly for the latest security features{'\n'}
              • Do not leave your device unattended in public places while using the app{'\n'}
              • Contact us immediately if you notice any unusual activity
            </Text>

            <Text style={styles.sectionHeader}>Your Rights</Text>
            <Text style={styles.policyText}>
              • You can view, modify, or delete your personal data at any time{'\n'}
              • You can request a copy of your data{'\n'}
              • You have the right to withdraw consent for data processing{'\n'}
              • Uninstalling the app will automatically delete all locally stored data
            </Text>

            <Text style={styles.lastUpdated}>
              Last updated: July 2025
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
  );

  const HelpContent = () => (
    <Modal
      visible={showHelpModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowHelpModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.modalTitle}>Help & Support</Text>
            
            <Text style={styles.sectionHeader}>Frequently Asked Questions</Text>
            <Text style={styles.helpQuestion}>Q: How do I add a credit card?</Text>
            <Text style={styles.helpAnswer}>
              A: Click the "+" button on the main page, fill in your credit card information and select the payment due date.
            </Text>

            <Text style={styles.helpQuestion}>Q: How do I set notification times?</Text>
            <Text style={styles.helpAnswer}>
              A: Go to the "Notifications" page where you can customize reminder times for each card.
            </Text>

            <Text style={styles.helpQuestion}>Q: What if I forget to mark a payment?</Text>
            <Text style={styles.helpAnswer}>
              A: You can click the "Mark as Paid" button in the credit card list, or add it in the payment history.
            </Text>

            <Text style={styles.helpQuestion}>Q: How do I backup my data?</Text>
            <Text style={styles.helpAnswer}>
              A: Currently the app stores data locally on your device. We recommend taking screenshots of important information as backup.
            </Text>

            <Text style={styles.sectionHeader}>Contact Us</Text>
            <Text style={styles.helpAnswer}>
              • Email: support@cardreminder.app{'\n'}
              • Service Hours: Monday-Friday 9:00-18:00{'\n'}
              • We will respond to your inquiries within 24 hours
            </Text>

            <Text style={styles.sectionHeader}>App Version</Text>
            <Text style={styles.helpAnswer}>
              Version 1.0.0{'\n'}
              Last updated: July 2025
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
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Profile</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Info */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatar}>👤</Text>
          </View>
          
          <View style={styles.nameSection}>
            {editingName ? (
              <View style={styles.editNameContainer}>
                <TextInput
                  style={styles.nameInput}
                  value={newName}
                  onChangeText={setNewName}
                  placeholder="Enter your name"
                  placeholderTextColor="#999999"
                  autoFocus={true}
                />
                <View style={styles.nameButtons}>
                  <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={() => {
                      setNewName(userData.name || '');
                      setEditingName(false);
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.saveButton}
                    onPress={handleSaveName}
                  >
                    <Text style={styles.saveButtonText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.nameContainer}
                onPress={() => setEditingName(true)}
              >
                <Text style={styles.name}>{userData.name || 'Guest User'}</Text>
                <Text style={styles.editHint}>Tap to edit</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <Text style={styles.email}>{userData.email || 'user@example.com'}</Text>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>🔔</Text>
            <Text style={styles.menuText}>Notification Settings</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => setShowLanguageSelector(true)}
          >
            <Text style={styles.menuIcon}>🌍</Text>
            <Text style={styles.menuText}>Language Settings</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>📊</Text>
            <Text style={styles.menuText}>Usage Statistics</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.menuSection}>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => setShowPrivacyModal(true)}
          >
            <Text style={styles.menuIcon}>🔒</Text>
            <Text style={styles.menuText}>Privacy & Security</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => setShowHelpModal(true)}
          >
            <Text style={styles.menuIcon}>❓</Text>
            <Text style={styles.menuText}>Help & Support</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>⭐</Text>
            <Text style={styles.menuText}>Rate App</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Logout Section */}
        <View style={styles.menuSection}>
          <TouchableOpacity 
            style={[styles.menuItem, styles.logoutItem]}
            onPress={handleLogout}
          >
            <Text style={styles.logoutIcon}>🚪</Text>
            <Text style={styles.logoutText}>Logout</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.versionSection}>
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </View>
      </ScrollView>

      <PrivacyContent />
      <HelpContent />
      
      <LanguageSelector
        visible={showLanguageSelector}
        onClose={() => setShowLanguageSelector(false)}
        currentLanguage={userData.language || 'en'}
        onLanguageChange={handleLanguageChange}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    fontSize: 40,
    color: '#FFFFFF',
  },
  nameSection: {
    alignItems: 'center',
    marginBottom: 8,
  },
  nameContainer: {
    alignItems: 'center',
  },
  name: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  editHint: {
    color: '#007AFF',
    fontSize: 14,
  },
  editNameContainer: {
    alignItems: 'center',
    width: '100%',
  },
  nameInput: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
    minWidth: 200,
  },
  nameButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    backgroundColor: '#666666',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  email: {
    color: '#999999',
    fontSize: 16,
  },
  menuSection: {
    backgroundColor: '#2a2a2a',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 16,
    width: 24,
  },
  menuText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
  },
  menuArrow: {
    color: '#666666',
    fontSize: 20,
  },
  logoutItem: {
    borderBottomWidth: 0,
  },
  logoutIcon: {
    fontSize: 20,
    marginRight: 16,
    width: 24,
  },
  logoutText: {
    flex: 1,
    color: '#FF3B30',
    fontSize: 16,
  },
  versionSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  versionText: {
    color: '#666666',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#2a2a2a',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    marginHorizontal: 20,
    maxHeight: '80%',
    width: '90%',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  sectionHeader: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  policyText: {
    color: '#CCCCCC',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  helpQuestion: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
  },
  helpAnswer: {
    color: '#CCCCCC',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  lastUpdated: {
    color: '#666666',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },
  modalCloseButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 16,
  },
  modalCloseText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});