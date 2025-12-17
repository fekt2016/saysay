import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../theme';

const SellerCard = ({
  seller,
  onPress,
  onFollowPress,
  isFollowing = false,
  style,
}) => {
  
  const avatarUri = seller?.avatar || 
                    seller?.image || 
                    seller?.logo || 
                    seller?.profilePicture || 
                    seller?.photo;
  const name = seller?.name || seller?.shopName || 'Seller';
  const rating = seller?.rating || seller?.ratings?.average || seller?.averageRating || 0;
  const followers = seller?.followersCount || seller?.followers || 0;
  const productsCount = seller?.productsCount || seller?.products?.length || 0;
  
  const [imageError, setImageError] = useState(false);

  
  React.useEffect(() => {
    if (seller && !avatarUri) {
      console.log('🔍 [SellerCard] Seller data (no avatar found):', {
        id: seller._id || seller.id,
        name: name,
        availableFields: Object.keys(seller),
      });
    }
  }, [seller, avatarUri, name]);

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.avatarContainer}>
        {avatarUri && !imageError ? (
          <Image 
            source={{ uri: avatarUri }} 
            style={styles.avatar}
            onError={(error) => {
              console.log('❌ [SellerCard] Image load error:', error.nativeEvent.error);
              console.log('❌ [SellerCard] Failed URI:', avatarUri);
              setImageError(true);
            }}
            onLoad={() => {
              console.log('✅ [SellerCard] Image loaded successfully:', avatarUri);
            }}
          />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
        
        <View style={styles.ratingContainer}>
          <Text style={styles.star}>⭐</Text>
          <Text style={styles.rating}>{rating.toFixed(1)}</Text>
        </View>
        
        <View style={styles.statsContainer}>
          <Text style={styles.stat}>{followers} followers</Text>
          <Text style={styles.statSeparator}>•</Text>
          <Text style={styles.stat}>{productsCount} products</Text>
        </View>
      </View>
      
      {onFollowPress && (
        <TouchableOpacity
          style={[styles.followButton, isFollowing && styles.followingButton]}
          onPress={onFollowPress}
          activeOpacity={0.7}
        >
          <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
            {isFollowing ? 'Following' : 'Follow'}
          </Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md || 12,
    marginBottom: theme.spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  avatarContainer: {
    marginRight: theme.spacing.md,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.grey200,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.white,
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  star: {
    fontSize: 14,
    marginRight: 4,
  },
  rating: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textSecondary,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  statSeparator: {
    marginHorizontal: theme.spacing.xs,
    color: theme.colors.textSecondary,
  },
  followButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md || 12,
    backgroundColor: theme.colors.primary,
  },
  followingButton: {
    backgroundColor: theme.colors.grey200,
  },
  followButtonText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.white,
  },
  followingButtonText: {
    color: theme.colors.text,
  },
});

export default SellerCard;
