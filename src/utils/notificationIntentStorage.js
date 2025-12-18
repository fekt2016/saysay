import * as SecureStore from 'expo-secure-store';
import logger from './logger';

const NOTIFICATION_INTENT_KEY = 'pending_notification_intent';

export const storeNotificationIntent = async (notificationData) => {
  try {
    const dataString = JSON.stringify(notificationData);
    await SecureStore.setItemAsync(NOTIFICATION_INTENT_KEY, dataString);
    return true;
  } catch (error) {
    logger.error('[notificationIntentStorage] Error storing notification intent:', error);
    return false;
  }
};

export const getAndClearNotificationIntent = async () => {
  try {
    const stored = await SecureStore.getItemAsync(NOTIFICATION_INTENT_KEY);
    if (!stored) {
      return null;
    }

    await SecureStore.deleteItemAsync(NOTIFICATION_INTENT_KEY);

    return JSON.parse(stored);
  } catch (error) {
    logger.error('[notificationIntentStorage] Error getting notification intent:', error);

    try {
      await SecureStore.deleteItemAsync(NOTIFICATION_INTENT_KEY);
    } catch (clearError) {
      logger.error('[notificationIntentStorage] Error clearing notification intent:', clearError);
    }
    return null;
  }
};

export const hasPendingNotificationIntent = async () => {
  try {
    const stored = await SecureStore.getItemAsync(NOTIFICATION_INTENT_KEY);
    return !!stored;
  } catch (error) {
    return false;
  }
};

export const clearNotificationIntent = async () => {
  try {
    await SecureStore.deleteItemAsync(NOTIFICATION_INTENT_KEY);
  } catch (error) {
    logger.error('[notificationIntentStorage] Error clearing notification intent:', error);
  }
};


