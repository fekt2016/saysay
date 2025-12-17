import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme';
import ProductCard from '../../components/ProductCard';
import EmptyState from '../../components/EmptyState';
import { useGetSellerProfile } from '../../hooks/useSeller';
import useProduct from '../../hooks/useProduct';
import { useToggleFollow, useGetSellersFollowers } from '../../hooks/useFollow';

const SellerScreen = ({ navigation }) => {
  const route = useRoute();
  const sellerId = route?.params?.sellerId || route?.params?.id;

  const { useGetAllPublicProductBySeller } = useProduct();

  const {
    data: sellerData,
    isLoading: isSellerLoading,
    error: sellerError,
  } = useGetSellerProfile(sellerId);

  const { toggleFollow, isFollowing, isLoading: isFollowLoading } = useToggleFollow(sellerId);
  const { data: followerData, isLoading: isFollowersLoading } = useGetSellersFollowers(sellerId);
  const { data: productsData, isLoading: isProductsLoading, error: productsError } = useGetAllPublicProductBySeller(sellerId);

  const seller = useMemo(() => {
    return sellerData?.data?.data?.data || sellerData?.data?.seller || sellerData?.seller || sellerData?.data?.data || {};
  }, [sellerData]);

  const products = useMemo(() => {
    if (!productsData) {
      return [];
    }
    if (Array.isArray(productsData)) {
      return productsData;
    }

    if (productsData.data?.products && Array.isArray(productsData.data.products)) {
      return productsData.data.products;
    }
    if (productsData.products && Array.isArray(productsData.products)) {
      return productsData.products;
    }
    return [];
  }, [productsData, productsError, sellerId]);

  const followers = useMemo(() => {
    return followerData?.data?.follows || [];
  }, [followerData]);

  const rating = seller?.ratings?.average || seller?.rating || seller?.averageRating || 0;
  const reviewsCount = seller?.ratings?.count || seller?.reviewsCount || 0;
  const productsCount = products.length || seller?.productsCount || 0;
  const followersCount = followers.length || seller?.followersCount || seller?.followers || 0;
  const avatarUri = seller?.avatar || seller?.image || seller?.logo;

  const handleProductPress = (product) => {
    navigation.navigate('ProductDetail', {
      productId: product._id || product.id,
      id: product._id || product.id,
    });
  };

  const handleFollowPress = () => {
    toggleFollow();
  };

  const renderProduct = ({ item, index }) => (
    <View style={[styles.productItem, index % 2 === 0 && styles.productItemLeft]}>
      <ProductCard
        product={item}
        onPress={() => handleProductPress(item)}
        style={styles.productCard}
      />
    </View>
  );

  if (isSellerLoading || isProductsLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading seller profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!seller || sellerError) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>😔</Text>
          <Text style={styles.errorTitle}>Seller not found</Text>
          <Text style={styles.errorText}>
            This seller might have moved or the link might be incorrect.
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>

        <LinearGradient
          colors={[theme.colors.primary, theme.colors.primary600]}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {(seller?.name || seller?.shopName || 'S').charAt(0).toUpperCase()}
                </Text>
              </View>
            )}

            <View style={styles.sellerInfo}>
              <Text style={styles.sellerName}>{seller?.name || seller?.shopName || 'Seller'}</Text>

              <View style={styles.ratingContainer}>
                <Text style={styles.star}>⭐</Text>
                <Text style={styles.rating}>{rating.toFixed(1)}</Text>
                <Text style={styles.ratingCount}>({reviewsCount} reviews)</Text>
              </View>

              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{followersCount}</Text>
                  <Text style={styles.statLabel}>Followers</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{productsCount}</Text>
                  <Text style={styles.statLabel}>Products</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{reviewsCount}</Text>
                  <Text style={styles.statLabel}>Reviews</Text>
                </View>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.followButton, isFollowing && styles.followingButton]}
            onPress={handleFollowPress}
            disabled={isFollowLoading}
            activeOpacity={0.7}
          >
            {isFollowLoading ? (
              <ActivityIndicator size="small" color={isFollowing ? theme.colors.text : theme.colors.white} />
            ) : (
              <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
                {isFollowLoading ? 'Processing...' : isFollowing ? 'Following' : 'Follow'}
              </Text>
            )}
          </TouchableOpacity>
        </LinearGradient>

        <View style={styles.productsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Products</Text>
            <Text style={styles.sectionSubtitle}>{productsData?.data?.total || products.length} items</Text>
          </View>

          {isProductsLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : products.length === 0 ? (
            <EmptyState
              icon="🛍️"
              title="No products yet"
              message="This shop hasn't listed any products for sale."
            />
          ) : (
            <FlatList
              data={products}
              renderItem={renderProduct}
              keyExtractor={(item) => item._id || item.id}
              numColumns={2}
              scrollEnabled={false}
              contentContainerStyle={styles.productsList}
            />
          )}
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
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.textSecondary,
  },
  header: {
    padding: theme.spacing.xl,
    paddingTop: theme.spacing['2xl'],
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.white,
    marginRight: theme.spacing.md,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  avatarText: {
    fontSize: theme.typography.fontSize['3xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.white,
  },
  sellerInfo: {
    flex: 1,
  },
  sellerName: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.white,
    marginBottom: theme.spacing.xs,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  star: {
    fontSize: 16,
    marginRight: 4,
  },
  rating: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.white,
    marginRight: theme.spacing.xs,
  },
  ratingCount: {
    fontSize: theme.typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
  },
  statItem: {
    alignItems: 'flex-start',
  },
  statValue: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.white,
  },
  statLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  followButton: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.full || 25,
    backgroundColor: theme.colors.white,
    alignItems: 'center',
  },
  followingButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  followButtonText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.primary,
  },
  followingButtonText: {
    color: theme.colors.white,
  },
  productsSection: {
    padding: theme.spacing.md,
  },
  sectionHeader: {
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  sectionSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  productItem: {
    flex: 1,
    paddingHorizontal: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  productItemLeft: {
    paddingRight: theme.spacing.sm,
  },
  productCard: {
    margin: 0,
  },
  productsList: {
    paddingBottom: theme.spacing.xl,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  errorIcon: {
    fontSize: 60,
    marginBottom: theme.spacing.md,
  },
  errorTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  errorText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  backButton: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md || 8,
  },
  backButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.white,
  },
});

export default SellerScreen;


