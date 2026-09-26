import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert, Linking } from 'react-native';
import Constants from 'expo-constants';
import { getUserPreferences, updateUserPreferences, autoDeleteOldItems, resetDatabase } from '../database/db';
import { UserPreferences, AutoDeletePeriod } from '../models/types';
import { TimeRollerPicker } from '../components/TimeRollerPicker';
import { sendTestNotification, checkNotificationPermissionStatus, requestNotificationPermissions } from '../services/notificationService';
import { exportAllTasksToExcel } from '../services/shareService';
import { PaywallModal } from '../components/PaywallModal';
import { Ionicons } from '@expo/vector-icons';

export const SettingsScreen: React.FC = () => {
  const [prefs, setPrefs] = useState<UserPreferences>({
    enableNotifications: true,
    defaultReminderTime: '19:00_nightbefore',
    reminderSound: 'default',
    autoDeletePeriod: 'never',
    freeScansUsed: 0,
    isSubscribed: false,
  });
  const [permStatus, setPermStatus] = useState<string>('checking');
  const [showPaywall, setShowPaywall] = useState(false);

  const appVersion = Constants.expoConfig?.version || '1.0.0';
  const buildNumber = Constants.expoConfig?.ios?.buildNumber || Constants.nativeBuildVersion || '1';

  const loadPrefs = async () => {
    const data = await getUserPreferences();
    setPrefs(data);

    const perm = await checkNotificationPermissionStatus();
    setPermStatus(perm.status);
  };

  useEffect(() => {
    loadPrefs();
  }, []);

  const handleToggleNotifications = async (val: boolean) => {
    if (val) {
      const granted = await requestNotificationPermissions();
      if (!granted) {
        Alert.alert(
          'Notification Permission Required',
          'Notifications are disabled in iOS System Settings. Please enable notifications for Sift in iOS Settings.'
        );
      }
    }
    await updateUserPreferences({ enableNotifications: val });
    await loadPrefs();
  };

  const handleSaveReminderTime = async (val: string) => {
    await updateUserPreferences({ defaultReminderTime: val });
    await loadPrefs();
  };

  const handleTestNotification = async () => {
    const id = await sendTestNotification();
    if (id) {
      Alert.alert('Test Notification Scheduled', 'You will receive a notification in 5 seconds!');
    } else {
      Alert.alert('Permission Denied', 'Please grant notification permissions in iOS Settings.');
    }
  };

  const handleSelectAutoDelete = async (period: AutoDeletePeriod) => {
    await updateUserPreferences({ autoDeletePeriod: period });
    const deletedCount = await autoDeleteOldItems(period);
    await loadPrefs();
    if (deletedCount > 0) {
      Alert.alert('Auto Retention', `Cleaned up ${deletedCount} completed/read item(s) older than ${period}.`);
    }
  };

  const handleResetApp = async () => {
    Alert.alert('Reset App Data', 'Are you sure you want to delete all local tasks and document history?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset Everything',
        style: 'destructive',
        onPress: async () => {
          await resetDatabase();
          await loadPrefs();
          Alert.alert('Reset Complete', 'App data has been wiped.');
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Account & Subscription Status Card */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionHeader}>Subscription & Usage</Text>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Current Plan:</Text>
          <Text style={[styles.statusText, prefs.isSubscribed ? styles.subActive : styles.subTrial]}>
            {prefs.isSubscribed ? 'Sift Pro (Unlimited) ⭐' : `Free Tier (${prefs.freeScansUsed}/5 scans used)`}
          </Text>
        </View>

        {!prefs.isSubscribed && (
          <TouchableOpacity style={styles.primaryActionBtn} onPress={() => setShowPaywall(true)}>
            <Ionicons name="sparkles" size={16} color="#fff" />
            <Text style={styles.primaryActionBtnText}>Upgrade to Sift Pro (Unlimited)</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Notifications & Reminders Card */}
      <View style={styles.sectionCard}>
        <View style={styles.headerRowToggle}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.sectionHeaderNoMargin}>Reminders & Notifications</Text>
            <TouchableOpacity
              onPress={() =>
                Alert.alert(
                  'Reminders & Permissions Info',
                  'Sift uses native iOS permissions to set reminders and add flyer events to your iPhone Calendar.\n\nIf permission was previously denied, you can re-enable it anytime in iPhone Settings ➔ Sift.'
                )
              }
              style={{ paddingLeft: 6 }}
            >
              <Ionicons name="information-circle-outline" size={18} color="#818cf8" />
            </TouchableOpacity>
          </View>
          <Switch
            value={prefs.enableNotifications}
            onValueChange={handleToggleNotifications}
            trackColor={{ false: '#334155', true: '#6366f1' }}
            thumbColor="#ffffff"
          />
        </View>

        <View style={styles.permStatusBadgeRow}>
          <Text style={styles.permStatusLabel}>iOS System Permission Status:</Text>
          <Text style={[styles.permStatusBadge, permStatus === 'granted' ? styles.grantedBadge : styles.deniedBadge]}>
            {permStatus === 'granted' ? 'GRANTED ✅' : 'DENIED ⚠️'}
          </Text>
        </View>

        {prefs.enableNotifications ? (
          <View style={{ marginTop: 12 }}>
            <Text style={styles.subText}>Roll to Select Default Notification Time:</Text>
            <TimeRollerPicker
              value={prefs.defaultReminderTime}
              onSave={handleSaveReminderTime}
            />

            <TouchableOpacity style={styles.testNotifBtn} onPress={handleTestNotification}>
              <Ionicons name="notifications" size={16} color="#fff" />
              <Text style={styles.testNotifBtnText}>Test Instant Alert (Rings in 5s)</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={styles.disabledText}>
            Notifications are currently disabled. Toggle ON to receive deadline reminders.
          </Text>
        )}
      </View>

      {/* Data Export Section */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionHeader}>Data Export</Text>
        <Text style={styles.subText}>Export your Actionable & Informational tasks to Excel:</Text>
        <TouchableOpacity style={styles.exportBtn} onPress={exportAllTasksToExcel}>
          <Ionicons name="stats-chart" size={18} color="#fff" />
          <Text style={styles.exportBtnText}>EXPORT ALL TASKS TO EXCEL (.CSV)</Text>
        </TouchableOpacity>
      </View>

      {/* Auto Data Retention Section */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionHeader}>Auto Data Retention & Deletion</Text>
        <Text style={styles.subText}>Automatically prune completed tasks older than:</Text>
        <View style={styles.periodRow}>
          {(['1w', '2w', '4w', '90d', '180d', 'never'] as AutoDeletePeriod[]).map((period) => (
            <TouchableOpacity
              key={period}
              style={[styles.periodChip, prefs.autoDeletePeriod === period && styles.periodChipActive]}
              onPress={() => handleSelectAutoDelete(period)}
            >
              <Text style={[styles.periodChipText, prefs.autoDeletePeriod === period && styles.periodChipTextActive]}>
                {period.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Reset App Section */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionHeader}>Danger Zone</Text>
        <TouchableOpacity style={styles.dangerBtn} onPress={handleResetApp}>
          <Ionicons name="trash" size={16} color="#fff" />
          <Text style={styles.dangerBtnText}>RESET ALL LOCAL APP DATA</Text>
        </TouchableOpacity>
      </View>

      {/* Support & Legal Links */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionHeader}>Support & Legal</Text>
        <TouchableOpacity style={styles.linkRow} onPress={() => Linking.openURL('https://siftapp.com/support.html')}>
          <Ionicons name="help-circle-outline" size={18} color="#818cf8" />
          <Text style={styles.linkText}>Support Hub & FAQs</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkRow} onPress={() => Linking.openURL('mailto:senthil930@gmail.com')}>
          <Ionicons name="mail-outline" size={18} color="#818cf8" />
          <Text style={styles.linkText}>Contact Support (senthil930@gmail.com)</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkRow} onPress={() => Linking.openURL('https://siftapp.com/privacy.html')}>
          <Ionicons name="shield-checkmark-outline" size={18} color="#818cf8" />
          <Text style={styles.linkText}>Privacy Policy</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkRow} onPress={() => Linking.openURL('https://siftapp.com/terms.html')}>
          <Ionicons name="document-text-outline" size={18} color="#818cf8" />
          <Text style={styles.linkText}>Terms of Service</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.versionText}>Sift iOS v{appVersion} (Build {buildNumber})</Text>

      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        onSubscribePlan={async (planId) => {
          await updateUserPreferences({ isSubscribed: true, activePlanId: planId });
          setShowPaywall(false);
          await loadPrefs();
          Alert.alert('Subscribed!', 'Welcome to Sift Pro!');
        }}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionCard: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sectionHeader: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  headerRowToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionHeaderNoMargin: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  permStatusBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    backgroundColor: '#0f172a',
    padding: 8,
    borderRadius: 8,
  },
  permStatusLabel: {
    color: '#94a3b8',
    fontSize: 11,
  },
  permStatusBadge: {
    fontSize: 11,
    fontWeight: '800',
  },
  grantedBadge: {
    color: '#10b981',
  },
  deniedBadge: {
    color: '#ff6b6b',
  },
  disabledText: {
    color: '#64748b',
    fontSize: 13,
    marginTop: 8,
    fontStyle: 'italic',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  rowLabel: {
    color: '#cbd5e1',
    fontSize: 14,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
  },
  subActive: {
    color: '#10b981',
  },
  subTrial: {
    color: '#ff6b6b',
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  primaryActionBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 6,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 4,
  },
  exportBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    marginLeft: 8,
  },
  subText: {
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 10,
  },
  testNotifBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#312e81',
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 12,
  },
  testNotifBtnText: {
    color: '#818cf8',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
  },
  periodRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  periodChip: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  periodChipActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  periodChipText: {
    color: '#94a3b8',
    fontSize: 12,
  },
  periodChipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  dangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f43f5e',
    paddingVertical: 10,
    borderRadius: 8,
  },
  dangerBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    marginLeft: 6,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  linkText: {
    color: '#818cf8',
    fontSize: 14,
    marginLeft: 10,
  },
  versionText: {
    color: '#64748b',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 10,
  },
});