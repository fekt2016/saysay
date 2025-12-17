import React, { useEffect, useRef, useState, useMemo } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, Linking, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { useAuth } from '../../hooks/useAuth';
import AuthStack from './AuthStack';
import MainTabs from './MainTabs';
import OnboardingScreen from '../screens/onboarding/OnboardingScreen';
import HeaderLogo from '../components/HeaderLogo';
import { theme } from '../theme';
import { parseDeepLink } from '../utils/deepLinking';
import { hasCompletedOnboarding } from '../utils/onboardingStorage';
import { storeNotificationIntent, getAndClearNotificationIntent } from '../utils/notificationIntentStorage';
import PushNotificationManager from '../components/PushNotificationManager';
import { setCurrentScreen } from '../utils/screenTracker';
import logger from '../utils/logger';

const Stack = createNativeStackNavigator();

/**
 * Extract screen name and params from navigation state
 * Used for screen tracking to identify which screen triggers backend crashes
