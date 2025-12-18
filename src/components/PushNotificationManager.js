import React, { useEffect, useRef, useState } from 'react';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { useAuth } from '../hooks/useAuth';
import { hasCompletedOnboarding } from '../utils/onboardingStorage';
import logger from '../utils/logger';

/**
 * PushNotificationManager Component
 * 
 * Manages push notifications for authenticated users.
 * Uses useAuth hook directly (no provider needed).
 * 
 * CRITICAL: This component should ONLY mount after onboarding is complete.
 * It is conditionally rendered in AppNavigator to prevent initialization during onboarding.
 * 
 * This component:
 * - Registers push token when user logs in
 * - Unregisters push token when user logs out
 * - Handles notification listeners
 */
const PushNotificationManager = () => {
  const { isAuthenticated } = useAuth();
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const { unregisterDeviceToken } = usePushNotifications();
  const prevAuthenticatedRef = useRef(isAuthenticated);

  // CRITICAL: Double-check onboarding status before allowing any operations
  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const completed = await hasCompletedOnboarding();
        setOnboardingCompleted(completed);
        if (!completed) {
          logger.warn('[PushNotificationManager] ⚠️ Onboarding not completed - component should not be mounted');
        }
      } catch (error) {
        logger.error('[PushNotificationManager] Error checking onboarding status:', error);
        // Fail safe - don't allow operations if we can't verify onboarding
        setOnboardingCompleted(false);
      }
    };
    checkOnboarding();
  }, []);

  // Handle logout - unregister push token when user logs out
  // CRITICAL: Only operate if onboarding is complete
  useEffect(() => {
    // Don't do anything if onboarding is not completed
    if (!onboardingCompleted) {
      logger.debug('[PushNotificationManager] Onboarding not completed, skipping operations');
      return;
    }

    // If user was authenticated and now is not, unregister token
    if (prevAuthenticatedRef.current && !isAuthenticated) {
      logger.debug('[PushNotificationManager] User logged out, unregistering push token');
      unregisterDeviceToken().catch((error) => {
        logger.warn('[PushNotificationManager] Error unregistering token on logout:', error);
      });
    }
    
    // Update ref for next comparison
    prevAuthenticatedRef.current = isAuthenticated;
  }, [isAuthenticated, unregisterDeviceToken, onboardingCompleted]);

  // The actual registration is handled in usePushNotifications hook
  // This component just ensures the hook is active and handles logout cleanup

  return null; // This component doesn't render anything
};

export default PushNotificationManager;
