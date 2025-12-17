import React, { useState, useMemo, useCallback, useRef, useEffect, useLayoutEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  RefreshControl,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import ProductCard from '../../components/ProductCard';
import EmptyState from '../../components/EmptyState';
import { useCategoryProducts } from '../../hooks/useCategoryProducts';
import { useGetCategoryById, useGetParentCategories } from '../../hooks/useCategory';
import LogoIcon from '../../components/header/LogoIcon';
import HeaderSearchInput from '../../components/header/HeaderSearchInput';
import HeaderAvatar from '../../components/header/HeaderAvatar';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SUBCATEGORIES_SIDEBAR_WIDTH = 120;
const PRODUCT_CARD_WIDTH = (SCREEN_WIDTH - SUBCATEGORIES_SIDEBAR_WIDTH - theme.spacing.md * 3) / 2;

const SORT_OPTIONS = [
  { value: '', label: 'Default', icon: '📋' },
  { value: 'price-asc', label: 'Price: Low to High', icon: '⬆️' },
  { value: 'price-desc', label: 'Price: High to Low', icon: '⬇️' },
  { value: 'rating', label: 'Highest Rated', icon: '⭐' },
  { value: 'newest', label: 'Newest First', icon: '🆕' },
];

const CategoryScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const categoryId = route?.params?.categoryId || route?.params?.id;
  const categoryName = route?.params?.categoryName || route?.params?.name;

  console.log('[CategoryScreen] Initial render:', {
    categoryId,
    categoryName,
    allParams: route?.params,
  });

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => <LogoIcon />,
      headerTitle: () => <HeaderSearchInput />,
      headerRight: () => <HeaderAvatar />,
    });
  }, [navigation]);

  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sortOption, setSortOption] = useState('');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 5000 });
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [selectedParentCategory, setSelectedParentCategory] = useState(categoryId || null);
  const [showSortModal, setShowSortModal] = useState(false);

  const slideAnim = useRef(new Animated.Value(0)).current;

  const {
    data: parentCategoriesData,
    isLoading: isParentCategoriesLoading,
  } = useGetParentCategories();

  const {
    data: categoryData,
    isLoading: isCategoryLoading,
    error: categoryError,
  } = useGetCategoryById(selectedParentCategory || categoryId);

  const {
    data: productsData,
    isLoading: isProductsLoading,
    error: productsError,
    refetch,
  } = useCategoryProducts(selectedParentCategory || categoryId, {
    page,
    limit: 20,
    sort: sortOption,
    minPrice: priceRange.min,
    maxPrice: priceRange.max,
    subcategory: selectedSubcategory,
  });

  const products = useMemo(() => {
    if (!productsData?.data) return [];
    return productsData.data.products || productsData.data || [];
  }, [productsData]);

  const category = useMemo(() => {
    if (!categoryData) return null;
    return (
      categoryData?.data?.category ||
      categoryData?.data ||
      categoryData ||
      null
    );
  }, [categoryData]);

  const subcategories = useMemo(() => {
    if (!category) return [];
    return category?.subcategories || category?.data?.subcategories || [];
  }, [category]);

  const parentCategories = useMemo(() => {
    if (!parentCategoriesData) return [];
    return (
      parentCategoriesData?.data?.categories ||
      parentCategoriesData?.categories ||
      parentCategoriesData?.results ||
      []
    );
  }, [parentCategoriesData]);

  useEffect(() => {
    console.log('[CategoryScreen] Route params changed:', { categoryId, categoryName });
    if (categoryId) {
      setSelectedParentCategory(categoryId);
      setPage(1); 
    }
  }, [categoryId, categoryName]);

  const totalProducts = useMemo(() => {
    return (
      productsData?.data?.total ||
      productsData?.total ||
      products.length 
      0
    );
  }, [productsData, products.length]);

  const displayName = useMemo(() => {
    return categoryName || category?.name || categoryData?.data?.name || 'Category';
  }, [categoryName, category, categoryData]);

  const handleProductPress = useCallback(
    (product) => {
      navigation.navigate('ProductDetail', {
        productId: product._id || product.id,
        id: product._id || product.id,
      });
    },
    [navigation]
  );

  const handleLoadMore = useCallback(() => {
    if (!isProductsLoading && products.length > 0 && products.length % 20 === 0) {
      setPage((prev) => prev + 1);
    }
  }, [isProductsLoading, products.length]);

  const handleSortChange = useCallback((sort) => {
    setSortOption(sort);
    setPage(1);
    setShowSortModal(false);
  }, []);

  const handleFilterApply = useCallback(() => {
    setPage(1);
    setShowFilters(false);
    refetch();
  }, [refetch]);

  const handleResetFilters = useCallback(() => {
    setPriceRange({ min: 0, max: 5000 });
    setSelectedSubcategory(null);
    setSortOption('');
    setPage(1);
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const openFilterModal = useCallback(() => {
    setShowFilters(true);
    Animated.spring(slideAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();
  }, [slideAnim]);

  const closeFilterModal = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowFilters(false);
    });
  }, [slideAnim]);

  const renderProduct = useCallback(
    ({ item, index }) => (
      <View style={styles.productItem}>
        <ProductCard
          product={item}
          onPress={() => handleProductPress(item)}
          style={styles.productCard}
        />
      </View>
    ),
    [handleProductPress]
  );

  const handleParentCategorySelect = useCallback((parentId) => {
    setSelectedParentCategory(parentId);
    setSelectedSubcategory(null);
    setPage(1);
  }, []);

  const handleSubcategorySelect = useCallback((subId) => {
    setSelectedSubcategory(subId === selectedSubcategory ? null : subId);
    setPage(1);
  }, [selectedSubcategory]);

  const renderFooter = useCallback(() => {
    if (!isProductsLoading || page === 1) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
        <Text style={styles.footerLoaderText}>Loading more...</Text>
      </View>
    );
  }, [isProductsLoading, page]);

  const renderEmpty = useCallback(() => {
    if (isProductsLoading) return null;
    return (
      <EmptyState
        icon="📦"
        title="No products found"
        message={
          selectedSubcategory || priceRange.min > 0 || priceRange.max < 5000
            ? 'Try adjusting your filters or check back later'
            : 'This category is empty. Check back later for new products.'
        }
      />
    );
  }, [isProductsLoading, selectedSubcategory, priceRange]);

  if (isCategoryLoading && !categoryData) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading category...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (categoryError || productsError) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorMessage}>
            {categoryError?.message || productsError?.message || 'Failed to load category'}
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              refetch();
            }}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>

      {parentCategories.length > 0 && (
        <View style={styles.parentCategoriesContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.parentCategoriesContent}
            >
              {parentCategories.map((parent) => {
                const isSelected = selectedParentCategory === (parent._id || parent.id);
                return (
                  <TouchableOpacity
                    key={parent._id || parent.id}
                    style={[
                      styles.parentCategoryTab,
                      isSelected && styles.parentCategoryTabActive,
                    ]}
                    onPress={() => handleParentCategorySelect(parent._id || parent.id)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.parentCategoryTabText,
                        isSelected && styles.parentCategoryTabTextActive,
                      ]}
                    >
                      {parent.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
      )}

      <SafeAreaView style={styles.splitContainer} edges={['bottom']}>

        {subcategories.length > 0 && (
          <View style={styles.subcategoriesSidebar}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.subcategoriesSidebarContent}
            >
              <TouchableOpacity
                style={[
                  styles.subcategoryItem,
                  !selectedSubcategory && styles.subcategoryItemActive,
                ]}
                onPress={() => handleSubcategorySelect(null)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.subcategoryItemText,
                    !selectedSubcategory && styles.subcategoryItemTextActive,
                  ]}
                >
                  All
                </Text>
              </TouchableOpacity>
              {subcategories.map((sub) => {
                const isSelected = selectedSubcategory === (sub._id || sub.id);
                return (
                  <TouchableOpacity
                    key={sub._id || sub.id}
                    style={[
                      styles.subcategoryItem,
                      isSelected && styles.subcategoryItemActive,
                    ]}
                    onPress={() => handleSubcategorySelect(sub._id || sub.id)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.subcategoryItemText,
                        isSelected && styles.subcategoryItemTextActive,
                      ]}
                    >
                      {sub.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        <View style={styles.productsContainer}>

          <View style={styles.categoryInfoBar}>
            <View style={styles.categoryInfoLeft}>
              <Text style={styles.categoryInfoTitle} numberOfLines={1}>
                {displayName}
              </Text>
              <Text style={styles.categoryInfoCount}>
                {totalProducts} {totalProducts === 1 ? 'product' : 'products'}
              </Text>
            </View>
            <View style={styles.categoryInfoActions}>
              <TouchableOpacity
                style={styles.headerActionButton}
                onPress={openFilterModal}
                activeOpacity={0.7}
              >
                <Ionicons name="filter-outline" size={20} color={theme.colors.textPrimary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerActionButton}
                onPress={() => setShowSortModal(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="swap-vertical-outline" size={20} color={theme.colors.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>

          <FlatList
            data={products}
            renderItem={renderProduct}
            keyExtractor={(item, index) =>
              item._id?.toString() || item.id?.toString() || `product-${index}`
            }
            numColumns={2}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={renderEmpty}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.3}
            contentContainerStyle={[
              styles.productsListContent,
              products.length === 0 && styles.listContentEmpty,
            ]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[theme.colors.primary]}
                tintColor={theme.colors.primary}
              />
            }
            removeClippedSubviews={Platform.OS === 'android'}
            maxToRenderPerBatch={10}
            windowSize={10}
            initialNumToRender={10}
          />
        </View>
      </SafeAreaView>

      <Modal
        visible={showSortModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSortModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSortModal(false)}
        >
          <View style={styles.sortModalContent}>
            <Text style={styles.sortModalTitle}>Sort By</Text>
            {SORT_OPTIONS.map((option) => {
              const isSelected = sortOption === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.sortOption,
                    isSelected && styles.sortOptionActive,
                  ]}
                  onPress={() => handleSortChange(option.value)}
                >
                  <Text style={styles.sortOptionIcon}>{option.icon}</Text>
                  <Text
                    style={[
                      styles.sortOptionText,
                      isSelected && styles.sortOptionTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {isSelected && (
                    <Text style={styles.sortOptionCheck}>✓</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showFilters}
        transparent
        animationType="none"
        onRequestClose={closeFilterModal}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.filterModalContent,
              {
                transform: [
                  {
                    translateY: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [600, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.filterModalHeader}>
              <Text style={styles.filterModalTitle}>Filters</Text>
              <TouchableOpacity
                onPress={closeFilterModal}
                style={styles.filterModalClose}
                accessibilityLabel="Close filters"
                accessibilityRole="button"
              >
                <Text style={styles.filterModalCloseIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.filterModalBody}
              showsVerticalScrollIndicator={false}
            >

              {subcategories.length > 0 && (
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>Subcategories</Text>
                  <View style={styles.filterOptionsGrid}>
                    {subcategories.map((sub) => {
                      const isSelected =
                        selectedSubcategory === (sub._id || sub.id);
                      return (
                        <TouchableOpacity
                          key={sub._id || sub.id}
                          style={[
                            styles.filterOptionCard,
                            isSelected && styles.filterOptionCardActive,
                          ]}
                          onPress={() => {}
                            setSelectedSubcategory(
                              isSelected ? null : sub._id || sub.id
                            )
                          }
                        >
                          <Text
                            style={[
                              styles.filterOptionCardText,
                              isSelected && styles.filterOptionCardTextActive,
                            ]}
                          >
                            {sub.name}
                          </Text>
                          {isSelected && (
                            <View style={styles.filterOptionCheckmark}>
                              <Text style={styles.filterOptionCheckmarkText}>
                                ✓
                              </Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Price Range</Text>
                <View style={styles.priceRangeContainer}>
                  <View style={styles.priceInputWrapper}>
                    <Text style={styles.priceInputLabel}>Min (GH₵)</Text>
                    <TextInput
                      style={styles.priceInput}
                      placeholder="0"
                      keyboardType="numeric"
                      value={priceRange.min > 0 ? priceRange.min.toString() : ''}
                      onChangeText={(text) => {
                        const value = parseInt(text) || 0;
                        setPriceRange((prev) => ({
                          ...prev,
                          min: value,
                        }));
                      }}
                    />
                  </View>
                  <View style={styles.priceSeparatorContainer}>
                    <View style={styles.priceSeparatorLine} />
                  </View>
                  <View style={styles.priceInputWrapper}>
                    <Text style={styles.priceInputLabel}>Max (GH₵)</Text>
                    <TextInput
                      style={styles.priceInput}
                      placeholder="5000"
                      keyboardType="numeric"
                      value={
                        priceRange.max < 5000 ? priceRange.max.toString() : ''
                      }
                      onChangeText={(text) => {
                        const value = parseInt(text) || 5000;
                        setPriceRange((prev) => ({
                          ...prev,
                          max: value,
                        }));
                      }}
                    />
                  </View>
                </View>
              </View>
            </ScrollView>

            <View style={styles.filterModalFooter}>
              <TouchableOpacity
                style={styles.filterResetButton}
                onPress={handleResetFilters}
              >
                <Text style={styles.filterResetButtonText}>Reset All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.filterApplyButton}
                onPress={handleFilterApply}
              >
                <Text style={styles.filterApplyButtonText}>
                  Apply Filters
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.background,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: theme.spacing.md,
  },
  errorTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  errorMessage: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  retryButtonText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  listContent: {
    paddingBottom: theme.spacing.xl,
  },
  listContentEmpty: {
    flexGrow: 1,
  },

  parentCategoriesContainer: {
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.grey200,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  parentCategoriesContent: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
  },
  parentCategoryTab: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginRight: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.grey100,
  },
  parentCategoryTabActive: {
    backgroundColor: theme.colors.primary,
  },
  parentCategoryTabText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textSecondary,
  },
  parentCategoryTabTextActive: {
    color: theme.colors.white,
    fontWeight: theme.typography.fontWeight.semiBold,
  },

  splitContainer: {
    flex: 1,
    flexDirection: 'row',
  },

  subcategoriesSidebar: {
    width: 120,
    backgroundColor: theme.colors.white,
    borderRightWidth: 1,
    borderRightColor: theme.colors.grey200,
  },
  subcategoriesSidebarContent: {
    paddingVertical: theme.spacing.sm,
  },
  subcategoryItem: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.grey100,
  },
  subcategoryItemActive: {
    backgroundColor: theme.colors.primary + '10',
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  subcategoryItemText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  subcategoryItemTextActive: {
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.semiBold,
  },

  productsContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  categoryInfoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.grey200,
    gap: theme.spacing.sm,
  },
  categoryInfoLeft: {
    flex: 1,
  },
  categoryInfoTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  categoryInfoCount: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  categoryInfoActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  headerActionButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.grey100,
  },
  headerActionIcon: {
    fontSize: 18,
  },
  productsListContent: {
    padding: theme.spacing.sm,
    paddingBottom: theme.spacing.xl,
  },
  header: {
    backgroundColor: theme.colors.white,
    paddingBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  titleSection: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  categoryTitle: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  productCount: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.xs,
    position: 'relative',
  },
  filterButton: {
    backgroundColor: theme.colors.primary,
  },
  sortButton: {
    backgroundColor: theme.colors.grey100,
  },
  actionButtonIcon: {
    fontSize: theme.typography.fontSize.base,
  },
  actionButtonText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  actionButtonTextWhite: {
    color: theme.colors.white,
  },
  actionButtonTextDark: {
    color: theme.colors.textPrimary,
  },
  filterBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.error,
  },
  subcategoriesContainer: {
    marginTop: theme.spacing.sm,
  },
  subcategoriesContent: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xs,
    gap: theme.spacing.sm,
  },
  subcategoryChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.grey100,
    marginRight: theme.spacing.sm,
  },
  subcategoryChipActive: {
    backgroundColor: theme.colors.primary,
  },
  subcategoryChipText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textPrimary,
  },
  subcategoryChipTextActive: {
    color: theme.colors.white,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  productItem: {
    flex: 1,
    margin: theme.spacing.xs,
    maxWidth: '48%',
  },
  productCard: {
    margin: 0,
  },
  footerLoader: {
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  footerLoaderText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sortModalContent: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    paddingBottom: theme.spacing.xl,
    maxHeight: '60%',
  },
  sortModalTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.grey200,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.grey100,
  },
  sortOptionActive: {
    backgroundColor: theme.colors.primary + '10',
  },
  sortOptionIcon: {
    fontSize: theme.typography.fontSize.lg,
    marginRight: theme.spacing.md,
  },
  sortOptionText: {
    flex: 1,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textPrimary,
  },
  sortOptionTextActive: {
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.primary,
  },
  sortOptionCheck: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.bold,
  },
  filterModalContent: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    maxHeight: '85%',
    ...theme.shadows.lg,
  },
  filterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.grey200,
  },
  filterModalTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  filterModalClose: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.grey100,
  },
  filterModalCloseIcon: {
    fontSize: theme.typography.fontSize.xl,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.fontWeight.bold,
  },
  filterModalBody: {
    padding: theme.spacing.md,
  },
  filterSection: {
    marginBottom: theme.spacing.xl,
  },
  filterSectionTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  filterOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  filterOptionCard: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.grey100,
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 100,
    alignItems: 'center',
    position: 'relative',
  },
  filterOptionCardActive: {
    backgroundColor: theme.colors.primary + '15',
    borderColor: theme.colors.primary,
  },
  filterOptionCardText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textPrimary,
  },
  filterOptionCardTextActive: {
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  filterOptionCheckmark: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.white,
  },
  filterOptionCheckmarkText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.white,
    fontWeight: theme.typography.fontWeight.bold,
  },
  priceRangeContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: theme.spacing.md,
  },
  priceInputWrapper: {
    flex: 1,
  },
  priceInputLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  priceInput: {
    borderWidth: 1,
    borderColor: theme.colors.grey300,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.white,
  },
  priceSeparatorContainer: {
    paddingBottom: theme.spacing.md,
  },
  priceSeparatorLine: {
    width: 20,
    height: 1,
    backgroundColor: theme.colors.grey300,
  },
  filterModalFooter: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.grey200,
    gap: theme.spacing.sm,
  },
  filterResetButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.grey100,
  },
  filterResetButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },
  filterApplyButton: {
    flex: 2,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary,
  },
  filterApplyButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.white,
  },
});

export default CategoryScreen;


