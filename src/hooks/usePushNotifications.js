import React, { useState, useRef, useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import useAuth from './useAuth';
import api from '../services/api';
import logger from '../utils/logger';

const EXPO_PROJECT_ID = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;

// Check if running in Expo Go (SDK 53+ removed Android push notifications from Expo Go)
// Expo Go has executionEnvironment === 'storeClient' or appOwnership === 'expo'
const isExpoGo = Constants?.executionEnvironment === 'storeClient' || 
                 (Constants?.appOwnership === 'expo' && !Constants?.expoConfig?.extra?.eas?.projectId);

export const usePushNotifications = () => {
  const { user, isAuthenticated } = useAuth();
  const [expoPushToken, setExpoPushToken] = useState(null);
  const [notification, setNotification] = useState(null);
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {

    const checkOnboardingAndRegister = async () => {
      try {
        const { hasCompletedOnboarding } = require('../utils/onboardingStorage');
        const onboardingCompleted = await hasCompletedOnboarding();

        if (!onboardingCompleted) {
          logger.debug('[PushNotifications] Onboarding not completed, skipping registration');
          return;
        }
      } catch (error) {
        logger.warn('[PushNotifications] Error checking onboarding status, skipping registration for safety:', error);
        return; 
      }

      if (!isAuthenticated || !user) {
        logger.debug('[PushNotifications] User not authenticated, skipping registration');
        return;
      }

      registerForPushNotificationsAsync()
        .then((token) => {
          if (token) {
            setExpoPushToken(token);
            registerDeviceToken(token);
          }
        })
        .catch((error) => {
          logger.error('[PushNotifications] Error registering:', error);
        });
    };

    checkOnboardingAndRegister();

    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      logger.debug('[PushNotifications] Notification received:', notification);
      setNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      logger.debug('[PushNotifications] Notification tapped:', response);
      setNotification(response.notification);
    });

    return () => {

      if (notificationListener.current) {
        try {
          if (typeof notificationListener.current.remove === 'function') {
            notificationListener.current.remove();
          } else if (Notifications.removeNotificationSubscription) {

            Notifications.removeNotificationSubscription(notificationListener.current);
          }
        } catch (error) {
          logger.warn('[PushNotifications] Error removing notification listener:', error);
        }
      }
      if (responseListener.current) {
        try {
          if (typeof responseListener.current.remove === 'function') {
            responseListener.current.remove();
          } else if (Notifications.removeNotificationSubscription) {

            Notifications.removeNotificationSubscription(responseListener.current);
          }
        } catch (error) {
          logger.warn('[PushNotifications] Error removing response listener:', error);
        }
      }
    };
  }, [isAuthenticated, user]);const registerDeviceToken = async (token) => {

    try {
      const { hasCompletedOnboarding } = require('../utils/onboardingStorage');
      const onboardingCompleted = await hasCompletedOnboarding();

      if (!onboardingCompleted) {
        logger.warn('[PushNotifications] ❌ Cannot register token: onboarding not completed');
        return;
      }
    } catch (error) {
      logger.warn('[PushNotifications] ❌ Cannot register token: error checking onboarding status', error);
      return; 
    }

    if (!user || !user.id) {
      logger.warn('[PushNotifications] ❌ Cannot register token: user ID missing', {
        hasUser: !!user,
        userId: user?.id,
      });
      return;
    }

    try {
      const platform = Platform.OS === 'ios' ? 'ios' : 'android';

      if (__DEV__) {
        logger.debug('[PushNotifications] 📱 Registering device token:', {
          userId: user.id,
          platform,
          tokenPrefix: token ? token.substring(0, 20) + '...' : 'null',
        });
      } else {
        logger.debug('[PushNotifications] 📱 Registering device token');
      }

      const response = await api.post('/notifications/register-device', {
        expoPushToken: token,
        platform,
        deviceInfo: {
          deviceName: Device.deviceName || 'Unknown',
          deviceModel: Device.modelName || 'Unknown',
          osVersion: Device.osVersion || 'Unknown',
        },
      });

      if (__DEV__) {
        logger.debug('[PushNotifications] ✅ Device token registered successfully:', {
          response: response.data,
          userId: user.id,
        });
      } else {
        logger.debug('[PushNotifications] ✅ Device token registered successfully');
      }
    } catch (error) {
      logger.error('[PushNotifications] ❌ Error registering device token:', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
        userId: user?.id,
      });

    }
  };const registerForPushNotificationsAsync = async () => {
    // SDK 53+: Android push notifications are not available in Expo Go
    if (Platform.OS === 'android' && isExpoGo) {
      logger.warn('[PushNotifications] ⚠️ Android push notifications are not available in Expo Go (SDK 53+)');
      logger.warn('[PushNotifications] ⚠️ Use a development build instead: https://docs.expo.dev/development/introduction/');
      logger.warn('[PushNotifications] ⚠️ Run: npx expo install expo-dev-client && npx expo run:android');
      return null;
    }

    if (!Device.isDevice) {
      logger.debug('[PushNotifications] ℹ️ Running on emulator/simulator - push notifications require a physical device');
      logger.debug('[PushNotifications] ℹ️ This is normal and expected. Push notifications will work on physical devices.');
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      logger.warn('[PushNotifications] Permission not granted');
      return null;
    }

    try {

      const projectId = EXPO_PROJECT_ID;

      let validProjectId = undefined;

      if (projectId) {

        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(projectId)) {
          validProjectId = projectId;
          if (__DEV__) {
            logger.debug('[PushNotifications] 🔑 Requesting Expo push token with projectId:', projectId);
          } else {
            logger.debug('[PushNotifications] 🔑 Requesting Expo push token with projectId');
          }
        } else {
          logger.warn('[PushNotifications] ⚠️ Invalid projectId format, using default Expo project');
          logger.debug('[PushNotifications] 🔑 Requesting Expo push token (using default Expo project)');
        }
      } else {
        logger.debug('[PushNotifications] 🔑 Requesting Expo push token (using default Expo project)');
      }

      const tokenConfig = validProjectId ? { projectId: validProjectId } : {};
      const token = await Notifications.getExpoPushTokenAsync(tokenConfig);

      if (__DEV__) {
        logger.debug('[PushNotifications] ✅ Expo push token obtained:', {
          tokenPrefix: token.data ? token.data.substring(0, 20) + '...' : 'null',
          hasToken: !!token.data,
          length: token.data ? token.data.length : 0,
        });
      } else {
        logger.debug('[PushNotifications] ✅ Expo push token obtained');
      }
      return token.data;
    } catch (error) {
      // Handle Expo Go Android push notification limitation (SDK 53+)
      if (Platform.OS === 'android' && isExpoGo) {
        logger.warn('[PushNotifications] ⚠️ Android push notifications not available in Expo Go (SDK 53+)');
        logger.warn('[PushNotifications] ⚠️ Use development build: npx expo install expo-dev-client && npx expo run:android');
      } else {
        logger.error('[PushNotifications] ❌ Error getting push token:', {
          error: error.message,
          code: error.code,
          details: error.details,
        });
      }
      return null;
    }
  };const unregisterDeviceToken = async () => {
    if (!expoPushToken) {
      return;
    }

    try {
      await api.delete('/notifications/register-device', {
        data: { expoPushToken },
      });
      logger.debug('[PushNotifications] Device token unregistered');
      setExpoPushToken(null);
    } catch (error) {
      logger.error('[PushNotifications] Error unregistering device token:', error);

      setExpoPushToken(null);
    }
  };

  return {
    expoPushToken,
    notification,
    unregisterDeviceToken,
  };
};

export default usePushNotifications;


