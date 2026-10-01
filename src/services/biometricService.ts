import * as LocalAuthentication from 'expo-local-authentication';

export async function isBiometricsAvailable(): Promise<boolean> {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    return hasHardware && isEnrolled;
  } catch (error) {
    console.error('Error checking biometrics availability:', error);
    return false;
  }
}

export async function authenticateBiometrics(
  reason: string = 'Unlock Sift to view confidential receipts & documents'
): Promise<boolean> {
  try {
    const available = await isBiometricsAvailable();
    if (!available) {
      // Biometrics not available on device or emulator fallback
      return true;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: reason,
      fallbackLabel: 'Enter Device Passcode',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
    });

    return result.success;
  } catch (error) {
    console.error('Biometrics authentication failed:', error);
    return false;
  }
}
