import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_ID_KEY = 'wishlist_session_id';

export const getSessionId = async () => {
  try {
    return await AsyncStorage.getItem(SESSION_ID_KEY);
  } catch (error) {
    console.error('Error getting session ID:', error);
    return null;
  }
};

export const generateSessionId = () => {
  return `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const saveSessionId = async (sessionId) => {
  try {
    await AsyncStorage.setItem(SESSION_ID_KEY, sessionId);
  } catch (error) {
    console.error('Error saving session ID:', error);
  }
};

export const clearSessionId = async () => {
  try {
    await AsyncStorage.removeItem(SESSION_ID_KEY);
  } catch (error) {
    console.error('Error clearing session ID:', error);
  }
};
