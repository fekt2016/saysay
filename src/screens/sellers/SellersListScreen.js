import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme';
import EmptyState from '../../components/EmptyState';
import { useGetFeaturedSellers } from '../../hooks/useSellers';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const StarRating = ({ rating, size = 14 }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <View style={styles.starRatingContainer}>
      {[...Array(fullStars)].map((_, i) => (
        <Text key={`full-${i}`} style={[styles.star, { fontSize: size }]}>⭐</Text>
      ))}
      {hasHalfStar && <Text style={[styles.star, { fontSize: size }]}>⭐</Text>}
      {[...Array(emptyStars)].map((_, i) => (
        <Text key={`empty-${i}`} style={[styles.star, { fontSize: size, opacity: 0.3 }]}>⭐</Text>
      ))}
    </View>
  );
};

const SellerCard = ({ seller, onPress }) => {
  const avatarUri = seller?.avatar || seller?.image || seller?.logo;
  const name = seller?.shopName || seller?.name || 'Seller';
  const rating = seller?.rating || seller?.ratings?.average || 0;
  const location = seller?.location;

  const sellerProducts = useMemo(() => {
    if (!seller?.products) return [];

    if (Array.isArray(seller.products)) {
      return seller.products;
    }
    if (seller.products?.products && Array.isArray(seller.products.products)) {
      return seller.products.products;
    }
    return [];
  }, [seller?.products]);

  const productsCount = useMemo(() => {

    if (seller?.productCount !== undefined && seller.productCount !== null) {
      return seller.productCount;
    }
    if (sellerProducts.length > 0) {
      return sellerProducts.length;
    }
    return 0;
  }, [seller?.productCount, sellerProducts.length]);

  const totalSold = seller?.totalSold || 0;

  const productImages = useMemo(() => {
    if (sellerProducts.length === 0) return [];

    const images = sellerProducts
      .flatMap((product) => {

        if (Array.isArray(product.images)) return product.images;
        if (product.image) return [product.image];
        if (product.imageCover) return [product.imageCover];
        if (product.photo) return [product.photo];
        return [];
      })
      .filter((img) => img && typeof img === 'string')
      .slice(0, 3);

    return images;
  }, [sellerProducts]);

  return (
    <TouchableOpacity
      style={styles.sellerCard}
      onPress={onPress}
      activeOpacity={0.9}
    >

      <View style={styles.sellerCardHeader}>
        <View style={styles.sellerAvatarContainer}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.sellerAvatar} />
          ) : (
            <View style={styles.sellerAvatarPlaceholder}>
              <Text style={styles.sellerAvatarText}>{name.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedBadgeIcon}>🛡️</Text>
          </View>
        </View>
        <View style={styles.sellerHeaderContent}>
          <Text style={styles.sellerName} numberOfLines={1}>{name}</Text>
          <View style={styles.sellerRatingContainer}>
            <StarRating rating={rating} size={14} />
            <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
          </View>
          {location && (
            <View style={styles.sellerLocation}>
              <Text style={styles.locationIcon}>📍</Text>
              <Text style={styles.locationText}>{location}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.sellerCardBody}>

        <View style={styles.sellerStats}>
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>📦</Text>
            <View style={styles.statContent}>
              <Text style={styles.statValue}>{productsCount}</Text>
              <Text style={styles.statLabel}>Products</Text>
            </View>
          </View>
          {totalSold > 0 && (
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>✅</Text>
              <View style={styles.statContent}>
                <Text style={styles.statValue}>{totalSold}</Text>
                <Text style={styles.statLabel}>Sold</Text>
              </View>
            </View>
          )}
        </View>

        {productImages.length > 0 && (
          <View style={styles.productPreviewSection}>
            <Text style={styles.previewLabel}>Featured Products</Text>
            <View style={styles.productPreview}>
              {productImages.map((image, index) => (
                <View key={index} style={styles.previewImageWrapper}>
                  <Image source={{ uri: image }} style={styles.previewImage} />
                </View>
              ))}
              {productImages.length < 3 && productsCount > productImages.length && (
                <View style={styles.moreProductsIndicator}>
                  <Text style={styles.moreProductsText}>
                    +{Math.max(0, productsCount - productImages.length)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
      </View>

      <View style={styles.sellerCardFooter}>
        <TouchableOpacity
          style={styles.viewShopButton}
          onPress={onPress}
          activeOpacity={0.7}
        >
          <Text style={styles.viewShopButtonText}>View Shop</Text>
          <Text style={styles.viewShopButtonIcon}>→</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const SellersListScreen = () => {
  const navigation = useNavigation();
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [locationFilter, setLocationFilter] = useState('');
  const [sortOption, setSortOption] = useState('rating-desc');

  const { data: sellersData, isLoading } = useGetFeaturedSellers({ limit: 100 });

  const allSellers = useMemo(() => {
    if (!sellersData) return [];
    if (Array.isArray(sellersData)) return sellersData;
    if (Array.isArray(sellersData?.sellers)) return sellersData.sellers;
    if (Array.isArray(sellersData?.data?.sellers)) return sellersData.data.sellers;
    if (Array.isArray(sellersData?.data)) return sellersData.data;
    return [];
  }, [sellersData]);

  const locations = useMemo(() => {
    const locationSet = new Set();
    allSellers.forEach(seller => {
      if (seller.location) {
        locationSet.add(seller.location);
      }
    });
    return Array.from(locationSet).sort();
  }, [allSellers]);

  const sellers = useMemo(() => {
    let filtered = [...allSellers];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(seller =>
        (seller.shopName || seller.name || '').toLowerCase().includes(query)
      );
    }

    if (minRating > 0) {
      filtered = filtered.filter(seller => {
        const rating = seller.rating || seller.ratings?.average || 0;
        return rating >= minRating;
      });
    }

    if (locationFilter) {
      filtered = filtered.filter(seller => seller.location === locationFilter);
    }

    filtered.sort((a, b) => {
      switch (sortOption) {
        case 'rating-desc':
          return (b.rating || b.ratings?.average || 0) - (a.rating || a.ratings?.average || 0);
        case 'rating-asc':
          return (a.rating || a.ratings?.average || 0) - (b.rating || b.ratings?.average || 0);
        case 'products-desc':
          return (b.productCount || b.products?.length || 0) - (a.productCount || a.products?.length || 0);
        case 'products-asc':
          return (a.productCount || a.products?.length || 0) - (b.productCount || b.products?.length || 0);
        case 'name-asc':
          return (a.shopName || a.name || '').localeCompare(b.shopName || b.name || '');
        case 'name-desc':
          return (b.shopName || b.name || '').localeCompare(a.shopName || a.name || '');
        default:
          return 0;
      }
    });

    return filtered;
  }, [allSellers, searchQuery, minRating, locationFilter, sortOption]);

  const handleSellerPress = useCallback((seller) => {
    navigation.navigate('Seller', {
      sellerId: seller._id || seller.id,
      id: seller._id || seller.id,
    });
  }, [navigation]);

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setMinRating(0);
    setLocationFilter('');
    setSortOption('rating-desc');
  }, []);

  const hasActiveFilters = searchQuery || minRating > 0 || locationFilter;

  const renderSeller = useCallback(({ item }) => (
    <SellerCard
      seller={item}
      onPress={() => handleSellerPress(item)}
    />
  ), [handleSellerPress]);

  const renderFilterModal = () => (
    <Modal
      visible={showFilters}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowFilters(false)}
    >
      <View style={styles.filterModalOverlay}>
        <View style={styles.filterModalContent}>
          <View style={styles.filterModalHeader}>
            <Text style={styles.filterModalTitle}>Filters</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Text style={styles.filterModalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.filterScroll}>

            <View style={styles.filterGroup}>
              <Text style={styles.filterSectionTitle}>Search</Text>
              <View style={styles.searchInputWrapper}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                  style={styles.filterSearchInput}
                  placeholder="Search by shop name..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>
            </View>

            <View style={styles.filterGroup}>
              <Text style={styles.filterSectionTitle}>Minimum Rating</Text>
              <View style={styles.ratingFilter}>
                {[0, 3, 4, 4.5].map((rating) => (
                  <TouchableOpacity
                    key={rating}
                    style={[
                      styles.ratingOption,
                      minRating === rating && styles.ratingOptionActive,
                    ]}
                    onPress={() => setMinRating(rating)}
                    activeOpacity={0.7}
                  >
                    <StarRating rating={rating} size={16} />
                    <Text style={styles.ratingOptionText}>
                      {rating === 0 ? 'All' : `${rating}+`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {locations.length > 0 && (
              <View style={styles.filterGroup}>
                <Text style={styles.filterSectionTitle}>Location</Text>
                <ScrollView style={styles.locationFilter}>
                  <TouchableOpacity
                    style={[
                      styles.locationOption,
                      !locationFilter && styles.locationOptionActive,
                    ]}
                    onPress={() => setLocationFilter('')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.locationOptionText}>All Locations</Text>
                  </TouchableOpacity>
                  {locations.map((location) => (
                    <TouchableOpacity
                      key={location}
                      style={[
                        styles.locationOption,
                        locationFilter === location && styles.locationOptionActive,
                      ]}
                      onPress={() => setLocationFilter(location)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.locationOptionText}>{location}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {hasActiveFilters && (
              <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFilters}>
                <Text style={styles.clearFiltersButtonText}>Clear All Filters</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.fullScreenContainer}>

      <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Verified Sellers</Text>
          <Text style={styles.pageDescription}>
            Shop from trusted and verified sellers on EazShop
          </Text>
        </View>
      </SafeAreaView>

      <SafeAreaView style={styles.mainContentSafeArea} edges={['bottom']}>

        <View style={styles.contentHeader}>
          <View style={styles.resultsInfo}>
            <Text style={styles.resultsCount}>
              Showing <Text style={styles.resultsCountBold}>{sellers.length}</Text> of{' '}
              <Text style={styles.resultsCountBold}>{allSellers.length}</Text> sellers
            </Text>
            {hasActiveFilters && (
              <View style={styles.activeFilters}>
                {searchQuery && (
                  <View style={styles.filterBadge}>
                    <Text style={styles.filterBadgeText}>Search: "{searchQuery}"</Text>
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                      <Text style={styles.filterBadgeClose}>✕</Text>
                    </TouchableOpacity>
                  </View>
                )}
                {minRating > 0 && (
                  <View style={styles.filterBadge}>
                    <Text style={styles.filterBadgeText}>Rating: {minRating}+</Text>
                    <TouchableOpacity onPress={() => setMinRating(0)}>
                      <Text style={styles.filterBadgeClose}>✕</Text>
                    </TouchableOpacity>
                  </View>
                )}
                {locationFilter && (
                  <View style={styles.filterBadge}>
                    <Text style={styles.filterBadgeText}>Location: {locationFilter}</Text>
                    <TouchableOpacity onPress={() => setLocationFilter('')}>
                      <Text style={styles.filterBadgeClose}>✕</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>

          <View style={styles.controlsContainer}>
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setShowFilters(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.filterButtonIcon}>🔍</Text>
              <Text style={styles.filterButtonText}>Filters</Text>
            </TouchableOpacity>

            <View style={styles.sortContainer}>
              <Text style={styles.sortIcon}>📋</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.sortOptions}>
                  {[
                    { value: 'rating-desc', label: 'Highest Rated' },
                    { value: 'rating-asc', label: 'Lowest Rated' },
                    { value: 'products-desc', label: 'Most Products' },
                    { value: 'products-asc', label: 'Fewest Products' },
                    { value: 'name-asc', label: 'Name (A-Z)' },
                    { value: 'name-desc', label: 'Name (Z-A)' },
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.sortOption,
                        sortOption === option.value && styles.sortOptionActive,
                      ]}
                      onPress={() => setSortOption(option.value)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.sortOptionText,
                          sortOption === option.value && styles.sortOptionTextActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : sellers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🏪</Text>
            <Text style={styles.emptyTitle}>No Sellers Found</Text>
            <Text style={styles.emptyText}>
              {hasActiveFilters
                ? 'Try adjusting your filters to see more results.'
                : 'Check back later for new sellers.'}
            </Text>
            {hasActiveFilters && (
              <TouchableOpacity style={styles.clearFiltersButtonMain} onPress={clearFilters}>
                <Text style={styles.clearFiltersButtonText}>Clear All Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <FlatList
            data={sellers}
            renderItem={renderSeller}
            keyExtractor={(item) => item._id?.toString() || item.id?.toString() || Math.random().toString()}
            numColumns={1}
            contentContainerStyle={styles.sellersListContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>

      {renderFilterModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    backgroundColor: theme.colors.grey50 || '#f8f9fa',
  },
  headerSafeArea: {
    backgroundColor: theme.colors.white,
  },
  mainContentSafeArea: {
    flex: 1,
    backgroundColor: theme.colors.grey50 || '#f8f9fa',
  },
  pageHeader: {
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.grey200,
  },
  pageTitle: {
    fontSize: theme.typography.fontSize['3xl'] || 28,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary || theme.colors.text,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  pageDescription: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  contentHeader: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.grey200,
  },
  resultsInfo: {
    marginBottom: theme.spacing.md,
  },
  resultsCount: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  resultsCountBold: {
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary || theme.colors.text,
  },
  activeFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  filterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: theme.colors.primary + '20' || '#fff9e6',
    borderRadius: theme.borderRadius.full || 20,
    borderWidth: 1,
    borderColor: theme.colors.primary + '50' || 'rgba(255, 196, 0, 0.3)',
  },
  filterBadgeText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textPrimary || theme.colors.text,
    fontWeight: theme.typography.fontWeight.medium,
  },
  filterBadgeClose: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.fontWeight.bold,
  },
  controlsContainer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    alignItems: 'center',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderWidth: 2,
    borderColor: theme.colors.grey200,
    borderRadius: theme.borderRadius.md || 12,
  },
  filterButtonIcon: {
    fontSize: 16,
  },
  filterButtonText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.textPrimary || theme.colors.text,
  },
  sortContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderWidth: 2,
    borderColor: theme.colors.grey200,
    borderRadius: theme.borderRadius.md || 12,
  },
  sortIcon: {
    fontSize: 16,
  },
  sortOptions: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  sortOption: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: theme.borderRadius.sm || 8,
    backgroundColor: theme.colors.grey200,
  },
  sortOptionActive: {
    backgroundColor: theme.colors.primary,
  },
  sortOptionText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textSecondary,
  },
  sortOptionTextActive: {
    color: theme.colors.white,
    fontWeight: theme.typography.fontWeight.semiBold,
  },
  sellersListContent: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  sellerCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl || 20,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  sellerCardHeader: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.grey50 || '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.grey200,
    alignItems: 'center',
  },
  sellerAvatarContainer: {
    position: 'relative',
    marginBottom: theme.spacing.md,
  },
  sellerAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: theme.colors.white,
  },
  sellerAvatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: theme.colors.white,
  },
  sellerAvatarText: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.white,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: theme.colors.white,
  },
  verifiedBadgeIcon: {
    fontSize: 16,
  },
  sellerHeaderContent: {
    width: '100%',
    alignItems: 'center',
  },
  sellerName: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary || theme.colors.text,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  sellerRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  ratingText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.textSecondary,
  },
  sellerLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  locationIcon: {
    fontSize: 12,
  },
  locationText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  sellerCardBody: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  sellerStats: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    justifyContent: 'space-around',
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.grey50 || '#f8f9fa',
    borderRadius: theme.borderRadius.md || 12,
    borderWidth: 1,
    borderColor: theme.colors.grey200,
  },
  statIcon: {
    fontSize: 20,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary || theme.colors.text,
  },
  statLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  productPreviewSection: {
    gap: theme.spacing.sm,
  },
  previewLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  productPreview: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    alignItems: 'center',
  },
  previewImageWrapper: {
    width: 70,
    height: 70,
    borderRadius: theme.borderRadius.md || 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: theme.colors.grey200,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  moreProductsIndicator: {
    width: 70,
    height: 70,
    borderRadius: theme.borderRadius.md || 12,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.primary + '50' || 'rgba(255, 196, 0, 0.3)',
  },
  moreProductsText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.white,
  },
  sellerCardFooter: {
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.grey200,
    backgroundColor: theme.colors.grey50 || '#f8f9fa',
  },
  viewShopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md || 12,
    borderWidth: 1,
    borderColor: theme.colors.grey200,
  },
  viewShopButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.textPrimary || theme.colors.text,
  },
  viewShopButtonIcon: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textPrimary || theme.colors.text,
  },
  starRatingContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  star: {
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.white,
    margin: theme.spacing.md,
    borderRadius: theme.borderRadius.xl || 16,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: theme.spacing.md,
  },
  emptyTitle: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary || theme.colors.text,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  clearFiltersButtonMain: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md || 12,
  },
  filterModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  filterModalContent: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: theme.borderRadius.xl || 20,
    borderTopRightRadius: theme.borderRadius.xl || 20,
    maxHeight: '80%',
    paddingBottom: theme.spacing.xl,
  },
  filterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.grey200,
  },
  filterModalTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary || theme.colors.text,
  },
  filterModalClose: {
    fontSize: theme.typography.fontSize.xl,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.fontWeight.bold,
  },
  filterScroll: {
    padding: theme.spacing.lg,
  },
  filterGroup: {
    marginBottom: theme.spacing.xl,
  },
  filterSectionTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.textPrimary || theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  searchIcon: {
    position: 'absolute',
    left: theme.spacing.md,
    zIndex: 1,
    fontSize: 16,
  },
  filterSearchInput: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    paddingLeft: theme.spacing.xl + theme.spacing.md,
    paddingRight: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.grey200,
    borderRadius: theme.borderRadius.md || 12,
    fontSize: theme.typography.fontSize.base,
    backgroundColor: theme.colors.grey50 || '#f8f9fa',
  },
  ratingFilter: {
    gap: theme.spacing.sm,
  },
  ratingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.grey200,
    borderRadius: theme.borderRadius.md || 12,
    backgroundColor: theme.colors.white,
  },
  ratingOptionActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '20' || '#fff9e6',
  },
  ratingOptionText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.textPrimary || theme.colors.text,
  },
  locationFilter: {
    maxHeight: 200,
  },
  locationOption: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.grey200,
    borderRadius: theme.borderRadius.md || 12,
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.white,
  },
  locationOptionActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '20' || '#fff9e6',
  },
  locationOptionText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textPrimary || theme.colors.text,
  },
  clearFiltersButton: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md || 12,
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  clearFiltersButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.white,
  },
});

export default SellersListScreen;


