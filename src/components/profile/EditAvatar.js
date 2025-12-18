
 
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';


const EditAvatar = ({ 
  user, 
  onPhotoChange, 
  isUploading = false,
  photoUrl: externalPhotoUrl 
}) => {
  const [photoUrl, setPhotoUrl] = useState(null);
  const [localPhoto, setLocalPhoto] = useState(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Set initial photo from user or external prop
    const initialPhoto = externalPhotoUrl || 
                        user?.photo || 
                        user?.profilePicture || 
                        user?.avatar || 
                        user?.image;
    if (initialPhoto) {
      setPhotoUrl(initialPhoto);
    }
  }, [user, externalPhotoUrl]);

  // Pulse animation when photo is updated
  useEffect(() => {
    if (localPhoto) {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [localPhoto]);

  const requestPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'We need access to your photos to update your profile picture.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const handleImagePicker = async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    Alert.alert(
      'Select Photo',
      'Choose an option',
      [
        { text: 'Camera', onPress: () => openCamera() },
        { text: 'Photo Library', onPress: () => openImagePicker() },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'We need access to your camera to take a photo.',
        [{ text: 'OK' }]
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      handleImageSelected(result.assets[0]);
    }
  };

  const openImagePicker = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      handleImageSelected(result.assets[0]);
    }
  };

  const handleImageSelected = (asset) => {
    setLocalPhoto(asset.uri);
    setPhotoUrl(asset.uri);
    
    // Create FormData for upload
    if (onPhotoChange) {
      onPhotoChange(asset);
    }
  };

  const displayName = user?.name || user?.firstName || user?.email || 'U';
  const initial = displayName.charAt(0).toUpperCase();
  const currentPhoto = localPhoto || photoUrl;

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.avatarContainer,
          { transform: [{ scale: pulseAnim }] }
        ]}
      >
        {currentPhoto ? (
          <Image
            source={{ uri: currentPhoto }}
            style={styles.avatar}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
        )}
        
        {isUploading && (
          <View style={styles.uploadingOverlay}>
            <ActivityIndicator size="small" color={theme.colors.white} />
          </View>
        )}

        <TouchableOpacity
          style={styles.editButton}
          onPress={handleImagePicker}
          disabled={isUploading}
          activeOpacity={0.7}
        >
          <Ionicons name="camera" size={16} color={theme.colors.white} />
        </TouchableOpacity>
      </Animated.View>

      <TouchableOpacity
        style={styles.changePhotoButton}
        onPress={handleImagePicker}
        disabled={isUploading}
        activeOpacity={0.7}
      >
        <Text style={styles.changePhotoText}>
          {isUploading ? 'Uploading...' : 'Change Photo'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: theme.spacing.md,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 4,
    borderColor: theme.colors.white,
    ...theme.shadows.md,
  },
  avatarPlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: theme.colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: theme.colors.white,
    ...theme.shadows.md,
  },
  avatarText: {
    fontSize: 44,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: theme.colors.white,
    ...theme.shadows.sm,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 55,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  changePhotoButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  changePhotoText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.semibold,
  },
});

export default EditAvatar;


