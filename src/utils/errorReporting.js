/**
 * Error Reporting Service
 * 
 * Provides optional error reporting integration (Sentry, etc.)
 * Gracefully handles cases where error reporting is not configured
 */

let errorReportingService = null;

/**
 * Initialize error reporting service
 * Currently supports Sentry (optional - only if installed)
 */
export const initErrorReporting = () => {
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    // Skip error reporting in development
    return;
  }

  try {
    // Try to load Sentry if available
    const Sentry = require('@sentry/react-native');
    
    if (Sentry && typeof Sentry.init === 'function') {
      Sentry.init({
        dsn: process.env.EXPO_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN,
        enableInExpoDevelopment: false,
        debug: false,
        environment: process.env.NODE_ENV || 'production',
        // Don't send PII
        beforeSend(event, hint) {
          // Sanitize sensitive data
          if (event.user) {
            delete event.user.email;
            delete event.user.username;
            delete event.user.ip_address;
          }
          return event;
        },
      });
      
      errorReportingService = Sentry;
      return true;
    }
  } catch (error) {
    // Sentry not installed or not available - this is OK
    // Error reporting is optional
  }

  return false;
};

/**
 * Capture an exception
 */
export const captureException = (error, context = {}) => {
  if (errorReportingService) {
    try {
      errorReportingService.captureException(error, {
        extra: context,
      });
    } catch (e) {
      // Silently fail - error reporting should never break the app
    }
  }
};

/**
 * Capture a message
 */
export const captureMessage = (message, level = 'error') => {
  if (errorReportingService) {
    try {
      errorReportingService.captureMessage(message, level);
    } catch (e) {
      // Silently fail
    }
  }
};

/**
 * Set user context (sanitized - no PII)
 */
export const setUserContext = (user) => {
  if (errorReportingService && user) {
    try {
      errorReportingService.setUser({
        id: user.id || user._id,
        // Don't include email, name, or other PII
      });
    } catch (e) {
      // Silently fail
    }
  }
};

/**
 * Clear user context
 */
export const clearUserContext = () => {
  if (errorReportingService) {
    try {
      errorReportingService.setUser(null);
    } catch (e) {
      // Silently fail
    }
  }
};

export default {
  initErrorReporting,
  captureException,
  captureMessage,
  setUserContext,
  clearUserContext,
};

