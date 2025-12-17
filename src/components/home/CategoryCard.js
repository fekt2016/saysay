
 
import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme';


const CategoryCard = ({ item, onPress }) => {
  const categoryId = item.id || item._id;
  if (!categoryId) {
    console.warn('Category missing ID:', item);
    return null;
  }

  const imageUri = item.image || item.imageCover || item.photo;

  return (
    <TouchableOpacity
      style={styles.categoryCard}
      onPress={() => onPress(categoryId, item.name || 'Category')}
      activeOpacity={0.8}
    >
      {imageUri ? (
        <Image 
          source={{ uri: imageUri }} 
          style={styles.categoryImage} 
          resizeMode="cover"
          onError={() => {
            console.warn('CategoryCard: Failed to load image:', imageUri);
          }}
        />
      ) : (
        <View style={[styles.categoryImage, styles.placeholderImage]} />
      )}
      <LinearGradient
        colors={['rgba(0, 0, 0, 0.8)', 'transparent']}
        start={{ x: 0, y: 1 }}
        end={{ x: 0, y: 0 }}
        style={styles.categoryOverlay}
      />
      <View style={styles.categoryContent}>
        <Text style={styles.categoryName}>{item.name || 'Category'}</Text>
        <Text style={styles.categoryCount}>{item.count ? `${item.count} Items` : '0 Items'}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  categoryCard: {
    width: 140,
    height: 180,
    borderRadius: theme.borderRadius.lg,
    marginRight: theme.spacing.md,
    overflow: 'hidden',
    backgroundColor: theme.colors.grey200,
  },
  categoryImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  categoryOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  categoryContent: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
  },
  categoryName: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.white,
    marginBottom: 4,
  },
  categoryCount: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.white,
    opacity: 0.9,
  },
  placeholderImage: {
    backgroundColor: theme.colors.grey200 || '#e5e5e5',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CategoryCard;


