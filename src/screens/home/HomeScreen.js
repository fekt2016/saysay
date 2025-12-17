import React, { useMemo, useCallback, useState, useEffect, useLayoutEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  StyleSheet,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import LogoIcon from '../../components/header/LogoIcon';
import HeaderSearchInput from '../../components/header/HeaderSearchInput';
import HeaderAvatar from '../../components/header/HeaderAvatar';

import useProduct from '../../hooks/useProduct';
import { useCategory } from '../../hooks/useCategory';
import { useEazShop } from '../../hooks/useEazShop';
import { useGetFeaturedSellers } from '../../hooks/useSellers';

import ProductCard from '../../components/ProductCard';
import HeroSlide from '../../components/home/HeroSlide';
import CategoryCard from '../../components/home/CategoryCard';
import TrustBadges from '../../components/home/TrustBadges';
import DealBanner from '../../components/home/DealBanner';
import EazShopSection from '../../components/home/EazShopSection';
import NewsletterSection from '../../components/home/NewsletterSection';
import ProductSkeleton from '../../components/home/ProductSkeleton';
import CategorySkeleton from '../../components/home/CategorySkeleton';

import { theme } from '../../theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const heroSlides = [
  {
    id: 1,
    title: 'Summer Collection 2025',
    subtitle: 'Experience the essence of luxury with our exclusive summer line.',
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2070&auto=format&fit=crop',
    cta: 'Shop Collection',
  },
  {
    id: 2,
    title: 'Modern Tech Essentials',
    subtitle: 'Upgrade your lifestyle with cutting-edge technology.',
    image: 'https://images.unsplash.com/photo-1498049860654-af1a5c5668ba?q=80&w=2070&auto=format&fit=crop',
    cta: 'Explore Gadgets',
  },
  {
    id: 3,
    title: 'Elegant Home Decor',
    subtitle: 'Transform your space into a sanctuary of style.',
    image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4f9d?q=80&w=2070&auto=format&fit=crop',
    cta: 'Discover More',
  },
];

