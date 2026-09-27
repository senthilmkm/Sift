import React, { useEffect, useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, ActivityIndicator, View, TouchableOpacity, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { ActionableScreen } from './src/screens/ActionableScreen';
import { InformationalScreen } from './src/screens/InformationalScreen';
import { ScanScreen } from './src/screens/ScanScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { OnboardingProfileScreen } from './src/screens/OnboardingProfileScreen';
import { getDB, getUserPreferences, updateUserPreferences } from './src/database/db';
import { ArchivedTasksModal } from './src/components/ArchivedTasksModal';
import { ProfileSwitcherModal } from './src/components/ProfileSwitcherModal';
import { exportAllTasksToExcel } from './src/services/shareService';
import { ProfileId } from './src/models/types';
import { PROFILE_CONFIGS } from './src/config/profiles';

const Tab = createBottomTabNavigator();

export default function App() {
  const [dbReady, setDbReady] = useState(false);
  const [onboarded, setOnboarded] = useState(false);
  const [activeProfile, setActiveProfile] = useState<ProfileId>('school');
  const [showArchivedModal, setShowArchivedModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    getDB()
      .then(async () => {
        const prefs = await getUserPreferences();
        setOnboarded(prefs.onboardingCompleted);
        setActiveProfile(prefs.activeProfile);
        setDbReady(true);
      })
      .catch((err) => console.error('Failed to init DB:', err));
  }, []);

  const handleSelectProfile = async (profileId: ProfileId) => {
    setActiveProfile(profileId);
    await updateUserPreferences({ activeProfile: profileId });
  };

  const handleOnboardingComplete = (profileId: ProfileId) => {
    setActiveProfile(profileId);
    setOnboarded(true);
  };

  if (!dbReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (!onboarded) {
    return <OnboardingProfileScreen onComplete={handleOnboardingComplete} />;
  }

  const currentTheme = PROFILE_CONFIGS[activeProfile] || PROFILE_CONFIGS.school;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerStyle: { backgroundColor: '#0f172a', shadowColor: 'transparent' },
            headerTitleStyle: { color: '#ffffff', fontWeight: '800', fontSize: 18 },
            headerLeft: () => (
              <TouchableOpacity
                onPress={() => setShowProfileModal(true)}
                style={styles.headerProfileBtn}
              >
                <View style={[styles.profilePill, { backgroundColor: currentTheme.accentColor + '25', borderColor: currentTheme.accentColor }]}>
                  <Ionicons name={currentTheme.icon as any} size={16} color={currentTheme.accentColor} />
                  <Text style={[styles.profilePillText, { color: currentTheme.accentColor }]}>
                    {currentTheme.name.split(' ')[0]}
                  </Text>
                  <Ionicons name="chevron-down" size={14} color={currentTheme.accentColor} />
                </View>
              </TouchableOpacity>
            ),
            headerRight: () => (
              <View style={styles.headerRightRow}>
                <TouchableOpacity onPress={exportAllTasksToExcel} style={styles.headerBtn}>
                  <Ionicons name="stats-chart" size={20} color="#10b981" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowArchivedModal(true)} style={styles.headerBtn}>
                  <Ionicons name="archive" size={20} color="#818cf8" />
                </TouchableOpacity>
              </View>
            ),
            tabBarStyle: { backgroundColor: '#0f172a', borderTopColor: '#334155', height: 60, paddingBottom: 8 },
            tabBarActiveTintColor: currentTheme.accentColor,
            tabBarInactiveTintColor: '#64748b',
            tabBarIcon: ({ color, size }) => {
              let iconName: keyof typeof Ionicons.glyphMap = 'ellipse';
              if (route.name === 'Actionable') iconName = 'checkbox-outline';
              if (route.name === 'Informational') iconName = 'information-circle-outline';
              if (route.name === 'Quick Scan') iconName = 'aperture-outline';
              if (route.name === 'Settings') iconName = 'settings-outline';
              return <Ionicons name={iconName} size={size} color={color} />;
            },
          })}
        >
          <Tab.Screen
            name="Actionable"
            component={ActionableScreen}
            options={{ title: currentTheme.tab1Name }}
          />
          <Tab.Screen
            name="Informational"
            component={InformationalScreen}
            options={{ title: currentTheme.tab2Name }}
          />
          <Tab.Screen
            name="Quick Scan"
            component={ScanScreen}
            options={{ title: '📷 Quick Scan' }}
          />
          <Tab.Screen
            name="Settings"
            component={SettingsScreen}
            options={{ title: '⚙️ Settings' }}
          />
        </Tab.Navigator>

        <ArchivedTasksModal
          visible={showArchivedModal}
          onClose={() => setShowArchivedModal(false)}
        />

        <ProfileSwitcherModal
          visible={showProfileModal}
          activeProfile={activeProfile}
          onSelectProfile={handleSelectProfile}
          onClose={() => setShowProfileModal(false)}
        />
      </NavigationContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  headerProfileBtn: {
    marginLeft: 12,
  },
  profilePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  profilePillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  headerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    gap: 8,
  },
  headerBtn: {
    padding: 6,
  },
});
