// components/AddCardPage.js - 專業UI重新設計版本
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
import { Ionicons } from '@expo/vector-icons';

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

export default function AddCardPage({ onAddCard, onBack }) {
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [dueDay, setDueDay] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [errors, setErrors] = useState({});

  const formatCardNumber = (text) => {
    // 移除所有非數字字符
    const cleaned = text.replace(/\D/g, '');
    
    // 每4位數字加一個空格
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    
    return formatted;
  };

  const validateForm = () => {
    const newErrors = {};

    if (!cardNumber.trim()) {
      newErrors.cardNumber = 'Card number is required';
    } else if (cardNumber.replace(/\s/g, '').length < 16) {
      newErrors.cardNumber = 'Invalid card number';
    }

    if (!cardName.trim()) {
      newErrors.cardName = 'Card name is required';
    }

    if (!dueDay.trim()) {
      newErrors.dueDay = 'Due date is required';
    } else {
      const day = parseInt(dueDay);
      if (isNaN(day) || day < 1 || day > 31) {
        newErrors.dueDay = 'Please enter a valid day (1-31)';
      }
    }

    if (!selectedBank) {
      newErrors.bank = 'Please select an issuing bank';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      const selectedBankInfo = HONG_KONG_BANKS.find(bank => bank.value === selectedBank);
      
      const newCard = {
        number: cardNumber.replace(/\s/g, ''), // 儲存時移除空格
        name: cardName.trim(),
        bank: selectedBankInfo?.label || 'Other Bank',
        dueDay: dueDay.trim(),
        color: selectedBankInfo?.color || '#666666',
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => onBack('MyCards')}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.title}>Add Card</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          {/* Card Number */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Card Number</Text>
            <TextInput
              style={[styles.input, errors.cardNumber && styles.inputError]}
              placeholder="1234 5678 9012 3456"
              placeholderTextColor="#999999"
              value={cardNumber}
              onChangeText={(text) => {
                setCardNumber(formatCardNumber(text));
                clearError('cardNumber');
              }}
              keyboardType="numeric"
              maxLength={19} // 16數字 + 3空格
            />
            {errors.cardNumber && (
              <Text style={styles.errorText}>{errors.cardNumber}</Text>
            )}
          </View>

          {/* Card Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Card Name</Text>
            <TextInput
              style={[styles.input, errors.cardName && styles.inputError]}
              placeholder="e.g., Visa Signature, Enjoy Card"
              placeholderTextColor="#999999"
              value={cardName}
              onChangeText={(text) => {
                setCardName(text);
                clearError('cardName');
              }}
            />
            {errors.cardName && (
              <Text style={styles.errorText}>{errors.cardName}</Text>
            )}
          </View>

          {/* Due Date */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Due Date</Text>
            <View style={styles.dueDateContainer}>
              <TextInput
                style={[styles.dueDateInput, errors.dueDay && styles.inputError]}
                placeholder="DD"
                placeholderTextColor="#999999"
                value={dueDay}
                onChangeText={(text) => {
                  setDueDay(text);
                  clearError('dueDay');
                }}
                keyboardType="numeric"
                maxLength={2}
              />
              <Text style={styles.dueDateText}>of each month</Text>
            </View>
            {errors.dueDay && (
              <Text style={styles.errorText}>{errors.dueDay}</Text>
            )}
          </View>

          {/* Issuing Bank */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Issuing Bank</Text>
            <View style={styles.banksGrid}>
              {HONG_KONG_BANKS.map((bank, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.bankOption,
                    selectedBank === bank.value && styles.bankOptionSelected
                  ]}
                  onPress={() => {
                    setSelectedBank(bank.value);
                    clearError('bank');
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.bankOptionText,
                    selectedBank === bank.value && styles.bankOptionTextSelected
                  ]}>
                    {bank.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.bank && (
              <Text style={styles.errorText}>{errors.bank}</Text>
            )}
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSubmit}
            activeOpacity={0.8}
          >
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  title: {
    flex: 1,
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
  formContainer: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000000',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  inputError: {
    borderColor: '#F44336',
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dueDateInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000000',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    width: 80,
    textAlign: 'center',
  },
  dueDateText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#666666',
  },
  banksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  bankOption: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    margin: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  bankOptionSelected: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  bankOptionText: {
    fontSize: 14,
    color: '#333333',
  },
  bankOptionTextSelected: {
    color: '#FFFFFF',
  },
  errorText: {
    color: '#F44336',
    fontSize: 12,
    marginTop: 4,
  },
  saveButton: {
    backgroundColor: '#000000',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});