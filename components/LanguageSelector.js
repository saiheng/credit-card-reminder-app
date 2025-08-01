// components/LanguageSelector.js - 完整的語言選擇組件
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal
} from 'react-native';

export default function LanguageSelector({ 
  visible, 
  onClose, 
  currentLanguage = 'en',
  onLanguageChange 
}) {
  
  const languages = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'zh-TW', name: 'Traditional Chinese', nativeName: '繁體中文' }
  ];

  const handleLanguageSelect = (languageCode) => {
    if (onLanguageChange) {
      onLanguageChange(languageCode);
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Select Language</Text>
          
          {languages.map((language, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.languageOption,
                currentLanguage === language.code && styles.selectedOption
              ]}
              onPress={() => handleLanguageSelect(language.code)}
              activeOpacity={0.8}
            >
              <View style={styles.languageInfo}>
                <Text style={[
                  styles.languageName,
                  currentLanguage === language.code && styles.selectedText
                ]}>
                  {language.name}
                </Text>
                <Text style={[
                  styles.nativeName,
                  currentLanguage === language.code && styles.selectedText
                ]}>
                  {language.nativeName}
                </Text>
              </View>
              {currentLanguage === language.code && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={onClose}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modal: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    paddingVertical: 24,
    width: '100%',
    maxWidth: 320,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  languageOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  selectedOption: {
    backgroundColor: '#007AFF20',
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  nativeName: {
    color: '#999999',
    fontSize: 14,
  },
  selectedText: {
    color: '#007AFF',
  },
  checkmark: {
    color: '#007AFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: {
    marginTop: 16,
    marginHorizontal: 24,
    backgroundColor: '#666666',
    borderRadius: 12,
    paddingVertical: 12,
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});