import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { useGetOrderById } from '../../hooks/useOrder';

import { theme } from '../../theme';

const OrderDetailScreen = ({ route, navigation }) => {
  const { orderId } = route.params;
  const { data: orderData, isLoading, isError, refetch } = useGetOrderById(orderId);

  const order = useMemo(() => {
    if (!orderData) {
      console.log('[OrderDetailScreen] No orderData');
      return null;
    }

    console.log('[OrderDetailScreen] orderData structure:', {
      hasData: !!orderData?.data,
      hasOrder: !!orderData?.data?.order,
      hasStatus: !!orderData?.status,
      keys: Object.keys(orderData),
    });

    if (orderData?.data?.order) {
      console.log('[OrderDetailScreen] Found orderData.data.order');
      return orderData.data.order;
    }

    if (orderData?.order) {
      console.log('[OrderDetailScreen] Found orderData.order');
      return orderData.order;
    }

    if (orderData?.data && typeof orderData.data === 'object' && !Array.isArray(orderData.data)) {
      console.log('[OrderDetailScreen] Using orderData.data as order');
      return orderData.data;
    }

    console.log('[OrderDetailScreen] Using orderData as order');
    return orderData;
  }, [orderData]);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return theme.colors.warning || '#FFA500';
      case 'processing':
        return theme.colors.info || '#3B82F6';
      case 'shipped':
        return theme.colors.primary;
      case 'delivered':
        return theme.colors.success;
      case 'cancelled':
        return theme.colors.error;
      default:
        return theme.colors.textSecondary;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading order details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.emptyContainer}>
          <Ionicons name="close-circle-outline" size={64} color={theme.colors.error} />
          <Text style={styles.emptyTitle}>Order not found</Text>
          <Text style={styles.emptyText}>This order could not be loaded</Text>
        </View>
      </SafeAreaView>
    );
  }

  const orderStatus = order.status || order.orderStatus || order.currentStatus || 'pending';
  const statusColor = getStatusColor(orderStatus);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>

        <LinearGradient
          colors={[statusColor, statusColor + 'CC']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.statusBanner}
        >
          <Text style={styles.statusBannerText}>
            Order {orderStatus.charAt(0).toUpperCase() + orderStatus.slice(1)}
          </Text>
          <Text style={styles.statusBannerSubtext}>
            Order #{order.orderNumber || order._id?.slice(-6)}
          </Text>
        </LinearGradient>

        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="information-circle-outline" size={20} color={theme.colors.textPrimary} />
            <Text style={styles.sectionTitle}>Order Information</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Order Date:</Text>
            <Text style={styles.infoValue}>{formatDate(order.createdAt)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Payment Method:</Text>
            <Text style={styles.infoValue}>
              {order.paymentMethod === 'payment_on_delivery' ? 'Cash on Delivery' :
               order.paymentMethod === 'mobile_money' ? 'Mobile Money' :
               order.paymentMethod === 'card' ? 'Card' : 'N/A'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Payment Status:</Text>
            <Text style={[
              styles.infoValue,
              { color: (order.paymentStatus === 'paid' || order.paymentStatus === 'completed') ? theme.colors.success : theme.colors.warning }
            ]}>
              {order.paymentStatus ? order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1) : 'Pending'}
            </Text>
          </View>
          {order.trackingNumber && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tracking Number:</Text>
              <TouchableOpacity
                onPress={() => {
                  if (order.trackingNumber) {
                    navigation.navigate('Tracking', { 
                      trackingNumber: order.trackingNumber,
                      orderId: order._id 
                    });
                  }
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.infoValue, styles.trackingNumber]}>
                  {order.trackingNumber}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {order.shippingAddress && (
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="location-outline" size={18} color={theme.colors.textPrimary} />
              <Text style={styles.sectionTitle}>Shipping Address</Text>
            </View>
            <Text style={styles.addressName}>{order.shippingAddress.fullName}</Text>
            <Text style={styles.addressText}>{order.shippingAddress.streetAddress}</Text>
            <Text style={styles.addressText}>
              {order.shippingAddress.area}, {order.shippingAddress.city}
            </Text>
            <Text style={styles.addressPhone}>{order.shippingAddress.contactPhone}</Text>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="cube-outline" size={18} color={theme.colors.textPrimary} />
            <Text style={styles.sectionTitle}>Order Items</Text>
          </View>
          {(order.orderItems || order.items || [])?.map((item, index) => (
            <View key={index} style={styles.orderItem}>
              <Image
                source={{ uri: item.product?.imageCover || item.product?.images?.[0] }}
                style={styles.itemImage}
                resizeMode="cover"
              />
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={2}>
                  {item.product?.name || 'Product'}
                </Text>
                {item.variant && (
                  <Text style={styles.itemVariant}>
                    {item.variant.attributes?.map(attr => attr.value).join(', ')}
                  </Text>
                )}
                <Text style={styles.itemPrice}>
                  GH₵ {(item.price || 0).toFixed(2)} × {item.quantity}
                </Text>
              </View>
              <Text style={styles.itemTotal}>
                GH₵ {((item.price || 0) * (item.quantity || 1)).toFixed(2)}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="wallet-outline" size={20} color={theme.colors.textPrimary} />
            <Text style={styles.sectionTitle}>Order Summary</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>
              GH₵ {(order.subtotal || 0).toFixed(2)}
            </Text>
          </View>
          {(order.shippingCost || order.shippingCost === 0) && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Shipping</Text>
              <Text style={styles.summaryValue}>
                {order.shippingCost > 0 ? `GH₵ ${order.shippingCost.toFixed(2)}` : 'Free'}
              </Text>
            </View>
          )}
          {order.tax > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax</Text>
              <Text style={styles.summaryValue}>
                GH₵ {(order.tax || 0).toFixed(2)}
              </Text>
            </View>
          )}
          {order.totalCovidLevy > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>COVID Levy</Text>
              <Text style={styles.summaryValue}>
                GH₵ {(order.totalCovidLevy || 0).toFixed(2)}
              </Text>
            </View>
          )}
          {order.discount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, styles.discountLabel]}>Discount</Text>
              <Text style={[styles.summaryValue, styles.discountValue]}>
                -GH₵ {(order.discount || 0).toFixed(2)}
              </Text>
            </View>
          )}
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>
              GH₵ {(order.totalPrice || order.totalAmount || order.total || 0).toFixed(2)}
            </Text>
          </View>
        </View>

        <View style={styles.actionSection}>

          {(order.status === 'processing' || order.status === 'shipped') && (
            <TouchableOpacity
              style={styles.trackButton}
              onPress={() => navigation.navigate('Tracking', { orderId: order._id })}
            >
              <LinearGradient
                colors={[theme.colors.primary, theme.colors.primary600 || theme.colors.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.trackButtonGradient}
              >
                <Ionicons name="car-outline" size={18} color={theme.colors.white} />
                <Text style={styles.trackButtonText}>Track Order</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.helpButton}
            onPress={() => {
              navigation.navigate('SupportChat', {
                orderId: order._id,
                orderNumber: order.orderNumber || order._id?.slice(-6),
                department: 'Orders & Delivery',
              });
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="help-circle-outline" size={18} color={theme.colors.primary} />
            <Text style={styles.helpButtonText}>Get Help with this Order</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
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
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  statusBanner: {
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
  },
  statusBannerText: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.white,
    textTransform: 'capitalize',
    marginBottom: theme.spacing.xs,
  },
  statusBannerSubtext: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.white,
    opacity: 0.9,
  },
  section: {
    backgroundColor: theme.colors.white,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  infoLabel: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
  },
  infoValue: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.textPrimary,
  },
  trackingNumber: {
    color: theme.colors.primary,
    textDecorationLine: 'underline',
  },
  addressName: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  addressText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  addressPhone: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.xs,
  },
  orderItem: {
    flexDirection: 'row',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.grey100,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.grey100,
  },
  itemInfo: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  itemName: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  itemVariant: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  itemPrice: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  itemTotal: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginLeft: theme.spacing.sm,
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
    color: theme.colors.textPrimary,
  },
  discountLabel: {
    color: theme.colors.success,
  },
  discountValue: {
    color: theme.colors.success,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.grey200,
    marginVertical: theme.spacing.md,
  },
  totalLabel: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  totalValue: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  actionSection: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
  },
  trackButton: {
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
  },
  trackButtonGradient: {
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  trackButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.white,
    marginLeft: theme.spacing.xs,
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  helpButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.primary,
  },
});

export default OrderDetailScreen;


