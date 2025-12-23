import React from 'react';
import { TouchableOpacity, View, Image, Text, StyleSheet } from 'react-native';
import { theme } from '../theme';

const ProductCard = ({
  product,
  onPress,
  onWishlistPress,
  isWishlisted = false,
  style,
}) => {
  
  const safeString = (value, fallback = '') => {
    if (value === null || value === undefined) return fallback;
    return String(value);
  };

  
  const safeNumberString = (value, decimals = 2) => {
    const num = Number(value);
    if (isNaN(num) || !isFinite(num)) return '0.00';
    return num.toFixed(decimals);
  };

  const imageUri =
    product?.imageCover ||
    product?.images?.[0] ||
    product?.image ||
    '';

  const basePrice =
    typeof product?.price === 'number'
      ? product.price
      : typeof product?.defaultPrice === 'number'
      ? product.defaultPrice
      : 0;

  const discountPrice =
    typeof product?.discountPrice === 'number'
      ? product.discountPrice
      : null;

  const price =
    discountPrice !== null && discountPrice < basePrice
      ? discountPrice
      : basePrice;

  const originalPrice =
    discountPrice !== null && discountPrice < basePrice
      ? basePrice
      : null;

  const name = safeString(product?.name, 'Product Name');

  
  const discountPercentage =
    typeof product?.discount === 'number'
      ? product.discount
      : typeof originalPrice === 'number' && originalPrice > price
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : null;

  const isValidPrice =
    typeof price === 'number' && isFinite(price) && price >= 0;

  const hasRating =
    typeof (product?.rating ?? product?.ratingsAverage) === 'number';

  const ratingValue =
    typeof product?.rating === 'number'
      ? product.rating
      : typeof product?.ratingsAverage === 'number'
      ? product.ratingsAverage
      : 0;

  const hasReviews =
    typeof product?.numReviews === 'number';

  const hasSold =
    typeof product?.totalSold === 'number' && product.totalSold > 0;

  // Calculate stock: sum of all variant stocks, or 0 if no variants
  const calculateStock = () => {
    if (product?.variants && Array.isArray(product.variants) && product.variants.length > 0) {
      return product.variants.reduce((sum, variant) => sum + (variant.stock || 0), 0);
    }
    // Fallback: if product has a direct stock field (for simple products)
    if (typeof product?.stock === 'number') {
      return product.stock;
    }
    return 0;
  };

  const stock = calculateStock();
  const isInStock = stock > 0;

  return (
    <View style={[styles.shadowContainer, style]}>
      <TouchableOpacity
        style={styles.container}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <View style={styles.imageContainer}>
          {imageUri.trim() !== '' ? (
            <Image
              source={{ uri: imageUri }}
              style={styles.productImage}
              resizeMode="cover"
              onError={(error) => {
                console.log('[ProductCard] Image load error:', error);
              }}
            />
          ) : (
            <View style={[styles.productImage, styles.placeholderImage]}>
              <Text style={styles.placeholderText}>No Image</Text>
            </View>
          )}

          {typeof onWishlistPress === 'function' && (
            <TouchableOpacity
              style={styles.wishlistButton}
              onPress={onWishlistPress}
            >
              <Text style={styles.wishlistIcon}>
                {isWishlisted ? '❤️' : '🤍'}
              </Text>
            </TouchableOpacity>
          )}

          {typeof discountPercentage === 'number' && discountPercentage > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>
                -{safeString(discountPercentage)}%
              </Text>
            </View>
          )}
        </View>

        <View style={styles.content}>
          <Text numberOfLines={2} style={styles.name}>
            {name}
          </Text>

          <View style={styles.priceContainer}>
            <Text style={styles.price}>
              GH₵{isValidPrice ? safeNumberString(price, 2) : '0.00'}
            </Text>

            {typeof originalPrice === 'number' &&
              originalPrice > price &&
              isValidPrice && (
                <Text style={styles.originalPrice}>
                  GH₵{safeNumberString(originalPrice, 2)}
                </Text>
              )}
          </View>

          {hasRating && (
            <View style={styles.ratingContainer}>
              <Text style={styles.rating}>
                ⭐ {safeNumberString(ratingValue, 1)}
              </Text>

              {hasReviews && (
                <Text style={styles.reviews}>
                  ({safeString(product.numReviews)})
                </Text>
              )}

              {hasSold && (
                <Text style={styles.reviews}>
                  {` • ${safeString(product.totalSold)} sold`}
                </Text>
              )}
            </View>
          )}

          {/* Stock Display */}
          <View style={styles.stockContainer}>
            <Text style={[styles.stockText, isInStock ? styles.stockInStock : styles.stockOutOfStock]}>
              {isInStock ? `${stock} left` : 'Out of stock'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  shadowContainer: {
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  container: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    width: '100%',
  },
  imageContainer: {
    width: '100%',
    height: 200,
    position: 'relative',
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    backgroundColor: theme.colors.grey200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.grey500,
  },
  wishlistButton: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.sm,
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.round,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  wishlistIcon: {
    fontSize: 20,
  },
  discountBadge: {
    position: 'absolute',
    top: theme.spacing.sm,
    left: theme.spacing.sm,
    backgroundColor: theme.colors.error,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  discountText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
  },
  content: {
    padding: theme.spacing.xs,
  },
  name: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
    minHeight: 40,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  price: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
    marginRight: theme.spacing.sm,
  },
  originalPrice: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.grey500,
    textDecorationLine: 'line-through',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  reviews: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.grey500,
    marginLeft: theme.spacing.xs,
  },
  stockContainer: {
    marginTop: theme.spacing.xs,
  },
  stockText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
  },
  stockInStock: {
    color: theme.colors.success || '#10B981',
  },
  stockOutOfStock: {
    color: theme.colors.error || '#EF4444',
  },
});

export default ProductCard;
