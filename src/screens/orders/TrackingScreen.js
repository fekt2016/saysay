import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  StyleSheet,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useGetOrderById } from '../../hooks/useOrder';
import { orderService } from '../../services/orderApi';
import { theme } from '../../theme';

const TrackingScreen = ({ route, navigation }) => {
  const { orderId, trackingNumber } = route.params || {};
  const { user, isAuthenticated } = useAuth();
  const [orderData, setOrderData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const { data: orderByIdData, isLoading: isLoadingById } = useGetOrderById(
    trackingNumber ? null : orderId
  );

  useEffect(() => {
    const fetchByTrackingNumber = async () => {
      if (!trackingNumber) return;

      try {
        setIsLoading(true);
        setError(null);
        const response = await orderService.getOrderByTrackingNumber(trackingNumber);
        const order = response?.data?.order || response?.order || response?.data;
        setOrderData(order);
      } catch (err) {
        console.error('[TrackingScreen] Error fetching order by tracking number:', err);
        setError(err.response?.data?.message || err.message || 'Failed to load tracking information');
      } finally {
        setIsLoading(false);
      }
    };

    fetchByTrackingNumber();
  }, [trackingNumber]);

  useEffect(() => {
    if (orderByIdData && !trackingNumber && orderId) {
      const order = orderByIdData?.data?.order || orderByIdData?.order || orderByIdData?.data || orderByIdData;
      setOrderData(order);
      setIsLoading(false);
    }
  }, [orderByIdData, trackingNumber, orderId]);

  useEffect(() => {
    if (orderId && !trackingNumber) {
      setIsLoading(isLoadingById);
    }
  }, [isLoadingById, orderId, trackingNumber]);

  const order = useMemo(() => {
    if (!orderData) return null;
    return orderData?.data?.order || orderData?.order || orderData?.data || orderData;
  }, [orderData]);

  const getStatusIcon = (status, iconType) => {
    if (iconType === 'order') return 'cube-outline';
    if (iconType === 'payment') return 'card-outline';
    if (iconType === 'processing') return 'cube-outline';
    if (iconType === 'preparing') return 'cube-outline';
    if (iconType === 'rider') return 'car-outline';
    if (iconType === 'delivery') return 'car-outline';
    if (iconType === 'delivered') return 'checkmark-circle';

    switch (status) {
      case 'pending_payment':
        return 'time-outline';
      case 'payment_completed':
        return 'card-outline';
      case 'processing':
      case 'confirmed':
      case 'preparing':
        return 'cube-outline';
      case 'ready_for_dispatch':
      case 'out_for_delivery':
        return 'car-outline';
      case 'delivered':
        return 'checkmark-circle';
      case 'cancelled':
      case 'refunded':
        return 'close-circle';
      default:
        return 'time-outline';
    }
  };

  const getStepColor = (step) => {
    if (step.isCompleted) {
      return theme.colors.primary || '#F7C948';
    } else if (step.isActive) {
      return theme.colors.info || '#2D7FF9';
    } else {
      return theme.colors.grey300 || '#D1D5DB';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatStatusLabel = (status) => {
    return status
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const trackingHistory = order?.trackingHistory || [];
  const currentStatus = order?.currentStatus || order?.status || 'pending_payment';
  const orderItems = order?.orderItems || order?.items || [];
  const paymentStatus = order?.paymentStatus || 'pending';

  const ALL_TRACKING_STEPS = [
    { status: 'pending_payment', label: 'Order Placed', icon: 'order' },
    { status: 'payment_completed', label: 'Payment Completed', icon: 'payment' },
    { status: 'processing', label: 'Processing Order', icon: 'processing' },
    { status: 'preparing', label: 'Preparing for Dispatch', icon: 'preparing' },
    { status: 'ready_for_dispatch', label: 'Rider Assigned', icon: 'rider' },
    { status: 'out_for_delivery', label: 'Out for Delivery', icon: 'delivery' },
    { status: 'delivered', label: 'Delivered', icon: 'delivered' },
  ];

  const getActiveStepIndex = () => {
    if ((paymentStatus === 'paid' || paymentStatus === 'completed') && currentStatus === 'pending_payment') {
      return 1; 
    }

    const statusToIndex = {
      pending_payment: 0,
      payment_completed: 1,
      processing: 2,
      confirmed: 2,
      preparing: 3,
      ready_for_dispatch: 4,
      out_for_delivery: 5,
      delivered: 6,
    };
    return statusToIndex[currentStatus] ?? 0;
  };

  const activeStepIndex = getActiveStepIndex();

  const buildCompleteTimeline = () => {
    return ALL_TRACKING_STEPS.map((step, index) => {
      let historyEntry = trackingHistory.find((entry) => entry.status === step.status);

      if (step.status === 'payment_completed' && (paymentStatus === 'paid' || paymentStatus === 'completed') && !historyEntry) {
        historyEntry = {
          status: 'payment_completed',
          message: 'Your payment has been confirmed.',
          timestamp: order?.paidAt || order?.createdAt,
        };
      }

      const isCompleted = index < activeStepIndex;
      const isActive = index === activeStepIndex;
      const isPending = index > activeStepIndex;

      return {
        ...step,
        historyEntry,
        isCompleted,
        isActive,
        isPending,
        stepIndex: index,
      };
    });
  };

  const completeTimeline = buildCompleteTimeline();

  const getEstimatedDelivery = () => {
    if (order?.deliveryEstimate) {
      if (
        order.deliveryEstimate.includes('Today') ||
        order.deliveryEstimate.includes('Business Day') ||
        order.deliveryEstimate.includes('Arrives')
      ) {
        return order.deliveryEstimate;
      }

      const days = parseInt(order.deliveryEstimate);
      if (!isNaN(days) && order.createdAt) {
        const orderDate = new Date(order.createdAt);
        const estimatedDate = new Date(orderDate);
        estimatedDate.setDate(estimatedDate.getDate() + days);

        return estimatedDate.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      }

      return order.deliveryEstimate;
    }

    if (order?.createdAt) {
      const orderDate = new Date(order.createdAt);
      const estimatedDate = new Date(orderDate);

      if (order?.shippingType === 'same_day') {
        return 'Arrives Today';
      } else if (order?.shippingType === 'express') {
        estimatedDate.setDate(estimatedDate.getDate() + 1);
        return estimatedDate.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      } else {
        estimatedDate.setDate(estimatedDate.getDate() + 3);
        return estimatedDate.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      }
    }

    return null;
  };

  const estimatedDelivery = getEstimatedDelivery();
  const activeStep = completeTimeline.find((s) => s.isActive) || completeTimeline[0];
  const stepColor = getStepColor(activeStep);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Tracking</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading tracking information...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !order) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Tracking</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Tracking Not Found</Text>
          <Text style={styles.errorText}>
            {error || 'Order not found with this tracking number'}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Tracking</Text>
        <TouchableOpacity
          style={styles.userAvatar}
          onPress={() => {
            if (isAuthenticated) {
              navigation.navigate('AccountTab', { screen: 'Account' });
            } else {
              navigation.navigate('Auth', { screen: 'Login' });
            }
          }}
          activeOpacity={0.7}
        >
          {isAuthenticated && (user?.profilePicture || user?.avatar || user?.photo) ? (
            <Image
              source={{ uri: user.profilePicture || user.avatar || user.photo }}
              style={styles.userAvatarImage}
              resizeMode="cover"
            />
          ) : isAuthenticated && user ? (
            <View style={styles.userAvatarPlaceholder}>
              <Text style={styles.userAvatarText}>
                {(user?.name || user?.firstName || user?.email || 'U').charAt(0).toUpperCase()}
              </Text>
            </View>
          ) : (
            <View style={styles.userAvatarIcon}>
              <Ionicons name="person-outline" size={18} color={theme.colors.textSecondary} />
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        <View style={styles.trackingHeader}>
          {order.trackingNumber && (
            <View style={styles.trackingHeaderRow}>
              <Text style={styles.trackingHeaderLabel}>Tracking Number:</Text>
              <Text style={styles.trackingHeaderValue}>{order.trackingNumber}</Text>
            </View>
          )}
          <View style={styles.trackingHeaderRow}>
            <Text style={styles.trackingHeaderLabel}>Order Number:</Text>
            <Text style={styles.trackingHeaderValue}>{order.orderNumber || order._id?.slice(-6)}</Text>
          </View>
          {order.createdAt && (
            <View style={styles.trackingHeaderRow}>
              <View style={styles.trackingHeaderLabelRow}>
                <Ionicons name="calendar-outline" size={14} color={theme.colors.textSecondary} />
                <Text style={styles.trackingHeaderLabel}>Order Placed:</Text>
              </View>
              <Text style={styles.trackingHeaderValue}>{formatDate(order.createdAt)}</Text>
            </View>
          )}
          {estimatedDelivery && (
            <View style={styles.estimatedDeliveryBanner}>
              <Ionicons name="calendar-outline" size={18} color={theme.colors.info} style={styles.estimatedDeliveryIcon} />
              <Text style={styles.estimatedDeliveryText}>
                Expected Delivery: <Text style={styles.estimatedDeliveryValue}>{estimatedDelivery}</Text>
              </Text>
            </View>
          )}
        </View>

        <View style={styles.currentStatusSection}>
          <Text style={styles.statusLabel}>Current Status</Text>
          <View style={[styles.statusBadge, { backgroundColor: stepColor + '15' }]}>
            <Ionicons 
              name={getStatusIcon(currentStatus, activeStep.icon)} 
              size={24} 
              color={stepColor} 
              style={styles.statusIcon}
            />
            <Text style={[styles.statusBadgeText, { color: stepColor }]}>
              {formatStatusLabel(currentStatus)}
            </Text>
          </View>
        </View>

        {estimatedDelivery && (
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.deliveryEstimateCard}
          >
            <View style={styles.deliveryEstimateLabelRow}>
              <Ionicons name="calendar-outline" size={16} color={theme.colors.white} />
              <Text style={styles.deliveryEstimateLabel}>Estimated Delivery Date</Text>
            </View>
            <Text style={styles.deliveryEstimateValue}>{estimatedDelivery}</Text>
          </LinearGradient>
        )}

        <View style={styles.timelineSection}>
          <Text style={styles.timelineTitle}>Tracking History</Text>
          <View style={styles.timeline}>
            {completeTimeline.map((step, index) => {
              const isLast = index === completeTimeline.length - 1;
              const stepColor = getStepColor(step);
              const stepBgColor = step.isCompleted || step.isActive ? stepColor : theme.colors.grey300;

            return (
                <View key={step.status} style={styles.timelineItem}>
                <View style={styles.timelineLeft}>
                  <View
                    style={[
                      styles.timelineIcon,
                        {
                          backgroundColor: stepBgColor,
                          borderColor: stepColor,
                        },
                      ]}
                    >
                      <Ionicons 
                        name={getStatusIcon(step.status, step.icon)} 
                        size={18} 
                        color={step.isCompleted || step.isActive ? theme.colors.white : theme.colors.grey500}
                      />
                  </View>
                  {!isLast && (
                    <View
                      style={[
                        styles.timelineLine,
                          {
                            backgroundColor: step.isCompleted ? stepColor : theme.colors.grey200,
                          },
                      ]}
                    />
                  )}
                </View>
                <View style={styles.timelineContent}>
                    <View style={styles.timelineStatusRow}>
                      {step.isCompleted && (
                        <Text style={[styles.timelineCheckmark, { color: stepColor }]}>✓</Text>
                      )}
                      <Text style={[styles.timelineStatus, { color: stepColor }]}>
                        {step.label}
                  </Text>
                    </View>
                    {step.historyEntry?.message && (
                      <Text style={styles.timelineMessage}>{step.historyEntry.message}</Text>
                    )}
                    {step.historyEntry?.timestamp && (
                      <Text style={styles.timelineDate}>{formatDate(step.historyEntry.timestamp)}</Text>
                    )}
                    {step.historyEntry?.location && (
                      <View style={styles.timelineLocation}>
                        <Ionicons name="location-outline" size={14} color={theme.colors.textSecondary} />
                        <Text style={styles.timelineLocationText}>{step.historyEntry.location}</Text>
                      </View>
                  )}
                  {step.historyEntry?.updatedBy && (
                    <View style={styles.timelineUpdatedBy}>
                      <Ionicons name="person-outline" size={12} color={theme.colors.textSecondary} />
                      <Text style={styles.timelineUpdatedByText}>
                        Updated by: {step.historyEntry.updatedBy?.name || step.historyEntry.updatedBy?.email || 'System'}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
          </View>
        </View>

        {order.shippingAddress && (
          <View style={styles.shippingSection}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="location-outline" size={18} color={theme.colors.textPrimary} />
              <Text style={styles.sectionTitle}>Shipping Address</Text>
            </View>
            {order.shippingAddress.fullName && (
              <View style={styles.addressRow}>
                <Text style={styles.addressLabel}>Full Name</Text>
                <Text style={styles.addressValue}>{order.shippingAddress.fullName}</Text>
              </View>
            )}
            {order.shippingAddress.streetAddress && (
              <View style={styles.addressRow}>
                <Text style={styles.addressLabel}>Street Address</Text>
                <Text style={styles.addressValue}>{order.shippingAddress.streetAddress}</Text>
              </View>
            )}
            {order.shippingAddress.area && (
              <View style={styles.addressRow}>
                <Text style={styles.addressLabel}>Area/Neighborhood</Text>
                <Text style={styles.addressValue}>{order.shippingAddress.area}</Text>
              </View>
            )}
            {order.shippingAddress.landmark && (
              <View style={styles.addressRow}>
                <Text style={styles.addressLabel}>Landmark</Text>
                <Text style={styles.addressValue}>{order.shippingAddress.landmark}</Text>
              </View>
            )}
            {(order.shippingAddress.city || order.shippingAddress.state) && (
              <View style={styles.addressRow}>
                <Text style={styles.addressLabel}>City/State</Text>
                <Text style={styles.addressValue}>
                  {order.shippingAddress.city
                    ? order.shippingAddress.city.charAt(0).toUpperCase() + order.shippingAddress.city.slice(1)
                    : ''}
                  {order.shippingAddress.city && order.shippingAddress.state ? ', ' : ''}
                  {order.shippingAddress.state
                    ? order.shippingAddress.state.charAt(0).toUpperCase() + order.shippingAddress.state.slice(1)
                    : ''}
                </Text>
              </View>
            )}
            {order.shippingAddress.region && (
              <View style={styles.addressRow}>
                <Text style={styles.addressLabel}>Region</Text>
                <Text style={styles.addressValue}>
                  {order.shippingAddress.region
                    .split(' ')
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ')}
                </Text>
              </View>
            )}
            {(order.shippingAddress.digitalAddress || order.shippingAddress.digitalAdress) && (
              <View style={styles.addressRow}>
                <Text style={styles.addressLabel}>Digital Address</Text>
                <Text style={styles.addressValue}>
                  {order.shippingAddress.digitalAddress || order.shippingAddress.digitalAdress}
                </Text>
              </View>
            )}
            {order.shippingAddress.contactPhone && (
              <View style={styles.addressRow}>
                <Text style={styles.addressLabel}>Contact Phone</Text>
                <Text style={styles.addressValue}>{order.shippingAddress.contactPhone}</Text>
              </View>
            )}
            {order.shippingAddress.country && (
              <View style={styles.addressRow}>
                <Text style={styles.addressLabel}>Country</Text>
                <Text style={styles.addressValue}>{order.shippingAddress.country}</Text>
              </View>
            )}
            {order.shippingAddress.additionalInformation && (
              <View style={[styles.addressRow, styles.addressRowFull]}>
                <Text style={styles.addressLabel}>Additional Information</Text>
                <Text style={styles.addressValue}>{order.shippingAddress.additionalInformation}</Text>
              </View>
            )}
          </View>
        )}

        {orderItems.length > 0 && (
          <View style={styles.orderItemsSection}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="cube-outline" size={18} color={theme.colors.textPrimary} />
              <Text style={styles.sectionTitle}>Order Items</Text>
            </View>
            {orderItems.map((item, index) => {
              const uniqueKey = item._id || item.id || `${item.product?._id || item.product?.id || 'item'}-${index}`;
              return (
                <View key={uniqueKey} style={styles.orderItemCard}>
                  {item.product?.imageCover && (
                    <Image
                      source={{ uri: item.product.imageCover }}
                      style={styles.orderItemImage}
                      resizeMode="cover"
                    />
                  )}
                  <View style={styles.orderItemInfo}>
                    <Text style={styles.orderItemName}>{item.product?.name || 'Product'}</Text>
                    <View style={styles.orderItemDetails}>
                      <Text style={styles.orderItemQuantity}>Qty: {item.quantity || 1}</Text>
                      <Text style={styles.orderItemPrice}>
                        GH₵{((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.summarySection}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="receipt-outline" size={18} color={theme.colors.textPrimary} />
            <Text style={styles.sectionTitle}>Order Summary</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>GH₵{(order.subtotal || 0).toFixed(2)}</Text>
          </View>
          {(order.shippingCost || order.shippingCost === 0) && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Shipping</Text>
              <Text style={styles.summaryValue}>
                {order.shippingCost > 0 ? `GH₵${order.shippingCost.toFixed(2)}` : 'Free'}
              </Text>
            </View>
          )}
          {order.tax > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax</Text>
              <Text style={styles.summaryValue}>GH₵{(order.tax || 0).toFixed(2)}</Text>
            </View>
          )}
          {order.totalCovidLevy > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>COVID Levy</Text>
              <Text style={styles.summaryValue}>GH₵{(order.totalCovidLevy || 0).toFixed(2)}</Text>
            </View>
          )}
          {order.discount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, styles.discountLabel]}>Discount</Text>
              <Text style={[styles.summaryValue, styles.discountValue]}>
                -GH₵{(order.discount || 0).toFixed(2)}
              </Text>
            </View>
          )}
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryTotalLabel}>Total</Text>
            <Text style={styles.summaryTotalValue}>
              GH₵{(order.totalPrice || order.totalAmount || order.total || 0).toFixed(2)}
            </Text>
          </View>
        </View>

        <View style={styles.paymentSection}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="card-outline" size={18} color={theme.colors.textPrimary} />
            <Text style={styles.sectionTitle}>Payment Information</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Payment Method</Text>
            <Text style={styles.infoValue}>
              {order.paymentMethod === 'payment_on_delivery'
                ? 'Cash on Delivery'
                : order.paymentMethod === 'mobile_money'
                ? 'Mobile Money'
                : order.paymentMethod === 'credit_balance'
                ? 'Account Balance'
                : order.paymentMethod === 'bank_transfer'
                ? 'Bank Transfer'
                : order.paymentMethod === 'card'
                ? 'Card Payment'
                : order.paymentMethod
                ? order.paymentMethod
                    .split('_')
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ')
                : 'N/A'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Payment Status</Text>
            <View
              style={[
                styles.paymentBadge,
                {
                  backgroundColor:
                    order.paymentStatus === 'paid' || order.paymentStatus === 'completed'
                      ? theme.colors.success + '20'
                      : theme.colors.warning + '20',
                },
              ]}
            >
              <Text
                style={[
                  styles.paymentBadgeText,
                  {
                    color:
                      order.paymentStatus === 'paid' || order.paymentStatus === 'completed'
                        ? theme.colors.success
                        : theme.colors.warning,
                  },
                ]}
              >
                {order.paymentStatus === 'paid' || order.paymentStatus === 'completed' ? 'Paid' : 'Pending'}
              </Text>
            </View>
          </View>
          {order.paidAt && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Paid On</Text>
              <Text style={styles.infoValue}>{formatDate(order.paidAt)}</Text>
            </View>
          )}
        </View>

        {(order.deliveryMethod || order.deliveryEstimate) && (
          <View style={styles.deliveryInfoSection}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="car-outline" size={18} color={theme.colors.textPrimary} />
              <Text style={styles.sectionTitle}>Delivery Information</Text>
            </View>
            {order.deliveryMethod && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Delivery Method</Text>
                <Text style={styles.infoValue}>
                  {order.deliveryMethod === 'pickup_center'
                    ? 'Pickup from EazShop Center'
                    : order.deliveryMethod === 'dispatch'
                    ? 'EazShop Dispatch Rider'
                    : order.deliveryMethod === 'seller_delivery'
                    ? "Seller's Own Delivery"
                    : order.deliveryMethod
                        .split('_')
                        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ')}
                </Text>
              </View>
            )}
            {estimatedDelivery && (
              <View style={styles.infoRow}>
                <View style={styles.infoLabelRow}>
                  <Ionicons name="calendar-outline" size={14} color={theme.colors.textSecondary} />
                  <Text style={styles.infoLabel}>Estimated Delivery Date</Text>
                </View>
                <Text style={styles.infoValue}>{estimatedDelivery}</Text>
              </View>
            )}
            {order.deliveryZone && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Delivery Zone</Text>
                <Text style={styles.infoValue}>
                  Zone {order.deliveryZone}
                  {order.deliveryZone === 'A' && ' (Same City)'}
                  {order.deliveryZone === 'B' && ' (Nearby City)'}
                  {order.deliveryZone === 'C' && ' (Nationwide)'}
                </Text>
              </View>
            )}
            {order.deliveryMethod === 'pickup_center' && order.pickupCenter && (
              <>
                <View style={styles.infoRow}>
                  <View style={styles.infoLabelRow}>
                    <Ionicons name="location-outline" size={14} color={theme.colors.textSecondary} />
                    <Text style={styles.infoLabel}>Pickup Center</Text>
                  </View>
                  <Text style={styles.infoValue}>
                    {order.pickupCenter.pickupName || 'EazShop Pickup Center'}
                  </Text>
                </View>
                {order.pickupCenter.address && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Address</Text>
                    <Text style={styles.infoValue}>{order.pickupCenter.address}</Text>
                  </View>
                )}
                {(order.pickupCenter.city || order.pickupCenter.area) && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Location</Text>
                    <Text style={styles.infoValue}>
                      {order.pickupCenter.area && order.pickupCenter.area}
                      {order.pickupCenter.area && order.pickupCenter.city && ', '}
                      {order.pickupCenter.city &&
                        order.pickupCenter.city.charAt(0).toUpperCase() + order.pickupCenter.city.slice(1)}
                    </Text>
                  </View>
                )}
                {order.pickupCenter.openingHours && (
                  <View style={styles.infoRow}>
                    <View style={styles.infoLabelRow}>
                      <Ionicons name="time-outline" size={14} color={theme.colors.textSecondary} />
                      <Text style={styles.infoLabel}>Opening Hours</Text>
                    </View>
                    <Text style={styles.infoValue}>{order.pickupCenter.openingHours}</Text>
                  </View>
                )}
                {order.pickupCenter.instructions && (
                  <View style={[styles.infoRow, styles.infoRowFull]}>
                    <Text style={styles.infoLabel}>Pickup Instructions</Text>
                    <Text style={[styles.infoValue, styles.pickupInstructions]}>
                      {order.pickupCenter.instructions}
                    </Text>
                  </View>
                )}
                {order.pickupCenter.googleMapLink && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Map</Text>
                    <TouchableOpacity
                      onPress={() => {
                        if (order.pickupCenter.googleMapLink) {
                          Linking.openURL(order.pickupCenter.googleMapLink);
                        }
                      }}
                      activeOpacity={0.7}
                      style={styles.mapLinkContainer}
                    >
                      <Ionicons name="map-outline" size={14} color={theme.colors.info} />
                      <Text style={styles.mapLink}>View on Google Maps</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.grey200,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: theme.colors.textPrimary,
  },
  headerTitle: {
    flex: 1,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.grey100,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.grey200,
  },
  userAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: theme.borderRadius.full,
  },
  userAvatarPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
  },
  userAvatarText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.white,
  },
  userAvatarIcon: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userIcon: {
    fontSize: 18,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
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
    borderRadius: theme.borderRadius.md,
  },
  retryButtonText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semiBold,
  },
  trackingHeader: {
    backgroundColor: theme.colors.white,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.grey200,
  },
  trackingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  trackingHeaderLabel: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
    marginRight: theme.spacing.sm,
  },
  trackingHeaderLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginRight: theme.spacing.sm,
  },
  trackingHeaderValue: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    flex: 1,
    textAlign: 'right',
  },
  estimatedDeliveryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.info + '15',
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.info,
    borderRadius: theme.borderRadius.sm,
    marginTop: theme.spacing.sm,
  },
  estimatedDeliveryIcon: {
    fontSize: 18,
    marginRight: theme.spacing.sm,
  },
  estimatedDeliveryText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textPrimary,
  },
  estimatedDeliveryValue: {
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.info,
  },
  currentStatusSection: {
    backgroundColor: theme.colors.white,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  statusLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
    fontWeight: theme.typography.fontWeight.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignSelf: 'flex-start',
  },
  statusIcon: {
    marginRight: theme.spacing.sm,
  },
  statusBadgeText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semiBold,
  },
  deliveryEstimateCard: {
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  deliveryEstimateLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  deliveryEstimateLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.white,
    opacity: 0.9,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  deliveryEstimateValue: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.white,
  },
  estimatedDeliveryIcon: {
    marginRight: theme.spacing.xs,
  },
  timelineSection: {
    backgroundColor: theme.colors.white,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  timelineTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.lg,
  },
  timeline: {
    paddingLeft: theme.spacing.xl,
  },
  timelineItem: {
    flexDirection: 'row',
    paddingBottom: theme.spacing.xl,
    position: 'relative',
  },
  timelineLeft: {
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  timelineIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    zIndex: 1,
  },
  timelineLine: {
    position: 'absolute',
    left: 19,
    top: 40,
    width: 2,
    height: '100%',
    zIndex: 0,
  },
  timelineContent: {
    flex: 1,
    paddingTop: theme.spacing.xs,
  },
  timelineStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  timelineCheckmark: {
    fontSize: theme.typography.fontSize.base,
    marginRight: theme.spacing.xs,
    fontWeight: theme.typography.fontWeight.bold,
  },
  timelineStatus: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semiBold,
  },
  timelineMessage: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
    lineHeight: 20,
  },
  timelineDate: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  timelineLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.xs,
  },
  timelineLocationIcon: {
    fontSize: 14,
    marginRight: theme.spacing.xs,
  },
  timelineLocationText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  shippingSection: {
    backgroundColor: theme.colors.white,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.lg,
  },
  sectionIcon: {
    marginRight: theme.spacing.xs,
  },
  addressRow: {
    marginBottom: theme.spacing.md,
  },
  addressRowFull: {
    marginBottom: theme.spacing.md,
  },
  addressLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.fontWeight.semiBold,
    marginBottom: theme.spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addressValue: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textPrimary,
    fontWeight: theme.typography.fontWeight.medium,
    lineHeight: 20,
  },
  orderItemsSection: {
    backgroundColor: theme.colors.white,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  orderItemCard: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.grey50,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
  },
  orderItemImage: {
    width: 60,
    height: 60,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.grey200,
  },
  orderItemInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  orderItemName: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
    lineHeight: 20,
  },
  orderItemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderItemQuantity: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  orderItemPrice: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.textPrimary,
  },
  summarySection: {
    backgroundColor: theme.colors.white,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
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
  summaryDivider: {
    height: 1,
    backgroundColor: theme.colors.grey200,
    marginVertical: theme.spacing.md,
  },
  summaryTotalLabel: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  summaryTotalValue: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  discountLabel: {
    color: theme.colors.success,
  },
  discountValue: {
    color: theme.colors.success,
  },
  paymentSection: {
    backgroundColor: theme.colors.white,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  infoRow: {
    marginBottom: theme.spacing.md,
  },
  infoRowFull: {
    marginBottom: theme.spacing.md,
  },
  infoLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.fontWeight.semiBold,
    marginBottom: theme.spacing.xs,
  },
  infoIcon: {
    marginRight: theme.spacing.xs,
  },
  infoValue: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textPrimary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  paymentBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
  },
  paymentBadgeText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semiBold,
  },
  deliveryInfoSection: {
    backgroundColor: theme.colors.white,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  pickupInstructions: {
    fontSize: theme.typography.fontSize.sm,
    lineHeight: 20,
    color: theme.colors.textSecondary,
  },
  mapLink: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.info,
    fontWeight: theme.typography.fontWeight.medium,
  },
  mapLinkIcon: {
    marginRight: theme.spacing.xs,
  },
});

export default TrackingScreen;


