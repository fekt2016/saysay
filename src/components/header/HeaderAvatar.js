import React, { useState } from 'react';
import { View, Image, TouchableOpacity, StyleSheet, Text, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { theme } from '../../theme';

/**
 * HeaderAvatar - User avatar component for header right
 * Enhanced for Android compatibility
 */
const HeaderAvatar = () => {
  const navigation = useNavigation();
  const { user, isAuthenticated } = useAuth();
  const [imageError, setImageError] = useState(false);

  if (__DEV__ && Platform.OS === 'android') {
    console.log('[HeaderAvatar] Android Debug:', {
      isAuthenticated,
      hasUser: !!user,
      userName: user?.name,
      userPhoto: user?.photo,
      userProfilePicture: user?.profilePicture,
      userAvatar: user?.avatar,
      userImage: user?.image,
      userKeys: user ? Object.keys(user) : [],
    });
  }

  const handlePress = () => {
    if (isAuthenticated) {
      navigation.navigate('AccountTab', {
        screen: 'Settings',
      });
    } else {
      navigation.navigate('Auth', { screen: 'Login' });
    }
  };

  const photoUrl = user?.photo || user?.profilePicture || user?.avatar || user?.image;
  
  const userName = user?.name || user?.firstName || user?.email || '';
  const userInitial = userName ? userName.charAt(0).toUpperCase() : 'U';

  const normalizedPhotoUrl = photoUrl && photoUrl.trim() !== '' 
    ? (photoUrl.startsWith('http') ? photoUrl : `http://${photoUrl}`)
    : null;

  const handleImageError = (error) => {
    console.error('[HeaderAvatar] Image load error:', error, 'URL:', normalizedPhotoUrl);
    setImageError(true);
  };

  const handleImageLoad = () => {
    setImageError(false);
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      style={styles.container}
    >
      {isAuthenticated && normalizedPhotoUrl && !imageError ? (
        <Image
          source={{ uri: normalizedPhotoUrl }}
          style={styles.avatar}
          resizeMode="cover"
          onError={handleImageError}
          onLoad={handleImageLoad}
        />
      ) : isAuthenticated && user ? (
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>{userInitial}</Text>
        </View>
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Ionicons name="person-outline" size={18} color={theme.colors.textSecondary} />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginRight: 8,
    marginLeft: 8,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  avatarPlaceholder: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: theme.colors.grey200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
});

export default HeaderAvatar;
