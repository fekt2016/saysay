import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Keyboard,
  Dimensions,
  Pressable,
  Animated,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSearchSuggestions } from '../../hooks/useSearchSuggestions';
import { getSearchHistory, saveSearchToHistory, removeSearchFromHistory, clearSearchHistory } from '../../utils/searchHistory';
import { theme } from '../../theme';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * HeaderSearchInput - Search input with dropdown suggestions
 * FIXED: Fully functional search with proper navigation, history management, and dropdown behavior
 */
const HeaderSearchInput = () => {
  const navigation = useNavigation();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false); // FIXED: Controlled dropdown state
  const [searchHistory, setSearchHistory] = useState([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [isNavigating, setIsNavigating] = useState(false); // FIXED: Prevent double navigation
  const searchInputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const blurTimeoutRef = useRef(null); // FIXED: Manage blur timeout
  
  // Animation values for dropdown
  const dropdownOpacity = useRef(new Animated.Value(0)).current;
  const dropdownTranslateY = useRef(new Animated.Value(-10)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Use search suggestions hook
  const { data: searchSuggestionsData, isLoading: isSearchProductsLoading } =
    useSearchSuggestions(debouncedSearchTerm, {
      staleTime: 2 * 60 * 1000,
    });

  // Extract suggestions
  const searchSuggestions = useMemo(() => {
    if (!debouncedSearchTerm || debouncedSearchTerm.length < 2) return [];
    return searchSuggestionsData?.data || searchSuggestionsData || [];
  }, [debouncedSearchTerm, searchSuggestionsData]);

  // Load search history on mount
  useEffect(() => {
    loadSearchHistory();
  }, []);

  // FIXED: Close dropdown when navigating away from screen
  useFocusEffect(
    useCallback(() => {
      return () => {
        // Cleanup: close dropdown when screen loses focus (with animation)
        if (isSearchOpen) {
          closeDropdown();
        }
        if (blurTimeoutRef.current) {
          clearTimeout(blurTimeoutRef.current);
          blurTimeoutRef.current = null;
        }
      };
    }, [isSearchOpen, closeDropdown])
  );

  const loadSearchHistory = async () => {
    try {
      const history = await getSearchHistory();
      setSearchHistory(history);
    } catch (error) {
      console.error('Error loading search history:', error);
    }
  };

  // FIXED: Controlled dropdown open with animation
  const openDropdown = useCallback(() => {
    setIsSearchOpen(true);
    // Clear any pending blur timeout
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    
    // Animate dropdown open
    Animated.parallel([
      Animated.timing(dropdownOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(dropdownTranslateY, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [dropdownOpacity, dropdownTranslateY, backdropOpacity]);

  // FIXED: Controlled dropdown close with animation
  const closeDropdown = useCallback(() => {
    // Animate dropdown close
    Animated.parallel([
      Animated.timing(dropdownOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(dropdownTranslateY, {
        toValue: -10,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Only update state after animation completes
      setIsSearchOpen(false);
      setActiveSuggestionIndex(-1);
      // Reset animation values for next open
      dropdownOpacity.setValue(0);
      dropdownTranslateY.setValue(-10);
      backdropOpacity.setValue(0);
    });
  }, [dropdownOpacity, dropdownTranslateY, backdropOpacity]);

  const handleSearchChange = useCallback((text) => {
    setSearchTerm(text);
    openDropdown(); // FIXED: Open dropdown when typing
    setActiveSuggestionIndex(-1);
  }, [openDropdown]);

  const handleSearchSubmit = useCallback(async () => {
    if (!searchTerm.trim() || isNavigating) return;

    try {
      await saveSearchToHistory(searchTerm.trim());
      await loadSearchHistory();

      navigation.navigate('SearchTab', {
        screen: 'Search',
        params: { query: searchTerm.trim() },
      });

      closeDropdown();
      setSearchTerm('');
      Keyboard.dismiss();
    } catch (error) {
      console.error('Error submitting search:', error);
    }
  }, [searchTerm, navigation, isNavigating, closeDropdown]);

  // FIXED: Proper navigation with double-click prevention
  const handleSuggestionSelect = useCallback(
    async (suggestion) => {
      if (!suggestion || isNavigating) return; // FIXED: Prevent double navigation

      const searchQuery = suggestion.text || suggestion;
      if (!searchQuery || !searchQuery.trim()) return;

      // FIXED: Set navigating flag to prevent double clicks
      setIsNavigating(true);

      // Clear blur timeout to prevent dropdown from closing
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
        blurTimeoutRef.current = null;
      }

      // Close dropdown immediately and dismiss keyboard
      Keyboard.dismiss();
      closeDropdown();
      setSearchTerm(searchQuery);

      try {
        // Save to history
        await saveSearchToHistory(searchQuery);
        await loadSearchHistory();

        // FIXED: Navigate based on suggestion type with proper product ID handling
        if (suggestion.type === 'product') {
          const productId = suggestion.data?._id || suggestion.data?.id || suggestion._id || suggestion.id;
          if (productId) {
            // Navigate to product detail
            navigation.navigate('SearchTab', {
              screen: 'ProductDetail',
              params: {
                productId: productId,
                id: productId,
              },
            });
            // Reset navigating flag after a delay
            setTimeout(() => setIsNavigating(false), 500);
            return;
          }
        }

        // Navigate to search results for other types
        navigation.navigate('SearchTab', {
          screen: 'Search',
          params: { 
            query: searchQuery,
            type: suggestion.type || undefined,
          },
        });
        // Reset navigating flag after a delay
        setTimeout(() => setIsNavigating(false), 500);
      } catch (error) {
        console.error('Error selecting suggestion:', error);
        setIsNavigating(false);
      }
    },
    [navigation, isNavigating, closeDropdown]
  );

  const handleClearSearch = useCallback(() => {
    setSearchTerm('');
    closeDropdown();
    searchInputRef.current?.blur();
  }, [closeDropdown]);

  // FIXED: Proper history deletion with immediate UI update
  const handleRemoveFromHistory = useCallback(
    async (itemText) => {
      // FIXED: Remove invalid stopPropagation - React Native doesn't support DOM events
      try {
        await removeSearchFromHistory(itemText);
        await loadSearchHistory(); // FIXED: Reload to update UI immediately
      } catch (error) {
        console.error('Error removing from history:', error);
      }
    },
    []
  );

  // FIXED: Proper clear all history
  const handleClearHistory = useCallback(async () => {
    try {
      await clearSearchHistory();
      await loadSearchHistory(); // FIXED: Reload to update UI immediately
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  }, []);

  // Prepare suggestions list
  const suggestionsList = useMemo(() => {
    const list = [];

    // Add search suggestions if available
    if (debouncedSearchTerm && searchSuggestions.length > 0) {
      searchSuggestions.forEach((suggestion, index) => {
        if (!suggestion) return;

        const suggestionText = suggestion.name || suggestion.title || suggestion.text || '';
        const suggestionType = suggestion.type || 'product';
        const suggestionId = suggestion._id || suggestion.id;

        if (suggestionText) {
          list.push({
            id: suggestionId ? `suggestion-${suggestionId}` : `suggestion-${index}-${Date.now()}`,
            type: suggestionType,
            text: suggestionText,
            data: suggestion,
          });
        }
      });
    }

    // Add search history if no active search or suggestions
    if (list.length === 0 && searchHistory.length > 0 && (!debouncedSearchTerm || debouncedSearchTerm.trim().length < 2)) {
      searchHistory.forEach((item, index) => {
        list.push({
          id: `history-${index}-${item}`,
          type: 'history',
          text: item,
        });
      });
    }

    return list;
  }, [debouncedSearchTerm, searchSuggestions, searchHistory]);

  // Calculate dropdown height
  const calculateDropdownHeight = useMemo(() => {
    if (suggestionsList.length === 0) return 200;
    
    const itemHeight = 60;
    const headerHeight = 40;
    const footerHeight = (searchHistory.length > 0 && (!debouncedSearchTerm || debouncedSearchTerm.trim().length < 2)) ? 50 : 0;
    const calculatedHeight = headerHeight + (suggestionsList.length * itemHeight) + footerHeight;
    const maxAllowedHeight = Math.min(SCREEN_HEIGHT * 0.5, 400);
    
    return Math.min(calculatedHeight, maxAllowedHeight);
  }, [suggestionsList.length, searchHistory.length, debouncedSearchTerm]);

  // FIXED: Handle input focus - opens dropdown
  const handleInputFocus = useCallback(() => {
    openDropdown();
  }, [openDropdown]);

  // FIXED: Handle input blur - delayed close to allow item clicks
  const handleInputBlur = useCallback(() => {
    // Clear any existing timeout
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
    }
    // Delay closing to allow suggestion item clicks to register
    // Reduced delay for better responsiveness
    blurTimeoutRef.current = setTimeout(() => {
      closeDropdown();
    }, 150);
  }, [closeDropdown]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);

  // FIXED: Render suggestion item with proper navigation and visual feedback
  const renderSuggestionItem = useCallback(
    ({ item, index }) => {
      if (!item) return null;

      const isActive = activeSuggestionIndex === index;
      const isHistory = item.type === 'history';
      const itemText = item.text || item || '';
      const isProduct = item.type === 'product';
      const isCategory = item.type === 'category';
      const isBrand = item.type === 'brand';
      const isTag = item.type === 'tag';

      let iconName = 'search-outline';
      if (isHistory) iconName = 'time-outline';
      else if (isProduct) iconName = 'cube-outline';
      else if (isCategory) iconName = 'grid-outline';
      else if (isBrand) iconName = 'storefront-outline';
      else if (isTag) iconName = 'pricetag-outline';

      return (
        <Pressable
          style={({ pressed }) => [
            styles.suggestionItem,
            isActive && styles.suggestionItemActive,
            pressed && styles.suggestionItemPressed, // FIXED: Visual feedback on press
          ]}
          onPress={() => {
            // FIXED: Clear blur timeout and navigate
            if (blurTimeoutRef.current) {
              clearTimeout(blurTimeoutRef.current);
              blurTimeoutRef.current = null;
            }
            handleSuggestionSelect(item);
          }}
          disabled={isNavigating} // FIXED: Disable during navigation
        >
          <View style={styles.suggestionItemLeft}>
            <View style={[
              styles.suggestionIconContainer,
              isHistory && styles.suggestionIconContainerHistory,
              isProduct && styles.suggestionIconContainerProduct,
              isCategory && styles.suggestionIconContainerCategory,
            ]}>
              <Ionicons 
                name={iconName} 
                size={18} 
                color={
                  isHistory ? theme.colors.textSecondary :
                  isProduct ? theme.colors.primary :
                  isCategory ? theme.colors.success :
                  theme.colors.textPrimary
                } 
              />
            </View>
            <View style={styles.suggestionTextContainer}>
              <Text 
                style={[styles.suggestionText, isActive && styles.suggestionTextActive]} 
                numberOfLines={1}
              >
                {itemText}
              </Text>
              {item.type && item.type !== 'history' && (
                <Text style={styles.suggestionType}>
                  {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                </Text>
              )}
            </View>
          </View>
          {/* FIXED: History delete button with proper event handling */}
          {isHistory && itemText && (
            <Pressable
              style={styles.deleteButton}
              onPress={() => {
                // FIXED: Remove invalid stopPropagation - React Native doesn't support DOM events
                handleRemoveFromHistory(itemText);
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              onStartShouldSetResponder={() => true}
            >
              <Ionicons name="close-circle" size={20} color={theme.colors.textSecondary} />
            </Pressable>
          )}
        </Pressable>
      );
    },
    [activeSuggestionIndex, handleSuggestionSelect, handleRemoveFromHistory, isNavigating]
  );

  // Render suggestions header
  const renderSuggestionsHeader = useCallback(() => {
    if (suggestionsList.length === 0) return null;

    const hasHistory = suggestionsList.some((item) => item.type === 'history');
    const hasSuggestions = suggestionsList.some((item) => item.type !== 'history');

    if (hasSuggestions && debouncedSearchTerm) {
      return (
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderContent}>
            <Ionicons name="flash-outline" size={16} color={theme.colors.primary} />
            <Text style={styles.sectionTitle}>Suggestions</Text>
          </View>
        </View>
      );
    }

    if (hasHistory && (!debouncedSearchTerm || debouncedSearchTerm.trim().length < 2)) {
      return (
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderContent}>
            <Ionicons name="time-outline" size={16} color={theme.colors.textSecondary} />
            <Text style={styles.sectionTitle}>Recent Searches</Text>
          </View>
        </View>
      );
    }

    return null;
  }, [suggestionsList, debouncedSearchTerm]);

  // FIXED: Render suggestions footer with clear history
  const renderSuggestionsFooter = useCallback(() => {
    if (searchHistory.length === 0) return null;
    if (debouncedSearchTerm && debouncedSearchTerm.trim().length >= 2) return null;

    return (
      <Pressable 
        style={styles.clearHistoryButton}
        onPress={handleClearHistory}
      >
        <Ionicons name="trash-outline" size={16} color={theme.colors.textSecondary} />
        <Text style={styles.clearHistoryText}>Clear Search History</Text>
      </Pressable>
    );
  }, [searchHistory.length, debouncedSearchTerm, handleClearHistory]);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.searchInputWrapper}
        activeOpacity={1}
        onPress={() => {
          searchInputRef.current?.focus();
          openDropdown(); // FIXED: Open dropdown when clicking input wrapper
        }}
      >
        <Ionicons name="search-outline" size={18} color={theme.colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          ref={searchInputRef}
          style={styles.searchInput}
          placeholder="Search products..."
          placeholderTextColor={theme.colors.grey400}
          value={searchTerm}
          onChangeText={handleSearchChange}
          onSubmitEditing={handleSearchSubmit}
          onFocus={handleInputFocus} // FIXED: Controlled open on focus
          onBlur={handleInputBlur} // FIXED: Delayed close on blur
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
        />
        {isSearchProductsLoading && debouncedSearchTerm && (
          <View style={styles.loadingIndicator}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
          </View>
        )}
        {searchTerm.length > 0 && !isSearchProductsLoading && (
          <TouchableOpacity 
            onPress={handleClearSearch} 
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.clearButton}
          >
            <Ionicons name="close-circle" size={18} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {/* FIXED: Dropdown with backdrop for outside-click detection - Animated */}
      {isSearchOpen && (
        <>
          {/* Backdrop overlay for outside-click detection - Animated */}
          <Animated.View
            style={[
              styles.backdrop,
              {
                opacity: backdropOpacity,
              },
            ]}
            pointerEvents={isSearchOpen ? 'auto' : 'none'}
          >
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => {
                // FIXED: Close dropdown and blur input when clicking outside
                searchInputRef.current?.blur();
                closeDropdown();
              }}
            />
          </Animated.View>
          {/* Dropdown content - positioned above backdrop - Animated */}
          <Animated.View
            style={[
              styles.dropdownWrapper,
              {
                opacity: dropdownOpacity,
                transform: [{ translateY: dropdownTranslateY }],
              },
            ]}
            pointerEvents="box-none"
          >
            <View style={styles.dropdownContent} pointerEvents="auto">
              {suggestionsList.length > 0 ? (
                <View style={[styles.suggestionsContainer, { maxHeight: calculateDropdownHeight }]}>
                  {renderSuggestionsHeader()}
                  <FlatList
                    ref={suggestionsRef}
                    data={suggestionsList}
                    keyExtractor={(item, index) => item?.id || `item-${index}-${Date.now()}`}
                    renderItem={renderSuggestionItem}
                    keyboardShouldPersistTaps="always"
                    keyboardDismissMode="on-drag"
                    ListFooterComponent={renderSuggestionsFooter}
                    scrollEnabled={suggestionsList.length > 5}
                    nestedScrollEnabled={true}
                    showsVerticalScrollIndicator={suggestionsList.length > 5}
                  />
                </View>
              ) : debouncedSearchTerm && !isSearchProductsLoading ? (
                <View style={[styles.suggestionsContainer, { maxHeight: 200 }]}>
                  <View style={styles.emptyStateContainer}>
                    <Ionicons name="search-outline" size={48} color={theme.colors.grey400} />
                    <Text style={styles.emptyStateTitle}>No results found</Text>
                    <Text style={styles.emptyStateText}>Try searching for something else</Text>
                  </View>
                </View>
              ) : null}
            </View>
          </Animated.View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    flex: 1,
    marginRight: 16,
    zIndex: 1000,
    elevation: 1000, // Android elevation
  },
  backdrop: {
    position: 'absolute',
    top: -10000,
    left: -10000,
    right: -10000,
    bottom: -10000,
    backgroundColor: 'transparent',
    zIndex: 998,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    width: '100%',
    maxWidth: 300,
    zIndex: 1001,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.textPrimary,
    padding: 0,
  },
  loadingIndicator: {
    marginLeft: 6,
  },
  clearButton: {
    marginLeft: 6,
    padding: 2,
  },
  dropdownWrapper: {
    position: 'absolute',
    top: '100%',
    left: '50%',
    marginLeft: -150,
    width: 300,
    marginTop: 8,
    zIndex: 1000,
    elevation: 1000, // Android elevation
  },
  dropdownContent: {
    width: '100%',
  },
  suggestionsContainer: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg || 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.grey200,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md || 12,
    paddingHorizontal: theme.spacing.md || 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.grey100,
    backgroundColor: theme.colors.white,
  },
  suggestionItemActive: {
    backgroundColor: theme.colors.primary + '08',
  },
  suggestionItemPressed: {
    backgroundColor: theme.colors.primary + '15', // FIXED: Visual feedback on press
  },
  suggestionItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  suggestionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.md || 8,
    backgroundColor: theme.colors.grey100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm || 8,
  },
  suggestionIconContainerHistory: {
    backgroundColor: theme.colors.grey100,
  },
  suggestionIconContainerProduct: {
    backgroundColor: theme.colors.primary + '15',
  },
  suggestionIconContainerCategory: {
    backgroundColor: theme.colors.success + '15' || '#e8f5e9',
  },
  suggestionTextContainer: {
    flex: 1,
  },
  suggestionText: {
    fontSize: theme.typography.fontSize.base || 14,
    fontWeight: theme.typography.fontWeight.medium || '500',
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  suggestionTextActive: {
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.semiBold || '600',
  },
  suggestionType: {
    fontSize: theme.typography.fontSize.xs || 12,
    color: theme.colors.textSecondary,
    textTransform: 'capitalize',
  },
  deleteButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: theme.spacing.sm || 8,
  },
  sectionHeader: {
    paddingVertical: theme.spacing.sm || 8,
    paddingHorizontal: theme.spacing.md || 12,
    backgroundColor: theme.colors.grey50 || '#fafafa',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.grey200,
  },
  sectionHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs || 4,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.xs || 12,
    fontWeight: theme.typography.fontWeight.semiBold || '600',
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  clearHistoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md || 12,
    paddingHorizontal: theme.spacing.md || 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.grey200,
    backgroundColor: theme.colors.grey50 || '#fafafa',
    gap: theme.spacing.xs || 4,
  },
  clearHistoryText: {
    fontSize: theme.typography.fontSize.sm || 14,
    fontWeight: theme.typography.fontWeight.medium || '500',
    color: theme.colors.textSecondary,
  },
  emptyStateContainer: {
    paddingVertical: theme.spacing['3xl'] || 48,
    paddingHorizontal: theme.spacing.xl || 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateTitle: {
    fontSize: theme.typography.fontSize.lg || 18,
    fontWeight: theme.typography.fontWeight.bold || '700',
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.md || 12,
    marginBottom: theme.spacing.xs || 4,
  },
  emptyStateText: {
    fontSize: theme.typography.fontSize.sm || 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});

export default HeaderSearchInput;
