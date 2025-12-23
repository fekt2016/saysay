import React, { useState, useMemo, useCallback, useEffect, useLayoutEffect, useRef } from 'react';
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
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import useProduct from '../../hooks/useProduct';
import { useCartActions, useCartTotals } from '../../hooks/useCart';
import { useToggleWishlist } from '../../hooks/useWishlist';
import { useGetProductReviews } from '../../hooks/useReview';
import { useAuth } from '../../hooks/useAuth';
import { theme } from '../../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_HEIGHT = SCREEN_WIDTH; 
const TAB_BAR_HEIGHT = 50;
const TABS = ['Overview', 'Description', 'Specifications', 'Reviews', 'Shipping & Returns']; 

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

// TabButton Component
const TabButton = ({ label, isActive, onPress }) => {
  return (
    <TouchableOpacity
      style={[styles.tabButton, isActive && styles.tabButtonActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text 
        style={[styles.tabButtonText, isActive && styles.tabButtonTextActive]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
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
  const [selectedSku, setSelectedSku] = useState(null); // CRITICAL: Maintain selectedSku state separately
  const [selectedAttributes, setSelectedAttributes] = useState({});
  const [productAddedToCart, setProductAddedToCart] = useState(false);
  const [activeTab, setActiveTab] = useState('Overview');
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [fullScreenImageVisible, setFullScreenImageVisible] = useState(false);
  const scrollViewRef = useRef(null);

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

  // CRITICAL: Auto-select default SKU on product load (SKU is the unit of commerce)
  useEffect(() => {
    if (variants.length > 0 && product && !selectedVariant) {
      // Find active variant first, otherwise use first in-stock variant, then first variant
      const defaultVariant = 
        variants.find(v => v.status === "active" && v.sku) ||
        variants.find(v => v.stock > 0 && v.sku) ||
        variants.find(v => v.sku) ||
        variants[0];
      
      if (defaultVariant?.sku) {
        console.log('[ProductDetailScreen] Auto-selecting default SKU:', defaultVariant.sku);
        setSelectedVariant(defaultVariant);
        setSelectedSku(defaultVariant.sku.trim().toUpperCase()); // CRITICAL: Set SKU
        if (defaultVariant.attributes && Array.isArray(defaultVariant.attributes)) {
          const initialAttributes = {};
          defaultVariant.attributes.forEach((attr) => {
            initialAttributes[attr.key] = attr.value;
          });
          setSelectedAttributes(initialAttributes);
        }
      }
    } else if (variants.length === 0) {
      // Product has no variants - clear selection
      if (selectedVariant) {
        setSelectedVariant(null);
        setSelectedSku(null);
        setSelectedAttributes({});
      }
    }
  }, [variants, product, selectedVariant]);
  
  // CRITICAL: Sync selectedSku when selectedVariant changes
  useEffect(() => {
    if (selectedVariant?.sku) {
      setSelectedSku(selectedVariant.sku.trim().toUpperCase());
    } else if (!selectedVariant) {
      setSelectedSku(null);
    }
  }, [selectedVariant]);

  useEffect(() => {
    if (Object.keys(selectedAttributes).length > 0 && variants.length > 0) {
      const matchingVariant = variants.find((variant) => {
        if (!variant.attributes || !Array.isArray(variant.attributes)) return false;
        return Object.entries(selectedAttributes).every(([key, value]) => {
          return variant.attributes.some((attr) => attr.key === key && attr.value === value);
        });
      });
      if (matchingVariant) {
        setSelectedVariant(matchingVariant);
        // CRITICAL: Set SKU when variant is matched
        if (matchingVariant.sku) {
          setSelectedSku(matchingVariant.sku.trim().toUpperCase());
        }
      } else {
        setSelectedVariant(null);
        setSelectedSku(null);
      }
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
      headerRight: () => (
        <TouchableOpacity
          style={styles.headerCartButton}
          onPress={() => navigation.navigate('CartTab', { screen: 'Cart' })}
          activeOpacity={0.7}
        >
          <Ionicons name="cart-outline" size={24} color={theme.colors.text} />
          {cartItemCount > 0 && (
            <View style={styles.headerCartBadge}>
              <Text style={styles.headerCartBadgeText}>
                {cartItemCount > 99 ? '99+' : cartItemCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      ),
    });
  }, [navigation, product?.name, cartItemCount]);

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
    setProductAddedToCart(false);
  }, []);

  const incrementQuantity = useCallback(() => {
    setQuantity((prev) => {
      const newQuantity = Math.min(prev + 1, stock);
      if (newQuantity !== prev) {
        setProductAddedToCart(false);
      }
      return newQuantity;
    });
  }, [stock]);

  const decrementQuantity = useCallback(() => {
    setQuantity((prev) => {
      const newQuantity = Math.max(1, prev - 1);
      if (newQuantity !== prev) {
        setProductAddedToCart(false);
      }
      return newQuantity;
    });
  }, []);

  const handleAddToCart = useCallback(() => {
    if (!isInStock || !product) {
      Alert.alert('Out of Stock', 'This product is currently out of stock.');
      return;
    }

    // CRITICAL: HARD LOG before addToCart to debug SKU issues
    console.log("[ADD_TO_CART_CLICK]", {
      productId: product._id,
      productName: product.name,
      selectedSku,
      selectedVariant: selectedVariant ? {
        _id: selectedVariant._id,
        sku: selectedVariant.sku,
        status: selectedVariant.status,
      } : null,
      variants: product?.variants?.map(v => ({
        id: v._id,
        sku: v.sku,
        status: v.status,
      })) || [],
      quantity,
      hasVariants: variants.length > 0,
    });

    // CRITICAL: For multi-variant products, ensure SKU is selected
    // If no SKU selected, try to auto-select default variant
    let finalSku = selectedSku;
    let finalVariant = selectedVariant;

    if (variants.length > 1) {
      if (!selectedSku) {
        // Try to auto-select default variant
        const defaultVariant = 
          variants.find(v => v.status === "active" && v.sku) ||
          variants.find(v => (v.stock || 0) > 0 && v.sku) ||
          variants.find(v => v.sku) ||
          variants[0];
        
        if (defaultVariant?.sku) {
          const defaultSku = defaultVariant.sku.trim().toUpperCase();
          console.log('[ProductDetailScreen] Auto-selecting default variant SKU:', defaultSku);
          
          // Update state for future operations
          setSelectedVariant(defaultVariant);
          setSelectedSku(defaultSku);
          
          // Set attributes for default variant
          if (defaultVariant.attributes && Array.isArray(defaultVariant.attributes)) {
            const initialAttributes = {};
            defaultVariant.attributes.forEach((attr) => {
              initialAttributes[attr.key] = attr.value;
            });
            setSelectedAttributes(initialAttributes);
          }
          
          finalSku = defaultSku;
          finalVariant = defaultVariant;
        } else {
          // Cannot resolve default SKU - block add
          Alert.alert(
            'Variant Required',
            'Please select a variant before adding to cart.',
            [{ text: 'OK' }]
          );
          return;
        }
      }
    } else if (variants.length === 1) {
      // Single-variant: Auto-select if not already selected
      const singleVariant = variants[0];
      if (!selectedVariant && singleVariant?.sku) {
        const singleSku = singleVariant.sku.trim().toUpperCase();
        setSelectedVariant(singleVariant);
        setSelectedSku(singleSku);
        if (singleVariant.attributes && Array.isArray(singleVariant.attributes)) {
          const initialAttributes = {};
          singleVariant.attributes.forEach((attr) => {
            initialAttributes[attr.key] = attr.value;
          });
          setSelectedAttributes(initialAttributes);
        }
        finalSku = singleSku;
        finalVariant = singleVariant;
      } else {
        finalSku = selectedSku || (singleVariant?.sku ? singleVariant.sku.trim().toUpperCase() : null);
        finalVariant = selectedVariant || singleVariant;
      }
    }

    // CRITICAL: Final validation - SKU must exist for variant products
    if (variants.length > 0 && !finalSku) {
      console.error('[ProductDetailScreen] ❌ SKU missing for variant product:', {
        productId: product._id,
        productName: product.name,
        selectedVariant: finalVariant,
        selectedSku: finalSku,
        variants: product?.variants,
      });
      Alert.alert('Error', 'Variant SKU is required. Please select a variant.');
      return;
    }

    console.log('[ProductDetailScreen] Adding to cart (SKU-based contract):', {
      productId: product._id,
      productName: product.name,
      variantSku: finalSku,
      selectedSku: finalSku,
      hasVariants: variants.length > 0,
      isSingleVariant: variants.length === 1,
    });

    // CRITICAL: Pass variantSku directly - variants are identified ONLY by SKU
    addToCart(
      {
        product: product,
        quantity,
        variantSku: finalSku || undefined, // SKU string - ONLY variantSku is accepted
      },
      {
        onSuccess: () => {
          setProductAddedToCart(true);
          Alert.alert('Success', 'Product added to cart!');
        },
        onError: (error) => {
          console.error('Error adding to cart:', error);
          
          // Handle SKU_REQUIRED error specifically
          if (error?.code === 'SKU_REQUIRED' || error?.message?.includes('variant')) {
            Alert.alert(
              'Variant Required',
              'Please select a variant before adding to cart.',
              [{ text: 'OK' }]
            );
          } else {
            Alert.alert('Error', error?.message || 'Failed to add product to cart. Please try again.');
          }
        },
      }
    );
  }, [product, quantity, isInStock, selectedVariant, selectedSku, variants, addToCart]);

  const handleGoToCart = useCallback(() => {
    navigation.navigate('CartTab', { screen: 'Cart' });
  }, [navigation]);

  const handleBuyNow = useCallback(() => {
    if (!isInStock || !product) {
      Alert.alert('Out of Stock', 'This product is currently out of stock.');
      return;
    }

    // CRITICAL: Auto-handle single-variant products
    const resolvedVariant = variants.length === 1
      ? variants[0]
      : selectedVariant;

    // Validate variant selection for products with variants
    if (variants.length > 0 && (!resolvedVariant || !resolvedVariant._id)) {
      Alert.alert(
        'Variant Required',
        'Please select a variant before proceeding.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Extract variant ID - MUST be string or null (NEVER pass full object)
    let variantId = null;
    if (resolvedVariant?._id) {
      variantId = resolvedVariant._id.toString ? resolvedVariant._id.toString() : String(resolvedVariant._id);
      
      // Validate ObjectId format
      if (!/^[0-9a-fA-F]{24}$/.test(variantId)) {
        console.error('[ProductDetailScreen] ❌ Invalid variant ID format:', variantId);
        Alert.alert('Error', 'Invalid variant selected. Please try again.');
        return;
      }
    }

    // Update UI state if auto-selected
    if (variants.length === 1 && !selectedVariant) {
      setSelectedVariant(resolvedVariant);
      if (resolvedVariant.sku) {
        setSelectedSku(resolvedVariant.sku.trim().toUpperCase());
      }
      if (resolvedVariant.attributes && Array.isArray(resolvedVariant.attributes)) {
        const initialAttributes = {};
        resolvedVariant.attributes.forEach((attr) => {
          initialAttributes[attr.key] = attr.value;
        });
        setSelectedAttributes(initialAttributes);
      }
    }

    // CRITICAL: Use selectedSku directly - no extraction needed
    const variantSkuForGoToCart = selectedSku || (resolvedVariant?.sku ? resolvedVariant.sku.trim().toUpperCase() : null);
    
    if (!variantSkuForGoToCart && variants.length > 0) {
      console.error('[ProductDetailScreen] ❌ SKU missing for buy now:', {
        productId: product._id,
        selectedSku,
        resolvedVariant,
      });
      Alert.alert('Error', 'Variant SKU is required. Please select a variant.');
      return;
    }

    // CRITICAL: Pass variantSku directly - variants are identified ONLY by SKU
    addToCart(
      {
        product: product,
        quantity,
        variantSku: variantSkuForGoToCart, // SKU string - ONLY variantSku is accepted
      },
      {
        onSuccess: () => {
          navigation.navigate('CartTab', { screen: 'Cart' });
        },
        onError: (error) => {
          console.error('Error adding to cart:', error);
          Alert.alert('Error', 'Failed to add product to cart. Please try again.');
        },
      }
    );
  }, [product, quantity, isInStock, selectedVariant, variants, addToCart, navigation]);


  const renderTabContent = useCallback(() => {
    switch (activeTab) {
      case 'Overview':
        return (
          <View style={styles.tabContent}>
            {product.summary && (
              <View style={styles.overviewItem}>
                <Text style={styles.overviewTitle}>Summary</Text>
                <Text style={styles.overviewText}>{product.summary}</Text>
              </View>
            )}
            <View style={styles.overviewItem}>
              <Text style={styles.overviewTitle}>Key Features</Text>
              {product.keyFeatures && Array.isArray(product.keyFeatures) ? (
                product.keyFeatures.map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))
              ) : (
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
                  <Text style={styles.featureText}>Premium Quality</Text>
                </View>
              )}
            </View>
            {product.warranty && (
              <View style={styles.overviewItem}>
                <Text style={styles.overviewTitle}>Warranty</Text>
                <Text style={styles.overviewText}>{product.warranty}</Text>
              </View>
            )}
          </View>
        );
      case 'Description':
        const description = product.description || 'No description available.';
        const shouldTruncate = description.length > 200;
        const displayText = isDescriptionExpanded || !shouldTruncate 
          ? description 
          : description.substring(0, 200) + '...';
        
        return (
          <View style={styles.tabContent}>
            <Text style={styles.descriptionText}>{displayText}</Text>
            {shouldTruncate && (
              <TouchableOpacity
                onPress={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                style={styles.expandButton}
              >
                <Text style={styles.expandButtonText}>
                  {isDescriptionExpanded ? 'Show Less' : 'Show More'}
                </Text>
                <Ionicons
                  name={isDescriptionExpanded ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={theme.colors.primary}
                />
              </TouchableOpacity>
            )}
          </View>
        );
      case 'Specifications':
        const specs = product.specifications || product.specs || {};
        const specEntries = Object.entries(specs);
        
        return (
          <View style={styles.tabContent}>
            {specEntries.length > 0 ? (
              <View style={styles.specsContainer}>
                {specEntries.map(([key, value], index) => (
                  <View key={index} style={styles.specRow}>
                    <Text style={styles.specKey}>{key}</Text>
                    <Text style={styles.specValue}>{String(value)}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="information-circle-outline" size={48} color={theme.colors.grey400} />
                <Text style={styles.emptyStateText}>No specifications available</Text>
              </View>
            )}
          </View>
        );
      case 'Reviews':
        return (
          <View style={styles.tabContent}>
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
                {isAuthenticated && (
                  <TouchableOpacity
                    style={styles.writeReviewButton}
                    onPress={() => navigation.navigate('WriteReview', { productId: productIdToUse })}
                  >
                    <Ionicons name="create-outline" size={20} color={theme.colors.white} />
                    <Text style={styles.writeReviewText}>Write a Review</Text>
                  </TouchableOpacity>
                )}
                <FlatList
                  data={reviews}
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
                {isAuthenticated && (
                  <TouchableOpacity
                    style={styles.writeReviewButton}
                    onPress={() => navigation.navigate('WriteReview', { productId: productIdToUse })}
                  >
                    <Ionicons name="create-outline" size={20} color={theme.colors.white} />
                    <Text style={styles.writeReviewText}>Write a Review</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        );
      case 'Shipping & Returns':
        return (
          <View style={styles.tabContent}>
            <View style={styles.shippingItem}>
              <Ionicons name="time-outline" size={24} color={theme.colors.primary} />
              <View style={styles.shippingContent}>
                <Text style={styles.shippingTitle}>Delivery Timeline</Text>
                <Text style={styles.shippingText}>
                  {product.shippingTime || '3-7 business days'}
                </Text>
              </View>
            </View>
            <View style={styles.shippingItem}>
              <Ionicons name="location-outline" size={24} color={theme.colors.primary} />
              <View style={styles.shippingContent}>
                <Text style={styles.shippingTitle}>Shipping Locations</Text>
                <Text style={styles.shippingText}>
                  {product.shippingLocations || 'Nationwide delivery available'}
                </Text>
              </View>
            </View>
            <View style={styles.shippingItem}>
              <Ionicons name="refresh-outline" size={24} color={theme.colors.primary} />
              <View style={styles.shippingContent}>
                <Text style={styles.shippingTitle}>Return Policy</Text>
                <Text style={styles.shippingText}>
                  {product.returnPolicy || '30-day return policy. Items must be unused and in original packaging.'}
                </Text>
              </View>
            </View>
          </View>
        );
      default:
        return null;
    }
  }, [activeTab, product, isDescriptionExpanded, reviews, reviewCount, averageRating, isAuthenticated, productIdToUse, navigation]);

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
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
      >
        {/* Image Carousel Section */}
        <View style={styles.imageSection}>
          {images.length > 0 ? (
            <FlatList
              data={images}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item, index) => index.toString()}
              onMomentumScrollEnd={(event) => {
                const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                setSelectedImageIndex(Math.max(0, Math.min(index, images.length - 1)));
              }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => setFullScreenImageVisible(true)}
                  style={styles.imageCarouselItem}
                >
          <Image
                    source={{ uri: item }}
            style={styles.mainImage}
            resizeMode="cover"
          />
                </TouchableOpacity>
              )}
              getItemLayout={(data, index) => ({
                length: SCREEN_WIDTH,
                offset: SCREEN_WIDTH * index,
                index,
              })}
            />
          ) : (
            <View style={styles.mainImage} />
          )}
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
          {images.length > 1 && (
            <View style={styles.paginationDots}>
              {images.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.paginationDot,
                    index === selectedImageIndex && styles.paginationDotActive,
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        {/* Thumbnail Gallery */}
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

        {/* Product Core Info Section */}
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

          <View style={styles.ratingStockRow}>
          {(product.ratingsAverage || product.rating) && (
            <View style={styles.ratingContainer}>
                <Ionicons name="star" size={16} color={theme.colors.warning} />
              <Text style={styles.ratingText}>
                  {(product.ratingsAverage || product.rating || 0).toFixed(1)}
              </Text>
                {product.ratingsQuantity > 0 && (
                  <Text style={styles.ratingCount}>({product.ratingsQuantity})</Text>
                )}
            </View>
          )}
          <View style={[styles.stockBadge, isInStock ? styles.stockBadgeInStock : styles.stockBadgeOutOfStock]}>
            <Text style={styles.stockText}>
              {isInStock ? `${stock} in stock` : 'Out of stock'}
            </Text>
            </View>
          </View>

          {/* Seller Info */}
          {product.seller && (
            <TouchableOpacity
              style={styles.sellerContainer}
              onPress={() => navigation.navigate('Seller', { sellerId: product.seller._id || product.seller.id })}
              activeOpacity={0.7}
            >
              <Ionicons name="storefront-outline" size={20} color={theme.colors.primary} />
              <Text style={styles.sellerText}>
                Sold by {product.seller.shopName || product.seller.name || 'Seller'}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          )}

          {product.sku && (
            <View style={styles.skuContainer}>
              <Text style={styles.skuText}>SKU: {product.sku}</Text>
            </View>
          )}
        </View>

        {/* Variant Selector */}
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

        {/* Tab Bar */}
        {TABS && TABS.length > 0 && (
          <View style={styles.tabBarContainer}>
            <View style={styles.tabBar}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.tabBarContent}
                style={styles.tabBarScrollView}
                nestedScrollEnabled={true}
              >
                {TABS.map((tab) => (
                  <TabButton
                    key={tab}
                    label={tab}
                    isActive={activeTab === tab}
                    onPress={() => setActiveTab(tab)}
                  />
                ))}
              </ScrollView>
            </View>
          </View>
        )}

        {/* Tab Content */}
        {renderTabContent()}
      </ScrollView>

      {/* Full Screen Image Modal */}
      <Modal
        visible={fullScreenImageVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setFullScreenImageVisible(false)}
      >
        <TouchableOpacity
          style={styles.fullScreenImageContainer}
          activeOpacity={1}
          onPress={() => setFullScreenImageVisible(false)}
        >
          <Image
            source={{ uri: images[selectedImageIndex] || images[0] || '' }}
            style={styles.fullScreenImage}
            resizeMode="contain"
          />
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setFullScreenImageVisible(false)}
          >
            <Ionicons name="close" size={28} color={theme.colors.white} />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Bottom Action Bar */}
      <View style={styles.actionBar}>
        {productAddedToCart ? (
          <TouchableOpacity
            style={styles.goToCartButton}
            onPress={handleGoToCart}
            activeOpacity={0.8}
          >
            <Ionicons name="cart" size={20} color={theme.colors.white} />
            <Text style={styles.goToCartText}>Go to Cart</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.wishlistButton, isInWishlist && styles.wishlistButtonActive]}
              onPress={toggleWishlist}
              disabled={isAddingToWishlist}
              activeOpacity={0.7}
            >
              {isAddingToWishlist ? (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              ) : (
                <Ionicons
                  name={isInWishlist ? 'heart' : 'heart-outline'}
                  size={24}
                  color={isInWishlist ? theme.colors.error : theme.colors.text}
                />
              )}
            </TouchableOpacity>
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
            <TouchableOpacity
              style={[styles.buyNowButton, !isInStock && styles.buyNowButtonDisabled]}
              onPress={handleBuyNow}
              disabled={!isInStock || isAddingToCart}
            >
              <Text style={styles.buyNowText}>Buy Now</Text>
            </TouchableOpacity>
          </>
        )}
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
  imageCarouselItem: {
    width: SCREEN_WIDTH,
    height: IMAGE_HEIGHT,
  },
  mainImage: {
    width: SCREEN_WIDTH,
    height: IMAGE_HEIGHT,
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
    paddingBottom: theme.spacing.md + 35, // Add extra padding to account for bottom tab bar
    borderTopWidth: 1,
    borderTopColor: theme.colors.grey200,
    backgroundColor: theme.colors.white,
    gap: theme.spacing.sm,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.grey300,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    height: 48,
  },
  quantityButton: {
    width: 44,
    height: 48,
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
    height: 48,
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
  goToCartButton: {
    flex: 1,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
  },
  goToCartIcon: {
    marginRight: 4,
  },
  goToCartText: {
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
  headerCartButton: {
    position: 'relative',
    marginRight: theme.spacing.md,
    padding: theme.spacing.xs,
  },
  headerCartBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.error,
    borderRadius: theme.borderRadius.round || 10,
    borderWidth: 2,
    borderColor: theme.colors.white,
  },
  headerCartBadgeText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.xxs || 10,
    fontWeight: theme.typography.fontWeight.bold,
  },
  // Image Carousel Styles
  paginationDots: {
    position: 'absolute',
    bottom: theme.spacing.md,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  paginationDotActive: {
    backgroundColor: theme.colors.white,
    width: 24,
  },
  // Full Screen Image Modal
  fullScreenImageContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: SCREEN_WIDTH,
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    right: theme.spacing.md,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Product Core Info Updates
  ratingStockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  ratingCount: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginLeft: 4,
  },
  sellerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.grey50,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  sellerText: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text,
    fontWeight: theme.typography.fontWeight.medium,
  },
  // Tab Bar Styles
  tabBarContainer: {
    marginTop: 0,
    backgroundColor: theme.colors.white,
    width: '100%',
  },
  tabBar: {
    backgroundColor: theme.colors.white,
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.grey200,
    height: TAB_BAR_HEIGHT + theme.spacing.sm * 2,
    width: '100%',
  },
  tabBarScrollView: {
    height: TAB_BAR_HEIGHT + theme.spacing.sm * 2,
    width: '100%',
  },
  tabBarContent: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    alignItems: 'center',
    height: TAB_BAR_HEIGHT + theme.spacing.sm * 2,
    flexDirection: 'row',
  },
  tabButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    marginRight: theme.spacing.xs,
    borderRadius: theme.borderRadius.md || 10,
    backgroundColor: theme.colors.grey100,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    minHeight: TAB_BAR_HEIGHT - 10,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 70,
    flexShrink: 0,
  },
  tabButtonActive: {
    backgroundColor: theme.colors.primary100 || theme.colors.primary + '20',
    borderBottomColor: theme.colors.primary,
  },
  tabButtonText: {
    fontSize: theme.typography.fontSize.xs || 12,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  tabButtonTextActive: {
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.semibold || theme.typography.fontWeight.bold,
  },
  tabIndicator: {
    // Removed - using borderBottomColor instead
  },
  // Tab Content Styles
  tabContent: {
    padding: theme.spacing.md,
    minHeight: 200,
  },
  // Overview Tab Styles
  overviewItem: {
    marginBottom: theme.spacing.lg,
  },
  overviewTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  overviewText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
    lineHeight: theme.typography.fontSize.base * 1.5,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  featureText: {
    flex: 1,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text,
  },
  // Description Tab Styles
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  expandButtonText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.semiBold,
  },
  // Specifications Tab Styles
  specsContainer: {
    backgroundColor: theme.colors.grey50,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },
  specRow: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.grey200,
  },
  specKey: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.text,
  },
  specValue: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'right',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing['2xl'],
  },
  emptyStateText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
  },
  // Reviews Tab Styles
  writeReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  writeReviewText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.white,
  },
  // Shipping & Returns Tab Styles
  shippingItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  shippingContent: {
    flex: 1,
  },
  shippingTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  shippingText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: theme.typography.fontSize.sm * 1.5,
  },
  // Action Bar Updates
  wishlistButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.grey300,
    backgroundColor: theme.colors.white,
  },
  wishlistButtonActive: {
    borderColor: theme.colors.error,
    backgroundColor: theme.colors.error + '10',
  },
  buyNowButton: {
    flex: 1,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.borderRadius.md,
  },
  buyNowButtonDisabled: {
    backgroundColor: theme.colors.grey400,
  },
  buyNowText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.white,
  },
});

export default ProductDetailScreen;


