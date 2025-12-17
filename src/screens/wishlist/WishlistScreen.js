import React, { useState, useMemo, useLayoutEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

import { useGetWishlist, useWishlistActions } from '../../hooks/useWishlist';

import ProductCard from '../../components/ProductCard';
import LogoIcon from '../../components/header/LogoIcon';
import HeaderSearchInput from '../../components/header/HeaderSearchInput';
import HeaderAvatar from '../../components/header/HeaderAvatar';

import { theme } from '../../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const WishlistScreen = () => {
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);

  const { data: wishlistData, isLoading, refetch } = useGetWishlist();
  const { removeFromWishlist, isRemoving } = useWishlistActions();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => <LogoIcon />,
      headerTitle: () => <HeaderSearchInput />,
      headerRight: () => <HeaderAvatar />,
    });
  }, [navigation]);

  const wishlistItems = useMemo(() => {
    if (!wishlistData) return [];

    if (Array.isArray(wishlistData)) {
      return wishlistData;
    }
    if (wishlistData?.data?.wishlist?.products && Array.isArray(wishlistData.data.wishlist.products)) {
      return wishlistData.data.wishlist.products;
    }
    if (wishlistData?.data?.products && Array.isArray(wishlistData.data.products)) {
      return wishlistData.data.products;
    }
    if (wishlistData?.wishlist?.products && Array.isArray(wishlistData.wishlist.products)) {
      return wishlistData.wishlist.products;
    }
    if (wishlistData?.data?.items && Array.isArray(wishlistData.data.items)) {
      return wishlistData.data.items;
    }
    if (wishlistData?.items && Array.isArray(wishlistData.items)) {
      return wishlistData.items;
    }

    return [];
  }, [wishlistData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleRemoveItem = (productId) => {
    Alert.alert(
      'Remove from Wishlist',
      'Are you sure you want to remove this item from your wishlist?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeFromWishlist(productId),
        },
      ]
    );
  };

  const renderProduct = ({ item }) => {
    const product = item.product || item;
    if (!product) return null;

    const productId = product._id || product.id;
    if (!productId) return null;

    return (
      <View style={styles.productCardWrapper}>
        <ProductCard
          product={product}
          onPress={() => navigation.navigate('ProductDetail', { productId, id: productId })}
          showRemove
          onRemove={() => handleRemoveItem(productId)}
        />
      </View>
    );
  };

  if (isLoading && !refreshing) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading wishlist...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>

      <FlatList
        data={wishlistItems}
        renderItem={renderProduct}
        keyExtractor={(item, index) => 
          item.product?._id || item.product?.id || item._id || item.id || `wishlist-${index}`
        }
        numColumns={2}
        contentContainerStyle={styles.productList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>❤️</Text>
            <Text style={styles.emptyTitle}>Your wishlist is empty</Text>
            <Text style={styles.emptyText}>
              Save items you love to your wishlist
            </Text>
            <TouchableOpacity
              style={styles.shopButton}
              onPress={() => navigation.navigate('HomeTab', { screen: 'Home' })}
            >
              <LinearGradient
                colors={[theme.colors.primary, theme.colors.primary600 || theme.colors.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.shopButtonGradient}
              >
                <Text style={styles.shopButtonText}>Start Shopping</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        }
      />
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
  productList: {
    paddingHorizontal: theme.spacing.sm,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  productCardWrapper: {
    width: (SCREEN_WIDTH - theme.spacing.sm * 2) / 1.6,
    marginHorizontal: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing['4xl'],
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: theme.spacing.lg,
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
    marginBottom: theme.spacing.xl,
  },
  shopButton: {
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
  },
  shopButtonGradient: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    alignItems: 'center',
  },
  shopButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.white,
  },
});

export default WishlistScreen;


