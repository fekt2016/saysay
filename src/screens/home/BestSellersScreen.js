import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../theme';
import ProductCard from '../../components/ProductCard';
import EmptyState from '../../components/EmptyState';
import SectionHeader from '../../components/SectionHeader';
import useBestSellers from '../../hooks/useBestSellers';

const BestSellersScreen = ({ navigation }) => {
  const [page, setPage] = useState(1);
  const { data: productsData, isLoading, refetch } = useBestSellers({ page, limit: 20 });

  const products = useMemo(() => {
    if (!productsData?.data) return [];
    return productsData.data.products || productsData.data || [];
  }, [productsData]);

  const handleProductPress = (product) => {
    navigation.navigate('ProductDetail', {
      productId: product._id || product.id,
      id: product._id || product.id,
    });
  };

  const handleLoadMore = () => {
    if (products.length > 0 && products.length % 20 === 0) {
      setPage((prev) => prev + 1);
    }
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

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <SectionHeader
        title="Best Sellers"
        subtitle={`${productsData?.data?.total || products.length} products`}
      />

      {isLoading && page === 1 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : products.length === 0 ? (
        <EmptyState
          icon="⭐"
          title="No best sellers found"
          message="Check back later for trending products"
        />
      ) : (
        <FlatList
          data={products}
          renderItem={renderProduct}
          keyExtractor={(item) => item._id || item.id}
          numColumns={2}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          contentContainerStyle={styles.listContent}
          ListFooterComponent={
            isLoading ? (
              <ActivityIndicator size="small" color={theme.colors.primary} style={styles.loadMore} />
            ) : null
          }
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
  loadMore: {
    marginVertical: theme.spacing.md,
  },
});

export default BestSellersScreen;


