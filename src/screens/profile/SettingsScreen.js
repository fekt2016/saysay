import React, { useState, useLayoutEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { useAuth } from '../../hooks/useAuth';
import { useUploadAvatar } from '../../hooks/useProfile';
import { useCreditBalance } from '../../hooks/useCreditBalance';

import ProfileSection from '../../components/profile/ProfileSection';
import SettingRow from '../../components/profile/SettingRow';
import LogoIcon from '../../components/header/LogoIcon';
import AppButton from '../../components/AppButton';

import { theme } from '../../theme';const SettingsScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { mutate: uploadAvatar, isPending: isUploadingAvatar } = useUploadAvatar();
  const [localPhoto, setLocalPhoto] = useState(null);

  const { data: creditBalanceData } = useCreditBalance();
  const walletBalance = creditBalanceData?.data?.wallet?.balance 
                        creditBalanceData?.data?.creditbalance?.balance 
                        creditBalanceData?.data?.balance 
                        0;

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => <LogoIcon />,
      headerTitle: 'Settings',
      headerStyle: {
        backgroundColor: theme.colors.white,
      },
      headerShadowVisible: false,
    });
  }, [navigation]);

  const photoUrl = localPhoto 
                   user?.photo 
                   user?.profilePicture 
                   user?.avatar 
                   user?.image;

  const handleAvatarPress = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'We need access to your photos to update your profile picture.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Select Photo',
      'Choose an option',
      [
        { 
          text: 'Camera', 
          onPress: async () => {
            const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
            if (cameraStatus.status === 'granted') {
              const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
              });
              if (!result.canceled && result.assets[0]) {
                handleImageSelected(result.assets[0]);
              }
            }
          }
        },
        { 
          text: 'Photo Library', 
          onPress: async () => {
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            });
            if (!result.canceled && result.assets[0]) {
              handleImageSelected(result.assets[0]);
            }
          }
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleImageSelected = (asset) => {
    setLocalPhoto(asset.uri);
    uploadAvatar(asset, {
      onSuccess: () => {

        Alert.alert('Success', 'Profile photo updated successfully');
      },
      onError: (error) => {
        Alert.alert('Error', error.message || 'Failed to upload photo');
        setLocalPhoto(null);
      },
    });
  };

  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  const accountItems = [
    {
      icon: 'wallet-outline',
      label: 'Wallet Balance',
      description: `Balance: GH₵${walletBalance.toFixed(2)}`,
      screen: 'CreditBalance',
      color: theme.colors.green || theme.colors.primary,
    },
  ];

  const securityItems = [
    {
      icon: 'shield-checkmark-outline',
      label: 'Security Settings',
      description: 'Password, 2FA, and security preferences',
      screen: 'SecuritySettings',
      color: theme.colors.blue || theme.colors.primary,
    },
    {
      icon: 'phone-portrait-outline',
      label: 'Device Management',
      description: 'Manage trusted devices and sessions',
      screen: 'DeviceManagement',
      color: theme.colors.grey600 || theme.colors.primary,
    },
    {
      icon: 'notifications-outline',
      label: 'Permissions',
      description: 'Manage notification permissions',
      screen: 'Permission',
      color: theme.colors.purple || theme.colors.primary,
    },
  ];

  const preferencesItems = [
    {
      icon: 'notifications-outline',
      label: 'Notifications',
      description: 'Manage notification preferences',
      screen: 'NotificationSettings',
      color: theme.colors.orange || theme.colors.primary,
    },
    {
      icon: 'language-outline',
      label: 'Language',
      description: 'Select app language',
      screen: 'Language',
      color: theme.colors.blue || theme.colors.primary,
    },
    {
      icon: 'globe-outline',
      label: 'Region',
      description: 'Select your region',
      screen: 'Region',
      color: theme.colors.green || theme.colors.primary,
    },
  ];

  const supportItems = [
    {
      icon: 'help-circle-outline',
      label: 'Help Center',
      description: 'Browse FAQs and guides',
      screen: 'HelpCenter',
      color: theme.colors.blue || theme.colors.primary,
    },
    {
      icon: 'document-text-outline',
      label: 'FAQs',
      description: 'Find answers to common questions',
      screen: 'HelpCenterTabs',
      color: theme.colors.green || theme.colors.primary,
    },
    {
      icon: 'chatbubble-outline',
      label: 'Chat Support',
      description: 'Get instant help from our team',
      screen: 'Chat',
      color: theme.colors.primary,
    },
    {
      icon: 'ticket-outline',
      label: 'Support Tickets',
      description: 'Create and manage support tickets',
      screen: 'Support',
      color: theme.colors.orange || theme.colors.primary,
    },
  ];

  const appItems = [
    {
      icon: 'information-circle-outline',
      label: 'App Version',
      description: 'Version 1.0.0',
      screen: 'AppVersion',
      color: theme.colors.textSecondary || theme.colors.primary,
    },
  ];

  const handleScreenNavigation = (screen) => {

    navigation.navigate(screen);
  };

  const displayName = user?.name || user?.firstName || 'User';
  const displayEmail = user?.email || user?.phone || '';

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <TouchableOpacity
              style={styles.avatarContainer}
              onPress={handleAvatarPress}
              activeOpacity={0.7}
              disabled={isUploadingAvatar}
            >
              {photoUrl ? (
                <Image
                  source={{ uri: photoUrl }}
                  style={styles.avatar}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>
                    {displayName.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              {isUploadingAvatar && (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator size="small" color={theme.colors.white} />
                </View>
              )}
              <View style={styles.cameraIconContainer}>
                <Ionicons name="camera" size={16} color={theme.colors.white} />
              </View>
            </TouchableOpacity>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName} numberOfLines={1}>
                {displayName}
              </Text>
              {displayEmail && (
                <Text style={styles.profileEmail} numberOfLines={1}>
                  {displayEmail}
                </Text>
              )}
            </View>
          </View>
          <AppButton
            title="Edit Profile"
            onPress={handleEditProfile}
            variant="outline"
            style={styles.editProfileButton}
          />
        </View>

        <ProfileSection title="Account">
          {accountItems.map((item, index) => (
            <SettingRow
              key={index}
              icon={item.icon}
              label={item.label}
              description={item.description}
              iconColor={item.color}
              onPress={() => handleScreenNavigation(item.screen)}
            />
          ))}
        </ProfileSection>

        <ProfileSection title="Security">
          {securityItems.map((item, index) => (
            <SettingRow
              key={index}
              icon={item.icon}
              label={item.label}
              description={item.description}
              iconColor={item.color}
              onPress={() => handleScreenNavigation(item.screen)}
            />
          ))}
        </ProfileSection>

        <ProfileSection title="Preferences">
          {preferencesItems.map((item, index) => (
            <SettingRow
              key={index}
              icon={item.icon}
              label={item.label}
              description={item.description}
              iconColor={item.color}
              onPress={() => handleScreenNavigation(item.screen)}
            />
          ))}
        </ProfileSection>

        <ProfileSection title="Support">
          {supportItems.map((item, index) => (
            <SettingRow
              key={index}
              icon={item.icon}
              label={item.label}
              description={item.description}
              iconColor={item.color}
              onPress={() => handleScreenNavigation(item.screen)}
            />
          ))}
        </ProfileSection>

        <ProfileSection title="App">
          {appItems.map((item, index) => (
            <SettingRow
              key={index}
              icon={item.icon}
              label={item.label}
              description={item.description}
              iconColor={item.color}
              onPress={() => handleScreenNavigation(item.screen)}
            />
          ))}
        </ProfileSection>
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

  profileCard: {
    backgroundColor: theme.colors.white,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.sm,
    borderWidth: 1,
    borderColor: theme.colors.grey200,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: theme.spacing.md,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: theme.colors.white,
    ...theme.shadows.sm,
  },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: theme.colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: theme.colors.white,
    ...theme.shadows.sm,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 45,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: theme.colors.white,
    ...theme.shadows.sm,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs / 2,
  },
  profileEmail: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  editProfileButton: {
    marginTop: 0,
  },
});

export default SettingsScreen;


