import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import apiClient from '../api/apiClient';

const DEVICE_TOKEN_STORAGE_KEY = 'fcm_device_token';
let listenersInitialized = false;
let registrationInFlight = null;
let registrationCompleted = false;
let registrationTimeout = null;

const debugLog = (message, extra = {}) => {
  const timestamp = new Date().toISOString();
  console.log(`[PUSH_DEBUG ${timestamp}] ${message}`, extra);
};

const debugError = (message, error, extra = {}) => {
  const timestamp = new Date().toISOString();
  console.error(`[PUSH_ERROR ${timestamp}] ${message}`, error, extra);
};

const isAndroidPlatform = () => {
  const platform = Capacitor.getPlatform();
  debugLog('Platform detection check', { platform, isAndroid: platform === 'android' });
  return platform === 'android';
};

const postDeviceTokenToBackend = async (value, user) => {
  if (!value) {
    debugError('Cannot post FCM token to backend', new Error('Token is empty'), { userId: user?.id });
    return;
  }

  const authToken = localStorage.getItem('token') || sessionStorage.getItem('token');
  debugLog('Preparing backend device registration POST', {
    userId: user?.id,
    platform: Capacitor.getPlatform(),
    tokenLength: value.length,
    tokenPrefix: value?.substring(0, 20),
    authTokenPresent: Boolean(authToken),
    authTokenLength: authToken?.length,
  });

  try {
    debugLog('Sending POST /device/register/', {
      url: '/device/register/',
      method: 'POST',
      payload: {
        device_token: value.substring(0, 20) + '...',
        platform: 'android',
        app_version: '1.0.0',
        device_name: Capacitor.getPlatform(),
      },
    });

    const response = await apiClient.post('/device/register/', {
      device_token: value,
      platform: 'android',
      app_version: '1.0.0',
      device_name: Capacitor.getPlatform(),
    });

    debugLog('✓ POST /device/register/ SUCCEEDED', {
      userId: user?.id,
      status: response?.status,
      responseData: response?.data,
    });
  } catch (error) {
    debugError('✗ POST /device/register/ FAILED', error, {
      status: error.response?.status,
      statusText: error.response?.statusText,
      errorMessage: error.response?.data?.detail || error.message,
      userId: user?.id,
      errorCode: error.code,
    });
  }
};

export const isNativePlatform = () => {
  const isNative = Capacitor.isNativePlatform();
  debugLog('Native platform check', { isNative });
  return isNative;
};

export const resetPushRegistrationState = () => {
  debugLog('Resetting push registration state');
  if (registrationTimeout) {
    clearTimeout(registrationTimeout);
    registrationTimeout = null;
  }
  listenersInitialized = false;
  registrationInFlight = null;
  registrationCompleted = false;
};

export const requestPushPermissions = async () => {
  debugLog('STEP 1: Requesting push permissions');

  if (!isAndroidPlatform()) {
    debugLog('STEP 1 SKIP: Not Android platform', { platform: Capacitor.getPlatform() });
    return { granted: true };
  }

  try {
    debugLog('STEP 1: Calling PushNotifications.requestPermissions()');
    const permission = await PushNotifications.requestPermissions();
    debugLog('STEP 1: Permission response received', { permission, keys: Object.keys(permission) });

    const granted = permission?.receive?.granted === true || permission?.granted === true;
    debugLog('STEP 1 RESULT', { granted, permission });
    return { granted };
  } catch (error) {
    debugError('STEP 1 FAILED: Permission request error', error, { errorType: error.constructor.name });
    return { granted: false };
  }
};

