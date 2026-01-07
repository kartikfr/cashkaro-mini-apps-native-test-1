import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

/**
 * Initialize push notifications for native platforms
 * Requests permission, registers the device, and sets up listeners
 */
export const initPushNotifications = async (): Promise<void> => {
  if (!Capacitor.isNativePlatform()) {
    console.log('[Push] Not a native platform, skipping push notification setup');
    return;
  }

  try {
    // Check current permission status
    const permissionStatus = await PushNotifications.checkPermissions();
    console.log('[Push] Current permission status:', permissionStatus.receive);

    // Request permission if not already granted
    if (permissionStatus.receive !== 'granted') {
      const requestResult = await PushNotifications.requestPermissions();
      console.log('[Push] Permission request result:', requestResult.receive);
      
      if (requestResult.receive !== 'granted') {
        console.log('[Push] Push notification permission denied');
        return;
      }
    }

    // Register for push notifications
    await PushNotifications.register();
    console.log('[Push] Registered for push notifications');

    // Set up listeners
    setupPushListeners();
  } catch (error) {
    console.error('[Push] Failed to initialize push notifications:', error);
  }
};

/**
 * Set up push notification event listeners
 */
const setupPushListeners = (): void => {
  // Handle successful registration
  PushNotifications.addListener('registration', (token: Token) => {
    console.log('[Push] Registration successful, token:', token.value);
    // TODO: Send token to your backend to store for the user
    // This token is used to send push notifications to this device
    savePushToken(token.value);
  });

  // Handle registration errors
  PushNotifications.addListener('registrationError', (error: any) => {
    console.error('[Push] Registration error:', error);
  });

  // Handle push notification received while app is in foreground
  PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
    console.log('[Push] Notification received in foreground:', notification);
    // You can show an in-app notification here
    handleForegroundNotification(notification);
  });

  // Handle push notification tap (app opened from notification)
  PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
    console.log('[Push] Notification action performed:', action);
    // Navigate to relevant screen based on notification data
    handleNotificationTap(action);
  });
};

/**
 * Save push token to backend (implement based on your backend)
 */
const savePushToken = async (token: string): Promise<void> => {
  // TODO: Implement API call to save token to your backend
  // Example:
  // await fetch('/api/push-tokens', {
  //   method: 'POST',
  //   body: JSON.stringify({ token, platform: Capacitor.getPlatform() }),
  // });
  console.log('[Push] Token to save:', token);
  
  // Store locally as fallback
  try {
    localStorage.setItem('push_token', token);
  } catch (e) {
    console.error('[Push] Failed to store token locally:', e);
  }
};

/**
 * Handle notification received while app is in foreground
 */
const handleForegroundNotification = (notification: PushNotificationSchema): void => {
  // You might want to show a toast or in-app banner
  console.log('[Push] Foreground notification:', {
    title: notification.title,
    body: notification.body,
    data: notification.data,
  });
};

/**
 * Handle notification tap - navigate to relevant screen
 */
const handleNotificationTap = (action: ActionPerformed): void => {
  const data = action.notification.data;
  
  // Navigate based on notification type/data
  if (data?.type === 'offer' && data?.offerId) {
    window.location.href = `/offer/${data.offerId}`;
  } else if (data?.type === 'payment') {
    window.location.href = '/payments';
  } else if (data?.type === 'earnings') {
    window.location.href = '/earnings';
  } else if (data?.deepLink) {
    window.location.href = data.deepLink;
  }
};

/**
 * Get the stored push token
 */
export const getPushToken = (): string | null => {
  try {
    return localStorage.getItem('push_token');
  } catch (e) {
    return null;
  }
};

/**
 * Remove all push notification listeners (cleanup)
 */
export const removePushListeners = async (): Promise<void> => {
  await PushNotifications.removeAllListeners();
};
