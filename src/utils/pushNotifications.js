import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import apiClient from '../api/apiClient';

const DEVICE_TOKEN_STORAGE_KEY = 'fcm_device_token';

export const isNativePlatform = () => Capacitor.isNativePlatform();

export const requestPushPermissions = async () => {
  if (!isNativePlatform()) return { granted: true };
  try {
    const permission = await PushNotifications.requestPermissions();
    return permission;
  } catch (error) {
    console.error('Push permission request failed', error);
    return { granted: false };
  }
};

export const registerPushNotifications = async (user, token) => {
  if (!isNativePlatform()) return null;
  try {
    await PushNotifications.register();
    const result = await PushNotifications.addListener('registration', async ({ value }) => {
      if (!value) return;
      localStorage.setItem(DEVICE_TOKEN_STORAGE_KEY, value);
      if (user?.id) {
        await apiClient.post('/device/register/', {
          device_token: value,
          platform: 'android',
          app_version: '1.0.0',
          device_name: Capacitor.getPlatform(),
        });
      }
    });

    const currentToken = localStorage.getItem(DEVICE_TOKEN_STORAGE_KEY);
    if (currentToken) {
      await apiClient.post('/device/register/', {
        device_token: currentToken,
        platform: 'android',
        app_version: '1.0.0',
        device_name: Capacitor.getPlatform(),
      });
    }

    return result;
  } catch (error) {
    console.error('Push registration failed', error);
    return null;
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
  if (!isNativePlatform()) return;
  try {
    if (token) {
      await apiClient.post('/device/unregister/', { device_token: token });
    }
  } catch (error) {
    console.error('Push unregistration failed', error);
  }
};

export const setupPushNotificationHandlers = async () => {
  if (!isNativePlatform()) return;
  try {
    await PushNotifications.addListener('registration', async ({ value }) => {
      if (!value) return;
      localStorage.setItem(DEVICE_TOKEN_STORAGE_KEY, value);
    });

    await PushNotifications.addListener('registrationError', (error) => {
      console.error('Push registration error', error);
    });

    await PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Foreground notification received', notification);
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
      console.log('Notification action performed', action);
    });
  } catch (error) {
    console.error('Push handler setup failed', error);
  }
};
