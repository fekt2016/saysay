import React, { useEffect, useRef, useState } from 'react';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { useAuth } from '../../hooks/useAuth';
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
