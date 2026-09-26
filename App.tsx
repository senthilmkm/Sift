import React, { useEffect, useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, ActivityIndicator, View, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { ActionableScreen } from './src/screens/ActionableScreen';
import { InformationalScreen } from './src/screens/InformationalScreen';
import { ScanScreen } from './src/screens/ScanScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { getDB } from './src/database/db';
import { ArchivedTasksModal } from './src/components/ArchivedTasksModal';
import { exportAllTasksToExcel } from './src/services/shareService';

const Tab = createBottomTabNavigator();

export default function App() {
  const [dbReady, setDbReady] = useState(false);
  const [showArchivedModal, setShowArchivedModal] = useState(false);

  useEffect(() => {
    getDB().then(() => setDbReady(true)).catch((err) => console.error('Failed to init DB:', err));
  }, []);

  if (!dbReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerStyle: { backgroundColor: '#0f172a', shadowColor: 'transparent' },
            headerTitleStyle: { color: '#ffffff', fontWeight: '800', fontSize: 18 },
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
            tabBarActiveTintColor: '#6366f1',
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
          <Tab.Screen name="Actionable" component={ActionableScreen} options={{ title: '📋 Actionable' }} />
          <Tab.Screen name="Informational" component={InformationalScreen} options={{ title: 'ℹ️ Informational' }} />
          <Tab.Screen name="Quick Scan" component={ScanScreen} options={{ title: '📷 Quick Scan' }} />
          <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: '⚙️ Settings' }} />
        </Tab.Navigator>

        <ArchivedTasksModal
          visible={showArchivedModal}
          onClose={() => setShowArchivedModal(false)}
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
