import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { ActivityIndicator, FlatList, Modal, ScrollView, Text, TextInput, TouchableOpacity, View, StyleSheet, Keyboard, Pressable } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { useRoute } from '@react-navigation/native';
import ProductCard from '../../components/ProductCard';
import { theme } from '../../theme';
import { useSearchResults } from '../../hooks/useSearch';
import { useCategory } from '../../hooks/useCategory';

const SearchScreen = ({ navigation }) => {
  const route = useRoute();
  const routeParams = route?.params || {};

  // FIXED: Move state declarations before queryParams useMemo
  const [searchQuery, setSearchQuery] = useState(routeParams.query || '');
  const [sortBy, setSortBy] = useState('relevance');
  const [showFilters, setShowFilters] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [filters, setFilters] = useState({
    category: [],
    priceRange: { min: 0, max: 5000 },
    rating: null,
    inStock: false,
    onSale: false,
  });

  const queryParams = useMemo(() => {
    const params = {};
    if (routeParams.query) params.q = routeParams.query;
    if (routeParams.type) params.type = routeParams.type;

    if (filters.category.length > 0) {
      params.category = filters.category[0]; 
    }
    if (filters.priceRange.min > 0) {
      params.minPrice = filters.priceRange.min;
    }
    if (filters.priceRange.max < 5000) {
      params.maxPrice = filters.priceRange.max;
    }
    if (filters.rating) {
      params.rating = filters.rating;
    }
    if (filters.inStock) {
      params.inStock = filters.inStock;
    }
    if (filters.onSale) {
      params.onSale = filters.onSale;
    }

    if (sortBy !== 'relevance') {
      params.sortBy = sortBy;
    }

    return params;
  }, [routeParams, filters, sortBy]);

  useEffect(() => {
    if (routeParams.query !== undefined) {
      setSearchQuery(routeParams.query);
    }
  }, [routeParams.query]);

  const handleSearchChange = useCallback((text) => {
    setSearchQuery(text);
  }, []);

  const handleSearchSubmit = useCallback(() => {
    if (searchQuery.trim()) {
      navigation.setParams({ query: searchQuery.trim() });
    }
  }, [searchQuery, navigation]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    navigation.setParams({ query: '' });
  }, [navigation]);

  const { data: productData, isLoading } = useSearchResults(queryParams);

  const { products, totalProducts } = useMemo(() => {
    const data = productData?.data || productData || {};
    return {
      products: data.data || [],
      totalProducts: data.totalProducts || data.results || 0,
    };
  }, [productData]);

  // FIXED: Correct useCategory hook usage
  const { getParentCategories } = useCategory();
  const categoriesData = getParentCategories?.data;
  const categories = categoriesData?.data?.categories || categoriesData?.categories || [];

  const searchQueryDisplay = queryParams.q || searchQuery || '';

  const toggleFilters = () => setShowFilters(!showFilters);

  const handleCategoryChange = (categoryId) => {
    const updatedCategories = filters.category.includes(categoryId)
      ? filters.category.filter((c) => c !== categoryId)
      : [...filters.category, categoryId];
    setFilters({ ...filters, category: updatedCategories });
  };

  const handleRatingChange = (rating) => {
    setFilters({
      ...filters,
      rating: filters.rating === rating ? null : rating,
    });
  };

  const handlePriceChange = (min, max) => {
    setFilters({ ...filters, priceRange: { min, max } });
  };

  const renderProduct = ({ item }) => {
    if (!item) return null;
    const productId = item._id || item.id;
    if (!productId) return null;

    // FIXED: Ensure navigation callback always fires with keyboard dismiss
    const handleProductPress = () => {
      Keyboard.dismiss();
      navigation.navigate('ProductDetail', { productId, id: productId });
    };

    return (
      <ProductCard
        product={item}
        onPress={handleProductPress}
        style={{ marginHorizontal: theme.spacing.sm, width: '55%' }}
      />
    );
  };

  return (
    <Container>

      <SearchInputContainer>
        <SearchInputWrapper>
          <SearchIcon>🔍</SearchIcon>
          <SearchInputField
            placeholder="Search products..."
            placeholderTextColor={theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={handleSearchChange}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <ClearButton onPress={handleClearSearch} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <ClearIcon>✕</ClearIcon>
            </ClearButton>
          )}
        </SearchInputWrapper>
      </SearchInputContainer>

      <SearchHeaderContainer>
        <SearchHeaderGradient>
          <HeaderContent>
            <SearchTitle>
              Results for <SearchQueryText>"{searchQueryDisplay}"</SearchQueryText>
            </SearchTitle>
            <ResultCount>
              {totalProducts > 0 ? (
                `${totalProducts} ${totalProducts === 1 ? 'item' : 'items'} found`
              ) : (
                'No items found'
              )}
            </ResultCount>
          </HeaderContent>
        </SearchHeaderGradient>
      </SearchHeaderContainer>

      <ControlsHeader>
        <FilterButton onPress={toggleFilters} activeOpacity={0.8}>
          <FilterButtonGradient>
            <FilterButtonText>🔍 Filters</FilterButtonText>
          </FilterButtonGradient>
        </FilterButton>

        <SortContainer>
          <SortButton onPress={() => setShowSortModal(true)}>
            <SortButtonText>
              {sortBy === 'relevance' && 'Relevance'}
              {sortBy === 'price-low' && 'Price: Low to High'}
              {sortBy === 'price-high' && 'Price: High to Low'}
              {sortBy === 'rating' && 'Customer Rating'}
              {sortBy === 'newest' && 'Newest Arrivals'}
            </SortButtonText>
            <SortButtonIcon>▼</SortButtonIcon>
          </SortButton>
        </SortContainer>
      </ControlsHeader>

      <Modal
        visible={showSortModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSortModal(false)}
      >
        <SortModalOverlay onPress={() => setShowSortModal(false)}>
          <SortModalContent onStartShouldSetResponder={() => true}>
            <SortModalTitle>Sort By</SortModalTitle>
            {['relevance', 'price-low', 'price-high', 'rating', 'newest'].map((option) => (
              <SortOptionButton
                key={option}
                onPress={() => {
                  setSortBy(option);
                  setShowSortModal(false);
                }}
                $active={sortBy === option}
              >
                <SortOptionText $active={sortBy === option}>
                  {option === 'relevance' && 'Relevance'}
                  {option === 'price-low' && 'Price: Low to High'}
                  {option === 'price-high' && 'Price: High to Low'}
                  {option === 'rating' && 'Customer Rating'}
                  {option === 'newest' && 'Newest Arrivals'}
                </SortOptionText>
                {sortBy === option && <SortOptionCheck>✓</SortOptionCheck>}
              </SortOptionButton>
            ))}
          </SortModalContent>
        </SortModalOverlay>
      </Modal>

      <Modal
        visible={showFilters}
        animationType="slide"
        transparent={true}
        onRequestClose={toggleFilters}
      >
        <FilterModalOverlay onPress={toggleFilters}>
          <FilterModalContent onStartShouldSetResponder={() => true}>
            <FilterModalHeader>
              <FilterModalTitle>Filters</FilterModalTitle>
              <CloseButton onPress={toggleFilters}>
                <CloseButtonText>✕</CloseButtonText>
              </CloseButton>
            </FilterModalHeader>

            <FilterScroll>

              <FilterSection>
                <FilterSectionTitle>Categories</FilterSectionTitle>
                {categories.length > 0 ? (
                  categories.map((category) => {
                    const isChecked = filters.category.includes(category._id || category.id);
                    return (
                      <FilterCheckbox
                        key={category._id || category.id}
                        onPress={() => handleCategoryChange(category._id || category.id)}
                        activeOpacity={0.7}
                      >
                        <FilterCheckboxBox $checked={isChecked}>
                          {isChecked && <FilterCheckboxCheck>✓</FilterCheckboxCheck>}
                        </FilterCheckboxBox>
                        <FilterCheckboxLabel>{category.name}</FilterCheckboxLabel>
                      </FilterCheckbox>
                    );
                  })
                ) : (
                  <FilterCheckboxLabel>No categories available</FilterCheckboxLabel>
                )}
              </FilterSection>

              <FilterSection>
                <FilterSectionTitle>Price Range</FilterSectionTitle>
                <PriceRangeContainer>
                  <PriceInputGroup>
                    <PriceInputLabel>Min</PriceInputLabel>
                    <PriceInput
                      value={filters.priceRange.min.toString()}
                      onChangeText={(text) =>
                        handlePriceChange(parseInt(text) || 0, filters.priceRange.max)
                      }
                      keyboardType="numeric"
                    />
                  </PriceInputGroup>
                  <PriceSeparator>-</PriceSeparator>
                  <PriceInputGroup>
                    <PriceInputLabel>Max</PriceInputLabel>
                    <PriceInput
                      value={filters.priceRange.max.toString()}
                      onChangeText={(text) =>
                        handlePriceChange(filters.priceRange.min, parseInt(text) || 5000)
                      }
                      keyboardType="numeric"
                    />
                  </PriceInputGroup>
                </PriceRangeContainer>
              </FilterSection>

              <FilterSection>
                <FilterSectionTitle>Rating</FilterSectionTitle>
                {[4, 3, 2].map((rating) => {
                  const isChecked = filters.rating === rating;
                  return (
                    <FilterRadio
                      key={rating}
                      onPress={() => handleRatingChange(rating)}
                      activeOpacity={0.7}
                    >
                      <FilterRadioCircle $checked={isChecked}>
                        {isChecked && <FilterRadioDot />}
                      </FilterRadioCircle>
                      <FilterRadioLabel>{rating}★ & above</FilterRadioLabel>
                    </FilterRadio>
                  );
                })}
              </FilterSection>

              <FilterSection>
                <FilterSectionTitle>Availability</FilterSectionTitle>
                <FilterCheckbox
                  onPress={() => setFilters({ ...filters, inStock: !filters.inStock })}
                  activeOpacity={0.7}
                >
                  <FilterCheckboxBox $checked={filters.inStock}>
                    {filters.inStock && <FilterCheckboxCheck>✓</FilterCheckboxCheck>}
                  </FilterCheckboxBox>
                  <FilterCheckboxLabel>In Stock Only</FilterCheckboxLabel>
                </FilterCheckbox>
                <FilterCheckbox
                  onPress={() => setFilters({ ...filters, onSale: !filters.onSale })}
                  activeOpacity={0.7}
                >
                  <FilterCheckboxBox $checked={filters.onSale}>
                    {filters.onSale && <FilterCheckboxCheck>✓</FilterCheckboxCheck>}
                  </FilterCheckboxBox>
                  <FilterCheckboxLabel>On Sale</FilterCheckboxLabel>
                </FilterCheckbox>
              </FilterSection>
            </FilterScroll>

            <FilterModalFooter>
              <ApplyButton onPress={toggleFilters} activeOpacity={0.8}>
                <ApplyButtonGradient>
                  <ApplyButtonText>Apply Filters</ApplyButtonText>
                </ApplyButtonGradient>
              </ApplyButton>
            </FilterModalFooter>
          </FilterModalContent>
        </FilterModalOverlay>
      </Modal>

      {isLoading ? (
        <LoadingContainer>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </LoadingContainer>
      ) : products.length === 0 ? (
        <EmptyState>
          <EmptyIcon>🔍</EmptyIcon>
          <EmptyTitle>No Results Found</EmptyTitle>
          <EmptyText>We couldn't find any products matching "{searchQueryDisplay}".</EmptyText>
          <EmptyText>Try checking your spelling or using different keywords.</EmptyText>
        </EmptyState>
      ) : (
        <ProductsList
          data={products}
          renderItem={renderProduct}
          keyExtractor={(item, index) => item?._id?.toString() || item?.id?.toString() || `product-${index}`}
          numColumns={2}
          contentContainerStyle={{ padding: theme.spacing.md }}
        />
      )}
    </Container>
  );
};

