
 
import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { theme } from '../../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');


const ProductSkeleton = () => {
  return (
    <View style={styles.productSkeleton}>
      <View style={styles.skeletonImage} />
      <View style={styles.skeletonText} />
      <View style={styles.skeletonTextShort} />
    </View>
  );
};

const styles = StyleSheet.create({
  productSkeleton: {
    width: (SCREEN_WIDTH - theme.spacing.md * 2) / 1.6,
    marginBottom: theme.spacing.md,
  },
  skeletonImage: {
    width: '100%',
    height: 180,
    backgroundColor: theme.colors.grey200,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
  },
  skeletonText: {
    width: '80%',
    height: 16,
    backgroundColor: theme.colors.grey200,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.xs,
  },
  skeletonTextShort: {
    width: '60%',
    height: 14,
    backgroundColor: theme.colors.grey200,
    borderRadius: theme.borderRadius.sm,
  },
});

export default ProductSkeleton;



