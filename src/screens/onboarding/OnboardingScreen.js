import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import OnboardingSlide from './OnboardingSlide';
import { setOnboardingCompleted } from '../../utils/onboardingStorage';
import logger from '../../utils/logger';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ONBOARDING_SLIDES = [
  {
    id: '1',
    title: 'Welcome to Saysay',
    description: 'Your trusted marketplace for shopping from verified sellers. Discover amazing products and enjoy seamless shopping experience.',
    icon: 'storefront',
    iconColor: theme.colors.primary,
  },
  {
    id: '2',
    title: 'Shop from Trusted Sellers',
    description: 'Browse products from verified sellers with authentic reviews. Find exactly what you need with confidence.',
    icon: 'shield-checkmark',
    iconColor: theme.colors.success || '#4CAF50',
  },
  {
    id: '3',
    title: 'Secure Payments & Wallet',
    description: 'Pay securely with multiple payment options. Top up your wallet for faster checkout and exclusive benefits.',
    icon: 'wallet',
    iconColor: theme.colors.warning || '#FF9800',
  },
  {
    id: '4',
    title: 'Fast Delivery & Tracking',
    description: 'Get your orders delivered quickly. Track your packages in real-time and stay updated every step of the way.',
    icon: 'car',
    iconColor: theme.colors.info || '#2196F3',
  },
];

const OnboardingScreen = () => {
  const navigation = useNavigation();
  const flatListRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const isLastSlide = currentIndex === ONBOARDING_SLIDES.length - 1;const handleComplete = async () => {
    try {
      await setOnboardingCompleted();
      logger.debug('[Onboarding] Onboarding completed, navigating to login');
      navigation.replace('Auth', { screen: 'Login' });
    } catch (error) {
      logger.error('[Onboarding] Error completing onboarding:', error);

      navigation.replace('Auth', { screen: 'Login' });
    }
  };const handleSkip = async () => {
    try {
      await setOnboardingCompleted();
      logger.debug('[Onboarding] Onboarding skipped, navigating to login');
      navigation.replace('Auth', { screen: 'Login' });
    } catch (error) {
      logger.error('[Onboarding] Error skipping onboarding:', error);

      navigation.replace('Auth', { screen: 'Login' });
    }
  };const handleNext = () => {
    if (isLastSlide) {
      handleComplete();
    } else {
      const nextIndex = currentIndex + 1;
      try {
        flatListRef.current?.scrollToIndex({ 
          index: nextIndex, 
          animated: true 
        });
      } catch (error) {

        logger.warn('[Onboarding] Error scrolling to index, using offset:', error);
        flatListRef.current?.scrollToOffset({ 
          offset: nextIndex * SCREEN_WIDTH, 
          animated: true 
        });
      }
    }
  };const handleScroll = (event) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / SCREEN_WIDTH);
    setCurrentIndex(index);
  };const renderSlide = ({ item }) => (
    <View style={styles.slideContainer}>
      <OnboardingSlide
        title={item.title}
        description={item.description}
        icon={item.icon}
        iconColor={item.iconColor}
      />
    </View>
  );const renderDots = () => (
    <View style={styles.dotsContainer}>
      {ONBOARDING_SLIDES.map((_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            index === currentIndex && styles.dotActive,
          ]}
        />
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>

      <View style={styles.skipContainer}>
        <TouchableOpacity
          onPress={handleSkip}
          style={styles.skipButton}
          activeOpacity={0.7}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={ONBOARDING_SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled ||
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(
            event.nativeEvent.contentOffset.x / SCREEN_WIDTH
          );

          const safeIndex = Math.max(0, Math.min(index, ONBOARDING_SLIDES.length - 1));
          setCurrentIndex(safeIndex);
        }}
        onScrollToIndexFailed={(info) => {

          logger.warn('[Onboarding] Scroll to index failed:', info);
          const wait = new Promise(resolve => setTimeout(resolve, 500));
          wait.then(() => {
            flatListRef.current?.scrollToIndex({ index: info.index, animated: false });
          });
        }}
      />

      {renderDots()}

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          onPress={handleNext}
          style={styles.nextButton}
          activeOpacity={0.8}
        >
          <Text style={styles.nextButtonText}>
            {isLastSlide ? 'Get Started' : 'Next'}
          </Text>
          <Ionicons
            name={isLastSlide ? 'checkmark' : 'arrow-forward'}
            size={20}
            color="#FFFFFF"
            style={styles.nextButtonIcon}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background || '#FFFFFF',
  },
  skipContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    paddingTop: theme.spacing.md || 16,
  },
  skipButton: {
    paddingHorizontal: theme.spacing.md || 16,
    paddingVertical: theme.spacing.sm || 8,
  },
  skipText: {
    fontSize: theme.typography?.body?.fontSize || 16,
    color: theme.colors.textSecondary || '#666666',
    fontWeight: '500',
  },
  slideContainer: {
    width: SCREEN_WIDTH,
    flex: 1,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.lg || 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.border || '#E0E0E0',
    marginHorizontal: 4,
  },
  dotActive: {
    width: 24,
    backgroundColor: theme.colors.primary,
  },
  buttonContainer: {
    paddingHorizontal: theme.spacing.xl || 32,
    paddingBottom: theme.spacing.xl || 32,
    paddingTop: theme.spacing.md || 16,
  },
  nextButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius?.lg || 12,
    paddingVertical: theme.spacing.md || 16,
    paddingHorizontal: theme.spacing.xl || 32,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: theme.typography?.button?.fontSize || 16,
    fontWeight: '600',
    marginRight: theme.spacing.sm || 8,
  },
  nextButtonIcon: {
    marginLeft: theme.spacing.xs || 4,
  },
});

export default OnboardingScreen;


