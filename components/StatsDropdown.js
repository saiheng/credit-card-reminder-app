// components/StatsDropdown.js - 改進版，使用專業圖標
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function StatsDropdown({ 
  visible, 
  onClose, 
  onNavigateToHistory, 
  onNavigateToAchievements 
}) {
  
  const handleHistoryPress = () => {
    onClose();
    if (onNavigateToHistory) {
      onNavigateToHistory();
    }
  };

  const handleAchievementsPress = () => {
    onClose();
    if (onNavigateToAchievements) {
      onNavigateToAchievements();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <View style={styles.dropdown}>
          <TouchableOpacity 
            style={styles.option}
            onPress={handleHistoryPress}
            activeOpacity={0.8}
          >
            <MaterialIcons name="history" size={20} color="#007AFF" />
            <Text style={styles.optionText}>Payment History</Text>
          </TouchableOpacity>
          
          <View style={styles.separator} />
          
          <TouchableOpacity 
            style={styles.option}
            onPress={handleAchievementsPress}
            activeOpacity={0.8}
          >
            <MaterialIcons name="emoji-events" size={20} color="#FF9800" />
            <Text style={styles.optionText}>Achievements</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    paddingBottom: 120, // 距離底部導航的距離
    paddingRight: 20,
  },
  dropdown: {
    backgroundColor: '#FFFFFF', // 改為白色背景，與新設計一致
    borderRadius: 16,
    overflow: 'hidden',
    minWidth: 200,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  optionText: {
    color: '#333333', // 改為深色文字，與白色背景搭配
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
  separator: {
    height: 1,
    backgroundColor: '#F0F0F0', // 更柔和的分隔線
    marginHorizontal: 20,
  },
});