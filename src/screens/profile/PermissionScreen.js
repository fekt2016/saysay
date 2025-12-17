import React, { useState, useEffect, useLayoutEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { theme } from '../../theme';
import ProfileSection from '../../components/profile/ProfileSection';
import LogoIcon from '../../components/header/LogoIcon';
import AppButton from '../../components/AppButton';const PermissionScreen = () => {
  const navigation = useNavigation();
  const [permissions, setPermissions] = useState({
    camera: null,
    photoLibrary: null,
    notifications: null,
    location: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => <LogoIcon />,
      headerTitle: 'Permissions',
      headerStyle: {
        backgroundColor: theme.colors.white,
      },
      headerShadowVisible: false,
    });
  }, [navigation]);

  useEffect(() => {
    checkAllPermissions();
  }, []);

  const checkAllPermissions = async () => {
    setIsLoading(true);
    try {

      const cameraStatus = await ImagePicker.getCameraPermissionsAsync();

      const photoLibraryStatus = await ImagePicker.getMediaLibraryPermissionsAsync();

      const notificationsStatus = await Notifications.getPermissionsAsync();

      const locationStatus = await Location.getForegroundPermissionsAsync();

      setPermissions({
        camera: cameraStatus.status,
        photoLibrary: photoLibraryStatus.status,
        notifications: notificationsStatus.status,
        location: locationStatus.status,
      });
    } catch (error) {
      console.error('Error checking permissions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openSystemSettings = async () => {
    try {
      if (Platform.OS === 'ios') {
        await Linking.openURL('app-settings:');
      } else {

        await Linking.openSettings();
      }
    } catch (error) {
      Alert.alert(
        'Error',
        'Unable to open system settings. Please go to Settings > EazShop manually.',
        [{ text: 'OK' }]
      );
    }
  };

  const getStatusText = (status) => {
    if (status === 'granted') return 'Enabled';
    if (status === 'denied') return 'Disabled';
    if (status === 'undetermined') return 'Not Set';
    return 'Unknown';
  };

  const getStatusColor = (status) => {
    if (status === 'granted') return theme.colors.success || theme.colors.green;
    if (status === 'denied') return theme.colors.error || theme.colors.red;
    return theme.colors.textSecondary;
  };

  const renderPermissionRow = (icon, name, description, status, iconColor = theme.colors.primary) => {
    const statusText = getStatusText(status);
    const statusColor = getStatusColor(status);
    const isGranted = status === 'granted';

    return (
      <View style={styles.permissionRow}>
        <View style={styles.permissionLeft}>
          <View style={[styles.iconContainer, { backgroundColor: iconColor + '15' }]}>
            <Ionicons name={icon} size={24} color={iconColor} />
          </View>
          <View style={styles.permissionInfo}>
            <View style={styles.permissionHeader}>
              <Text style={styles.permissionName}>{name}</Text>
              <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                <Text style={[styles.statusText, { color: statusColor }]}>
                  {statusText}
                </Text>
              </View>
            </View>
            <Text style={styles.permissionDescription}>{description}</Text>
          </View>
        </View>
        {isGranted ? (
          <Ionicons name="checkmark-circle" size={24} color={statusColor} />
        ) : (
          <Ionicons name="close-circle" size={24} color={statusColor} />
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Checking permissions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        <View style={styles.infoBanner}>
          <Ionicons name="shield-checkmark-outline" size={24} color={theme.colors.primary} />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>App Permissions</Text>
            <Text style={styles.infoDescription}>
              These permissions are managed by your device's operating system. To change them, use the button below to open system settings.
            </Text>
          </View>
        </View>

        <ProfileSection title="Device Permissions">
          {renderPermissionRow(
            'camera-outline',
            'Camera',
            'Take photos for your profile picture and product reviews',
            permissions.camera,
            theme.colors.blue || theme.colors.primary
          )}
          {renderPermissionRow(
            'images-outline',
            'Photo Library',
            'Select photos from your gallery for profile and product images',
            permissions.photoLibrary,
            theme.colors.purple || theme.colors.primary
          )}
          {renderPermissionRow(
            'notifications-outline',
            'Notifications',
            'Receive order updates, promotions, and important alerts',
            permissions.notifications,
            theme.colors.orange || theme.colors.primary
          )}
          {renderPermissionRow(
            'location-outline',
            'Location',
            'Find nearby stores and get accurate delivery addresses',
            permissions.location,
            theme.colors.green || theme.colors.primary
          )}
        </ProfileSection>

        <View style={styles.whySection}>
          <Text style={styles.whyTitle}>Why We Need These Permissions</Text>
          <View style={styles.whyItem}>
            <Ionicons name="camera" size={16} color={theme.colors.primary} />
            <Text style={styles.whyText}>
              <Text style={styles.whyBold}>Camera:</Text> Take photos directly in the app for your profile or product reviews
            </Text>
          </View>
          <View style={styles.whyItem}>
            <Ionicons name="images" size={16} color={theme.colors.primary} />
            <Text style={styles.whyText}>
              <Text style={styles.whyBold}>Photo Library:</Text> Select existing photos from your device to use in the app
            </Text>
          </View>
          <View style={styles.whyItem}>
            <Ionicons name="notifications" size={16} color={theme.colors.primary} />
            <Text style={styles.whyText}>
              <Text style={styles.whyBold}>Notifications:</Text> Stay updated on your orders, deliveries, and exclusive offers
            </Text>
          </View>
          <View style={styles.whyItem}>
            <Ionicons name="location" size={16} color={theme.colors.primary} />
            <Text style={styles.whyText}>
              <Text style={styles.whyBold}>Location:</Text> Get accurate delivery addresses and find nearby stores
            </Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <AppButton
            title="Open System Settings"
            onPress={openSystemSettings}
            variant="primary"
            fullWidth
          />
        </View>

        <View style={styles.buttonContainer}>
          <AppButton
            title="Refresh Permissions"
            onPress={checkAllPermissions}
            variant="outline"
            fullWidth
          />
        </View>

        <View style={styles.footerInfo}>
          <Ionicons name="information-circle-outline" size={16} color={theme.colors.textSecondary} />
          <Text style={styles.footerText}>
            After changing permissions in system settings, return here and tap "Refresh Permissions" to update the status.
          </Text>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xl,
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

  infoBanner: {
    flexDirection: 'row',
    backgroundColor: theme.colors.primary + '10',
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  infoTextContainer: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  infoTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs / 2,
  },
  infoDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: theme.typography.fontSize.sm * 1.5,
  },

  permissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.grey100 || theme.colors.grey200,
  },
  permissionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  permissionInfo: {
    flex: 1,
  },
  permissionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs / 2,
  },
  permissionName: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textPrimary,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm || 12,
    marginLeft: theme.spacing.sm,
  },
  statusText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  permissionDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: theme.typography.fontSize.sm * 1.4,
  },

  whySection: {
    backgroundColor: theme.colors.white,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.lg,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.grey200,
  },
  whyTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  whyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  whyText: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.sm,
    lineHeight: theme.typography.fontSize.sm * 1.5,
  },
  whyBold: {
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },

  buttonContainer: {
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
  },

  footerInfo: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.grey200,
  },
  footerText: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.sm,
    lineHeight: theme.typography.fontSize.sm * 1.5,
  },
});

export default PermissionScreen;


