import React, { useEffect, useCallback, useState, useMemo, useLayoutEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../hooks/useAuth';
import {
  useGetCart,
  useCartTotals,
  useCartActions,
  useAutoSyncCart,
  getCartStructure,
} from '../../hooks/useCart';
import { theme } from '../../theme';
import LogoIcon from '../../components/header/LogoIcon';
import HeaderAvatar from '../../components/header/HeaderAvatar';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CartScreen = () => {
  const navigation = useNavigation();
  const { user, isAuthenticated } = useAuth();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [quantityInputs, setQuantityInputs] = useState();

  const { data, isLoading: isCartLoading, isError, refetch } = useGetCart();
  const { total: subTotal, count } = useCartTotals();
  const {
    updateCartItem,
    removeCartItem,
    clearCart,
    isUpdating,
    isRemoving,
    isClearing,
  } = useCartActions();

  useAutoSyncCart();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => <LogoIcon />,
      headerTitle: `Cart (${count || 0})`,
      headerRight: () => <HeaderAvatar />,
    });
  }, [navigation, count]);

  const products = useMemo(() => getCartStructure(data), [data]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigation.navigate('Auth', { screen: 'Login' });
    }
  }, [isAuthenticated, navigation]);

  useEffect(() => {
    const inputs = {};
    products.forEach((item) => {
      if (item._id) {
        inputs[item._id] = item.quantity?.toString() || '1';
      }
    });
    setQuantityInputs(inputs);
  }, [products]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      console.error('Error refreshing cart:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const handleQuantityChange = useCallback(
    (itemId, newQuantity) => {
      if (newQuantity < 1) return;
      const maxStock = products.find((item) => item._id === itemId)?.product?.stock || 999;
      const validatedQuantity = Math.min(newQuantity, maxStock);
      updateCartItem({ itemId, quantity: validatedQuantity });
    },
    [updateCartItem, products]
  );

  const handleRemoveItem = useCallback(
    (itemId) => {
      Alert.alert(
        'Remove Item',
        'Are you sure you want to remove this item from your cart?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => removeCartItem(itemId),
          },
        ]
      );
    },
    [removeCartItem]
  );

  const handleClearCart = useCallback(() => {
    Alert.alert(
      'Clear Cart',
      'Are you sure you want to remove all items from your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => clearCart(),
        },
      ]
    );
  }, [clearCart]);

  const handleCheckout = useCallback(() => {
    if (!isAuthenticated) {
      navigation.navigate('Auth', { screen: 'Login' });
      return;
    }
    if (products.length === 0) {
      Alert.alert('Empty Cart', 'Your cart is empty. Add items to proceed to checkout.');
      return;
    }
    navigation.navigate('Checkout');
  }, [isAuthenticated, navigation, products.length]);

  const handleQuantityInputChange = useCallback((itemId, text) => {
    setQuantityInputs((prev) => ({
      ...prev,
      [itemId]: text.replace(/[^0-9]/g, ''),
    }));
  }, []);

  const handleQuantityInputBlur = useCallback(
    (itemId) => {
      const quantity = parseInt(quantityInputs[itemId] || '1', 10);
      if (quantity >= 1) {
        handleQuantityChange(itemId, quantity);
      } else {
        setQuantityInputs((prev) => ({
          ...prev,
          [itemId]: '1',
        }));
        handleQuantityChange(itemId, 1);
      }
    },
    [quantityInputs, handleQuantityChange]
  );

  if (isCartLoading && !refreshing) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['bottom']}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading your cart...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['bottom']}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorTitle}>Failed to load cart</Text>
            <Text style={styles.errorText}>Please try again later</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (products.length === 0) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['bottom']}>
          <ScrollView
            contentContainerStyle={styles.emptyScrollContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
            }
          >
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <Text style={styles.emptyIcon}>🛒</Text>
              </View>
              <Text style={styles.emptyTitle}>Your cart is empty</Text>
              <Text style={styles.emptyText}>
                Looks like you haven't added anything to your cart yet. Start shopping to fill it up!
              </Text>
              <TouchableOpacity
                style={styles.shopButton}
                onPress={() => navigation.navigate('HomeTab', { screen: 'Home' })}
              >
                <LinearGradient
                  colors={theme.gradients.primary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.shopButtonGradient}
                >
                  <Text style={styles.shopButtonText}>Start Shopping</Text>
                  <Text style={styles.shopButtonIcon}>→</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  const FREE_SHIPPING_THRESHOLD = 100;
  const amountNeeded = Math.max(0, FREE_SHIPPING_THRESHOLD - subTotal);
  const hasFreeShipping = subTotal >= FREE_SHIPPING_THRESHOLD;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>

        {products.length > 0 && (
          <View style={styles.clearCartContainer}>
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClearCart}
              disabled={isClearing}
            >
              <Text style={styles.clearButtonText}>
                {isClearing ? 'Clearing...' : 'Clear Cart'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
      >

        <View style={styles.cartItemsContainer}>
          {products
            .filter((item) => item.product)
            .map((item, index) => {
              if (!item.product) return null;

              const unitPrice = item.product?.defaultPrice || item.product?.price || 0;
              const quantity = item.quantity || 1;
              const itemTotal = (typeof unitPrice === 'number' ? unitPrice : 0) * (typeof quantity === 'number' ? quantity : 1);
              const imageUri = item.product?.imageCover || item.product?.images?.[0] || item.product?.image;
              const maxStock = typeof item.product?.stock === 'number' ? item.product.stock : 999;

              const itemKey = item._id || item.product?._id || `cart-item-${item.product?._id || item.product?.id || index}`;

              return (
                <View key={itemKey} style={styles.cartItemCard}>
                  {imageUri ? (
                    <Image
                      source={{ uri: imageUri }}
                      style={styles.productImage}
                      resizeMode="cover"
                      onError={() => console.log('Failed to load image for product:', item.product?.name)}
                    />
                  ) : (
                    <View style={[styles.productImage, styles.placeholderImage]}>
                      <Text style={styles.placeholderText}>No Image</Text>
                    </View>
                  )}

                  <View style={styles.itemContent}>
                    <View style={styles.itemHeader}>
                      <Text style={styles.productName} numberOfLines={2}>
                        {item.product?.name || 'Product Name'}
                      </Text>
                      <TouchableOpacity
                        style={styles.removeIconButton}
                        onPress={() => handleRemoveItem(item._id)}
                        disabled={isRemoving}
                      >
                        <Text style={styles.removeIcon}>✕</Text>
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.unitPrice}>
                      GH₵{unitPrice.toFixed(2)} each
                    </Text>

                    <View style={styles.itemFooter}>
                      <View style={styles.quantityContainer}>
                        <TouchableOpacity
                          style={[
                            styles.quantityButton,
                            (item.quantity || 1) <= 1 && styles.quantityButtonDisabled,
                          ]}
                          onPress={() => handleQuantityChange(item._id, (item.quantity || 1) - 1)}
                          disabled={(item.quantity || 1) <= 1 || isUpdating}
                        >
                          <Text style={styles.quantityButtonText}>−</Text>
                        </TouchableOpacity>

                        <TextInput
                          style={styles.quantityInput}
                          value={quantityInputs[item._id] || (item.quantity || 1).toString()}
                          onChangeText={(text) => handleQuantityInputChange(item._id, text)}
                          onBlur={() => handleQuantityInputBlur(item._id)}
                          keyboardType="number-pad"
                          maxLength={3}
                          selectTextOnFocus
                          editable={!isUpdating}
                        />

                        <TouchableOpacity
                          style={[
                            styles.quantityButton,
                            (item.quantity || 1) >= maxStock && styles.quantityButtonDisabled,
                          ]}
                          onPress={() => handleQuantityChange(item._id, (item.quantity || 1) + 1)}
                          disabled={(item.quantity || 1) >= maxStock || isUpdating}
                        >
                          <Text style={styles.quantityButtonText}>+</Text>
                        </TouchableOpacity>
                      </View>

                      <Text style={styles.itemTotal}>GH₵{itemTotal.toFixed(2)}</Text>
                    </View>
                  </View>
                </View>
              );
            })}
        </View>

        {!hasFreeShipping && (
          <View style={styles.shippingBanner}>
            <Text style={styles.shippingIcon}>🚚</Text>
            <View style={styles.shippingTextContainer}>
              <Text style={styles.shippingText}>
                Add GH₵{amountNeeded.toFixed(2)} more for FREE shipping!
              </Text>
              <View style={styles.shippingProgressBar}>
                <View
                  style={[
                    styles.shippingProgressFill,
                    { width: `${(subTotal / FREE_SHIPPING_THRESHOLD) * 100}%` },
                  ]}
                />
              </View>
            </View>
          </View>
        )}

        {hasFreeShipping && (
          <View style={styles.freeShippingBadge}>
            <Text style={styles.freeShippingIcon}>✓</Text>
            <Text style={styles.freeShippingText}>You qualify for FREE shipping!</Text>
          </View>
        )}

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Order Summary</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal ({count} {count === 1 ? 'item' : 'items'})</Text>
            <Text style={styles.summaryValue}>GH₵{subTotal.toFixed(2)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Shipping</Text>
            <Text style={[styles.summaryValue, hasFreeShipping && styles.freeShippingValue]}>
              {hasFreeShipping ? 'FREE' : 'GH₵0.00'}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>GH₵{subTotal.toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>
      </SafeAreaView>

      <View style={[styles.bottomBar, { marginBottom: Math.max(80, insets.bottom + 60) }]}>
        <View style={styles.bottomTotalContainer}>
          <Text style={styles.bottomTotalLabel}>Total</Text>
          <Text style={styles.bottomTotalValue}>GH₵{subTotal.toFixed(2)}</Text>
        </View>
        <TouchableOpacity
          style={[styles.checkoutButton, products.length === 0 && styles.checkoutButtonDisabled]}
          onPress={handleCheckout}
          disabled={products.length === 0}
        >
          <LinearGradient
            colors={theme.gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.checkoutGradient}
          >
            <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
            <Text style={styles.checkoutButtonIcon}>→</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.grey50,
    position: 'relative',
  },
  safeArea: {
    flex: 1,
  },
  clearCartContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.grey200,
  },
  clearButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  clearButtonText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.error,
    fontWeight: theme.typography.fontWeight.semiBold,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing['2xl'],
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing['2xl'],
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: theme.spacing.lg,
  },
  errorTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  errorText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
  },
  retryButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.white,
  },
  emptyScrollContent: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing['3xl'],
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.grey100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xl,
  },
  emptyIcon: {
    fontSize: 64,
  },
  emptyTitle: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight: theme.typography.fontSize.base * 1.5,
  },
  shopButton: {
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
    marginTop: theme.spacing.md,
  },
  shopButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
  },
  shopButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.white,
    marginRight: theme.spacing.sm,
  },
  shopButtonIcon: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.white,
  },
  scrollContent: {
    paddingBottom: 150, 
  },
  cartItemsContainer: {
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  cartItemCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  productImage: {
    width: 100,
    height: 100,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.grey100,
  },
  placeholderImage: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.grey200,
  },
  placeholderText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  itemContent: {
    flex: 1,
    marginLeft: theme.spacing.md,
    justifyContent: 'space-between',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.xs,
  },
  productName: {
    flex: 1,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.text,
    marginRight: theme.spacing.sm,
  },
  removeIconButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.grey100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeIcon: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.fontWeight.bold,
  },
  unitPrice: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    width: 36,
    height: 36,
    backgroundColor: theme.colors.grey50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButtonDisabled: {
    opacity: 0.5,
    backgroundColor: theme.colors.grey100,
  },
  quantityButtonText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
  },
  quantityInput: {
    width: 50,
    height: 36,
    textAlign: 'center',
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.text,
    backgroundColor: theme.colors.white,
  },
  itemTotal: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  shippingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary + '15',
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.primary + '30',
  },
  shippingIcon: {
    fontSize: 24,
    marginRight: theme.spacing.sm,
  },
  shippingTextContainer: {
    flex: 1,
  },
  shippingText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.semiBold,
    marginBottom: theme.spacing.xs,
  },
  shippingProgressBar: {
    height: 4,
    backgroundColor: theme.colors.grey200,
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
  },
  shippingProgressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.full,
  },
  freeShippingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.success + '20',
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.success + '40',
  },
  freeShippingIcon: {
    fontSize: 20,
    color: theme.colors.success,
    marginRight: theme.spacing.sm,
    fontWeight: theme.typography.fontWeight.bold,
  },
  freeShippingText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.success,
    fontWeight: theme.typography.fontWeight.semiBold,
  },
  summaryCard: {
    backgroundColor: theme.colors.white,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  summaryTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  summaryLabel: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
  },
  summaryValue: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.text,
  },
  freeShippingValue: {
    color: theme.colors.success,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.grey200,
    marginVertical: theme.spacing.md,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
  },
  totalValue: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    backgroundColor: theme.colors.white,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.grey200,
    zIndex: 10000,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
      },
      android: {
        elevation: 25, 
      },
    }),
  },
  bottomTotalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  bottomTotalLabel: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
  },
  bottomTotalValue: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  checkoutButton: {
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
  },
  checkoutButtonDisabled: {
    opacity: 0.5,
  },
  checkoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
  },
  checkoutButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.white,
    marginRight: theme.spacing.sm,
  },
  checkoutButtonIcon: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.white,
  },
});

export default CartScreen;


