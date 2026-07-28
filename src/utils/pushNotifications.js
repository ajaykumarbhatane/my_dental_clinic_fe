import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import apiClient from '../api/apiClient';

const DEVICE_TOKEN_STORAGE_KEY = 'fcm_device_token';

const log = (msg, data = {}) => console.log(`[DEVICE_REG] ${msg}`, data);
const err = (msg, error, data = {}) => console.error(`[DEVICE_REG_ERROR] ${msg}`, error, data);

export const isNativePlatform = () => Capacitor.isNativePlatform();

const getDevicePlatform = () => {
  try {
    return Capacitor.getPlatform();
  } catch (e) {
    return 'unknown';
  }
};

export const registerDeviceToken = async (user, authToken) => {
  if (!user || !authToken) {
    log('SKIP: missing user or authToken', { userId: user?.id, hasToken: !!authToken });
    return null;
  }

  const platform = getDevicePlatform();
  
  log('START: Device token registration', { userId: user?.id, platform });

  // If Android, try to get FCM token from native Capacitor
  if (platform === 'android') {
    try {
      log('ANDROID: Requesting permissions');
      const permission = await PushNotifications.requestPermissions();
      const granted = permission?.receive?.granted === true || permission?.granted === true;
      
      if (!granted) {
        log('ANDROID: Permission denied', { permission });
        return null;
      }

      log('ANDROID: Permission granted, setting up handlers');
      
      // Setup error handler
      await PushNotifications.addListener('registrationError', (error) => {
        err('ANDROID: FCM registration error', error);
      });

      // Setup notification handlers
      await PushNotifications.addListener('pushNotificationReceived', (notification) => {
        log('ANDROID: Notification received (foreground)', { title: notification.title });
        LocalNotifications.schedule({
          notifications: [{
            title: notification.title || 'New notification',
            body: notification.body || 'Update',
            id: Date.now(),
            schedule: { at: new Date(Date.now() + 1000), allowWhileIdle: true },
          }],
        });
      });

      // Setup the crucial registration listener
      let tokenReceived = false;
      await PushNotifications.addListener('registration', async (result) => {
        const fcmToken = result?.value;
        log('ANDROID: Registration listener fired', { hasToken: !!fcmToken, tokenLength: fcmToken?.length });
        
        if (!fcmToken) {
          log('ANDROID: Token is empty in listener');
          return;
        }

        tokenReceived = true;
        localStorage.setItem(DEVICE_TOKEN_STORAGE_KEY, fcmToken);
        
        // Post to backend
        await postTokenToBackend(fcmToken, user, 'android');
      });

      log('ANDROID: Calling PushNotifications.register()');
      await PushNotifications.register();

      // Wait for listener to fire
      await sleep(3000);

      // If listener didn't fire, check cached token
      if (!tokenReceived) {
        log('ANDROID: Listener never fired, checking cache');
        const cachedToken = localStorage.getItem(DEVICE_TOKEN_STORAGE_KEY);
        if (cachedToken) {
          log('ANDROID: Found cached token');
          await postTokenToBackend(cachedToken, user, 'android');
        } else {
          err('ANDROID: No token in listener or cache', new Error('FCM token unavailable'));
        }
      }

      return true;
    } catch (error) {
      err('ANDROID: Registration failed', error);
      return null;
    }
  } else {
    // For web/testing: generate fake token and post to backend
    log(`${platform.toUpperCase()}: Not native Android, using fallback token`);
    const fallbackToken = `${platform}-${user.id}-${Date.now()}`;
    localStorage.setItem(DEVICE_TOKEN_STORAGE_KEY, fallbackToken);
    await postTokenToBackend(fallbackToken, user, platform);
    return true;
  }
};

const postTokenToBackend = async (deviceToken, user, platform) => {
  if (!deviceToken) {
    log('SKIP: Empty device token');
    return;
  }

  log('POSTING to backend', { tokenLength: deviceToken.length, userId: user?.id, platform });

  try {
    const response = await apiClient.post('/device/register/', {
      device_token: deviceToken,
      platform: platform === 'android' ? 'android' : 'web',
      app_version: '1.0.0',
      device_name: getDevicePlatform(),
    });

    log('✓ BACKEND POST SUCCEEDED', { 
      status: response?.status, 
      userId: user?.id,
      deviceId: response?.data?.id,
    });
    return response.data;
  } catch (error) {
    err('✗ BACKEND POST FAILED', error, {
      status: error.response?.status,
      message: error.response?.data?.detail || error.message,
      userId: user?.id,
    });
    return null;
  }
};

export const unregisterDevice = async (deviceToken) => {
  if (!deviceToken) return;
  
  try {
    await apiClient.post('/device/unregister/', { device_token: deviceToken });
    log('Device unregistered');
  } catch (error) {
    err('Unregister failed', error);
  }
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

