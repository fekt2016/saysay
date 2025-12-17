
 
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { theme } from '../../theme';


const CategorySkeleton = () => {
  return (
    <View style={styles.categorySkeleton}>
      <View style={styles.skeletonCategoryImage} />
    </View>
  );
};

const styles = StyleSheet.create({
  categorySkeleton: {
    width: 140,
    height: 180,
    backgroundColor: theme.colors.grey200,
    borderRadius: theme.borderRadius.lg,
    marginRight: theme.spacing.md,
  },
  skeletonCategoryImage: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.grey300,
    borderRadius: theme.borderRadius.lg,
  },
});

export default CategorySkeleton;



