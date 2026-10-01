import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { authenticateBiometrics } from '../services/biometricService';

interface BiometricLockOverlayProps {
  visible: boolean;
  onUnlockSuccess: () => void;
}

export const BiometricLockOverlay: React.FC<BiometricLockOverlayProps> = ({
  visible,
  onUnlockSuccess,
}) => {
  const handleAuthenticate = async () => {
    const success = await authenticateBiometrics('Unlock Sift to view confidential receipts & documents');
    if (success) {
      onUnlockSuccess();
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent={false}>
      <View style={styles.container}>
        <View style={styles.iconBox}>
          <Ionicons name="lock-closed" size={56} color="#6366f1" />
        </View>

        <Text style={styles.title}>Sift is Locked</Text>
        <Text style={styles.subtitle}>
          Biometric App Lock is active. Verify your identity to access your private receipts, medical directives, and financial records.
        </Text>

        <TouchableOpacity style={styles.unlockBtn} onPress={handleAuthenticate} activeOpacity={0.8}>
          <Ionicons name="scan-outline" size={24} color="#ffffff" style={{ marginRight: 8 }} />
          <Text style={styles.unlockBtnText}>Unlock with Face ID / Touch ID</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d16',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  iconBox: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#1e1b4b',
    borderColor: '#6366f1',
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    color: '#f8fafc',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 36,
  },
  unlockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366f1',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    justifyContent: 'center',
  },
  unlockBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
