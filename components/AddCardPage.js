// components/AddCardPage.js - 修復版，調整頭部位置避免動態島遮擋
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
  Alert
} from 'react-native';

const HONG_KONG_BANKS = [
  { value: 'hsbc', label: 'HSBC', color: '#db0011' },
  { value: 'hangseng', label: 'Hang Seng Bank', color: '#0066cc' },
  { value: 'boc', label: 'Bank of China (Hong Kong)', color: '#8B0000' },
  { value: 'icbc', label: 'ICBC (Asia)', color: '#c41e3a' },
  { value: 'scb', label: 'Standard Chartered', color: '#0f7ec6' },
  { value: 'dbs', label: 'DBS Bank', color: '#e31837' },
  { value: 'citibank', label: 'Citibank', color: '#1976d2' },
  { value: 'ccb', label: 'China Construction Bank (Asia)', color: '#003d7a' },
  { value: 'bea', label: 'Bank of East Asia', color: '#0066cc' },
  { value: 'other', label: 'Other Bank', color: '#666666' }
];

const CARD_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'
];

export default function AddCardPage({ onAddCard, onBack }) {
  const [selectedBank, setSelectedBank] = useState('');
  const [cardName, setCardName] = useState('');
  const [dueDay, setDueDay] = useState('');
  const [selectedColor, setSelectedColor] = useState(CARD_COLORS[0]);
  const [showBankPicker, setShowBankPicker] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!selectedBank) {
      newErrors.bank = 'Please select a bank';
    }

    if (!cardName.trim()) {
      newErrors.cardName = 'Please enter card name';
    }

    if (!dueDay.trim()) {
      newErrors.dueDay = 'Please enter due day';
    } else {
      const day = parseInt(dueDay);
      if (isNaN(day) || day < 1 || day > 31) {
        newErrors.dueDay = 'Please enter a valid day (1-31)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      const selectedBankInfo = HONG_KONG_BANKS.find(bank => bank.value === selectedBank);
      
      const newCard = {
        name: cardName.trim(),
        bank: selectedBankInfo?.label || 'Other Bank',
        dueDay: dueDay.trim(),
        color: selectedColor,
        notificationEnabled: true
      };

      onAddCard(newCard);
    }
  };

  const clearError = (field) => {
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const getBankColor = (bankValue) => {
    const bank = HONG_KONG_BANKS.find(b => b.value === bankValue);
    return bank ? bank.color : '#666666';
  };

  const selectedBankInfo = HONG_KONG_BANKS.find(bank => bank.value === selectedBank);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Add New Card</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Bank Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Bank</Text>
          <TouchableOpacity
            style={[
              styles.bankSelector,
              errors.bank && styles.errorInput
            ]}
            onPress={() => setShowBankPicker(!showBankPicker)}
            activeOpacity={0.8}
          >
            <Text style={[
              styles.bankSelectorText,
              selectedBank ? styles.selectedBankText : styles.placeholderText
            ]}>
              {selectedBankInfo ? selectedBankInfo.label : 'Choose your bank'}
            </Text>
            <Text style={styles.dropdownIcon}>▼</Text>
          </TouchableOpacity>
          {errors.bank && <Text style={styles.errorText}>{errors.bank}</Text>}

          {/* Bank Options */}
          {showBankPicker && (
            <View style={styles.bankOptions}>
              {HONG_KONG_BANKS.map((bank, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.bankOption}
                  onPress={() => {
                    setSelectedBank(bank.value);
                    setShowBankPicker(false);
                    clearError('bank');
                  }}
                  activeOpacity={0.8}
                >
                  <View style={[styles.bankIndicator, { backgroundColor: bank.color }]} />
                  <Text style={styles.bankOptionText}>{bank.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Card Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Card Details</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Card Name</Text>
            <TextInput
              style={[
                styles.textInput,
                errors.cardName && styles.errorInput
              ]}
              placeholder="e.g., HSBC Red Card"
              placeholderTextColor="#666666"
              value={cardName}
              onChangeText={(text) => {
                setCardName(text);
                clearError('cardName');
              }}
            />
            {errors.cardName && <Text style={styles.errorText}>{errors.cardName}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Payment Due Day</Text>
            <TextInput
              style={[
                styles.textInput,
                errors.dueDay && styles.errorInput
              ]}
              placeholder="Day of month (1-31)"
              placeholderTextColor="#666666"
              value={dueDay}
              onChangeText={(text) => {
                setDueDay(text);
                clearError('dueDay');
              }}
              keyboardType="numeric"
              maxLength={2}
            />
            {errors.dueDay && <Text style={styles.errorText}>{errors.dueDay}</Text>}
            <Text style={styles.helperText}>
              Enter the day of the month when payment is due (e.g., 15 for 15th of each month)
            </Text>
          </View>
        </View>

        {/* Color Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Card Color</Text>
          <View style={styles.colorGrid}>
            {CARD_COLORS.map((color, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.colorOption,
                  { backgroundColor: color },
                  selectedColor === color && styles.selectedColor
                ]}
                onPress={() => setSelectedColor(color)}
                activeOpacity={0.8}
              >
                {selectedColor === color && (
                  <Text style={styles.colorCheckmark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Card Preview */}
        {(cardName || selectedBank) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preview</Text>
            <View style={[
              styles.cardPreview,
              { 
                backgroundColor: selectedColor,
                borderLeftColor: getBankColor(selectedBank)
              }
            ]}>
              <View style={styles.previewContent}>
                <Text style={styles.previewCardName}>
                  {cardName || 'Card Name'}
                </Text>
                <Text style={styles.previewBankName}>
                  {selectedBankInfo?.label || 'Bank Name'}
                </Text>
                <Text style={styles.previewDueDate}>
                  Due: {dueDay || 'XX'}th of each month
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Submit Button */}
        <View style={styles.submitSection}>
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            activeOpacity={0.8}
          >
            <Text style={styles.submitButtonText}>Add Credit Card</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
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
    paddingTop: 60, // 調整位置避免動態島遮擋
    paddingBottom: 16,
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
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  bankSelector: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  bankSelectorText: {
    fontSize: 16,
    flex: 1,
  },
  selectedBankText: {
    color: '#FFFFFF',
  },
  placeholderText: {
    color: '#666666',
  },
  dropdownIcon: {
    color: '#666666',
    fontSize: 12,
  },
  bankOptions: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#333333',
    maxHeight: 200,
  },
  bankOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  bankIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  bankOptionText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    color: '#FFFFFF',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  helperText: {
    color: '#999999',
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  selectedColor: {
    borderColor: '#FFFFFF',
  },
  colorCheckmark: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  cardPreview: {
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    minHeight: 120,
    justifyContent: 'center',
  },
  previewContent: {
    flex: 1,
  },
  previewCardName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  previewBankName: {
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 4,
    opacity: 0.9,
  },
  previewDueDate: {
    color: '#FFFFFF',
    fontSize: 12,
    opacity: 0.8,
  },
  submitSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  errorInput: {
    borderColor: '#FF3B30',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 4,
  },
  bottomSpacing: {
    height: 20,
  },
});