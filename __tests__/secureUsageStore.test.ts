import {
  getOrCreateDeviceInstallId,
  getSecureUsageRecord,
  canUserScan,
  recordSuccessfulScan,
  updateSecureSubscriptionState,
  syncPreferencesWithSecureStore,
} from '../src/services/secureUsageStore';
import { UserPreferences } from '../src/models/types';

describe('Secure Usage & Free Tier Anti-Cheat System Tests', () => {
  it('generates and persists a unique device installation ID', async () => {
    const deviceId1 = await getOrCreateDeviceInstallId();
    expect(deviceId1).toContain('sift_device_');

    const deviceId2 = await getOrCreateDeviceInstallId();
    expect(deviceId2).toBe(deviceId1);
  });

  it('allows scanning up to 5 free scans per month for non-subscribed users', async () => {
    let canScan = await canUserScan();
    expect(canScan).toBe(true);

    const record = await getSecureUsageRecord();
    expect(record.scansUsedThisMonth).toBe(0);
  });

  it('accurately increments scan usage and blocks after 5 scans', async () => {
    // Record 5 successful scans
    for (let i = 1; i <= 5; i++) {
      const updated = await recordSuccessfulScan();
      expect(updated.scansUsedThisMonth).toBe(i);
    }

    const canScanAfter5 = await canUserScan();
    expect(canScanAfter5).toBe(false);
  });

  it('restores scan usage state from SecureStore to prevent app uninstall/reset bypass', async () => {
    // Simulate SQLite database being reset (SQLite freeScansUsed = 0)
    const wipedDbPrefs: UserPreferences = {
      activeProfile: 'school',
      enabledProfiles: ['school', 'elderCare', 'smallBiz', 'property', 'legalImmigration'],
      onboardingCompleted: true,
      enableNotifications: true,
      enableCriticalAlerts: false,
      enablePiiRedaction: true,
      enableBiometricLock: false,
      defaultReminderTime: '19:00_nightbefore',
      reminderSound: 'default',
      autoDeletePeriod: 'never',
      freeScansUsed: 0, // Wiped by app reinstall or user DB reset
      isSubscribed: false,
    };

    // Reconcile with SecureStore
    const restoredPrefs = await syncPreferencesWithSecureStore(wipedDbPrefs);
    expect(restoredPrefs.freeScansUsed).toBe(5); // Restored from SecureStore!
  });

  it('unlocks unlimited scans when user subscribes to Sift Pro', async () => {
    await updateSecureSubscriptionState(true, 'sift_annual_2999');
    const canScanSubscribed = await canUserScan();
    expect(canScanSubscribed).toBe(true);
  });
});