const HomeScreen = () => {
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => <LogoIcon />,
      headerTitle: () => <HeaderSearchInput />,
      headerRight: () => <HeaderAvatar />,
    });
  }, [navigation]);

  const { getProducts } = useProduct();

  const { data: productsData, isLoading: isProductsLoading, refetch: refetchProducts, error: productsError } = getProducts;

  const { getCategories } = useCategory();

  const { data: categoriesData, isLoading: isCategoriesLoading, refetch: refetchCategories, error: categoriesError } = getCategories;

  const { useGetEazShopProducts } = useEazShop();
  const { data: eazshopData, isLoading: isEazShopLoading, refetch: refetchEazShop } = useGetEazShopProducts();

  const { data: sellersData, isLoading: isSellersLoading, refetch: refetchSellers } = useGetFeaturedSellers({ limit: 8 });

  const products = useMemo(() => {
    if (!productsData) return [];

    if (productsData.data?.data && Array.isArray(productsData.data.data)) {
      return productsData.data.data;
    }

    if (productsData.data?.products && Array.isArray(productsData.data.products)) {
      return productsData.data.products;
    }

    if (productsData.products && Array.isArray(productsData.products)) {
      return productsData.products;
    }

    if (productsData.results && Array.isArray(productsData.results)) {
      return productsData.results;
    }

    if (productsData.data && Array.isArray(productsData.data)) {
      return productsData.data;
    }

    if (Array.isArray(productsData)) {
      return productsData;
    }

    return [];
  }, [productsData]);

  const categories = useMemo(() => {
    const cats = categoriesData?.results || categoriesData?.data?.results || [];
    const filteredCats = cats.filter(cat => !cat.parentCategory);
    
    const categoriesWithCount = filteredCats.map(cat => {
      const categoryId = cat._id || cat.id;
      if (!categoryId) return { ...cat, count: 0 };
      
      const productCount = products.filter(product => {
        const productParentCategory = product.parentCategory?._id || product.parentCategory || product.category?.parentCategory?._id || product.category?.parentCategory;
        const productSubCategory = product.subCategory?._id || product.subCategory || product.category?.subCategory?._id || product.category?.subCategory;
        const productCategory = product.category?._id || product.category;
        
        return (
          String(productParentCategory) === String(categoryId) ||
          String(productSubCategory) === String(categoryId) ||
          String(productCategory) === String(categoryId)
        );
      }).length;
      
      return {
        ...cat,
        count: productCount,
      };
    });
    
    const shuffled = shuffleArray(categoriesWithCount);
    return shuffled.slice(0, 6);
  }, [categoriesData, products]);

  const eazshopProducts = useMemo(() => {
    return Array.isArray(eazshopData) ? eazshopData : [];
  }, [eazshopData]);

  const sellers = useMemo(() => {
    if (!sellersData) return [];
    let sellersList = [];
    if (Array.isArray(sellersData)) {
      sellersList = sellersData;
    } else if (Array.isArray(sellersData?.data?.sellers)) {
      sellersList = sellersData.data.sellers;
    } else if (Array.isArray(sellersData?.sellers)) {
      sellersList = sellersData.sellers;
    }
    
    return sellersList;
  }, [sellersData]);

  const sellersWithProducts = useMemo(() => {
    if (!sellers.length || !products.length) return sellers.map(seller => ({ ...seller, topProducts: [] }));

    return sellers.map(seller => {
      const sellerId = seller._id || seller.id;
      if (!sellerId) return { ...seller, topProducts: [] };

      const sellerProducts = products.filter(product => {
        const productSellerId = product.seller?._id || product.seller?.id || product.sellerId || product.seller;
        return productSellerId && (productSellerId.toString() === sellerId.toString() || productSellerId === sellerId);
      });

      if (sellerProducts.length === 0) {
        return { ...seller, topProducts: [] };
      }

      const sortedProducts = [...sellerProducts].sort((a, b) => {
        const aSales = a.salesCount || a.totalOrders || a.ordersCount || 0;
        const bSales = b.salesCount || b.totalOrders || b.ordersCount || 0;
        return bSales - aSales;
      });

      const topProducts = sortedProducts.slice(0, 2);

      return { ...seller, topProducts };
    });
  }, [sellers, products]);


  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchProducts?.() || Promise.resolve(),
        refetchCategories?.() || Promise.resolve(),
        refetchEazShop?.() || Promise.resolve(),
        refetchSellers?.() || Promise.resolve(),
      ]);
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refetchProducts, refetchCategories, refetchEazShop, refetchSellers]);

  const handleProductClick = useCallback((productId) => {
    navigation.navigate('ProductDetail', { productId, id: productId });
  }, [navigation]);

  const handleCategoryClick = useCallback((categoryId, categoryName) => {
    console.log('[HomeScreen] Navigating to category:', { categoryId, categoryName });
    navigation.navigate('CategoryTab', {
      screen: 'Category',
      params: {
        categoryId: categoryId?.toString(),
        id: categoryId?.toString(),
        categoryName: categoryName,
        name: categoryName,
      },
    });
  }, [navigation]);

  const handleViewAllProducts = useCallback(() => {
    navigation.navigate('SearchTab', { screen: 'Search' });
  }, [navigation]);

  const handleViewAllCategories = useCallback(() => {
    navigation.navigate('CategoryTab', { screen: 'Categories' });
  }, [navigation]);

  const handleSellerPress = useCallback((sellerId) => {
    navigation.navigate('Seller', {
      sellerId: sellerId,
      id: sellerId,
    });
  }, [navigation]);

  const handleViewAllSellers = useCallback(() => {
    navigation.navigate('SellersList');
  }, [navigation]);


  const renderCategory = ({ item }) => (
    <CategoryCard item={item} onPress={handleCategoryClick} />
  );

  const renderProduct = ({ item, index }) => {
    const productId = item._id || item.id;
    if (!productId) {
      console.warn('Product missing ID:', item);
      return null;
    }
    return (
      <View style={styles.productCard}>
        <ProductCard
          product={item}
          onPress={() => handleProductClick(productId)}
        />
      </View>
    );
  };

  const renderSeller = (item) => {
    const sellerId = item._id || item.id;
    if (!sellerId) {
      console.warn('Seller missing ID:', item);
      return null;
    }

    const sellerName = item.name || item.shopName || 'Seller';
    const avatarUri = item.avatar || item.image || item.logo || item.profilePicture || item.photo;
    const rating = item.rating || item.ratings?.average || item.averageRating || 0;
    const topProducts = item.topProducts || [];

    return (
      <TouchableOpacity
        style={styles.sellerCardContainer}
        onPress={() => handleSellerPress(sellerId)}
        activeOpacity={0.8}
      >
        <View style={styles.sellerHeader}>
          <View style={styles.sellerInfo}>
            {avatarUri ? (
              <Image
                source={{ uri: avatarUri }}
                style={styles.sellerAvatar}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.sellerAvatarPlaceholder}>
                <Text style={styles.sellerAvatarText}>{sellerName.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <View style={styles.sellerDetails}>
              <Text style={styles.sellerName} numberOfLines={1}>{sellerName}</Text>
              {rating > 0 && (
                <View style={styles.sellerRating}>
                  <Text style={styles.starIcon}>⭐</Text>
                  <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {topProducts.length > 0 && (
          <View style={styles.productsGrid}>
            {topProducts.map((product, index) => {
              const productId = product._id || product.id;
              if (!productId) return null;

              const productImage = product.imageCover || product.images?.[0] || product.image || '';
              const productName = product.name || 'Product';
              const basePrice = typeof product.price === 'number' ? product.price : typeof product.defaultPrice === 'number' ? product.defaultPrice : 0;
              const discountPrice = typeof product.discountPrice === 'number' ? product.discountPrice : null;
              const finalPrice = discountPrice !== null && discountPrice < basePrice ? discountPrice : basePrice;

              return (
                <TouchableOpacity
                  key={productId}
                  style={styles.productPreview}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleProductClick(productId);
                  }}
                  activeOpacity={0.7}
                >
                  {productImage ? (
                    <Image
                      source={{ uri: productImage }}
                      style={styles.productPreviewImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.productPreviewPlaceholder}>
                      <Text style={styles.productPreviewPlaceholderText}>📦</Text>
                    </View>
                  )}
                  <View style={styles.productPreviewContent}>
                    <Text style={styles.productPreviewName} numberOfLines={2}>
                      {productName}
                    </Text>
                    {finalPrice > 0 && (
                      <Text style={styles.productPreviewPrice}>
                        ₦{finalPrice.toLocaleString()}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
            {topProducts.length < 2 && (
              <View style={styles.productPreviewEmpty} />
            )}
          </View>
        )}

        {topProducts.length === 0 && (
          <View style={styles.noProductsContainer}>
            <Text style={styles.noProductsText}>No products available</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const isLoading = isProductsLoading || isCategoriesLoading;
  const hasError = productsError || categoriesError;

  if (hasError) {
    console.warn('HomeScreen API errors:', { productsError, categoriesError });
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >

        <View style={styles.heroSection}>
          <HeroSlide
            slides={heroSlides}
            autoPlay={true}
            autoPlayInterval={5000}
            onSlidePress={handleViewAllProducts}
          />
        </View>

        <TrustBadges />

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Browse Categories</Text>
            <TouchableOpacity onPress={handleViewAllCategories} style={styles.sectionLink}>
              <Text style={styles.sectionLinkText}>View All</Text>
              <Text style={styles.sectionLinkIcon}>→</Text>
            </TouchableOpacity>
          </View>

          {isCategoriesLoading ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryList}>
              {[1, 2, 3, 4, 5].map((index) => (
                <CategorySkeleton key={index} />
              ))}
            </ScrollView>
          ) : categories.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No categories available</Text>
            </View>
          ) : (
            <FlatList
              data={categories}
              renderItem={renderCategory}
              keyExtractor={(item, index) => item.id || item._id || `category-${index}`}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryListContent}
            />
          )}
        </View>

        {(sellersWithProducts.length > 0 || sellers.length > 0) && (
          <View style={styles.sellersSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Trending Sellers</Text>
              <TouchableOpacity onPress={handleViewAllSellers} style={styles.sectionLink}>
                <Text style={styles.sectionLinkText}>View All</Text>
                <Text style={styles.sectionLinkIcon}>→</Text>
              </TouchableOpacity>
            </View>

            {isSellersLoading ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sellersList}>
                {[1, 2, 3, 4].map((index) => (
                  <View key={index} style={styles.sellerSkeleton}>
                    <View style={styles.skeletonSellerAvatar} />
                    <View style={styles.skeletonSellerText} />
                    <View style={styles.skeletonSellerTextShort} />
                  </View>
                ))}
              </ScrollView>
            ) : sellersWithProducts.length > 0 ? (
              <FlatList
                data={sellersWithProducts}
                renderItem={({ item }) => (
                  <View style={styles.sellerCardWrapper}>
                    {renderSeller(item)}
                  </View>
                )}
                keyExtractor={(item, index) => item._id || item.id || `seller-${index}`}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.sellersListContent}
              />
            ) : sellers.length > 0 ? (
              <FlatList
                data={sellers}
                renderItem={({ item }) => (
                  <View style={styles.sellerCardWrapper}>
                    {renderSeller({ ...item, topProducts: [] })}
                  </View>
                )}
                keyExtractor={(item, index) => item._id || item.id || `seller-${index}`}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.sellersListContent}
              />
            ) : null}
          </View>
        )}

        {eazshopProducts.length > 0 && (
          <EazShopSection
            products={eazshopProducts}
            onProductPress={handleProductClick}
            onViewAllPress={handleViewAllProducts}
          />
        )}

        <DealBanner onPress={handleViewAllProducts} />

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>All Products</Text>
            <TouchableOpacity onPress={handleViewAllProducts} style={styles.sectionLink}>
              <Text style={styles.sectionLinkText}>View All</Text>
              <Text style={styles.sectionLinkIcon}>→</Text>
            </TouchableOpacity>
          </View>

          {isProductsLoading ? (
            <View style={styles.productGrid}>
              {[1, 2, 3, 4, 5, 6].map((index) => (
                <ProductSkeleton key={index} />
              ))}
            </View>
          ) : products.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No products available</Text>
            </View>
          ) : (
            <FlatList
              data={products.slice(0, 10)}
              renderItem={renderProduct}
              keyExtractor={(item, index) => item._id || item.id || `product-${index}`}
              numColumns={2}
              columnWrapperStyle={styles.productRow}
              scrollEnabled={false}
            />
          )}
        </View>

        <NewsletterSection onSubscribe={() => console.log('Subscribe clicked')} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  heroSection: {
    marginBottom: 20,
  },

  section: {
    paddingVertical: theme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  sectionLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionLinkText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary,
    marginRight: 4,
  },
  sectionLinkIcon: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.primary,
  },

  categoryList: {
    paddingLeft: theme.spacing.md,
  },
  categoryListContent: {
    paddingHorizontal: theme.spacing.md,
  },

  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: theme.spacing.md,
  },
  productRow: {
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  productCard: {
    flex: 1,
    marginHorizontal: theme.spacing.xs,
    maxWidth: '55%',
  },

  emptyState: {
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },

  sellersSection: {
    paddingVertical: theme.spacing.lg,
  },
  sellersList: {
    paddingLeft: theme.spacing.md,
  },
  sellersListContent: {
    paddingHorizontal: theme.spacing.md,
  },
  sellerCardWrapper: {
    width: SCREEN_WIDTH * 0.85,
    marginRight: theme.spacing.md,
  },
  sellerCardContainer: {
    backgroundColor: theme.colors.white || '#FFFFFF',
    borderRadius: theme.borderRadius.md || 12,
    padding: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sellerHeader: {
    marginBottom: theme.spacing.md,
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.grey200 || '#E5E5E5',
    marginRight: theme.spacing.sm,
  },
  sellerAvatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.primary || '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  sellerAvatarText: {
    fontSize: theme.typography.fontSize.xl || 20,
    fontWeight: theme.typography.fontWeight.bold || 'bold',
    color: theme.colors.white || '#FFFFFF',
  },
  sellerDetails: {
    flex: 1,
  },
  sellerName: {
    fontSize: theme.typography.fontSize.lg || 16,
    fontWeight: theme.typography.fontWeight.bold || 'bold',
    color: theme.colors.textPrimary || '#000000',
    marginBottom: theme.spacing.xs || 4,
  },
  sellerRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  ratingText: {
    fontSize: theme.typography.fontSize.sm || 12,
    color: theme.colors.textSecondary || '#666666',
  },
  productsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.sm || 8,
  },
  productPreview: {
    flex: 1,
    maxWidth: '48%',
    backgroundColor: theme.colors.grey50 || '#F9F9F9',
    borderRadius: theme.borderRadius.sm || 8,
    overflow: 'hidden',
  },
  productPreviewImage: {
    width: '100%',
    height: 100,
    backgroundColor: theme.colors.grey200 || '#E5E5E5',
  },
  productPreviewPlaceholder: {
    width: '100%',
    height: 100,
    backgroundColor: theme.colors.grey200 || '#E5E5E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productPreviewPlaceholderText: {
    fontSize: 24,
  },
  productPreviewContent: {
    padding: theme.spacing.sm || 8,
  },
  productPreviewName: {
    fontSize: theme.typography.fontSize.xs || 12,
    fontWeight: theme.typography.fontWeight.medium || '500',
    color: theme.colors.textPrimary || '#000000',
    marginBottom: theme.spacing.xs || 4,
  },
  productPreviewPrice: {
    fontSize: theme.typography.fontSize.sm || 12,
    fontWeight: theme.typography.fontWeight.bold || 'bold',
    color: theme.colors.primary || '#007AFF',
  },
  productPreviewEmpty: {
    flex: 1,
    maxWidth: '48%',
  },
  noProductsContainer: {
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  noProductsText: {
    fontSize: theme.typography.fontSize.sm || 12,
    color: theme.colors.textSecondary || '#666666',
  },
  sellerSkeleton: {
    width: SCREEN_WIDTH * 0.85,
    marginRight: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  skeletonSellerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.grey200,
    marginBottom: theme.spacing.sm,
  },
  skeletonSellerText: {
    width: '80%',
    height: 16,
    backgroundColor: theme.colors.grey200,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.xs,
  },
  skeletonSellerTextShort: {
    width: '60%',
    height: 14,
    backgroundColor: theme.colors.grey200,
    borderRadius: theme.borderRadius.sm,
  },
});

export default HomeScreen;


