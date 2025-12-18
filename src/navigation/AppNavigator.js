import React, { useEffect, useRef, useState, useMemo } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, Linking, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { useAuth } from '../hooks/useAuth';
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
 */
const getActiveRouteName = (state) => {
  if (!state || typeof state.index !== 'number') {
    return 'Unknown';
  }

  const route = state.routes[state.index];

  if (route.state) {
    return getActiveRouteName(route.state);
  }

  return route.name;
};

/**
 * Extract route params from navigation state
 */
const getActiveRouteParams = (state) => {
  if (!state || typeof state.index !== 'number') {
    return null;
  }

  const route = state.routes[state.index];

  if (route.state) {
    return getActiveRouteParams(route.state) || route.params;
  }

  return route.params;
};

const AppNavigator = () => {
  const { isLoading, isAuthenticated } = useAuth();
  const navigationRef = useRef(null);
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);
  const [hasCompletedOnboardingCheck, setHasCompletedOnboardingCheck] = useState(false);
  const prevAuthenticatedRef = useRef(isAuthenticated);

  // Check onboarding status on mount
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const completed = await hasCompletedOnboarding();
        setHasCompletedOnboardingCheck(completed);
        logger.debug('[AppNavigator] Onboarding status:', completed ? 'completed' : 'not completed');
      } catch (error) {
        logger.error('[AppNavigator] Error checking onboarding status:', error);
        setHasCompletedOnboardingCheck(false);
      } finally {
        setIsCheckingOnboarding(false);
      }
    };

    checkOnboardingStatus();
  }, []);

  // Navigate to Auth when user becomes unauthenticated (e.g., after 401 error, password change)
  useEffect(() => {
    // Check if user was authenticated and now is not (auth state changed from true to false)
    const wasAuthenticated = prevAuthenticatedRef.current;
    const isNowUnauthenticated = !isAuthenticated && !isLoading;
    
    if (wasAuthenticated && isNowUnauthenticated && hasCompletedOnboardingCheck && navigationRef.current) {
      logger.warn('[AppNavigator] User became unauthenticated - navigating to login');
      // Small delay to ensure navigation is ready
      const timer = setTimeout(() => {
        if (navigationRef.current) {
          try {
            // Reset navigation stack to prevent back navigation to protected screens
            navigationRef.current.reset({
              index: 0,
              routes: [{ name: 'Auth', params: { screen: 'Login' } }],
            });
            logger.debug('[AppNavigator] ✅ Navigated to login screen');
          } catch (error) {
            logger.error('[AppNavigator] Error navigating to Auth:', error);
            // Fallback to navigate if reset fails
            try {
              navigationRef.current.navigate('Auth', { screen: 'Login' });
            } catch (navError) {
              logger.error('[AppNavigator] Error with fallback navigation:', navError);
            }
          }
        }
      }, 300);
      return () => clearTimeout(timer);
    }
    
    // Update ref for next comparison
    prevAuthenticatedRef.current = isAuthenticated;
  }, [isAuthenticated, isLoading, hasCompletedOnboardingCheck]);

  // Navigate to Auth when onboarding is completed and user is not authenticated (initial state)
  useEffect(() => {
    if (hasCompletedOnboardingCheck && !isAuthenticated && navigationRef.current && !isLoading && !prevAuthenticatedRef.current) {
      // Small delay to ensure navigation is ready after navigator switch
      const timer = setTimeout(() => {
        if (navigationRef.current) {
          try {
            logger.debug('[AppNavigator] Navigating to Auth after onboarding completion');
            navigationRef.current.navigate('Auth', { screen: 'Login' });
          } catch (error) {
            logger.error('[AppNavigator] Error navigating to Auth:', error);
          }
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [hasCompletedOnboardingCheck, isAuthenticated, isLoading]);

  // Memoize linking config
  const linkingConfig = useMemo(() => ({
    prefixes: [
      'saysay://',
      'https://eazworld.com',
      'https://www.eazworld.com',
    ],
    config: {
      screens: {
        Onboarding: {
          path: 'onboarding',
        },
        Auth: {
          screens: {
            Login: {
              path: 'login',
            },
            Register: {
              path: 'register',
            },
            ForgotPassword: {
              path: 'forgot-password',
            },
            OtpVerification: {
              path: 'verify-otp',
            },
            ResetPassword: {
              path: 'reset-password',
            },
          },
        },
        Main: {
          screens: {
            CartTab: {
              screens: {
                Cart: 'cart',
                Checkout: 'checkout',
                OrderComplete: {
                  path: 'order-confirmation',
                },
              },
            },
            AccountTab: {
              screens: {
                Account: 'account',
                Orders: 'orders',
                OrderDetail: {
                  path: 'order/:orderId',
                },
              },
            },
          },
        },
      },
    },
  }), []);

  // Show loading while checking onboarding status or auth status
  if (isLoading || isCheckingOnboarding) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  // Show onboarding if not completed
  if (!hasCompletedOnboardingCheck) {
    return (
      <NavigationContainer
        ref={navigationRef}
        linking={linkingConfig}
        onReady={() => {
          logger.debug('[AppNavigator] Navigation ready (onboarding)');
        }}
        onStateChange={(state) => {
          const screenName = getActiveRouteName(state);
          const params = getActiveRouteParams(state);
          setCurrentScreen(screenName, params);
          if (__DEV__) {
            logger.debug(`[ScreenTracker] Screen changed to: ${screenName}`, params ? `Params: ${JSON.stringify(params)}` : '');
          }
        }}
      >
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen
            name="Onboarding"
            component={OnboardingScreen}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  return (
    <>
      {hasCompletedOnboardingCheck && <PushNotificationManager />}
      <NavigationContainer
        ref={navigationRef}
        linking={linkingConfig}
        onReady={() => {
          logger.debug('[AppNavigator] Navigation ready');
          if (navigationRef.current) {
            const state = navigationRef.current.getRootState();
            const screenName = getActiveRouteName(state);
            const params = getActiveRouteParams(state);
            setCurrentScreen(screenName, params);
          }
        }}
        onStateChange={(state) => {
          const screenName = getActiveRouteName(state);
          const params = getActiveRouteParams(state);
          setCurrentScreen(screenName, params);
          if (__DEV__) {
            logger.debug(`[ScreenTracker] Screen changed to: ${screenName}`, params ? `Params: ${JSON.stringify(params)}` : '');
          }
        }}
      >
        <Stack.Navigator 
          screenOptions={{ 
            headerShown: true,
            headerTransparent: false,
            headerBackVisible: true,
            headerBackTitleVisible: false,
          }}
        >
          <Stack.Screen 
            name="Main" 
            component={MainTabs}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Auth" 
            component={AuthStack}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Onboarding" 
            component={OnboardingScreen}
            options={{ 
              headerShown: false,
              gestureEnabled: false,
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
  },
});

export default AppNavigator;