const SearchHeaderGradient = ({ children, style, ...props }) => (
  <LinearGradient
    colors={[theme.colors.primary, theme.colors.primary600]}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 0 }}
    style={[{
      paddingTop: 16,
      paddingBottom: 16,
      paddingLeft: 16,
      paddingRight: 16,
    }, style]}
    {...props}
  >
    {children}
  </LinearGradient>
);

const FilterButtonGradient = ({ children, style, ...props }) => (
  <LinearGradient
    colors={[theme.colors.primary, theme.colors.primary600]}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 0 }}
    style={[{
      flexDirection: 'row',
      alignItems: 'center',
      paddingTop: 16,
      paddingBottom: 16,
      paddingLeft: 16,
      paddingRight: 16,
    }, style]}
    {...props}
  >
    {children}
  </LinearGradient>
);

const ApplyButtonGradient = ({ children, style, ...props }) => (
  <LinearGradient
    colors={[theme.colors.primary, theme.colors.primary600]}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 0 }}
    style={[{
      paddingTop: 16,
      paddingBottom: 16,
      paddingLeft: 16,
      paddingRight: 16,
      alignItems: 'center',
    }, style]}
    {...props}
  >
    {children}
  </LinearGradient>
);

const Container = ({style, ...props}) => (
  <View {...props} style={[styles.container, style]} />
);

