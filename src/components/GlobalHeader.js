import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ActivityIndicator, FlatList, Image, Keyboard, Platform, Text, TextInput, TouchableOpacity, View, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useSearchSuggestions } from '../hooks/useSearchSuggestions';
import { getSearchHistory, saveSearchToHistory, removeSearchFromHistory } from '../utils/searchHistory';
import Logo from './Logo';
import { theme } from '../theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const GlobalHeader = ({ style }) => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated } = useAuth();
  
  
  const isHomeScreen = route?.name === 'Home';
  
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const searchInputRef = useRef(null);
  const suggestionsRef = useRef(null);

  
  const calculateMaxHeight = useCallback((itemCount) => {
    
    const estimatedItemHeight = 60; 
    const headerHeight = 40; 
    const footerHeight = 50; 
    const padding = 20; 
    
    
    const contentHeight = (itemCount * estimatedItemHeight) + headerHeight + footerHeight + padding;
    
    
    const maxScreenHeight = (SCREEN_HEIGHT - insets.top - insets.bottom) * 0.6;
    
    
    const minHeight = (estimatedItemHeight * 2) + headerHeight + padding;
    
    
    return Math.max(minHeight, Math.min(contentHeight, maxScreenHeight));
  }, [insets]);

  
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

  
  
  const searchSuggestions = React.useMemo(() => {
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
    const { clearSearchHistory } = await import('../utils/searchHistory');
    await clearSearchHistory();
    await loadSearchHistory();
  }, []);

  
  const suggestionsList = React.useMemo(() => {
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
          style={[
            styles.suggestionItem,
            isActive && styles.suggestionItemActive,
          ]}
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
                style={[
                  styles.suggestionText,
                  isActive && styles.suggestionTextActive,
                ]} 
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
              <Ionicons 
                name="close-circle" 
                size={20} 
                color={theme.colors.textSecondary} 
              />
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

  const handleAvatarPress = () => {
    if (isAuthenticated) {
      navigation.navigate('AccountTab', { screen: 'Account' });
    } else {
      navigation.navigate('Auth', { screen: 'Login' });
    }
  };

  
  useEffect(() => {
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      
    });

    return () => {
      keyboardDidHideListener.remove();
    };
  }, []);

  const handleBackPress = () => {
    
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    
    
    const parent = navigation.getParent();
    if (parent && parent.canGoBack()) {
      parent.goBack();
      return;
    }
    
    
    
  };

  
  const canGoBack = navigation.canGoBack() || (navigation.getParent()?.canGoBack() ?? false);

  return (
    <HeaderSafeArea edges={['top']} style={style}>
      <HeaderContainer>
        {}
        <View style={styles.leftSection}>
          {canGoBack && (
            <BackButton onPress={handleBackPress} activeOpacity={0.7}>
              <BackIcon>←</BackIcon>
            </BackButton>
          )}
          <Logo 
            variant={isHomeScreen ? "default" : "compact"} 
            onPress={() => navigation.navigate('HomeTab', { screen: 'Home' })}
            style={styles.logoContainer}
          />
        </View>
        
        {}
        <SearchInputWrapper>
          <SearchInputContainer
            activeOpacity={1}
            onPress={() => searchInputRef.current?.focus()}
          >
            <Ionicons name="search-outline" size={20} color={theme.colors.textSecondary} style={styles.searchIcon} />
            <SearchInputField
              ref={searchInputRef}
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
              <LoadingIndicator>
                <ActivityIndicator size="small" color={theme.colors.primary} />
              </LoadingIndicator>
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
          </SearchInputContainer>

          {}
          {showSuggestions && (
            <>
              {suggestionsList.length > 0 ? (
                <View style={[styles.suggestionsContainer, { maxHeight: calculateDropdownHeight }]}>
                  {renderSuggestionsHeader()}
                  <FlatList
                    ref={suggestionsRef}
                    data={suggestionsList}
                    keyExtractor={(item, index) => item?.id || `item-${index}`}
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
                    <Text style={styles.emptyStateText}>
                      Try searching for something else
                    </Text>
                  </View>
                </View>
              )}
            </>
          )}
        </SearchInputWrapper>

        {}
        <HeaderActions>
          <UserAvatar onPress={handleAvatarPress} activeOpacity={0.7}>
            {(() => {
              
              const photoUrl = user?.profilePicture || user?.avatar || user?.photo || user?.image;
              if (isAuthenticated && user) {
                console.log('[GlobalHeader] Avatar Debug:', {
                  isAuthenticated,
                  hasUser: !!user,
                  profilePicture: user?.profilePicture,
                  avatar: user?.avatar,
                  photo: user?.photo,
                  image: user?.image,
                  photoUrl,
                  userKeys: Object.keys(user || {}),
                });
              }

              if (isAuthenticated && photoUrl && photoUrl.trim() !== '') {
                return (
                  <UserAvatarImage
                    source={{ uri: photoUrl }}
                    resizeMode="cover"
                    onError={(error) => {
                      console.error('[GlobalHeader] Avatar image load error:', error, 'URL:', photoUrl);
                    }}
                    onLoad={() => {
                      console.log('[GlobalHeader] Avatar image loaded successfully:', photoUrl);
                    }}
                  />
                );
              } else if (isAuthenticated && user) {
                return (
                  <UserAvatarText>
                    {(user?.name || user?.firstName || user?.email || 'U').charAt(0).toUpperCase()}
                  </UserAvatarText>
                );
              } else {
                return (
                  <View style={styles.userAvatarIcon}>
                    <Ionicons name="person-outline" size={18} color={theme.colors.white} />
                  </View>
                );
              }
            })()}
          </UserAvatar>
        </HeaderActions>
      </HeaderContainer>
    </HeaderSafeArea>
  );
};


