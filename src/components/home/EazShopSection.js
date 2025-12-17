
 
import React from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ProductCard from '../ProductCard';
import { theme } from '../../theme';


const EazShopSection = ({ products, onProductPress, onViewAllPress }) => {
  const renderProduct = ({ item, index }) => {
    const productId = item._id || item.id;
    if (!productId) {
      console.warn('Product missing ID:', item);
      return null;
    }
    return (
      <View style={styles.eazshopProductCard}>
        <ProductCard
          product={item}
          onPress={() => onProductPress(productId)}
        />
      </View>
    );
  };

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.eazshopSection}
    >
      <View style={styles.eazshopHeader}>
        <View style={styles.eazshopBadgeContainer}>
          <View style={styles.eazshopBadge}>
            <Text style={styles.badgeIcon}>⭐</Text>
            <Text style={styles.badgeText}>Official Store</Text>
          </View>
          <View style={styles.trustBadge}>
            <Text style={styles.trustBadgeText}>✓ Trusted</Text>
          </View>
          <View style={styles.trustBadge}>
            <Text style={styles.trustBadgeText}>🛡️ Verified</Text>
          </View>
          <View style={styles.trustBadge}>
            <Text style={styles.trustBadgeText}>🚚 Fast Delivery</Text>
          </View>
        </View>
        <Text style={styles.eazshopTitle}>Saysay Official Store</Text>
        <Text style={styles.eazshopSubtitle}>Trusted • Verified • Fast Delivery</Text>
      </View>
      
      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item, index) => item._id || item.id || `eazshop-product-${index}`}
        numColumns={2}
        columnWrapperStyle={styles.eazshopProductRow}
        scrollEnabled={false}
        contentContainerStyle={styles.eazshopGrid}
      />
      
      <TouchableOpacity 
        style={styles.viewAllEazshopButton}
        onPress={onViewAllPress}
      >
        <Text style={styles.viewAllEazshopText}>View All Saysay Products</Text>
        <Text style={styles.viewAllEazshopIcon}>→</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  eazshopSection: {
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  eazshopHeader: {
    marginBottom: theme.spacing.lg,
  },
  eazshopBadgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: theme.spacing.md,
  },
  eazshopBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: theme.borderRadius.full,
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  badgeIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  badgeText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.white,
    textTransform: 'uppercase',
  },
  trustBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: theme.borderRadius.full,
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  trustBadgeText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.white,
    fontWeight: theme.typography.fontWeight.medium,
  },
  eazshopTitle: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.white,
    marginBottom: theme.spacing.xs,
  },
  eazshopSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.white,
    opacity: 0.9,
  },
  eazshopGrid: {
    paddingBottom: theme.spacing.md,
  },
  eazshopProductRow: {
    justifyContent: 'space-between',
    paddingHorizontal: 0,
    marginBottom: theme.spacing.sm,
  },
  eazshopProductCard: {
    flex: 1,
    marginHorizontal: theme.spacing.md / 2,
    maxWidth: '55%',
  },
  viewAllEazshopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: theme.borderRadius.full,
    marginTop: theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  viewAllEazshopText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.white,
    marginRight: 8,
  },
  viewAllEazshopIcon: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.white,
  },
});

export default EazShopSection;



