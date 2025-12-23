import { Platform } from 'react-native';
import logger from './logger';

// Safely import Constants with fallback
let Constants;
try {
  Constants = require('expo-constants').default || require('expo-constants');
} catch (e) {
  // expo-constants not available - use fallback
  Constants = {};
  if (__DEV__) {
    logger.warn('[getBaseUrl] expo-constants not available, using fallback detection');
  }
}

/**
 * Get the API base URL for the current environment
 * 
 * Configuration Priority:
 * 1. EXPO_PUBLIC_API_URL environment variable (highest priority - set in .env file)
 * 2. Platform-specific defaults (fallback)
 * 3. Production URL (when not in development)
 * 
 * To update your IP address:
 * 1. Find your IP: Run `ipconfig getifaddr en0` in terminal
 * 2. Create/update .env file: EXPO_PUBLIC_API_URL=http://YOUR_IP:4000
 * 3. Or update the default IP below
 */
export const getBaseUrl = () => {
  // Production environment
  if (!__DEV__) {
    return 'https://eazworld.com';
  }

  // Development environment
  // Priority 1: Environment variable (allows override for all platforms)
  // Set this in Saysay/.env file: EXPO_PUBLIC_API_URL=http://YOUR_IP:4000
  if (process.env.EXPO_PUBLIC_API_URL) {
    const envUrl = process.env.EXPO_PUBLIC_API_URL.trim();
    const url = envUrl.replace(/\/+$/, '');
    
    // Validate URL format
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      logger.warn('[getBaseUrl] ⚠️ Invalid EXPO_PUBLIC_API_URL format (missing http://), using default');
    } else {
      logger.debug('[getBaseUrl] ✅ Using EXPO_PUBLIC_API_URL from .env:', url);
      return url;
    }
  }

  // Priority 2: Platform-specific defaults
  // ⚠️ DEVELOPMENT ONLY: This IP is only used in __DEV__ mode
  // ⚠️ Production builds NEVER use this IP - they use https://eazworld.com
  // ⚠️ UPDATE THIS IP if your network IP changes (or use .env file instead)
  // To find your IP: Run `ipconfig getifaddr en0` in terminal
  const NETWORK_IP = '10.29.14.240'; // 👈 DEVELOPMENT ONLY - Not used in production
  
  if (Platform.OS === 'android') {
    // Check if running on Android emulator
    // Android emulator uses special IP 10.0.2.2 to access host machine's localhost
    // Use safe property access with fallbacks
    const executionEnvironment = Constants?.executionEnvironment;
    const deviceName = Constants?.deviceName || '';
    const isDevice = Constants?.isDevice;
    
    // Detect emulator: not standalone build AND (deviceName contains emulator/sdk OR isDevice is false)
    const isEmulator = executionEnvironment !== 'standalone' && 
      (deviceName.toLowerCase().includes('emulator') || 
       deviceName.toLowerCase().includes('sdk') ||
       deviceName.toLowerCase().includes('google_sdk') ||
       isDevice === false);
    
    if (isEmulator) {
      // Android Emulator: Use 10.0.2.2 to access host machine
      const emulatorUrl = 'http://10.0.2.2:4000';
      logger.debug('[getBaseUrl] 🤖 Android Emulator - Using 10.0.2.2:', emulatorUrl);
      logger.debug('[getBaseUrl] 💡 For physical Android device, set EXPO_PUBLIC_API_URL=http://YOUR_IP:4000');
      return emulatorUrl;
    } else {
      // Physical Android device: Use network IP
      const androidUrl = `http://${NETWORK_IP}:4000`;
      logger.debug('[getBaseUrl] 📱 Android Device - Using network IP:', androidUrl);
      logger.debug('[getBaseUrl] 💡 To update: Set EXPO_PUBLIC_API_URL in .env or update NETWORK_IP constant');
      return androidUrl;
    }
  }

  // iOS Simulator and Physical iOS devices
  // iOS Simulator can use localhost, but network IP works for both
  const executionEnvironment = Constants?.executionEnvironment;
  const isDevice = Constants?.isDevice;
  
  // Detect iOS Simulator: not standalone build AND isDevice is false
  const isIOSSimulator = executionEnvironment !== 'standalone' && isDevice === false;
  
  if (isIOSSimulator) {
    // iOS Simulator: Can use localhost or network IP
    const simulatorUrl = `http://localhost:4000`;
    logger.debug('[getBaseUrl] 🍎 iOS Simulator - Using localhost:', simulatorUrl);
    logger.debug(`[getBaseUrl] 💡 If this doesn't work, set EXPO_PUBLIC_API_URL=http://${NETWORK_IP}:4000`);
    return simulatorUrl;
  } else {
    // Physical iOS device: Use network IP
    const iosUrl = `http://${NETWORK_IP}:4000`;
    logger.debug('[getBaseUrl] 📱 iOS Device - Using network IP:', iosUrl);
    logger.debug('[getBaseUrl] 💡 To update: Set EXPO_PUBLIC_API_URL in .env or update NETWORK_IP constant');
    return iosUrl;
  }
};

export const getApiBaseUrl = () => {
  const baseUrl = getBaseUrl();
  return `${baseUrl}/api/v1`;
};

export default getBaseUrl;
