import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import apiClient from '../api/apiClient';

const DEVICE_TOKEN_STORAGE_KEY = 'fcm_device_token';

const timestamp = () => new Date().toISOString();
const log = (msg, data = {}) => console.log(`[${timestamp()}][DEVICE_REG] ${msg}`, data);
const err = (msg, error, data = {}) => console.error(`[${timestamp()}][DEVICE_REG_ERROR] ${msg}`, error, data);
const step = (number, msg, data = {}) => log(`STEP ${number}: ${msg}`, data);

const getDevicePlatform = () => {
  try {
    return Capacitor.getPlatform();
  } catch (e) {
    return 'unknown';
  }
};

const isNativeAndroid = () => {
  try {
    const platform = getDevicePlatform();
    const isNative = Capacitor.isNativePlatform?.() ?? false;
    return isNative && platform === 'android';
  } catch (e) {
    return false;
  }
};

const ensureAppointmentChannel = async () => {
  if (!isNativeAndroid()) {
    return;
  }

  try {
    await LocalNotifications.createChannel({
      id: 'appointments',
      name: 'Appointment Reminders',
      description: 'Appointment reminder notifications and quick actions.',
      importance: 4,
      sound: 'default',
      lights: true,
      vibration: true,
    });
    log('ANDROID: Appointment notification channel ensured');
  } catch (error) {
    console.warn('ANDROID: Failed to create appointments notification channel', error);
  }
};

const waitForRegistration = async () => {
  let registrationHandle = null;
  let errorHandle = null;

  return new Promise(async (resolve, reject) => {
    const cleanup = async () => {
      try {
        await registrationHandle?.remove();
      } catch (e) {
        console.warn('[DEVICE_REG] cleanup registrationHandle failed', e);
      }
      try {
        await errorHandle?.remove();
      } catch (e) {
        console.warn('[DEVICE_REG] cleanup errorHandle failed', e);
      }
    };

    try {
      registrationHandle = await PushNotifications.addListener('registration', (result) => {
        log('ANDROID: registration event', { result });
        const token = result?.value;
        if (!token) {
          err('ANDROID: registration event returned no token', result);
          cleanup();
          return reject(new Error('Push registration returned no token'));
        }
        cleanup();
        resolve(token);
      });

      errorHandle = await PushNotifications.addListener('registrationError', (error) => {
        err('ANDROID: registrationError event', error);
        cleanup();
        reject(new Error(`Push registration error: ${JSON.stringify(error)}`));
      });
    } catch (listenError) {
      err('ANDROID: Failed to attach PushNotifications listeners', listenError);
      await cleanup();
      reject(listenError);
    }
  });
};

export const registerDeviceToken = async (user, authToken) => {
  if (!user || !authToken) {
    step(1, 'SKIP: missing user or authToken', { userId: user?.id, hasToken: !!authToken });
    return null;
  }

  const platform = getDevicePlatform();
  const nativeAndroid = isNativeAndroid();
  step(2, 'Beginning device registration', { userId: user?.id, platform, nativeAndroid, PushNotificationsType: typeof PushNotifications });

  if (nativeAndroid) {
    try {
      step(3, 'Requesting push notification permission on Android');
      const permission = await PushNotifications.requestPermissions();
      step(4, 'Push notification permission response', { permission });

      const granted = permission?.receive?.granted === true || permission?.granted === true;
      if (permission.receive !== "granted") {
          step(5, "Permission denied");
          return;
      }

      step(6, 'Push permission granted; preparing registration');
      const cachedToken = localStorage.getItem(DEVICE_TOKEN_STORAGE_KEY);
      if (cachedToken) {
        log('ANDROID: Using cached device token before registration', { cachedTokenLength: cachedToken.length });
      }

      await ensureAppointmentChannel();
      step(7, 'Attaching registration event handlers');
      const registrationPromise = waitForRegistration();

      step(8, 'Calling PushNotifications.register()');
      await PushNotifications.register();

      step(9, 'Waiting for FCM token from registration event');
      const fcmToken = await Promise.race([
        registrationPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('FCM registration timeout after 20 seconds')), 20000)),
      ]);

      step(10, 'FCM token received', { tokenLength: fcmToken?.length, tokenPreview: fcmToken?.slice(0, 20) });
      localStorage.setItem(DEVICE_TOKEN_STORAGE_KEY, fcmToken);

      await postTokenToBackend(fcmToken, user, 'android');
      return true;
    } catch (error) {
      err('ANDROID: Push registration failed', error);

      // If FCM registration failed, still check for a cached token to avoid losing an already generated token.
      const fallbackToken = localStorage.getItem(DEVICE_TOKEN_STORAGE_KEY);
      if (fallbackToken) {
        step(11, 'Using cached FCM token after registration failure', { fallbackTokenLength: fallbackToken.length });
        await postTokenToBackend(fallbackToken, user, 'android');
        return true;
      }

      return null;
    }
  }

  step(12, 'Non-Android platform detected; using web fallback token', { platform });
  const fallbackToken = `${platform}-${user.id}-${Date.now()}`;
  localStorage.setItem(DEVICE_TOKEN_STORAGE_KEY, fallbackToken);
  await postTokenToBackend(fallbackToken, user, platform);
  return true;
};

const postTokenToBackend = async (deviceToken, user, platform) => {
  if (!deviceToken) {
    step(13, 'SKIP: Empty device token');
    return null;
  }

  step(14, 'Posting device token to backend', { tokenLength: deviceToken.length, userId: user?.id, platform });

  try {
    const response = await apiClient.post('/device/register/', {
      device_token: deviceToken,
      platform: platform === 'android' ? 'android' : 'web',
      app_version: '1.0.0',
      device_name: getDevicePlatform(),
    });

    step(15, 'Backend registration succeeded', { status: response?.status, userId: user?.id, deviceId: response?.data?.id });
    return response.data;
  } catch (error) {
    err('ANDROID: Backend registration failed', error, {
      status: error.response?.status,
      data: error.response?.data,
      userId: user?.id,
      deviceTokenPreview: deviceToken?.slice(0, 20),
    });
    return null;
  }
};

export const unregisterDevice = async (deviceToken) => {
  if (!deviceToken) return;
  try {
    await apiClient.post('/device/unregister/', { device_token: deviceToken });
    step(16, 'Device unregistered', { tokenPreview: deviceToken.slice(0, 20) });
  } catch (error) {
    err('ANDROID: Unregister failed', error, { tokenPreview: deviceToken?.slice(0, 20) });
  }
};

