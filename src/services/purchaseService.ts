import { Platform } from 'react-native';
import Purchases, {
  PurchasesPackage,
  PurchasesOfferings,
  CustomerInfo,
  LOG_LEVEL,
  PURCHASES_ERROR_CODE,
} from 'react-native-purchases';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { updateSecureSubscriptionState } from './secureUsageStore';
import { updateUserPreferences } from '../database/db';

export const REVENUECAT_APPLE_KEY = 'appl_mpKVzVcMgeTnlviRrIMPNnLeiIt';

let isConfigured = false;

/**
 * Checks whether native StoreKit / RevenueCat is supported in the current runtime.
 * Expo Go and Web environments do not have the native StoreKit module.
 */
export function isPurchasesSupported(): boolean {
  if (Platform.OS === 'web') return false;
  const isExpoGo =
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
    (Constants as any)?.appOwnership === 'expo';
  return !isExpoGo;
}

/**
 * Evaluates whether CustomerInfo contains an active Pro entitlement or active subscription.
 */
export function hasActiveSubscription(customerInfo: CustomerInfo | null): boolean {
  if (!customerInfo) return false;
  const activeEntitlements = customerInfo.entitlements?.active;
  if (activeEntitlements && Object.keys(activeEntitlements).length > 0) {
    return true;
  }
  const activeSubs = customerInfo.activeSubscriptions;
  if (Array.isArray(activeSubs) && activeSubs.length > 0) {
    return true;
  }
  return false;
}

/**
 * Initializes RevenueCat Purchases SDK with the Apple Public API key.
 */
export async function initializePurchases(): Promise<boolean> {
  if (!isPurchasesSupported()) {
    console.log('[Purchases] Native StoreKit not supported in Expo Go / Web. Native RevenueCat bypass active.');
    return false;
  }

  if (isConfigured) {
    return true;
  }

  try {
    if (__DEV__) {
      await Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    }

    await Purchases.configure({ apiKey: REVENUECAT_APPLE_KEY });
    isConfigured = true;
    console.log('[Purchases] RevenueCat initialized successfully with Apple API key.');

    // Listen to real-time customer info updates (e.g. renewals, trial expirations)
    Purchases.addCustomerInfoUpdateListener(async (info) => {
      const active = hasActiveSubscription(info);
      await updateSecureSubscriptionState(active);
      await updateUserPreferences({ isSubscribed: active });
    });

    return true;
  } catch (error) {
    console.error('[Purchases] Failed to initialize RevenueCat:', error);
    return false;
  }
}

/**
 * Retrieves the current offerings from RevenueCat.
 */
export async function getOfferings(): Promise<PurchasesOfferings | null> {
  if (!isPurchasesSupported()) {
    return null;
  }

  try {
    await initializePurchases();
    const offerings = await Purchases.getOfferings();
    return offerings;
  } catch (error) {
    console.warn('[Purchases] Failed to fetch offerings:', error);
    return null;
  }
}

/**
 * Verifies active subscription status against RevenueCat.
 */
export async function checkSubscriptionStatus(): Promise<boolean> {
  if (!isPurchasesSupported()) {
    return false;
  }

  try {
    await initializePurchases();
    const customerInfo = await Purchases.getCustomerInfo();
    const active = hasActiveSubscription(customerInfo);
    await updateSecureSubscriptionState(active);
    await updateUserPreferences({ isSubscribed: active });
    return active;
  } catch (error) {
    console.warn('[Purchases] Failed to get customer info:', error);
    return false;
  }
}

/**
 * Purchases a package or plan through RevenueCat, triggering Apple's native purchase sheet.
 */
export async function purchaseSubscription(
  planId?: string,
  explicitPackage?: PurchasesPackage
): Promise<{ success: boolean; userCancelled?: boolean; error?: string }> {
  if (!isPurchasesSupported()) {
    // Simulator / Expo Go simulated fallback for local development
    console.log('[Purchases] Local simulated purchase completed for plan:', planId);
    await updateSecureSubscriptionState(true, planId);
    await updateUserPreferences({ isSubscribed: true, activePlanId: planId });
    return { success: true };
  }

  try {
    await initializePurchases();

    let pkgToBuy: PurchasesPackage | undefined = explicitPackage;

    if (!pkgToBuy) {
      const offerings = await Purchases.getOfferings();
      const current = offerings?.current;
      const packages = current?.availablePackages || [];

      if (planId) {
        const target = planId.toLowerCase();
        pkgToBuy = packages.find((p) => {
          const prodId = (p.product?.identifier || '').toLowerCase();
          const pkgId = (p.identifier || '').toLowerCase();
          const pkgType = String(p.packageType || '').toLowerCase();

          if (prodId === target || pkgId === target) return true;
          if (target.includes('annual') || target.includes('3999') || target.includes('yearly')) {
            if (prodId.includes('annual') || pkgId.includes('annual') || pkgType.includes('annual')) {
              return true;
            }
          }
          if (target.includes('monthly') || target.includes('499')) {
            if (prodId.includes('monthly') || pkgId.includes('monthly') || pkgType.includes('monthly')) {
              return true;
            }
          }
          return false;
        });
      }

      if (!pkgToBuy && packages.length > 0) {
        pkgToBuy = packages[0];
      }
    }

    if (!pkgToBuy) {
      throw new Error(
        'Subscription offerings are currently unavailable. Please verify In-App Purchases configuration in App Store Connect & RevenueCat.'
      );
    }

    console.log('[Purchases] Presenting native Apple Purchase Sheet for:', pkgToBuy.identifier, pkgToBuy.product.identifier);
    const { customerInfo } = await Purchases.purchasePackage(pkgToBuy);
    const active = hasActiveSubscription(customerInfo);

    await updateSecureSubscriptionState(active, pkgToBuy.identifier);
    await updateUserPreferences({ isSubscribed: active, activePlanId: pkgToBuy.identifier });

    return { success: active };
  } catch (error: any) {
    if (
      error?.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR ||
      error?.userCancelled ||
      error?.message === 'USER_CANCELLED'
    ) {
      console.log('[Purchases] User dismissed Apple native purchase sheet.');
      return { success: false, userCancelled: true };
    }
    console.error('[Purchases] Purchase error:', error);
    return { success: false, error: error?.message || 'Purchase could not be completed.' };
  }
}

/**
 * Restores previous App Store purchases.
 */
export async function restorePurchases(): Promise<{
  success: boolean;
  isSubscribed: boolean;
  error?: string;
}> {
  if (!isPurchasesSupported()) {
    return { success: true, isSubscribed: false };
  }

  try {
    await initializePurchases();
    const customerInfo = await Purchases.restorePurchases();
    const active = hasActiveSubscription(customerInfo);

    await updateSecureSubscriptionState(active);
    await updateUserPreferences({ isSubscribed: active });

    return { success: true, isSubscribed: active };
  } catch (error: any) {
    console.error('[Purchases] Restore error:', error);
    return { success: false, isSubscribed: false, error: error?.message || 'Restore failed.' };
  }
}