export const registerPushNotifications = async (user, token) => {
  debugLog('===== PUSH REGISTRATION START =====', { userId: user?.id, hasAuthToken: !!token });

  if (!isAndroidPlatform()) {
    debugLog('ABORT: Not Android platform', { platform: Capacitor.getPlatform() });
    return null;
  }

  if (!token) {
    debugError('ABORT: No auth token', new Error('Auth token is missing'), { userId: user?.id });
    return null;
  }

  if (registrationCompleted) {
    debugLog('ABORT: Registration already completed in this session', { userId: user?.id });
    return null;
  }

  if (registrationInFlight) {
    debugLog('ABORT: Registration is already in flight', { userId: user?.id });
    return registrationInFlight;
  }

  registrationInFlight = (async () => {
    try {
      debugLog('STEP 1: Request permissions');
      const permission = await requestPushPermissions();

      if (!permission?.granted) {
        debugError('STEP 1 FAILED: Permission denied', new Error('User denied notification permission'), { userId: user?.id });
        return null;
      }

      debugLog('STEP 1 SUCCESS: Permission granted');

      debugLog('STEP 2: Setup push notification handlers');
      await setupPushNotificationHandlers();
      debugLog('STEP 2 SUCCESS: Handlers setup complete');

      debugLog('STEP 3: Setup registration listener');
      let listenerCalled = false;
      const registrationHandler = async ({ value }) => {
        listenerCalled = true;
        debugLog('>>> REGISTRATION LISTENER FIRED <<<', { hasValue: !!value, tokenLength: value?.length });

        if (!value) {
          debugError('Listener fired with empty token', new Error('No FCM token in listener'), { userId: user?.id });
          return;
        }

        localStorage.setItem(DEVICE_TOKEN_STORAGE_KEY, value);
        debugLog('FCM TOKEN STORED', { 
          token: value.substring(0, 30) + '...', 
          length: value.length 
        });

        await postDeviceTokenToBackend(value, user);
      };

      await PushNotifications.addListener('registration', registrationHandler);
      debugLog('STEP 3 SUCCESS: Registration listener attached');

      debugLog('STEP 4: Call PushNotifications.register()');
      await PushNotifications.register();
      debugLog('STEP 4 SUCCESS: PushNotifications.register() completed');

      // Wait a bit for the listener to fire
      debugLog('STEP 5: Waiting for FCM token (max 5 seconds)');
      await new Promise(resolve => setTimeout(resolve, 5000));

      debugLog('STEP 6: Check if token was received');
      if (!listenerCalled) {
        debugLog('WARNING: Registration listener was never called', { userId: user?.id });
      }

      const currentToken = localStorage.getItem(DEVICE_TOKEN_STORAGE_KEY);
      if (currentToken) {
        debugLog('STEP 6: Found cached token, posting to backend', { tokenLength: currentToken.length });
        await postDeviceTokenToBackend(currentToken, user);
      } else {
        debugError('STEP 6 FAILED: No FCM token received or cached', new Error('FCM token unavailable'), { 
          userId: user?.id,
          listenerCalled,
        });
      }

      registrationCompleted = true;
      debugLog('===== PUSH REGISTRATION COMPLETE =====', { userId: user?.id, success: !!currentToken });
      return registrationHandler;
    } catch (error) {
      debugError('PUSH REGISTRATION EXCEPTION', error, { 
        userId: user?.id,
        errorType: error.constructor.name,
        stack: error.stack,
      });
      return null;
    }
  })();

  try {
    return await registrationInFlight;
  } catch (error) {
    debugError('Registration promise rejected', error);
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
    debugError('Token refresh failed', error);
  }
};

export const unregisterPushNotifications = async (token) => {
  if (!isAndroidPlatform()) return;
  debugLog('Unregistering device token');
  try {
    if (token) {
      await apiClient.post('/device/unregister/', { device_token: token });
      debugLog('Device token unregistered successfully');
    }
  } catch (error) {
    debugError('Push unregistration failed', error);
  }
};

export const setupPushNotificationHandlers = async () => {
  if (!isAndroidPlatform()) {
    debugLog('Skipping handler setup: not Android');
    return;
  }
  if (listenersInitialized) {
    debugLog('Handlers already initialized');
    return;
  }

  try {
    debugLog('Setting up registrationError handler');
    await PushNotifications.addListener('registrationError', (error) => {
      debugError('>>> REGISTRATION ERROR LISTENER <<<', error, { errorData: error });
    });

    debugLog('Setting up pushNotificationReceived handler');
    await PushNotifications.addListener('pushNotificationReceived', (notification) => {
      debugLog('Foreground notification received', notification);
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

    debugLog('Setting up pushNotificationActionPerformed handler');
    await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      debugLog('Notification action performed', action);
    });

    listenersInitialized = true;
    debugLog('All push handlers initialized successfully');
  } catch (error) {
    debugError('Push handler setup failed', error);
  }
};
