import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQueryClient, useQuery, useMutation } from '@tanstack/react-query';
import { theme } from '../../theme';
import { useOrderConfirmation } from '../../hooks/useOrderConfirmation';
import { useCartActions } from '../../hooks/useCart';

const OrderCompleteScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const queryClient = useQueryClient();
  const { clearCart } = useCartActions();
  const cartClearedRef = useRef(false);

  const { 
    orderId, 
    orderNumber, 
    totalAmount,
    paymentMethod,
    shippingCost,
    subTotal,
    discount,
    orderDate,
    deliveryMethod,
    reference,
    needsVerification = false,
  } = route?.params || {};

  const {
    orderFromApi,
    isOrderLoading,
    orderError,
    isVerifyingPayment,
    paymentVerificationError,
    verificationStatus,
    hasVerified,
  } = useOrderConfirmation(null, orderId, reference, needsVerification);

  const order = orderFromApi?.data?.order || orderFromApi?.order || orderFromApi;
  const finalOrderNumber = order?.orderNumber || orderNumber;
  const finalTotalAmount = order?.totalPrice || order?.totalAmount || totalAmount;
  const finalPaymentMethod = order?.paymentMethod || paymentMethod;
  const finalDeliveryMethod = order?.deliveryMethod || deliveryMethod;
  
  // Check if order is confirmed (paymentStatus === 'paid' or orderStatus === 'confirmed')
  const isOrderConfirmed = order?.paymentStatus === 'paid' || 
                          order?.paymentStatus === 'completed' ||
                          order?.orderStatus === 'confirmed' ||
                          order?.currentStatus === 'confirmed';

  const isPaystackPayment = finalPaymentMethod === 'mobile_money' || finalPaymentMethod === 'paystack';
  const isCashOnDelivery = finalPaymentMethod === 'payment_on_delivery' || finalPaymentMethod === 'cod';
  const isWalletPayment = finalPaymentMethod === 'credit_balance' || finalPaymentMethod === 'wallet';

  useEffect(() => {
    if (!orderId) return;

    const cartClearKey = `CART_CLEARED_${orderId}`;

    const alreadyCleared = cartClearedRef.current;
    if (alreadyCleared) {
      return;
    }

    // Clear cart if order is confirmed (for any payment method)
    if (isOrderConfirmed) {
      cartClearedRef.current = true;
      clearCart();
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      // Invalidate product queries to refresh stock
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product'] });
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      // Invalidate all product-related queries (including category-products, seller products, etc.)
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey;
          return (
            (Array.isArray(key) && key[0] === 'products') ||
            (Array.isArray(key) && key[0] === 'product') ||
            (Array.isArray(key) && key[0] === 'category-products')
          );
        },
      });
      return;
    }

    // For COD/Wallet: Clear immediately (no verification needed)
    if (isCashOnDelivery || isWalletPayment) {
      cartClearedRef.current = true;
      clearCart();
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      // Invalidate product queries to refresh stock
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product'] });
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      // Invalidate all product-related queries (including category-products, seller products, etc.)
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey;
          return (
            (Array.isArray(key) && key[0] === 'products') ||
            (Array.isArray(key) && key[0] === 'product') ||
            (Array.isArray(key) && key[0] === 'category-products')
          );
        },
      });
      return;
    }

    // For Paystack: Clear after payment verification succeeds
    if (isPaystackPayment && verificationStatus === 'success' && hasVerified) {
      cartClearedRef.current = true;
      clearCart();
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      // Invalidate product queries to refresh stock
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product'] });
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      // Invalidate all product-related queries (including category-products, seller products, etc.)
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey;
          return (
            (Array.isArray(key) && key[0] === 'products') ||
            (Array.isArray(key) && key[0] === 'product') ||
            (Array.isArray(key) && key[0] === 'category-products')
          );
        },
      });
    }
  }, [orderId, isOrderConfirmed, isCashOnDelivery, isWalletPayment, isPaystackPayment, verificationStatus, hasVerified, clearCart, queryClient, order]);

  const handleViewOrder = () => {
    if (orderId) {

      navigation.getParent()?.getParent()?.navigate('Main', {
        screen: 'AccountTab',
        params: {
          screen: 'Account',
          params: {
            screen: 'Orders',
            params: {
              screen: 'OrderDetail',
              params: { orderId },
            },
          },
        },
      });
    } else {

      navigation.getParent()?.getParent()?.navigate('Main', {
        screen: 'AccountTab',
        params: {
          screen: 'Account',
          params: {
            screen: 'Orders',
          },
        },
      });
    }
  };

  const handleContinueShopping = () => {

    try {
      console.log('[OrderComplete] Navigating to Home screen...');

      const rootNavigator = navigation.getParent()?.getParent();

      if (rootNavigator) {

        rootNavigator.navigate('Main', {
          screen: 'HomeTab',
          params: {
            screen: 'Home',
          },
        });
        console.log('[OrderComplete] ✅ Navigated to Home screen via root navigator');
      } else {

        const parentNavigator = navigation.getParent();
        if (parentNavigator) {
          parentNavigator.navigate('Main', {
            screen: 'HomeTab',
            params: {
              screen: 'Home',
            },
          });
          console.log('[OrderComplete] ✅ Navigated to Home screen via parent navigator');
        } else {

          navigation.navigate('Main');
          console.log('[OrderComplete] ✅ Navigated to Main (fallback)');
        }
      }
    } catch (error) {
      console.error('[OrderComplete] ❌ Navigation error:', error);

      try {
        navigation.reset({
          index: 0,
          routes: [
            {
              name: 'Main',
              state: {
                routes: [
                  {
                    name: 'HomeTab',
                    state: {
                      routes: [{ name: 'Home' }],
                      index: 0,
                    },
                  },
                ],
                index: 0,
              },
            },
          ],
        });
        console.log('[OrderComplete] ✅ Reset navigation to Home');
      } catch (resetError) {
        console.error('[OrderComplete] ❌ Reset navigation error:', resetError);
      }
    }
  };

  if ((isOrderLoading && orderId) || (isVerifyingPayment && needsVerification)) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingTitle}>
            {isVerifyingPayment ? 'Verifying Payment...' : 'Loading Order Details...'}
          </Text>
          <Text style={styles.loadingText}>
            {isVerifyingPayment 
              ? 'Please wait, we are validating your payment with Paystack.'
              : 'Please wait while we fetch your order information.'}
          </Text>
          {orderId && (
            <Text style={styles.loadingSubtext}>Order ID: {orderId}</Text>
          )}
        </View>
      </SafeAreaView>
    );
  }

  if (verificationStatus === 'failed' && isPaystackPayment && needsVerification) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Payment Verification Failed</Text>
          <Text style={styles.errorText}>
            {paymentVerificationError || 
             "We couldn't verify your payment. Please contact support if payment was deducted."}
          </Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.primaryButton]} 
              onPress={() => {
                navigation.getParent()?.getParent()?.navigate('Main', {
                  screen: 'AccountTab',
                  params: {
                    screen: 'Account',
                    params: {
                      screen: 'Orders',
                    },
                  },
                });
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.buttonText, styles.primaryButtonText]}>View Orders</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.button} 
              onPress={() => {

                navigation.replace('OrderComplete', route.params);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>Retry Verification</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (orderError && orderId && !order) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Error Loading Order</Text>
          <Text style={styles.errorText}>
            {orderError?.message || 'Failed to load order details'}
          </Text>
          {paymentVerificationError && (
            <Text style={styles.errorSubtext}>
              Payment verification error: {paymentVerificationError}
            </Text>
          )}
          <TouchableOpacity 
            style={[styles.button, styles.primaryButton]} 
            onPress={() => {
              navigation.getParent()?.getParent()?.navigate('Main', {
                screen: 'AccountTab',
                params: {
                  screen: 'Account',
                  params: {
                    screen: 'Orders',
                  },
                },
              });
            }}
            activeOpacity={0.8}
          >
            <Text style={[styles.buttonText, styles.primaryButtonText]}>View Orders</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>✅</Text>
          </View>

          <Text style={styles.title}>Order Placed Successfully!</Text>

          <Text style={styles.message}>
            Thank you for your purchase. Your order has been confirmed and will be
            processed shortly.
          </Text>

          {isPaystackPayment && needsVerification && (
            <View style={styles.verificationStatus}>
              {verificationStatus === 'success' && (
                <Text style={styles.verificationSuccess}>
                  ✓ Payment verified successfully
                </Text>
              )}
              {reference && (
                <Text style={styles.referenceText}>
                  Payment Reference: {reference}
                </Text>
              )}
            </View>
          )}

          {finalOrderNumber && (
            <View style={styles.orderInfo}>
              <Text style={styles.orderLabel}>Order Number:</Text>
              <Text style={styles.orderNumber}>{finalOrderNumber}</Text>
            </View>
          )}

          {(finalTotalAmount || finalPaymentMethod || finalDeliveryMethod) && (
            <View style={styles.detailsContainer}>
              {finalTotalAmount && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Total Amount:</Text>
                  <Text style={styles.detailValue}>GH₵{finalTotalAmount.toFixed(2)}</Text>
                </View>
              )}
              {finalPaymentMethod && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Payment Method:</Text>
                  <Text style={styles.detailValue}>
                    {finalPaymentMethod === 'payment_on_delivery' ? 'Cash on Delivery' :
                     finalPaymentMethod === 'credit_balance' ? 'Account Balance' :
                     finalPaymentMethod === 'mobile_money' ? 'Mobile Money' :
                     finalPaymentMethod === 'bank_transfer' ? 'Bank Transfer' :
                     finalPaymentMethod}
                  </Text>
                </View>
              )}
              {finalDeliveryMethod && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Delivery Method:</Text>
                  <Text style={styles.detailValue}>
                    {finalDeliveryMethod === 'pickup_center' ? 'Pickup Center' :
                     finalDeliveryMethod === 'dispatch' ? 'Home Delivery' :
                     finalDeliveryMethod}
                  </Text>
                </View>
              )}
            </View>
          )}

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.primaryButton]} 
              onPress={handleViewOrder}
              activeOpacity={0.8}
            >
              <Text style={[styles.buttonText, styles.primaryButtonText]}>View Order</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.button} 
              onPress={handleContinueShopping}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>Continue Shopping</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background || '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
    minHeight: '100%',
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.success || '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xl,
  },
  icon: {
    fontSize: 50,
  },
  title: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  message: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: theme.spacing.xl,
  },
  orderInfo: {
    backgroundColor: theme.colors.white,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
    width: '100%',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  orderLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  orderNumber: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  buttonContainer: {
    width: '100%',
  },
  button: {
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    borderWidth: 0,
  },
  buttonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.textPrimary,
  },
  primaryButtonText: {
    color: theme.colors.white,
  },
  detailsContainer: {
    backgroundColor: theme.colors.white,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
    width: '100%',
    marginBottom: theme.spacing.xl,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  detailLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  detailValue: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.textPrimary,
    flex: 1,
    textAlign: 'right',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  loadingTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  loadingText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  loadingSubtext: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: theme.spacing.lg,
  },
  errorTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  errorText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.error,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  errorSubtext: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.warning,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  verificationStatus: {
    backgroundColor: theme.colors.white,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.lg,
    width: '100%',
    alignItems: 'center',
  },
  verificationSuccess: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.success,
    fontWeight: theme.typography.fontWeight.semiBold,
    marginBottom: theme.spacing.xs,
  },
  referenceText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
});

export default OrderCompleteScreen;


