import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProfileId } from '../models/types';
import { ALL_PROFILES, PROFILE_CONFIGS } from '../config/profiles';
import { updateUserPreferences } from '../database/db';

interface OnboardingProfileScreenProps {
  onComplete: (selectedProfile: ProfileId) => void;
}

export const OnboardingProfileScreen: React.FC<OnboardingProfileScreenProps> = ({ onComplete }) => {
  const [selectedProfile, setSelectedProfile] = useState<ProfileId>('school');

  const handleContinue = async () => {
    await updateUserPreferences({
      activeProfile: selectedProfile,
      onboardingCompleted: true,
    });
    onComplete(selectedProfile);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerContainer}>
          <Text style={styles.badgeText}>⚡ WELCOME TO SIFT</Text>
          <Text style={styles.title}>What paper headaches are you solving today?</Text>
          <Text style={styles.subtitle}>
            Sift tailors its AI document engine, reminder alerts, and database views to match your specific paperwork burden.
          </Text>
        </View>

        <View style={styles.profileList}>
          {ALL_PROFILES.map((profileId) => {
            const config = PROFILE_CONFIGS[profileId];
            const isSelected = selectedProfile === profileId;

            return (
              <TouchableOpacity
                key={profileId}
                activeOpacity={0.8}
                onPress={() => setSelectedProfile(profileId)}
                style={[
                  styles.profileCard,
                  isSelected && { borderColor: config.accentColor, backgroundColor: '#1e293b' },
                ]}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.iconBox, { backgroundColor: config.accentColor + '20' }]}>
                    <Ionicons name={config.icon as any} size={24} color={config.accentColor} />
                  </View>
                  <View style={styles.cardTextContainer}>
                    <View style={styles.nameRow}>
                      <Text style={styles.profileName}>{config.name}</Text>
                      {config.badgeText && (
                        <View style={[styles.badge, { backgroundColor: config.accentColor }]}>
                          <Text style={styles.badgeLabel}>{config.badgeText}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.profileSubtitle}>{config.subtitle}</Text>
                  </View>
                </View>

                <View style={styles.radioContainer}>
                  <Ionicons
                    name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                    size={22}
                    color={isSelected ? config.accentColor : '#64748b'}
                  />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleContinue}
          style={[
            styles.continueButton,
            { backgroundColor: PROFILE_CONFIGS[selectedProfile].accentColor },
          ]}
        >
          <Text style={styles.continueButtonText}>
            Continue with {PROFILE_CONFIGS[selectedProfile].name}
          </Text>
          <Ionicons name="arrow-forward" size={20} color="#ffffff" />
        </TouchableOpacity>

        <Text style={styles.footerNote}>
          🔒 Private & Local. Scanned images are processed securely and never stored on any cloud server. You can switch profiles anytime in Settings.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  headerContainer: {
    marginTop: 10,
    marginBottom: 24,
  },
  badgeText: {
    color: '#818cf8',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  title: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '900',
    lineHeight: 32,
    marginBottom: 10,
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 15,
    lineHeight: 22,
  },
  profileList: {
    gap: 12,
    marginBottom: 28,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#172033',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#334155',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 14,
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTextContainer: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  profileName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeLabel: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  profileSubtitle: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 17,
  },
  radioContainer: {
    marginLeft: 10,
  },
  continueButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 56,
    borderRadius: 16,
    gap: 10,
    marginBottom: 16,
  },
  continueButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  footerNote: {
    color: '#64748b',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
