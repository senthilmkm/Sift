import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert, Linking } from 'react-native';
import Constants from 'expo-constants';
import { getUserPreferences, updateUserPreferences, autoDeleteOldItems, resetDatabase } from '../database/db';
import { UserPreferences, AutoDeletePeriod } from '../models/types';
import { TimeRollerPicker } from '../components/TimeRollerPicker';
import { sendTestNotification, checkNotificationPermissionStatus, requestNotificationPermissions } from '../services/notificationService';
import { exportAllTasksToExcel, exportAllTasksToPDF } from '../services/shareService';
import { PaywallModal } from '../components/PaywallModal';
import { Ionicons } from '@expo/vector-icons';

export const SettingsScreen: React.FC = () => {
  const [prefs, setPrefs] = useState<UserPreferences>({
    activeProfile: 'school',
    enabledProfiles: ['school', 'elderCare', 'smallBiz', 'property', 'legalImmigration'],
    onboardingCompleted: true,
    enableNotifications: true,
    enableCriticalAlerts: false,
    enablePiiRedaction: true,
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

  const handleToggleCriticalAlerts = async (val: boolean) => {
    await updateUserPreferences({ enableCriticalAlerts: val });
    await loadPrefs();
  };

  const handleTogglePiiRedaction = async (val: boolean) => {
    await updateUserPreferences({ enablePiiRedaction: val });
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
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeaderNoMargin}>Subscription & Usage</Text>
          <TouchableOpacity
            onPress={() =>
              Alert.alert(
                'Subscription & Free Tier Info',
                'Free tier includes 5 document scans per month total across all 5 Smart Profiles combined.\n\nSift Pro ($4.99/mo or $39.99/yr) unlocks unlimited scans, Critical Alerts, and Excel/PDF CPA tax exports.'
              )
            }
          >
            <Ionicons name="information-circle-outline" size={18} color="#818cf8" />
          </TouchableOpacity>
        </View>

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

      {/* Privacy & Security Controls Card */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeaderNoMargin}>Privacy & Security Controls</Text>
          <TouchableOpacity
            onPress={() =>
              Alert.alert(
                'Privacy & Redaction Info',
                'Sift runs an On-Device PII Redaction Engine directly on your iPhone. SSNs, Medicare MBIs, Credit Cards, Bank Routing Numbers, and USCIS A-Numbers are scrubbed locally before AI processing.\n\nYour data remains 100% locally on your phone in SQLite (`sift_v2.db`) with zero cloud database retention.'
              )
            }
          >
            <Ionicons name="information-circle-outline" size={18} color="#818cf8" />
          </TouchableOpacity>
        </View>

        <View style={styles.toggleRow}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={styles.toggleLabel}>On-Device PII Masking</Text>
            <Text style={styles.toggleSubtext}>Auto-redacts SSNs, Medicare MBIs & Credit Cards</Text>
          </View>
          <Switch
            value={prefs.enablePiiRedaction}
            onValueChange={handleTogglePiiRedaction}
            trackColor={{ false: '#334155', true: '#10b981' }}
            thumbColor="#ffffff"
          />
        </View>
      </View>

      {/* Notifications & Critical Alerts Card */}
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

        {prefs.enableNotifications && (
          <View style={styles.toggleRow}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.toggleLabel}>Apple Critical Alerts</Text>
                <TouchableOpacity
                  onPress={() =>
                    Alert.alert(
                      'Apple Critical Alerts Info',
                      'Urgent healthcare pre-op fasting rules, court summons, or utility shutoffs play audible alarms even when your iPhone is set to Silent or Do Not Disturb.'
                    )
                  }
                  style={{ paddingLeft: 6 }}
                >
                  <Ionicons name="information-circle-outline" size={16} color="#f43f5e" />
                </TouchableOpacity>
              </View>
              <Text style={styles.toggleSubtext}>Play audible alarm for urgent deadlines when Silent</Text>
            </View>
            <Switch
              value={prefs.enableCriticalAlerts}
              onValueChange={handleToggleCriticalAlerts}
              trackColor={{ false: '#334155', true: '#f43f5e' }}
              thumbColor="#ffffff"
            />
          </View>
        )}

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

      {/* Data & Tax Export Section */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeaderNoMargin}>Tax & Data Export</Text>
          <TouchableOpacity
            onPress={() =>
              Alert.alert(
                '1-Tap Tax & CPA Export Info',
                'Export your tasks and receipts into Excel (.CSV) or PDF format.\n\nSift auto-extracts Vendor Name, Purchase Date, Total Amount Spent, Tax Category (Materials, Fuel, Utilities, Office, Fees), and Receipt Notes ready for your CPA or accountant!'
              )
            }
          >
            <Ionicons name="information-circle-outline" size={18} color="#818cf8" />
          </TouchableOpacity>
        </View>
        <Text style={styles.subText}>Export your Actionable & Informational items for your CPA or records:</Text>

        <TouchableOpacity style={styles.exportBtn} onPress={exportAllTasksToExcel}>
          <Ionicons name="stats-chart" size={18} color="#fff" />
          <Text style={styles.exportBtnText}>EXPORT ALL TO EXCEL (.CSV)</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.exportBtn, { backgroundColor: '#2563eb', marginTop: 10 }]} onPress={exportAllTasksToPDF}>
          <Ionicons name="document-text" size={18} color="#fff" />
          <Text style={styles.exportBtnText}>EXPORT CPA TAX REPORT (.PDF)</Text>
        </TouchableOpacity>
      </View>

      {/* Auto Data Retention Section */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeaderNoMargin}>Auto Data Retention & Deletion</Text>
          <TouchableOpacity
            onPress={() =>
              Alert.alert(
                'Auto Retention Info',
                'Sift automatically cleans up old completed or archived tasks after the selected period to keep your phone storage light and clutter-free.'
              )
            }
          >
            <Ionicons name="information-circle-outline" size={18} color="#818cf8" />
          </TouchableOpacity>
        </View>
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
        <TouchableOpacity style={styles.linkRow} onPress={() => Linking.openURL('https://senthilmkm.github.io/Sift/support.html')}>
          <Ionicons name="help-circle-outline" size={18} color="#818cf8" />
          <Text style={styles.linkText}>Support Hub & FAQs</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkRow} onPress={() => Linking.openURL('mailto:senthil930@gmail.com')}>
          <Ionicons name="mail-outline" size={18} color="#818cf8" />
          <Text style={styles.linkText}>Contact Support (senthil930@gmail.com)</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkRow} onPress={() => Linking.openURL('https://senthilmkm.github.io/Sift/privacy.html')}>
          <Ionicons name="shield-checkmark-outline" size={18} color="#818cf8" />
          <Text style={styles.linkText}>Privacy Policy</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkRow} onPress={() => Linking.openURL('https://senthilmkm.github.io/Sift/terms.html')}>
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
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionHeaderNoMargin: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
  headerRowToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  toggleSubtext: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  rowLabel: {
    fontSize: 14,
    color: '#94a3b8',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '700',
  },
  subActive: {
    color: '#10b981',
  },
  subTrial: {
    color: '#818cf8',
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 4,
    gap: 8,
  },
  primaryActionBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  permStatusBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0f172a',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  permStatusLabel: {
    fontSize: 12,
    color: '#94a3b8',
  },
  permStatusBadge: {
    fontSize: 11,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: 'hidden',
  },
  grantedBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    color: '#34d399',
  },
  deniedBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    color: '#fca5a5',
  },
  subText: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 10,
  },
  disabledText: {
    fontSize: 13,
    color: '#f43f5e',
    fontStyle: 'italic',
    marginTop: 6,
  },
  testNotifBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    borderRadius: 10,
    paddingVertical: 10,
    marginTop: 12,
    gap: 6,
  },
  testNotifBtnText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 13,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
  },
  exportBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  periodRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  periodChip: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  periodChipActive: {
    backgroundColor: '#6366f1',
    borderColor: '#818cf8',
  },
  periodChipText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  periodChipTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  dangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef4444',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 6,
  },
  dangerBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    gap: 10,
  },
  linkText: {
    color: '#cbd5e1',
    fontSize: 14,
    fontWeight: '500',
  },
  versionText: {
    textAlign: 'center',
    color: '#64748b',
    fontSize: 12,
    marginTop: 8,
  },
});