import * as SecureStore from 'expo-secure-store';
import { UserPreferences } from '../models/types';

export interface SecureUsageRecord {
  deviceInstallId: string;
  currentMonth: string; // YYYY-MM
  scansUsedThisMonth: number;
  lastScanTimestamp: number;
  isSubscribed: boolean;
  activePlanId?: string;
}

const SECURE_STORE_KEY = 'SIFT_PERSISTENT_USAGE_V1';
const DEVICE_ID_KEY = 'SIFT_PERSISTENT_DEVICE_ID_V1';

// In-memory fallback cache for Web or environment where SecureStore is unavailable
let memoryCache: SecureUsageRecord | null = null;

function getCurrentMonthString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function generateDeviceId(): string {
  const randomPart = Math.random().toString(36).substring(2, 11);
  return `sift_device_${Date.now()}_${randomPart}`;
}

async function safeSecureGet(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

async function safeSecureSet(key: string, value: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch {
    // Fallback silently if SecureStore not available in current environment
  }
}

/**
 * Gets or initializes the immutable persistent device installation ID.
 * This ID persists across app reinstalls via Keychain / SecureStore.
 */
export async function getOrCreateDeviceInstallId(): Promise<string> {
  let deviceId = await safeSecureGet(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = generateDeviceId();
    await safeSecureSet(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

/**
 * Retrieves the persistent usage record from SecureStore (Keychain/KeyStore).
 * Handles monthly reset detection and clock rollback protection.
 */
export async function getSecureUsageRecord(): Promise<SecureUsageRecord> {
  const deviceId = await getOrCreateDeviceInstallId();
  const currentMonth = getCurrentMonthString();
  const now = Date.now();

  const storedStr = await safeSecureGet(SECURE_STORE_KEY);
  let record: SecureUsageRecord;

  if (storedStr) {
    try {
      record = JSON.parse(storedStr);
    } catch {
      record = {
        deviceInstallId: deviceId,
        currentMonth,
        scansUsedThisMonth: 0,
        lastScanTimestamp: now,
        isSubscribed: false,
      };
    }
  } else if (memoryCache) {
    record = { ...memoryCache };
  } else {
    record = {
      deviceInstallId: deviceId,
      currentMonth,
      scansUsedThisMonth: 0,
      lastScanTimestamp: now,
      isSubscribed: false,
    };
  }

  // Clock rollback detection: If current time is significantly before last stored timestamp (> 24h into past),
  // prevent reset cheating.
  const isClockRolledBack = now < record.lastScanTimestamp - 86400000;

  // Monthly reset check: If month changed and clock wasn't rolled back into past
  if (record.currentMonth !== currentMonth && !isClockRolledBack) {
    record.currentMonth = currentMonth;
    record.scansUsedThisMonth = 0;
  }

  // Ensure deviceInstallId is populated
  record.deviceInstallId = deviceId;
  memoryCache = record;
  await safeSecureSet(SECURE_STORE_KEY, JSON.stringify(record));

  return record;
}

/**
 * Checks whether the user is eligible to scan a document.
 * Returns true if user is subscribed or hasn't reached the 5 scans/month free tier limit.
 */
export async function canUserScan(): Promise<boolean> {
  const record = await getSecureUsageRecord();
  if (record.isSubscribed) return true;
  return record.scansUsedThisMonth < 5;
}

/**
 * Increments the monthly scan count in persistent SecureStore.
 * Must be called whenever a free user successfully scans a document.
 */
export async function recordSuccessfulScan(): Promise<SecureUsageRecord> {
  const record = await getSecureUsageRecord();
  const now = Date.now();

  if (!record.isSubscribed) {
    record.scansUsedThisMonth += 1;
  }
  record.lastScanTimestamp = now;

  memoryCache = record;
  await safeSecureSet(SECURE_STORE_KEY, JSON.stringify(record));
  return record;
}

/**
 * Updates subscription status in persistent SecureStore.
 */
export async function updateSecureSubscriptionState(isSubscribed: boolean, planId?: string): Promise<SecureUsageRecord> {
  const record = await getSecureUsageRecord();
  record.isSubscribed = isSubscribed;
  if (planId) {
    record.activePlanId = planId;
  }
  record.lastScanTimestamp = Date.now();

  memoryCache = record;
  await safeSecureSet(SECURE_STORE_KEY, JSON.stringify(record));
  return record;
}

/**
 * Reconciles local database preferences with SecureStore persistent source of truth.
 * Protects against app uninstalls and database resets.
 */
export async function syncPreferencesWithSecureStore(dbPrefs: UserPreferences): Promise<UserPreferences> {
  const secureRecord = await getSecureUsageRecord();

  let needsUpdate = false;
  let updatedFreeScans = dbPrefs.freeScansUsed;
  let updatedIsSubscribed = dbPrefs.isSubscribed;

  // If SecureStore has a higher scan count for the current month (e.g., after reinstall or DB reset),
  // restore the persistent count to prevent free tier bypass.
  if (secureRecord.scansUsedThisMonth > dbPrefs.freeScansUsed) {
    updatedFreeScans = secureRecord.scansUsedThisMonth;
    needsUpdate = true;
  }

  // Also enforce subscription state if persistent SecureStore has record
  if (secureRecord.isSubscribed && !dbPrefs.isSubscribed) {
    updatedIsSubscribed = true;
    needsUpdate = true;
  }

  return {
    ...dbPrefs,
    freeScansUsed: updatedFreeScans,
    isSubscribed: updatedIsSubscribed,
    activePlanId: dbPrefs.activePlanId || secureRecord.activePlanId,
  };
}
