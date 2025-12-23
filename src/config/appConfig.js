/**
 * App Configuration
 * 
 * Centralized app configuration values
 * Update these values for app-wide settings
 */

import logger from '../utils/logger';

let Constants;
try {
  Constants = require('expo-constants').default;
} catch (e) {
  // expo-constants not available (shouldn't happen in Expo)
  Constants = { expoConfig: {} };
}

const getProjectIdFromConfig = () => {
  // Check environment variable first
  if (process.env.EXPO_PUBLIC_PROJECT_ID) {
    return process.env.EXPO_PUBLIC_PROJECT_ID;
  }
  
  // Check app.json via Constants
  const configProjectId = Constants.expoConfig?.extra?.eas?.projectId;
  
  // Handle null (set in app.json for development)
  if (configProjectId === null || configProjectId === undefined) {
    return undefined; // Use Expo Go default
  }
  
  // Validate UUID format (basic check)
  if (configProjectId && configProjectId !== 'REPLACE_WITH_REAL_EXPO_PROJECT_ID') {
    // Basic UUID validation (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(configProjectId)) {
      return configProjectId;
    }
    // Invalid UUID format - return undefined to avoid error
    // Only warn in development (this is a config issue, not a runtime error)
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      logger.warn('[appConfig] Invalid projectId format in app.json, using undefined (Expo Go default)');
    }
    return undefined;
  }
  
  // No valid project ID found - use undefined (Expo Go default)
  return undefined;
};

export const EXPO_PROJECT_ID = getProjectIdFromConfig();

export const APP_ENV = process.env.NODE_ENV || (typeof __DEV__ !== 'undefined' && __DEV__) ? 'development' : 'production';

export const APP_VERSION = '1.0.0';

export default {
  EXPO_PROJECT_ID,
  APP_ENV,
  APP_VERSION,
};
