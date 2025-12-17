import { Platform } from 'react-native';
import logger from './logger';

export const getBaseUrl = () => {
  // Production environment
  if (!__DEV__) {
    return 'https://eazworld.com';
  }

  // Development environment
  // Priority 1: Environment variable (allows override for all platforms)
  if (process.env.EXPO_PUBLIC_API_URL) {
    const envUrl = process.env.EXPO_PUBLIC_API_URL.trim();
    const url = envUrl.replace(/\/+$/, '');
    logger.debug('[getBaseUrl] Using EXPO_PUBLIC_API_URL:', url);
    return url;
  }

  // Priority 2: Platform-specific defaults
  if (Platform.OS === 'android') {
    // Android Emulator uses special IP 10.0.2.2 to access host machine's localhost
    const androidUrl = 'http://10.0.2.2:4000';
    logger.debug('[getBaseUrl] Android Emulator - Using:', androidUrl);
    logger.debug('[getBaseUrl] Note: For physical Android devices, set EXPO_PUBLIC_API_URL to your Mac\'s network IP');
    return androidUrl;
  }

  // iOS Simulator and Physical iOS devices
  // Using localhost for iOS Simulator (works for simulator only)
  // For physical iOS devices, set EXPO_PUBLIC_API_URL to your Mac's network IP
  const defaultIOSUrl = 'http://localhost:4000';
  
  logger.debug('[getBaseUrl] 📱 iOS - Using localhost:', defaultIOSUrl);
  logger.debug('[getBaseUrl] 💡 This works for iOS Simulator');
  logger.debug('[getBaseUrl] 💡 For physical iOS devices, set: EXPO_PUBLIC_API_URL=http://YOUR_MAC_IP:4000');
  logger.debug('[getBaseUrl] 💡 To use network IP, set: EXPO_PUBLIC_API_URL=http://10.194.166.240:4000');
  
  return defaultIOSUrl;
};

export const getApiBaseUrl = () => {
  const baseUrl = getBaseUrl();
  return `${baseUrl}/api/v1`;
};

export default getBaseUrl;


