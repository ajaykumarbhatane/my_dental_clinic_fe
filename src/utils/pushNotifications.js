import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import apiClient from '../api/apiClient';

const DEVICE_TOKEN_STORAGE_KEY = 'fcm_device_token';
let listenersInitialized = false;
let registrationInFlight = null;
let registrationCompleted = false;

const isAndroidPlatform = () => Capacitor.getPlatform() === 'android';

const logContext = (message, extra = {}) => {
  console.log(`[push] ${message}`, extra);
};

const postDeviceTokenToBackend = async (value, user) => {
  if (!value) {
    logContext('Skipping backend registration: missing FCM token');
    return;
  }

  const authToken = localStorage.getItem('token') || sessionStorage.getItem('token');
  logContext('Calling backend device registration', {
    userId: user?.id,
    platform: Capacitor.getPlatform(),
    tokenLength: value.length,
    authHeaderPresent: Boolean(authToken),
  });

  try {
    const response = await apiClient.post('/device/register/', {
      device_token: value,
      platform: 'android',
      app_version: '1.0.0',
      device_name: Capacitor.getPlatform(),
    });
    logContext('Backend device registration succeeded', {
      userId: user?.id,
      status: response?.status,
    });
  } catch (error) {
    console.error('[push] Backend device registration failed', {
      status: error.response?.status,
      message: error.response?.data?.detail || error.message,
      userId: user?.id,
    });
  }
};

export const isNativePlatform = () => Capacitor.isNativePlatform();

export const resetPushRegistrationState = () => {
  listenersInitialized = false;
  registrationInFlight = null;
  registrationCompleted = false;
};

export const requestPushPermissions = async () => {
  if (!isAndroidPlatform()) {
    logContext('Skipping permission request: platform is not android', { platform: Capacitor.getPlatform() });
    return { granted: true };
  }

  try {
    const permission = await PushNotifications.requestPermissions();
    const granted = permission?.receive?.granted || permission?.granted === true;
    logContext('Permission result', { granted, platform: Capacitor.getPlatform(), permission });
    return { granted };
  } catch (error) {
    console.error('[push] Permission request failed', error);
    return { granted: false };
  }
};

export const registerPushNotifications = async (user, token) => {
  if (!isAndroidPlatform()) {
    logContext('Skipping push registration because platform is not android', { platform: Capacitor.getPlatform() });
    return null;
  }

  if (!token) {
    console.warn('[push] Skipping push registration because auth token is missing');
    return null;
  }

  if (registrationCompleted) {
    logContext('Push registration already completed for this session');
    return null;
  }

  if (registrationInFlight) {
    logContext('Push registration is already in progress');
    return registrationInFlight;
  }

  registrationInFlight = (async () => {
    console.log('========== LOGIN SUCCESS ==========' );
    console.log('[push] Token stored');
    console.log('[push] Starting push registration');

    const permission = await requestPushPermissions();
    if (!permission?.granted) {
      console.warn('[push] Permission denied; skipping registration');
      return null;
    }

    console.log('[push] Permission granted');
    await setupPushNotificationHandlers();

    const registrationHandler = async ({ value }) => {
      if (!value) {
        console.warn('[push] Registration listener fired without a token');
        return;
      }

      localStorage.setItem(DEVICE_TOKEN_STORAGE_KEY, value);
      console.log('========== FCM TOKEN RECEIVED ==========' );
      console.log(value);
      console.log('======================================');
      await postDeviceTokenToBackend(value, user);
    };

    console.log('[push] Calling PushNotifications.register()');
    await PushNotifications.addListener('registration', registrationHandler);
    await PushNotifications.register();

    const currentToken = localStorage.getItem(DEVICE_TOKEN_STORAGE_KEY);
    if (currentToken) {
      await postDeviceTokenToBackend(currentToken, user);
    } else {
      console.warn('[push] Registration listener never fired and no cached FCM token is available');
    }

    registrationCompleted = true;
    return registrationHandler;
  })();

  try {
    return await registrationInFlight;
  } catch (error) {
    console.error('[push] Push registration failed', error);
    return null;
  } finally {
    registrationInFlight = null;
  }
};

export const refreshPushToken = async (oldToken, newToken) => {
  if (!oldToken || !newToken) return;
  try {
    await apiClient.post('/device/refresh-token/', { old_token: oldToken, new_token: newToken });
  } catch (error) {
    console.error('Token refresh failed', error);
  }
};

export const unregisterPushNotifications = async (token) => {
  if (!isAndroidPlatform()) return;
  try {
    if (token) {
      await apiClient.post('/device/unregister/', { device_token: token });
    }
  } catch (error) {
    console.error('Push unregistration failed', error);
  }
};

export const setupPushNotificationHandlers = async () => {
  if (!isAndroidPlatform()) return;
  if (listenersInitialized) {
    logContext('Push notification handlers are already initialized');
    return;
  }

  try {
    await PushNotifications.addListener('registrationError', (error) => {
      console.error('[push] Registration error', error);
    });

    await PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('[push] Foreground notification received', notification);
      LocalNotifications.schedule({
        notifications: [
          {
            title: notification.title || 'New notification',
            body: notification.body || 'You have a new update',
            id: Date.now(),
            schedule: { at: new Date(Date.now() + 1000), allowWhileIdle: true },
            extra: notification.data || {},
          },
        ],
      });
    });

    await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log('[push] Notification action performed', action);
    });

    listenersInitialized = true;
  } catch (error) {
    console.error('[push] Push handler setup failed', error);
  }
};