const SearchHeaderContainer = ({style, ...props}) => (
  <View {...props} style={[styles.searchHeaderContainer, style]} />
);

const HeaderContent = ({style, ...props}) => (
  <View {...props} style={[styles.headerContent, style]} />
);

const SearchTitle = ({style, ...props}) => (
  <Text {...props} style={[styles.searchTitle, style]} />
);

const SearchQueryText = ({style, ...props}) => (
  <Text {...props} style={[styles.searchQueryText, style]} />
);

const ResultCount = ({style, ...props}) => (
  <Text {...props} style={[styles.resultCount, style]} />
);

const ControlsHeader = ({style, ...props}) => (
  <View {...props} style={[styles.controlsHeader, style]} />
);

const FilterButton = ({style, ...props}) => (
  <TouchableOpacity {...props} style={[styles.filterButton, style]} />
);

const FilterButtonText = ({style, ...props}) => (
  <Text {...props} style={[styles.filterButtonText, style]} />
);

const SortContainer = ({style, ...props}) => (
  <View {...props} style={[styles.sortContainer, style]} />
);

const SortButton = ({style, ...props}) => (
  <TouchableOpacity {...props} style={[styles.sortButton, style]} />
);

const SortButtonText = ({style, ...props}) => (
  <Text {...props} style={[styles.sortButtonText, style]} />
);

