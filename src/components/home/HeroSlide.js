import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  FlatList,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const AUTO_PLAY_INTERVAL = 5000;
const DEFAULT_SLIDE_HEIGHT = SCREEN_HEIGHT * 0.35;

const HeroSlide = ({
  slides = [],
  autoPlay = true,
  autoPlayInterval = AUTO_PLAY_INTERVAL,
  onSlidePress,
  height = DEFAULT_SLIDE_HEIGHT,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);
  const autoPlayTimerRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  if (!slides || slides.length === 0) {
    return null;
  }

  const slideToIndex = useCallback((index) => {
    if (flatListRef.current && index >= 0 && index < slides.length) {
      flatListRef.current.scrollToIndex({ index, animated: true });
      setCurrentIndex(index);
    }
  }, [slides.length]);

  const nextSlide = useCallback(() => {
    const nextIndex = (currentIndex + 1) % slides.length;
    slideToIndex(nextIndex);
  }, [currentIndex, slides.length, slideToIndex]);

  const previousSlide = useCallback(() => {
    const prevIndex = (currentIndex - 1 + slides.length) % slides.length;
    slideToIndex(prevIndex);
  }, [currentIndex, slides.length, slideToIndex]);

  useEffect(() => {
    if (autoPlay && slides.length > 1) {
      autoPlayTimerRef.current = setInterval(() => {
        nextSlide();
      }, autoPlayInterval);

      return () => {
        if (autoPlayTimerRef.current) {
          clearInterval(autoPlayTimerRef.current);
        }
      };
    }
  }, [autoPlay, autoPlayInterval, nextSlide, slides.length]);

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false }
  );

  const handleMomentumScrollEnd = (event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    setCurrentIndex(index);
  };

  const handleSlidePress = useCallback((item) => {
    if (onSlidePress) {
      onSlidePress(item);
    }
  }, [onSlidePress]);

  const renderSlide = ({ item, index }) => {
    const slideId = item.id || item._id || index;
    
    return (
      <View style={[styles.heroSlide, { width: SCREEN_WIDTH, height }]}>
        {item.image ? (
          <Image
            source={{ uri: item.image }}
            style={[styles.heroImage, { width: SCREEN_WIDTH, height }]}
            resizeMode="cover"
            onError={() => {
              console.warn('HeroSlide: Failed to load image:', item.image);
            }}
          />
        ) : (
          <View style={[styles.heroImage, styles.placeholderImage, { width: SCREEN_WIDTH, height }]} />
        )}
        <LinearGradient
          colors={['transparent', 'rgba(0, 0, 0, 0.7)']}
          style={[styles.heroOverlay, { width: SCREEN_WIDTH, height }]}
        />
        <View style={styles.heroContent}>
          {item.subtitle && (
            <Text style={styles.heroSubtitle}>{item.subtitle}</Text>
          )}
          {item.title && (
            <Text style={styles.heroTitle}>{item.title}</Text>
          )}
          {item.cta && (
            <TouchableOpacity
              style={styles.heroButton}
              onPress={() => handleSlidePress(item)}
              activeOpacity={0.8}
            >
              <Text style={styles.heroButtonText}>{item.cta}</Text>
              <Text style={styles.heroButtonIcon}>→</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderPaginationDots = () => {
    if (slides.length <= 1) return null;

    return (
      <View style={styles.paginationContainer}>
        {slides.map((_, index) => {
          const isActive = index === currentIndex;
          return (
            <TouchableOpacity
              key={index}
              style={[styles.paginationDot, isActive && styles.paginationDotActive]}
              onPress={() => slideToIndex(index)}
              activeOpacity={0.7}
            />
          );
        })}
      </View>
    );
  };

  const getItemLayout = (data, index) => ({
    length: SCREEN_WIDTH,
    offset: SCREEN_WIDTH * index,
    index,
  });

  return (
    <View style={[styles.container, { height }]}>
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item, index) => {
          const id = item.id || item._id || index;
          return `hero-slide-${id}`;
        }}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        getItemLayout={getItemLayout}
        onScrollToIndexFailed={(info) => {
          const wait = new Promise(resolve => setTimeout(resolve, 500));
          wait.then(() => {
            flatListRef.current?.scrollToIndex({ index: info.index, animated: false });
          });
        }}
        decelerationRate="fast"
        removeClippedSubviews={false}
        initialNumToRender={slides.length}
        maxToRenderPerBatch={slides.length}
        windowSize={5}
      />
      {renderPaginationDots()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: SCREEN_WIDTH,
    overflow: 'hidden',
  },
  heroSlide: {
    width: SCREEN_WIDTH,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  heroContent: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    zIndex: 2,
  },
  heroSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.white,
    opacity: 0.9,
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: theme.typography.fontSize['3xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.white,
    marginBottom: 16,
  },
  heroButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: theme.borderRadius.full,
    alignSelf: 'flex-start',
  },
  heroButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.primary,
    marginRight: 8,
  },
  heroButtonIcon: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.bold,
  },
  paginationContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.white,
    opacity: 0.5,
    marginHorizontal: 4,
  },
  paginationDotActive: {
    width: 24,
    opacity: 1,
  },
  placeholderImage: {
    backgroundColor: theme.colors.grey200 || '#e5e5e5',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default HeroSlide;
