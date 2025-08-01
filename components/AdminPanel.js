// components/AdminPanel.js - 🔥 信用卡資料庫管理工具
import React, { useState, useEffect } from 'react';
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
import { MaterialIcons } from '@expo/vector-icons';
import { creditCardService } from '../firebase';

export default function AdminPanel({ 
  onBack, 
  getText, 
  currentLanguage = 'zh-TW' 
}) {
  // 狀態管理
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  
  // 新增/編輯卡片的表單狀態
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    bank: '',
    category: [],
    cashback: '',
    description: '',
    conditions: '',
    nameVariants: [],
    searchKeywords: []
  });

  // 載入所有卡片資料
  const loadCards = async () => {
    try {
      setLoading(true);
      const allCards = await creditCardService.getAllCards();
      setCards(allCards);
      console.log('🎉 管理面板載入卡片數量:', allCards.length);
    } catch (error) {
      console.error('❌ 載入卡片失敗:', error);
      Alert.alert('錯誤', '載入卡片資料失敗');
    } finally {
      setLoading(false);
    }
  };

  // 組件載入時執行
  useEffect(() => {
    loadCards();
  }, []);

  // 🔥 新增卡片功能
  const handleAddCard = async () => {
    try {
      if (!formData.name || !formData.bank) {
        Alert.alert('提示', '請填寫卡片名稱和銀行名稱');
        return;
      }

      // 準備卡片資料
      const newCardData = {
        ...formData,
        // 如果沒有設定ID，自動生成
        id: formData.id || `${formData.bank.toLowerCase()}_${formData.name.toLowerCase()}`.replace(/\s+/g, '_'),
        // 確保分類是陣列格式
        category: typeof formData.category === 'string' 
          ? formData.category.split(',').map(cat => cat.trim()) 
          : formData.category,
        // 確保變體和關鍵字是陣列格式
        nameVariants: typeof formData.nameVariants === 'string'
          ? formData.nameVariants.split(',').map(variant => variant.trim())
          : formData.nameVariants,
        searchKeywords: typeof formData.searchKeywords === 'string'
          ? formData.searchKeywords.split(',').map(keyword => keyword.trim())
          : formData.searchKeywords
      };

      console.log('🚀 準備新增卡片:', newCardData);
      
      const success = await creditCardService.addCard(newCardData);
      
      if (success) {
        Alert.alert('成功', `已成功新增 ${formData.name}`);
        setShowAddModal(false);
        resetForm();
        // 重新載入資料以顯示最新狀態
        await loadCards();
      } else {
        Alert.alert('失敗', '新增卡片失敗，請重試');
      }
    } catch (error) {
      console.error('❌ 新增卡片錯誤:', error);
      Alert.alert('錯誤', '新增過程中發生錯誤');
    }
  };

  // 🔥 編輯卡片功能
  const handleEditCard = async () => {
    try {
      if (!selectedCard || !formData.name || !formData.bank) {
        Alert.alert('提示', '請填寫完整資料');
        return;
      }

      // 準備更新資料
      const updateData = {
        name: formData.name,
        bank: formData.bank,
        category: typeof formData.category === 'string' 
          ? formData.category.split(',').map(cat => cat.trim()) 
          : formData.category,
        cashback: formData.cashback,
        description: formData.description,
        conditions: formData.conditions,
        nameVariants: typeof formData.nameVariants === 'string'
          ? formData.nameVariants.split(',').map(variant => variant.trim())
          : formData.nameVariants,
        searchKeywords: typeof formData.searchKeywords === 'string'
          ? formData.searchKeywords.split(',').map(keyword => keyword.trim())
          : formData.searchKeywords
      };

      console.log('🔄 準備更新卡片:', selectedCard.id, updateData);
      
      const success = await creditCardService.updateCard(selectedCard.id, updateData);
      
      if (success) {
        Alert.alert('成功', `已成功更新 ${formData.name}`);
        setShowEditModal(false);
        setSelectedCard(null);
        resetForm();
        // 重新載入資料
        await loadCards();
      } else {
        Alert.alert('失敗', '更新卡片失敗，請重試');
      }
    } catch (error) {
      console.error('❌ 更新卡片錯誤:', error);
      Alert.alert('錯誤', '更新過程中發生錯誤');
    }
  };

  // 🔥 刪除卡片功能
  const handleDeleteCard = async (card) => {
    Alert.alert(
      '確認刪除',
      `確定要刪除 ${card.name} 嗎？此操作無法復原。`,
      [
        { text: '取消', style: 'cancel' },
        { 
          text: '刪除', 
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🗑️ 準備刪除卡片:', card.id);
              
              const success = await creditCardService.deleteCard(card.id);
              
              if (success) {
                Alert.alert('成功', `已成功刪除 ${card.name}`);
                // 重新載入資料
                await loadCards();
              } else {
                Alert.alert('失敗', '刪除卡片失敗，請重試');
              }
            } catch (error) {
              console.error('❌ 刪除卡片錯誤:', error);
              Alert.alert('錯誤', '刪除過程中發生錯誤');
            }
          }
        }
      ]
    );
  };

  // 重置表單
  const resetForm = () => {
    setFormData({
      id: '',
      name: '',
      bank: '',
      category: [],
      cashback: '',
      description: '',
      conditions: '',
      nameVariants: [],
      searchKeywords: []
    });
  };

  // 開始編輯卡片
  const startEditCard = (card) => {
    setSelectedCard(card);
    setFormData({
      id: card.id,
      name: card.name,
      bank: card.bank,
      category: Array.isArray(card.category) ? card.category.join(', ') : card.category,
      cashback: card.cashback,
      description: card.description,
      conditions: card.conditions,
      nameVariants: Array.isArray(card.nameVariants) ? card.nameVariants.join(', ') : card.nameVariants,
      searchKeywords: Array.isArray(card.searchKeywords) ? card.searchKeywords.join(', ') : card.searchKeywords
    });
    setShowEditModal(true);
  };

  // 渲染卡片項目
  const renderCardItem = (card, index) => (
    <View key={card.id} style={styles.cardItem}>
      <View style={styles.cardHeader}>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>{card.name}</Text>
          <Text style={styles.bankName}>{card.bank}</Text>
          <Text style={styles.cashbackText}>回贈: {card.cashback}</Text>
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => startEditCard(card)}
            activeOpacity={0.7}
          >
            <MaterialIcons name="edit" size={20} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteCard(card)}
            activeOpacity={0.7}
          >
            <MaterialIcons name="delete" size={20} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.cardDescription}>{card.description}</Text>
    </View>
  );

  // 渲染表單模態框
  const renderFormModal = (isEdit = false) => (
    <Modal
      visible={isEdit ? showEditModal : showAddModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => {
        if (isEdit) {
          setShowEditModal(false);
          setSelectedCard(null);
        } else {
          setShowAddModal(false);
        }
        resetForm();
      }}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView style={styles.formContainer}>
            <Text style={styles.modalTitle}>
              {isEdit ? '編輯信用卡' : '新增信用卡'}
            </Text>
            
            <Text style={styles.fieldLabel}>卡片名稱 *</Text>
            <TextInput
              style={styles.textInput}
              value={formData.name}
              onChangeText={(text) => setFormData(prev => ({...prev, name: text}))}
              placeholder="例如：恒生enJoy卡"
            />
            
            <Text style={styles.fieldLabel}>銀行名稱 *</Text>
            <TextInput
              style={styles.textInput}
              value={formData.bank}
              onChangeText={(text) => setFormData(prev => ({...prev, bank: text}))}
              placeholder="例如：恒生銀行"
            />
            
            <Text style={styles.fieldLabel}>分類（用逗號分隔）</Text>
            <TextInput
              style={styles.textInput}
              value={formData.category}
              onChangeText={(text) => setFormData(prev => ({...prev, category: text}))}
              placeholder="例如：青年學生, 超市購物"
            />
            
            <Text style={styles.fieldLabel}>回贈率</Text>
            <TextInput
              style={styles.textInput}
              value={formData.cashback}
              onChangeText={(text) => setFormData(prev => ({...prev, cashback: text}))}
              placeholder="例如：2%"
            />
            
            <Text style={styles.fieldLabel}>描述</Text>
            <TextInput
              style={[styles.textInput, styles.multilineInput]}
              value={formData.description}
              onChangeText={(text) => setFormData(prev => ({...prev, description: text}))}
              placeholder="例如：惠康每月3/13/23日92折"
              multiline
              numberOfLines={3}
            />
            
            <Text style={styles.fieldLabel}>條件</Text>
            <TextInput
              style={styles.textInput}
              value={formData.conditions}
              onChangeText={(text) => setFormData(prev => ({...prev, conditions: text}))}
              placeholder="例如：無上限"
            />
            
            <Text style={styles.fieldLabel}>名稱變體（用逗號分隔）</Text>
            <TextInput
              style={styles.textInput}
              value={formData.nameVariants}
              onChangeText={(text) => setFormData(prev => ({...prev, nameVariants: text}))}
              placeholder="例如：enjoy, enjoy card, 恒生enjoy"
            />
            
            <Text style={styles.fieldLabel}>搜索關鍵字（用逗號分隔）</Text>
            <TextInput
              style={styles.textInput}
              value={formData.searchKeywords}
              onChangeText={(text) => setFormData(prev => ({...prev, searchKeywords: text}))}
              placeholder="例如：恒生, hangseng, enjoy, 學生"
            />
          </ScrollView>
          
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                if (isEdit) {
                  setShowEditModal(false);
                  setSelectedCard(null);
                } else {
                  setShowAddModal(false);
                }
                resetForm();
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={isEdit ? handleEditCard : handleAddCard}
              activeOpacity={0.7}
            >
              <Text style={styles.saveButtonText}>
                {isEdit ? '更新' : '新增'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* 頭部 */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.7}
        >
          <MaterialIcons name="arrow-back" size={24} color="#333333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>信用卡資料管理</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            resetForm();
            setShowAddModal(true);
          }}
          activeOpacity={0.7}
        >
          <MaterialIcons name="add" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* 統計信息 */}
      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>
          總共 {cards.length} 張信用卡
        </Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={loadCards}
          activeOpacity={0.7}
        >
          <MaterialIcons name="refresh" size={20} color="#007AFF" />
          <Text style={styles.refreshText}>重新載入</Text>
        </TouchableOpacity>
      </View>

      {/* 卡片列表 */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>載入中...</Text>
        </View>
      ) : (
        <ScrollView style={styles.cardsList}>
          {cards.map(renderCardItem)}
        </ScrollView>
      )}

      {/* 新增模態框 */}
      {renderFormModal(false)}
      
      {/* 編輯模態框 */}
      {renderFormModal(true)}
    </SafeAreaView>
  );
}

// 樣式定義
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    textAlign: 'center',
  },
  addButton: {
    padding: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#F8F8F8',
  },
  statsText: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  refreshText: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 4,
  },
  cardsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  cardItem: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  bankName: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  cashbackText: {
    fontSize: 14,
    color: '#F59E0B',
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    padding: 8,
    backgroundColor: '#E3F2FD',
    borderRadius: 6,
  },
  deleteButton: {
    padding: 8,
    backgroundColor: '#FFEBEE',
    borderRadius: 6,
  },
  cardDescription: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 18,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
  },
  // 模態框樣式
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    padding: 20,
  },
  formContainer: {
    maxHeight: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 8,
    marginTop: 12,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333333',
    backgroundColor: '#FAFAFA',
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '500',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});