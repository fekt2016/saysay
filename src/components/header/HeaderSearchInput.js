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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSearchSuggestions } from '../../hooks/useSearchSuggestions';
import { getSearchHistory, saveSearchToHistory, removeSearchFromHistory, clearSearchHistory } from '../../utils/searchHistory';
import { theme } from '../../theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * HeaderSearchInput - Extracted from GlobalHeader
 * Reuses the exact same search logic and functionality
 * Designed for use in React Navigation headerTitle
 */
const HeaderSearchInput = () => {
  const navigation = useNavigation();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const searchInputRef = useRef(null);
  const suggestionsRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: searchSuggestionsData, isLoading: isSearchProductsLoading } =
    useSearchSuggestions(debouncedSearchTerm, {
      staleTime: 2 * 60 * 1000,
    });

  const searchSuggestions = useMemo(() => {
    if (!debouncedSearchTerm || debouncedSearchTerm.length < 2) return [];
    return searchSuggestionsData?.data || searchSuggestionsData || [];
  }, [debouncedSearchTerm, searchSuggestionsData]);

  useEffect(() => {
    loadSearchHistory();
  }, []);

  const loadSearchHistory = async () => {
    const history = await getSearchHistory();
    setSearchHistory(history);
  };

  const handleSearchChange = useCallback((text) => {
    setSearchTerm(text);
    setShowSuggestions(true);
    setActiveSuggestionIndex(-1);
  }, []);

  const handleSearchSubmit = useCallback(async () => {
    if (!searchTerm.trim()) return;

    await saveSearchToHistory(searchTerm.trim());
    await loadSearchHistory();

    navigation.navigate('SearchTab', {
      screen: 'Search',
      params: { query: searchTerm.trim() },
    });

    setShowSuggestions(false);
    setSearchTerm('');
    Keyboard.dismiss();
  }, [searchTerm, navigation]);

  const handleSuggestionSelect = useCallback(
    async (suggestion) => {
      const searchQuery = suggestion.text || suggestion;

      if (!searchQuery || !searchQuery.trim()) return;

      setSearchTerm(searchQuery);
      setShowSuggestions(false);

      await saveSearchToHistory(searchQuery);
      await loadSearchHistory();

      switch (suggestion.type) {
        case 'product':
          if (suggestion.data?._id) {
            navigation.navigate('ProductDetail', {
              productId: suggestion.data._id,
              id: suggestion.data._id,
            });
          } else {
            navigation.navigate('SearchTab', {
              screen: 'Search',
              params: { query: searchQuery, type: 'product' },
            });
          }
          break;
        case 'category':
          navigation.navigate('SearchTab', {
            screen: 'Search',
            params: { query: searchQuery, type: 'category' },
          });
          break;
        case 'brand':
          navigation.navigate('SearchTab', {
            screen: 'Search',
            params: { query: searchQuery, type: 'brand' },
          });
          break;
        case 'tag':
          navigation.navigate('SearchTab', {
            screen: 'Search',
            params: { query: searchQuery, type: 'tag' },
          });
          break;
        default:
          navigation.navigate('SearchTab', {
            screen: 'Search',
            params: { query: searchQuery },
          });
      }

      Keyboard.dismiss();
    },
    [navigation]
  );

  const handleClearSearch = useCallback(() => {
    setSearchTerm('');
    setShowSuggestions(false);
    setActiveSuggestionIndex(-1);
    searchInputRef.current?.blur();
  }, []);

  const handleRemoveFromHistory = useCallback(
    async (item, event) => {
      event?.stopPropagation();
      await removeSearchFromHistory(item);
      await loadSearchHistory();
    },
    []
  );

  const handleClearHistory = useCallback(async () => {
    await clearSearchHistory();
    await loadSearchHistory();
  }, []);

  const suggestionsList = useMemo(() => {
    const list = [];

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

  const calculateDropdownHeight = useMemo(() => {
    if (suggestionsList.length === 0) return 200;
    
    const itemHeight = 60;
    const headerHeight = 40;
    const footerHeight = (searchHistory.length > 0 && (!debouncedSearchTerm || debouncedSearchTerm.trim().length < 2)) ? 50 : 0;
    const calculatedHeight = headerHeight + (suggestionsList.length * itemHeight) + footerHeight;
    const maxAllowedHeight = Math.min(SCREEN_HEIGHT * 0.5, 400);
    
    return Math.min(calculatedHeight, maxAllowedHeight);
  }, [suggestionsList.length, searchHistory.length, debouncedSearchTerm]);

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
        <TouchableOpacity
          style={[styles.suggestionItem, isActive && styles.suggestionItemActive]}
          onPress={() => handleSuggestionSelect(item)}
          activeOpacity={0.7}
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
          {isHistory && itemText && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={(e) => {
                e.stopPropagation();
                handleRemoveFromHistory(itemText, e);
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close-circle" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      );
    },
    [activeSuggestionIndex, handleSuggestionSelect, handleRemoveFromHistory]
  );

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

  const renderSuggestionsFooter = useCallback(() => {
    if (searchHistory.length === 0) return null;
    if (debouncedSearchTerm && debouncedSearchTerm.trim().length >= 2) return null;

    return (
      <TouchableOpacity 
        style={styles.clearHistoryButton}
        onPress={handleClearHistory}
        activeOpacity={0.7}
      >
        <Ionicons name="trash-outline" size={16} color={theme.colors.textSecondary} />
        <Text style={styles.clearHistoryText}>Clear Search History</Text>
      </TouchableOpacity>
    );
  }, [searchHistory.length, debouncedSearchTerm, handleClearHistory]);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.searchInputWrapper}
        activeOpacity={1}
        onPress={() => searchInputRef.current?.focus()}
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
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => {
            setTimeout(() => setShowSuggestions(false), 200);
          }}
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

      {showSuggestions && (
        <>
          {suggestionsList.length > 0 ? (
            <View style={[styles.suggestionsContainer, { maxHeight: calculateDropdownHeight }]}>
              {renderSuggestionsHeader()}
              <FlatList
                ref={suggestionsRef}
                data={suggestionsList}
                keyExtractor={(item, index) => item?.id || `item-${index}-${Date.now()}`}
                renderItem={renderSuggestionItem}
                keyboardShouldPersistTaps="handled"
                ListFooterComponent={renderSuggestionsFooter}
                scrollEnabled={suggestionsList.length > 5}
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={suggestionsList.length > 5}
              />
            </View>
          ) : debouncedSearchTerm && !isSearchProductsLoading && (
            <View style={[styles.suggestionsContainer, { maxHeight: 200 }]}>
              <View style={styles.emptyStateContainer}>
                <Ionicons name="search-outline" size={48} color={theme.colors.grey400} />
                <Text style={styles.emptyStateTitle}>No results found</Text>
                <Text style={styles.emptyStateText}>Try searching for something else</Text>
              </View>
            </View>
          )}
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
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: '50%',
    marginLeft: -150,
    width: 300,
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg || 12,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
    zIndex: 1000,
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