const SortButtonIcon = ({style, ...props}) => (
  <Text {...props} style={[styles.sortButtonIcon, style]} />
);

const SortModalOverlay = ({style, children, ...props}) => (
  <Pressable {...props} style={[styles.sortModalOverlay, style]}>
    {children}
  </Pressable>
);

const SortModalContent = ({style, ...props}) => (
  <View {...props} style={[styles.sortModalContent, style]} />
);

const SortModalTitle = ({style, ...props}) => (
  <Text {...props} style={[styles.sortModalTitle, style]} />
);

const SortOptionButton = ({style, ...props}) => (
  <TouchableOpacity {...props} style={[styles.sortOptionButton, style]} />
);

const SortOptionText = ({style, ...props}) => (
  <Text {...props} style={[styles.sortOptionText, style]} />
);

const SortOptionCheck = ({style, ...props}) => (
  <Text {...props} style={[styles.sortOptionCheck, style]} />
);

const FilterModalOverlay = ({style, children, ...props}) => (
  <Pressable {...props} style={[styles.filterModalOverlay, style]}>
    {children}
  </Pressable>
);

const FilterModalContent = ({style, ...props}) => (
  <View {...props} style={[styles.filterModalContent, style]} />
);

const FilterModalHeader = ({style, ...props}) => (
  <View {...props} style={[styles.filterModalHeader, style]} />
);

const FilterModalTitle = ({style, ...props}) => (
  <Text {...props} style={[styles.filterModalTitle, style]} />
);

const CloseButton = ({style, ...props}) => (
  <TouchableOpacity {...props} style={[styles.closeButton, style]} />
);

const CloseButtonText = ({style, ...props}) => (
  <Text {...props} style={[styles.closeButtonText, style]} />
);

const FilterScroll = ({style, ...props}) => (
  <ScrollView 
    {...props} 
    style={[styles.filterScroll, style]}
    keyboardShouldPersistTaps="always"
    keyboardDismissMode="on-drag"
  />
);

const FilterSection = ({style, ...props}) => (
  <View {...props} style={[styles.filterSection, style]} />
);

const FilterSectionTitle = ({style, ...props}) => (
  <Text {...props} style={[styles.filterSectionTitle, style]} />
);

const FilterCheckbox = ({style, ...props}) => (
  <TouchableOpacity {...props} style={[styles.filterCheckbox, style]} />
);

const FilterCheckboxBox = ({style, ...props}) => (
  <View {...props} style={[styles.filterCheckboxBox, style]} />
);

const FilterCheckboxCheck = ({style, ...props}) => (
  <Text {...props} style={[styles.filterCheckboxCheck, style]} />
);

const FilterCheckboxLabel = ({style, ...props}) => (
  <Text {...props} style={[styles.filterCheckboxLabel, style]} />
);

const FilterRadio = ({style, ...props}) => (
  <TouchableOpacity {...props} style={[styles.filterRadio, style]} />
);

const FilterRadioCircle = ({style, ...props}) => (
  <View {...props} style={[styles.filterRadioCircle, style]} />
);

const FilterRadioDot = ({style, ...props}) => (
  <View {...props} style={[styles.filterRadioDot, style]} />
);

const FilterRadioLabel = ({style, ...props}) => (
  <Text {...props} style={[styles.filterRadioLabel, style]} />
);

const PriceRangeContainer = ({style, ...props}) => (
  <View {...props} style={[styles.priceRangeContainer, style]} />
);

const PriceInputGroup = ({style, ...props}) => (
  <View {...props} style={[styles.priceInputGroup, style]} />
);

