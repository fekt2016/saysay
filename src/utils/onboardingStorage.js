import * as SecureStore from 'expo-secure-store';
import logger from './logger';

const ONBOARDING_KEY = 'has_completed_onboarding';export const hasCompletedOnboarding = async () => {
  try {
    const value = await SecureStore.getItemAsync(ONBOARDING_KEY);
    return value === 'true';
  } catch (error) {
    logger.error('[OnboardingStorage] Error checking onboarding status:', error);

    return false;
  }
};export const setOnboardingCompleted = async () => {
  try {
    await SecureStore.setItemAsync(ONBOARDING_KEY, 'true');
    logger.debug('[OnboardingStorage] Onboarding marked as completed');
  } catch (error) {
    logger.error('[OnboardingStorage] Error saving onboarding status:', error);
    throw error;
  }
};export const resetOnboarding = async () => {
  try {
    await SecureStore.deleteItemAsync(ONBOARDING_KEY);
    logger.debug('[OnboardingStorage] Onboarding reset (for testing)');
  } catch (error) {
    logger.error('[OnboardingStorage] Error resetting onboarding:', error);
    throw error;
  }
};


