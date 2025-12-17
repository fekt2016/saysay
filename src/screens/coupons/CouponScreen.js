import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../theme';
import EmptyState from '../../components/EmptyState';
import SectionHeader from '../../components/SectionHeader';
import { useCoupons, useApplyCoupon } from '../../hooks/useCoupons';

const CouponScreen = ({ navigation }) => {
  const { data: couponsData, isLoading } = useCoupons();
  const applyCoupon = useApplyCoupon();

  const coupons = couponsData?.data?.coupons || couponsData?.data || [];

  const handleApplyCoupon = (coupon) => {
    Alert.alert(
      'Apply Coupon',
      `Apply coupon "${coupon.code}" with ${coupon.discount}% discount?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Apply',
          onPress: () => {
            applyCoupon.mutate(coupon.code, {
              onSuccess: () => {
                Alert.alert('Success', 'Coupon applied successfully!');
                navigation.navigate('Cart');
              },
              onError: (error) => {
                Alert.alert('Error', error.message || 'Failed to apply coupon');
              },
            });
          },
        },
      ]
    );
  };

  const renderCouponItem = ({ item }) => {
    const coupon = item;
    const isExpired = coupon.expiresAt && new Date(coupon.expiresAt) < new Date();
    const isUsed = coupon.used || false;

    return (
      <View style={[styles.couponCard, (isExpired || isUsed) && styles.couponCardDisabled]}>
        <View style={styles.couponContent}>
          <View style={styles.couponHeader}>
            <Text style={styles.couponCode}>{coupon.code}</Text>
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>
                {coupon.discountType === 'percentage' ? `${coupon.discount}%` : `₵${coupon.discount}`}
              </Text>
            </View>
          </View>

          <Text style={styles.couponTitle}>{coupon.title || 'Discount Coupon'}</Text>

          {coupon.description && (
            <Text style={styles.couponDescription}>{coupon.description}</Text>
          )}

          <View style={styles.couponFooter}>
            {coupon.expiresAt && (
              <Text style={styles.expiryText}>
                Expires: {new Date(coupon.expiresAt).toLocaleDateString()}
              </Text>
            )}
            {coupon.minPurchase && (
              <Text style={styles.minPurchaseText}>
                Min. purchase: ₵{coupon.minPurchase}
              </Text>
            )}
          </View>

          {isExpired && (
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>Expired</Text>
            </View>
          )}
          {isUsed && !isExpired && (
            <View style={[styles.statusBadge, styles.usedBadge]}>
              <Text style={styles.statusText}>Used</Text>
            </View>
          )}
        </View>

        {!isExpired && !isUsed && (
          <TouchableOpacity
            style={styles.applyButton}
            onPress={() => handleApplyCoupon(coupon)}
            disabled={applyCoupon.isPending}
            activeOpacity={0.7}
          >
            {applyCoupon.isPending ? (
              <ActivityIndicator size="small" color={theme.colors.white} />
            ) : (
              <Text style={styles.applyButtonText}>Apply</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <SectionHeader
        title="My Coupons"
        subtitle={`${coupons.length} available coupons`}
      />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : coupons.length === 0 ? (
        <EmptyState
          icon="🎫"
          title="No coupons available"
          message="You don't have any coupons yet. Check back later for new offers!"
        />
      ) : (
        <FlatList
          data={coupons}
          renderItem={renderCouponItem}
          keyExtractor={(item) => item._id || item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
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
  listContent: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  couponCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md || 12,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderStyle: 'dashed',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  couponCardDisabled: {
    borderColor: theme.colors.grey300,
    opacity: 0.6,
  },
  couponContent: {
    marginBottom: theme.spacing.sm,
  },
  couponHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  couponCode: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
    letterSpacing: 1,
  },
  discountBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full || 20,
  },
  discountText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.white,
  },
  couponTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  couponDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
    lineHeight: theme.typography.fontSize.sm * theme.typography.lineHeight.normal,
  },
  couponFooter: {
    gap: theme.spacing.xs,
  },
  expiryText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  minPurchaseText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  statusBadge: {
    position: 'absolute',
    top: theme.spacing.md,
    right: theme.spacing.md,
    backgroundColor: theme.colors.error,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm || 6,
  },
  usedBadge: {
    backgroundColor: theme.colors.grey500,
  },
  statusText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.white,
  },
  applyButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md || 8,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.white,
  },
});

export default CouponScreen;


