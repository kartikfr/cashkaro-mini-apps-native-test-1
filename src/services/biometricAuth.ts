import { NativeBiometric, BiometryType } from '@capgo/capacitor-native-biometric';
import { Capacitor } from '@capacitor/core';

export interface BiometricAvailability {
  isAvailable: boolean;
  biometryType: BiometryType;
  biometryTypeName: string;
}

/**
 * Check if biometric authentication is available on the device
 */
export const checkBiometricAvailability = async (): Promise<BiometricAvailability> => {
  if (!Capacitor.isNativePlatform()) {
    return {
      isAvailable: false,
      biometryType: BiometryType.NONE,
      biometryTypeName: 'None',
    };
  }

  try {
    const result = await NativeBiometric.isAvailable();
    
    return {
      isAvailable: result.isAvailable,
      biometryType: result.biometryType,
      biometryTypeName: getBiometryTypeName(result.biometryType),
    };
  } catch (error) {
    console.error('[Biometric] Error checking availability:', error);
    return {
      isAvailable: false,
      biometryType: BiometryType.NONE,
      biometryTypeName: 'None',
    };
  }
};

/**
 * Get human-readable name for biometry type
 */
const getBiometryTypeName = (type: BiometryType): string => {
  switch (type) {
    case BiometryType.FACE_ID:
      return 'Face ID';
    case BiometryType.TOUCH_ID:
      return 'Touch ID';
    case BiometryType.FINGERPRINT:
      return 'Fingerprint';
    case BiometryType.FACE_AUTHENTICATION:
      return 'Face Authentication';
    case BiometryType.IRIS_AUTHENTICATION:
      return 'Iris Authentication';
    case BiometryType.MULTIPLE:
      return 'Biometric';
    default:
      return 'None';
  }
};

/**
 * Authenticate user using biometrics
 * @param reason - The reason for authentication (shown to user)
 * @returns true if authentication successful, false otherwise
 */
export const authenticateWithBiometric = async (
  reason: string = 'Verify your identity'
): Promise<boolean> => {
  if (!Capacitor.isNativePlatform()) {
    console.log('[Biometric] Not a native platform, skipping biometric auth');
    return true; // Allow on web
  }

  try {
    const { isAvailable, biometryTypeName } = await checkBiometricAvailability();
    
    if (!isAvailable) {
      console.log('[Biometric] Biometrics not available');
      return true; // Allow if biometrics not available
    }

    await NativeBiometric.verifyIdentity({
      reason,
      title: 'Authentication Required',
      subtitle: `Use ${biometryTypeName} to continue`,
      description: reason,
      useFallback: true,
      fallbackTitle: 'Use Passcode',
      maxAttempts: 3,
    });

    console.log('[Biometric] Authentication successful');
    return true;
  } catch (error: any) {
    console.error('[Biometric] Authentication failed:', error);
    
    // Check if user cancelled
    if (error?.code === 'BIOMETRIC_DISMISSED' || error?.code === 'BIOMETRIC_CANCELED') {
      console.log('[Biometric] User cancelled authentication');
      return false;
    }
    
    // For other errors, you might want to allow the action
    // or show an error message
    return false;
  }
};

/**
 * Authenticate before payment - convenience wrapper
 */
export const authenticateForPayment = async (): Promise<boolean> => {
  return authenticateWithBiometric('Authenticate to confirm payment request');
};

/**
 * Authenticate for app unlock - convenience wrapper
 */
export const authenticateForAppUnlock = async (): Promise<boolean> => {
  return authenticateWithBiometric('Unlock the app');
};

/**
 * Store credentials securely using device biometrics
 * Useful for storing tokens or sensitive data
 */
export const setSecureCredentials = async (
  server: string,
  username: string,
  password: string
): Promise<boolean> => {
  if (!Capacitor.isNativePlatform()) {
    return false;
  }

  try {
    await NativeBiometric.setCredentials({
      server,
      username,
      password,
    });
    return true;
  } catch (error) {
    console.error('[Biometric] Failed to store credentials:', error);
    return false;
  }
};

/**
 * Retrieve stored credentials
 */
export const getSecureCredentials = async (
  server: string
): Promise<{ username: string; password: string } | null> => {
  if (!Capacitor.isNativePlatform()) {
    return null;
  }

  try {
    const credentials = await NativeBiometric.getCredentials({ server });
    return credentials;
  } catch (error) {
    console.error('[Biometric] Failed to get credentials:', error);
    return null;
  }
};

/**
 * Delete stored credentials
 */
export const deleteSecureCredentials = async (server: string): Promise<boolean> => {
  if (!Capacitor.isNativePlatform()) {
    return false;
  }

  try {
    await NativeBiometric.deleteCredentials({ server });
    return true;
  } catch (error) {
    console.error('[Biometric] Failed to delete credentials:', error);
    return false;
  }
};