const HeaderSafeArea = ({style, ...props}) => (
  <SafeAreaView {...props} style={[styles.headerSafeArea, style]} />
);


const HeaderContainer = ({style, ...props}) => (
  <View {...props} style={[styles.headerContainer, style]} />
);


const SearchInputContainer = ({style, ...props}) => (
  <TouchableOpacity {...props} style={[styles.searchInputContainer, style]} />
);


const SearchInputWrapper = ({style, ...props}) => (
  <View {...props} style={[styles.searchInputWrapper, style]} />
);


const SearchInputField = ({style, ...props}) => (
  <TextInput {...props} style={[styles.searchInputField, style]} />
);


const LoadingIndicator = ({style, ...props}) => (
  <View {...props} style={[styles.loadingIndicator, style]} />
);




const HeaderActions = ({style, ...props}) => (
  <View {...props} style={[styles.headerActions, style]} />
);


const UserAvatar = ({style, ...props}) => (
  <TouchableOpacity {...props} style={[styles.userAvatar, style]} />
);


const UserAvatarText = ({style, ...props}) => (
  <Text {...props} style={[styles.userAvatarText, style]} />
);


const UserAvatarImage = ({style, ...props}) => (
  <Image {...props} style={[styles.userAvatarImage, style]} />
);


const BackButton = ({style, ...props}) => (
  <TouchableOpacity {...props} style={[styles.backButton, style]} />
);


const BackIcon = ({style, ...props}) => (
  <Text {...props} style={[styles.backIcon, style]} />
);


const styles = StyleSheet.create({
  headerSafeArea: {
    backgroundColor: theme.colors.white,
    borderBottomWidth: 0,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 4,
    minHeight: 40,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  logoContainer: {
    marginRight: theme.spacing.sm,
    width: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
  },
  backIcon: {
    fontSize: 20,
    color: theme.colors.white,
    fontWeight: theme.typography.fontWeight.bold,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: theme.colors.grey300,
    minHeight: 36,
  },
  searchIcon: {
    marginRight: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    padding: 0,
    color: theme.colors.textPrimary,
  },
  searchInputWrapper: {
    flex: 1,
    position: 'relative',
    marginHorizontal: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  searchInputField: {
    flex: 1,
    padding: 0,
    minHeight: 20,
    color: theme.colors.textPrimary,
  },
  clearButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: theme.spacing.xs,
  },
  loadingIndicator: {
    width: 16,
    height: 16,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    marginTop: theme.spacing.xs,
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
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
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
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.grey100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  suggestionIconContainerHistory: {
    backgroundColor: theme.colors.grey100,
  },
  suggestionIconContainerProduct: {
    backgroundColor: theme.colors.primary + '15',
  },
  suggestionIconContainerCategory: {
    backgroundColor: theme.colors.success + '15',
  },
  suggestionTextContainer: {
    flex: 1,
  },
  suggestionText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  suggestionTextActive: {
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.semiBold,
  },
  suggestionType: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
    textTransform: 'capitalize',
  },
  deleteButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: theme.spacing.sm,
  },
  sectionHeader: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.grey50,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.grey200,
  },
  sectionHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  clearHistoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.grey200,
    backgroundColor: theme.colors.grey50,
    gap: theme.spacing.xs,
  },
  clearHistoryText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textSecondary,
  },
  emptyStateContainer: {
    paddingVertical: theme.spacing['3xl'],
    paddingHorizontal: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  emptyStateText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: theme.colors.primary + '40',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    marginLeft: theme.spacing.sm,
  },
  userAvatarText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.white,
  },
  userAvatarIcon: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: theme.borderRadius.full,
  },
});

export default GlobalHeader;
