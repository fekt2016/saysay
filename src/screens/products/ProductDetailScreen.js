import React, { useState, useMemo, useCallback, useEffect, useLayoutEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import useProduct from '../../hooks/useProduct';
import { useCartActions, useCartTotals } from '../../hooks/useCart';
import { useToggleWishlist } from '../../hooks/useWishlist';
import { useGetProductReviews } from '../../hooks/useReview';
import { useAuth } from '../../hooks/useAuth';
import { theme } from '../../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_HEIGHT = SCREEN_WIDTH; 

const isColorValue = (value) => {
  if (!value || typeof value !== 'string') return false;
  const colorNames = [
    'black', 'silver', 'gray', 'white', 'maroon', 'red', 'purple',
    'fuchsia', 'green', 'lime', 'olive', 'yellow', 'navy', 'blue',
    'teal', 'aqua', 'orange',
  ];
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return colorNames.includes(value.toLowerCase()) || hexRegex.test(value);
};

const ProductDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { productId, id } = route?.params || {};
  
  const productIdToUse = productId || id;

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedAttributes, setSelectedAttributes] = useState({});

  const { useGetProductById } = useProduct();
  const { data: productData, isLoading, error, refetch } = useGetProductById(productIdToUse);

  const { data: reviewsData, isLoading: reviewsLoading } = useGetProductReviews(productIdToUse);

  const { addToCart, isAdding: isAddingToCart } = useCartActions();
  const { count: cartItemCount } = useCartTotals();
  const { toggleWishlist, isInWishlist, isAdding: isAddingToWishlist } = useToggleWishlist(productIdToUse);

  const { user, isAuthenticated } = useAuth();

  const product = useMemo(() => {
    if (!productData) return null;
    if (productData.data?.product) return productData.data.product;
    if (productData.product) return productData.product;
    if (productData.data?.data) return productData.data.data;
    return productData.data || productData;
  }, [productData]);

  const variants = useMemo(() => {
    return product?.variants || [];
  }, [product]);

  const attributeKeys = useMemo(() => {
    const keys = new Set();
    variants.forEach((variant) => {
      if (variant.attributes && Array.isArray(variant.attributes)) {
        variant.attributes.forEach((attr) => {
          keys.add(attr.key);
        });
      }
    });
    return Array.from(keys);
  }, [variants]);

  useEffect(() => {
    if (variants.length > 0 && Object.keys(selectedAttributes).length === 0) {
      const initialAttributes = {};
      const inStockVariant = variants.find((v) => v.stock > 0) || variants[0];
      if (inStockVariant && inStockVariant.attributes) {
        inStockVariant.attributes.forEach((attr) => {
          initialAttributes[attr.key] = attr.value;
        });
        setSelectedAttributes(initialAttributes);
        setSelectedVariant(inStockVariant);
      }
    }
  }, [variants, selectedAttributes]);

  useEffect(() => {
    if (Object.keys(selectedAttributes).length > 0 && variants.length > 0) {
      const matchingVariant = variants.find((variant) => {
        if (!variant.attributes || !Array.isArray(variant.attributes)) return false;
        return Object.entries(selectedAttributes).every(([key, value]) => {
          return variant.attributes.some((attr) => attr.key === key && attr.value === value);
        });
      });
      setSelectedVariant(matchingVariant || null);
    }
  }, [selectedAttributes, variants]);

  useEffect(() => {
    if (selectedVariant && quantity > selectedVariant.stock) {
      setQuantity(selectedVariant.stock > 0 ? selectedVariant.stock : 1);
    }
  }, [selectedVariant, quantity]);

  const reviews = useMemo(() => {
    if (!reviewsData) return [];
    if (reviewsData.data?.data?.reviews && Array.isArray(reviewsData.data.data.reviews)) {
      return reviewsData.data.data.reviews;
    }
    if (reviewsData.data?.reviews && Array.isArray(reviewsData.data.reviews)) {
      return reviewsData.data.reviews;
    }
    if (Array.isArray(reviewsData.reviews)) {
      return reviewsData.reviews;
    }
    return product?.reviews || [];
  }, [reviewsData, product]);

  const reviewCount = product?.ratingsQuantity || reviews.length || 0;
  const averageRating = product?.ratingsAverage || 0;

  const images = useMemo(() => {
    if (!product) return [];
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      return product.images;
    }
    if (product.imageCover) {
      return [product.imageCover];
    }
    return [];
  }, [product]);

  const displayPrice = useMemo(() => {
    if (selectedVariant?.price) {
      return selectedVariant.price;
    }
    return product?.defaultPrice || product?.price || product?.minPrice || 0;
  }, [product, selectedVariant]);

  const originalPrice = useMemo(() => {
    if (selectedVariant?.originalPrice) {
      return selectedVariant.originalPrice;
    }
    return product?.originalPrice || 0;
  }, [product, selectedVariant]);

  const hasDiscount = originalPrice > 0 && displayPrice < originalPrice;
  const discountPercentage = hasDiscount
    ? Math.round(((originalPrice - displayPrice) / originalPrice) * 100)
    : 0;

  const stock = useMemo(() => {
    if (selectedVariant) {
      return selectedVariant.stock || 0;
    }
    if (!product) return 0;
    if (product.totalStock !== undefined && product.totalStock !== null) {
      return product.totalStock;
    }
    if (product.defaultStock !== undefined && product.defaultStock !== null) {
      return product.defaultStock;
    }
    if (product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
      return product.variants.reduce((sum, variant) => sum + (variant.stock || 0), 0);
    }
    return product.stock || 0;
  }, [product, selectedVariant]);

  const isInStock = stock > 0;

  useLayoutEffect(() => {
    navigation.setOptions({
      title: product?.name || 'Product Details',
    });
  }, [navigation, product?.name]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      console.error('Error refreshing product:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const handleAttributeChange = useCallback((attribute, value) => {
    setSelectedAttributes((prev) => ({
      ...prev,
      [attribute]: value,
    }));
  }, []);

  const handleAddToCart = useCallback(() => {
    if (!isInStock || !product) {
      Alert.alert('Out of Stock', 'This product is currently out of stock.');
      return;
    }

    addToCart(
      {
        product: product,
        quantity,
        variant: selectedVariant,
      },
      {
        onSuccess: () => {
          Alert.alert('Success', 'Product added to cart!');
        },
        onError: (error) => {
          console.error('Error adding to cart:', error);
          Alert.alert('Error', 'Failed to add product to cart. Please try again.');
        },
      }
    );
  }, [product, quantity, isInStock, selectedVariant, addToCart]);

  const incrementQuantity = useCallback(() => {
    setQuantity((prev) => Math.min(prev + 1, stock));
  }, [stock]);

  const decrementQuantity = useCallback(() => {
    setQuantity((prev) => Math.max(1, prev - 1));
  }, []);

  if (isLoading && !refreshing) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !product) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {error?.message || 'Product not found'}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
      >

        <View style={styles.imageSection}>
          <Image
            source={{ uri: images[selectedImageIndex] || images[0] || '' }}
            style={styles.mainImage}
            resizeMode="cover"
          />
          {hasDiscount && (
            <View style={[styles.imageBadge, styles.discountBadge]}>
              <Text style={styles.badgeText}>-{discountPercentage}% OFF</Text>
            </View>
          )}
          {!isInStock && (
            <View style={[styles.imageBadge, styles.outOfStockBadge]}>
              <Text style={styles.badgeText}>Out of Stock</Text>
            </View>
          )}
        </View>

        {images.length > 1 && (
          <FlatList
            data={images}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thumbnailList}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={[
                  styles.thumbnailItem,
                  index === selectedImageIndex && styles.thumbnailItemActive,
                ]}
                onPress={() => setSelectedImageIndex(index)}
              >
                <Image source={{ uri: item }} style={styles.thumbnailImage} resizeMode="cover" />
              </TouchableOpacity>
            )}
          />
        )}

        <View style={styles.contentSection}>
          {product.parentCategory && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>
                {product.parentCategory.name || 'Category'}
              </Text>
            </View>
          )}

          <Text style={styles.productTitle}>{product.name}</Text>

          <View style={styles.priceContainer}>
            <Text style={styles.currentPrice}>GH₵{displayPrice.toFixed(2)}</Text>
            {hasDiscount && originalPrice > 0 && (
              <Text style={styles.originalPrice}>GH₵{originalPrice.toFixed(2)}</Text>
            )}
          </View>

          {(product.ratingsAverage || product.rating) && (
            <View style={styles.ratingContainer}>
              <Text style={styles.ratingText}>
                ⭐ {(product.ratingsAverage || product.rating || 0).toFixed(1)}
                {product.ratingsQuantity && ` (${product.ratingsQuantity} reviews)`}
              </Text>
            </View>
          )}

          <View style={[styles.stockBadge, isInStock ? styles.stockBadgeInStock : styles.stockBadgeOutOfStock]}>
            <Text style={styles.stockText}>
              {isInStock ? `${stock} in stock` : 'Out of stock'}
            </Text>
          </View>

          {product.sku && (
            <View style={styles.skuContainer}>
              <Text style={styles.skuText}>SKU: {product.sku}</Text>
            </View>
          )}
        </View>

        {attributeKeys.length > 0 && (
          <View style={styles.variantsSection}>
            <Text style={styles.sectionTitle}>Select Options</Text>
            {attributeKeys.map((attribute) => {
              const values = [
                ...new Set(
                  variants
                    .map((v) => v.attributes?.find((a) => a.key === attribute)?.value)
                    .filter(Boolean)
                ),
              ];

              const isColor = attribute.toLowerCase().includes('color');

              return (
                <View key={attribute} style={styles.variantGroup}>
                  <View style={styles.variantGroupHeader}>
                    <Text style={styles.variantGroupLabel}>
                      {attribute}
                      {selectedAttributes[attribute] && (
                        <Text style={styles.selectedValue}> • {selectedAttributes[attribute]}</Text>
                      )}
                    </Text>
                  </View>
                  <View style={styles.variantOptionsContainer}>
                    {values.map((value) => {
                      const showAsColor = isColor && isColorValue(value);
                      const variantStock = variants.find((variant) => {
                        return (
                          variant.attributes?.some((attr) => attr.key === attribute && attr.value === value) &&
                          Object.entries(selectedAttributes)
                            .filter(([key]) => key !== attribute)
                            .every(([key, val]) =>
                              variant.attributes?.some((attr) => attr.key === key && attr.value === val)
                            )
                        );
                      })?.stock || 0;

                      const isOutOfStock = variantStock <= 0;
                      const isLowStock = variantStock > 0 && variantStock <= 5;
                      const isSelected = selectedAttributes[attribute] === value;

                      return (
                        <View key={`${attribute}-${value}`} style={styles.variantOptionWrapper}>
                          <TouchableOpacity
                            style={[
                              styles.variantOption,
                              isSelected && styles.variantOptionActive,
                              isOutOfStock && styles.variantOptionDisabled,
                            ]}
                            onPress={() => !isOutOfStock && handleAttributeChange(attribute, value)}
                            disabled={isOutOfStock}
                            activeOpacity={0.7}
                          >
                            {showAsColor ? (
                              <View style={styles.colorSwatchContainer}>
                                <View
                                  style={[
                                    styles.colorSwatchRing,
                                    isSelected && styles.colorSwatchRingActive,
                                  ]}
                                />
                                <View
                                  style={[
                                    styles.colorSwatch,
                                    { backgroundColor: value },
                                    isSelected && styles.colorSwatchActive,
                                  ]}
                                />
                                {isSelected && (
                                  <View style={styles.checkmarkIndicator}>
                                    <Text style={styles.checkmarkIcon}>✓</Text>
                                  </View>
                                )}
                              </View>
                            ) : (
                              <View style={styles.variantOptionContent}>
                                <Text
                                  style={[
                                    styles.variantOptionText,
                                    isSelected && styles.variantOptionTextActive,
                                    isOutOfStock && styles.variantOptionTextDisabled,
                                  ]}
                                >
                                  {value}
                                </Text>
                                {isSelected && (
                                  <View style={styles.checkmarkIndicator}>
                                    <Text style={styles.checkmarkIcon}>✓</Text>
                                  </View>
                                )}
                              </View>
                            )}
                            {isOutOfStock && (
                              <View style={styles.outOfStockOverlay}>
                                <Text style={styles.outOfStockText}>Out</Text>
                              </View>
                            )}
                          </TouchableOpacity>
                          {!isOutOfStock && isLowStock && (
                            <View style={styles.variantStockBadge}>
                              <Text style={styles.variantStockText}>{variantStock} left</Text>
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {product.description && (
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.descriptionText}>{product.description}</Text>
          </View>
        )}

        <View style={styles.reviewsSection}>
          <Text style={styles.sectionTitle}>Customer Reviews ({reviewCount})</Text>
          {reviewCount > 0 ? (
            <>
              <View style={styles.reviewsSummary}>
                <View style={styles.overallRating}>
                  <Text style={styles.ratingNumber}>{averageRating.toFixed(1)}</Text>
                  <Text style={styles.ratingStars}>⭐</Text>
                  <Text style={styles.ratingTextSmall}>out of 5</Text>
                </View>
                <View style={styles.ratingBars}>
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const count = reviews.filter((r) => r.rating === stars).length;
                    const percentage = reviewCount > 0 ? (count / reviewCount) * 100 : 0;
                    return (
                      <View key={stars} style={styles.ratingBar}>
                        <Text style={styles.starCount}>{stars} stars</Text>
                        <View style={styles.barTrack}>
                          <View style={[styles.barProgress, { width: `${percentage}%` }]} />
                        </View>
                        <Text style={styles.barPercentage}>{percentage.toFixed(0)}%</Text>
                      </View>
                    );
                  })}
                </View>
              </View>

              <FlatList
                data={reviews.slice(0, 5)}
                keyExtractor={(item) => item._id || item.id || Math.random().toString()}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <View style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                      <View style={styles.reviewerAvatar}>
                        <Text style={styles.reviewerInitial}>
                          {(item.user?.name || 'A').charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.reviewerInfo}>
                        <Text style={styles.reviewerName}>{item.user?.name || 'Anonymous'}</Text>
                        <Text style={styles.reviewDate}>
                          {new Date(item.createdAt || item.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </Text>
                      </View>
                      <Text style={styles.reviewRating}>
                        {'⭐'.repeat(item.rating || 0)}
                      </Text>
                    </View>
                    {item.title && <Text style={styles.reviewTitle}>{item.title}</Text>}
                    <Text style={styles.reviewComment}>
                      {item.comment || item.review || 'No comment'}
                    </Text>
                  </View>
                )}
              />
            </>
          ) : (
            <View style={styles.noReviewsState}>
              <Text style={styles.noReviewsIcon}>💬</Text>
              <Text style={styles.noReviewsText}>No reviews yet</Text>
              <Text style={styles.noReviewsText}>Be the first to share your thoughts!</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.actionBar}>
        <View style={styles.quantityContainer}>
          <TouchableOpacity
            style={[styles.quantityButton, quantity <= 1 && styles.quantityButtonDisabled]}
            onPress={decrementQuantity}
            disabled={quantity <= 1}
          >
            <Text style={styles.quantityText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.quantityValue}>{quantity}</Text>
          <TouchableOpacity
            style={[
              styles.quantityButton,
              (quantity >= stock || !isInStock) && styles.quantityButtonDisabled,
            ]}
            onPress={incrementQuantity}
            disabled={quantity >= stock || !isInStock}
          >
            <Text style={styles.quantityText}>+</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[styles.addToCartButton, !isInStock && styles.addToCartButtonDisabled]}
          onPress={handleAddToCart}
          disabled={!isInStock || isAddingToCart}
        >
          {isAddingToCart ? (
            <ActivityIndicator size="small" color={theme.colors.white} />
          ) : (
            <Text style={styles.addToCartText}>
            {isInStock ? 'Add to Cart' : 'Out of Stock'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
);
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  imageSection: {
    width: '100%',
    height: IMAGE_HEIGHT,
    position: 'relative',
    backgroundColor: theme.colors.grey100,
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  imageBadge: {
    position: 'absolute',
    top: theme.spacing.md,
    left: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    zIndex: 2,
  },
  discountBadge: {
    backgroundColor: theme.colors.error,
  },
  outOfStockBadge: {
    backgroundColor: theme.colors.grey600,
  },
  badgeText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.white,
  },
  thumbnailList: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  thumbnailItem: {
    width: 70,
    height: 70,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    marginRight: theme.spacing.sm,
  },
  thumbnailItemActive: {
    borderColor: theme.colors.primary,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  contentSection: {
    padding: theme.spacing.md,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.grey100,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    marginBottom: theme.spacing.sm,
  },
  categoryText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
  },
  productTitle: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  currentPrice: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  originalPrice: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.grey500,
    textDecorationLine: 'line-through',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  ratingText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
  },
  stockBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
  },
  stockBadgeInStock: {
    backgroundColor: theme.colors.success + '20',
  },
  stockBadgeOutOfStock: {
    backgroundColor: theme.colors.error + '20',
  },
  stockText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.text,
  },
  skuContainer: {
    marginTop: theme.spacing.sm,
  },
  skuText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  variantsSection: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.grey50,
    marginTop: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  variantGroup: {
    marginBottom: theme.spacing.lg,
  },
  variantGroupHeader: {
    marginBottom: theme.spacing.sm,
  },
  variantGroupLabel: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.text,
  },
  selectedValue: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.normal,
  },
  variantOptionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  variantOptionWrapper: {
    position: 'relative',
  },
  variantOption: {
    minWidth: 90,
    minHeight: 50,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: theme.colors.grey300,
    backgroundColor: theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  variantOptionActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10',
  },
  variantOptionDisabled: {
    opacity: 0.5,
    borderColor: theme.colors.grey300,
  },
  variantOptionContent: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  variantOptionText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text,
  },
  variantOptionTextActive: {
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.semiBold,
  },
  variantOptionTextDisabled: {
    color: theme.colors.grey500,
  },
  checkmarkIndicator: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  checkmarkIcon: {
    fontSize: 14,
    color: theme.colors.white,
    fontWeight: theme.typography.fontWeight.bold,
  },
  colorSwatchContainer: {
    position: 'relative',
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorSwatch: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: theme.colors.grey300,
  },
  colorSwatchActive: {
    borderColor: theme.colors.primary,
  },
  colorSwatchRing: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorSwatchRingActive: {
    borderColor: theme.colors.primary,
  },
  variantStockBadge: {
    position: 'absolute',
    bottom: -10,
    left: '50%',
    marginLeft: -30,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.warning,
    zIndex: 5,
  },
  variantStockText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.white,
    fontWeight: theme.typography.fontWeight.semiBold,
  },
  outOfStockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.md,
    zIndex: 1,
  },
  outOfStockText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.white,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  descriptionSection: {
    padding: theme.spacing.md,
  },
  descriptionText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
    lineHeight: theme.typography.fontSize.base * 1.5,
  },
  reviewsSection: {
    padding: theme.spacing.md,
  },
  reviewsSummary: {
    flexDirection: 'row',
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  overallRating: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingNumber: {
    fontSize: theme.typography.fontSize['3xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
  },
  ratingStars: {
    fontSize: theme.typography.fontSize.xl,
  },
  ratingTextSmall: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  ratingBars: {
    flex: 1,
    justifyContent: 'center',
    gap: theme.spacing.xs,
  },
  ratingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  starCount: {
    minWidth: 60,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  barTrack: {
    flex: 1,
    height: 8,
    backgroundColor: theme.colors.grey200,
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
  },
  barProgress: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.full,
  },
  barPercentage: {
    minWidth: 40,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'right',
  },
  reviewCard: {
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.grey50,
    borderRadius: theme.borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  reviewerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  reviewerInitial: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.white,
  },
  reviewerInfo: {
    flex: 1,
  },
  reviewerName: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.text,
    marginBottom: 2,
  },
  reviewDate: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  reviewRating: {
    fontSize: theme.typography.fontSize.base,
  },
  reviewTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  reviewComment: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: theme.typography.fontSize.sm * 1.5,
  },
  noReviewsState: {
    alignItems: 'center',
    paddingVertical: theme.spacing['2xl'],
  },
  noReviewsIcon: {
    fontSize: 48,
    marginBottom: theme.spacing.md,
  },
  noReviewsText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.grey200,
    backgroundColor: theme.colors.white,
    gap: theme.spacing.md,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.grey300,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },
  quantityButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.grey100,
  },
  quantityButtonDisabled: {
    opacity: 0.5,
  },
  quantityText: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
  },
  quantityValue: {
    width: 50,
    textAlign: 'center',
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.text,
  },
  addToCartButton: {
    flex: 1,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
  },
  addToCartButtonDisabled: {
    backgroundColor: theme.colors.grey400,
  },
  addToCartText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.white,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing['2xl'],
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing['2xl'],
  },
  errorText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.error,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  retryButton: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
  },
  retryText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.white,
  },
});

export default ProductDetailScreen;


