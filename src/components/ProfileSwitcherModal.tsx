import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProfileId } from '../models/types';
import { ALL_PROFILES, PROFILE_CONFIGS } from '../config/profiles';

interface ProfileSwitcherModalProps {
  visible: boolean;
  activeProfile: ProfileId;
  onSelectProfile: (profileId: ProfileId) => void;
  onClose: () => void;
}

export const ProfileSwitcherModal: React.FC<ProfileSwitcherModalProps> = ({
  visible,
  activeProfile,
  onSelectProfile,
  onClose,
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              <View style={styles.header}>
                <Text style={styles.title}>Switch Sift Profile</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                  <Ionicons name="close" size={22} color="#94a3b8" />
                </TouchableOpacity>
              </View>

              <Text style={styles.description}>
                Select an active profile to filter dashboard items, update AI extraction rules, and adapt theme colors.
              </Text>

              <View style={styles.profileList}>
                {ALL_PROFILES.map((profileId) => {
                  const config = PROFILE_CONFIGS[profileId];
                  const isActive = activeProfile === profileId;

                  return (
                    <TouchableOpacity
                      key={profileId}
                      activeOpacity={0.8}
                      onPress={() => {
                        onSelectProfile(profileId);
                        onClose();
                      }}
                      style={[
                        styles.profileItem,
                        isActive && { backgroundColor: config.accentColor + '18', borderColor: config.accentColor },
                      ]}
                    >
                      <View style={[styles.iconBox, { backgroundColor: config.accentColor + '25' }]}>
                        <Ionicons name={config.icon as any} size={20} color={config.accentColor} />
                      </View>
                      <View style={styles.textCol}>
                        <Text style={styles.profileName}>{config.name}</Text>
                        <Text style={styles.profileSub} numberOfLines={1}>
                          {config.subtitle}
                        </Text>
                      </View>
                      {isActive && <Ionicons name="checkmark-circle" size={22} color={config.accentColor} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 4,
  },
  description: {
    color: '#94a3b8',
    fontSize: 13,
    marginBottom: 16,
    lineHeight: 18,
  },
  profileList: {
    gap: 10,
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#334155',
    gap: 12,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textCol: {
    flex: 1,
  },
  profileName: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  profileSub: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 2,
  },
});