const PriceInputLabel = ({style, ...props}) => (
  <Text {...props} style={[styles.priceInputLabel, style]} />
);

const PriceInput = ({style, ...props}) => (
  <TextInput {...props} style={[styles.priceInput, style]} />
);

const PriceSeparator = ({style, ...props}) => (
  <Text {...props} style={[styles.priceSeparator, style]} />
);

const FilterModalFooter = ({style, ...props}) => (
  <View {...props} style={[styles.filterModalFooter, style]} />
);

const ApplyButton = ({style, ...props}) => (
  <TouchableOpacity {...props} style={[styles.applyButton, style]} />
);

const ApplyButtonText = ({style, ...props}) => (
  <Text {...props} style={[styles.applyButtonText, style]} />
);

const LoadingContainer = ({style, ...props}) => (
  <View {...props} style={[styles.loadingContainer, style]} />
);

const EmptyState = ({style, ...props}) => (
  <View {...props} style={[styles.emptyState, style]} />
);

const EmptyIcon = ({style, ...props}) => (
  <Text {...props} style={[styles.emptyIcon, style]} />
);

const EmptyTitle = ({style, ...props}) => (
  <Text {...props} style={[styles.emptyTitle, style]} />
);

const EmptyText = ({style, ...props}) => (
  <Text {...props} style={[styles.emptyText, style]} />
);

const ProductsList = ({style, ...props}) => (
  <FlatList 
    {...props} 
    style={[styles.productsList, style]}
    keyboardShouldPersistTaps="always"
    keyboardDismissMode="on-drag"
  />
);

const SearchInputContainer = ({style, ...props}) => (
  <View {...props} style={[styles.searchInputContainer, style]} />
);

const SearchInputWrapper = ({style, ...props}) => (
  <View {...props} style={[styles.searchInputWrapper, style]} />
);

const SearchIcon = ({style, ...props}) => (
  <Text {...props} style={[styles.searchIcon, style]} />
);

const SearchInputField = ({style, ...props}) => (
  <TextInput {...props} style={[styles.searchInputField, style]} />
);

const ClearButton = ({style, ...props}) => (
  <TouchableOpacity {...props} style={[styles.clearButton, style]} />
);

const ClearIcon = ({style, ...props}) => (
  <Text {...props} style={[styles.clearIcon, style]} />
);

const SortSelect = ({style, ...props}) => (
  <TextInput {...props} style={[styles.sortSelect, style]} />
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchHeaderContainer: {
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: '0 4',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  searchTitle: {
    flex: 1,
  },
  searchQueryText: {
    fontStyle: 'italic',
    opacity: 0.95,
  },
  resultCount: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  controlsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  filterButton: {
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: '0 1',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  filterButtonText: {},
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: '0 1',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortButtonText: {},
  sortButtonIcon: {},
  sortModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sortModalContent: {
    width: '80%',
    maxWidth: 300,
    shadowColor: '#000',
    shadowOffset: '0 4',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  sortModalTitle: {},
  sortOptionButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sortOptionText: {},
  sortOptionCheck: {},
  filterModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  filterModalContent: {
    maxHeight: '80%',
  },
  filterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 2,
  },
  filterModalTitle: {},
  closeButton: {},
  closeButtonText: {},
  filterScroll: {
    flex: 1,
  },
  filterSection: {
    borderBottomWidth: 1,
  },
  filterSectionTitle: {},
  filterCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterCheckboxBox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterCheckboxCheck: {},
  filterCheckboxLabel: {
    flex: 1,
  },
  filterRadio: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterRadioCircle: {
    width: 24,
    height: 24,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterRadioDot: {
    width: 12,
    height: 12,
  },
  filterRadioLabel: {
    flex: 1,
  },
  priceRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceInputGroup: {
    flex: 1,
  },
  priceInputLabel: {},
  priceInput: {
    borderWidth: 1,
  },
  priceSeparator: {},
  filterModalFooter: {
    borderTopWidth: 1,
  },
  applyButton: {
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: '0 2',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  applyButtonText: {},
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    shadowColor: '#000',
    shadowOffset: '0 2',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyIcon: {
    fontSize: 50,
  },
  emptyTitle: {
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
  },
  productsList: {
    flex: 1,
  },
  searchInputContainer: {
    borderBottomWidth: 1,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.grey300,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  searchIcon: {},
  searchInputField: {
    flex: 1,
  },
  clearButton: {},
  clearIcon: {},
  sortSelect: {
    flex: 1,
  },
});

export default SearchScreen;


