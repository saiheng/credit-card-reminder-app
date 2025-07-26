// components/StatsDropdown.js - 統計功能下拉選單
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal
} from 'react-native';

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
            <Text style={styles.optionIcon}>📊</Text>
            <Text style={styles.optionText}>Payment History</Text>
          </TouchableOpacity>
          
          <View style={styles.separator} />
          
          <TouchableOpacity 
            style={styles.option}
            onPress={handleAchievementsPress}
            activeOpacity={0.8}
          >
            <Text style={styles.optionIcon}>🏆</Text>
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
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    overflow: 'hidden',
    minWidth: 200,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  optionIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  optionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  separator: {
    height: 1,
    backgroundColor: '#333333',
    marginHorizontal: 20,
  },
});