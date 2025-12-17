import React, { useState, useLayoutEffect, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import useAuthHook from '../../hooks/useAuth';
import { theme } from '../../theme';
import ProfileSection from '../../components/profile/ProfileSection';
import SettingRow from '../../components/profile/SettingRow';
import LogoIcon from '../../components/header/LogoIcon';const SecuritySettingsScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { 
    profileData, 
    refetchAuth,
    enableTwoFactor, 
    disableTwoFactor,
    getTwoFactorSetup,
    verifyTwoFactor,
    isEnabling2FA,
    isDisabling2FA,
  } = useAuthHook();

  const twoFactorStatus = 
    user?.twoFactorEnabled 
    user?.securitySettings?.twoFactorEnabled 
    profileData?.twoFactorEnabled 
    profileData?.securitySettings?.twoFactorEnabled 
    false;

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(twoFactorStatus);

  const getHasPin = () => {
    return (
      user?.securitySettings?.hasPin === true 
      profileData?.securitySettings?.hasPin === true 
      profileData?.data?.securitySettings?.hasPin === true 
      false
    );
  };

  const [hasPin, setHasPin] = useState(getHasPin());

  useEffect(() => {
    const currentStatus = 
      user?.twoFactorEnabled ||
      user?.securitySettings?.twoFactorEnabled ||
      profileData?.twoFactorEnabled ||
      profileData?.securitySettings?.twoFactorEnabled ||
      false;
    console.log('[SecuritySettingsScreen] 2FA Status Update:', {
      currentStatus,
      userTwoFactor: user?.twoFactorEnabled,
      profileTwoFactor: profileData?.twoFactorEnabled,
      user,
      profileData,
    });
    setTwoFactorEnabled(currentStatus);
  }, [user?.twoFactorEnabled, profileData?.twoFactorEnabled, user, profileData]);

  useEffect(() => {
    const currentHasPin = getHasPin();
    console.log('[SecuritySettingsScreen] PIN Status Update:', {
      currentHasPin,
      userHasPin: user?.securitySettings?.hasPin,
      profileHasPin: profileData?.securitySettings?.hasPin,
      profileDataHasPin: profileData?.data?.securitySettings?.hasPin,
      user,
      profileData,
    });
    setHasPin(currentHasPin);
  }, [
    user?.securitySettings?.hasPin, 
    profileData?.securitySettings?.hasPin,
    profileData?.data?.securitySettings?.hasPin,
    user, 
    profileData
  ]);

  useFocusEffect(
    React.useCallback(() => {
      console.log('[SecuritySettingsScreen] Screen focused, refetching auth and profile...');
      refetchAuth();

      setTimeout(() => {
        const currentStatus = 
          user?.twoFactorEnabled ||
          user?.securitySettings?.twoFactorEnabled ||
          profileData?.twoFactorEnabled ||
          profileData?.securitySettings?.twoFactorEnabled ||
          false;
        console.log('[SecuritySettingsScreen] Post-refetch 2FA status:', currentStatus);
        setTwoFactorEnabled(currentStatus);
      }, 500);
    }, [refetchAuth, user, profileData])
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => <LogoIcon />,
      headerTitle: 'Security Settings',
      headerStyle: {
        backgroundColor: theme.colors.white,
      },
      headerShadowVisible: false,
    });
  }, [navigation]);

  const handleChangePassword = () => {
    navigation.navigate('ChangePassword');
  };

  const handleToggle2FA = () => {
    if (twoFactorEnabled) {

      Alert.alert(
        'Disable Two-Factor Authentication',
        'Are you sure you want to disable two-factor authentication? This will make your account less secure.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Disable',
            style: 'destructive',
            onPress: async () => {
              try {
                await disableTwoFactor.mutateAsync(null, {
                  onSuccess: () => {

                    refetchAuth();
                    Alert.alert('Success', 'Two-factor authentication has been disabled');
                  },
                  onError: (error) => {
                    let errorMessage = 
                      error?.response?.data?.message ||
                      error?.message 
                      'Failed to disable 2FA. Please try again.';

                    if (error?.response?.status === 404 || errorMessage.includes('not yet implemented')) {
                      errorMessage = 'Two-factor authentication is not yet available. This feature will be available soon.';
                    }

                    Alert.alert('2FA Not Available', errorMessage);
                  },
                });
              } catch (error) {
                let errorMessage = 
                  error?.response?.data?.message 
                  error?.message 
                  'Failed to disable 2FA. Please try again.';

                if (error?.response?.status === 404 || errorMessage.includes('not yet implemented')) {
                  errorMessage = 'Two-factor authentication is not yet available. This feature will be available soon.';
                }

                Alert.alert('2FA Not Available', errorMessage);
              }
            },
          },
        ]
      );
    } else {

      Alert.alert(
        'Enable Two-Factor Authentication',
        'Two-factor authentication adds an extra layer of security to your account. You will need to verify your identity using an authenticator app.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Enable',
            onPress: async () => {
              try {

                await enableTwoFactor.mutateAsync(undefined, {
                  onSuccess: (response) => {

                    const setupData = response?.data;
                    const twoFactorData = setupData?.twoFactor || {};

                    const otpAuthUrl = twoFactorData?.otpAuthUrl || setupData?.otpAuthUrl;
                    const base32 = twoFactorData?.base32 || setupData?.base32SecretMasked;
                    const twoFactorPending = setupData?.twoFactorPending || false;

                    if (otpAuthUrl && twoFactorPending) {

                      navigation.navigate('TwoFactorSetup', {
                        qrCodeUrl: otpAuthUrl,
                        secret: base32, 
                        backupCodes: setupData?.backupCodes || [],
                      });

                    } else {

                      console.warn('[SecuritySettingsScreen] Unexpected response:', response);
                      refetchAuth();
                    }
                  },
                  onError: (error) => {
                    let errorMessage = 
                      error?.response?.data?.message ||
                      error?.message 
                      'Failed to enable 2FA. Please try again.';

                    if (error?.response?.status === 404 || errorMessage.includes('not yet implemented')) {
                      errorMessage = 'Two-factor authentication is not yet available. This feature will be available soon.';
                    }

                    Alert.alert('2FA Not Available', errorMessage);
                  },
                });
              } catch (error) {
                let errorMessage = 
                  error?.response?.data?.message 
                  error?.message 
                  'Failed to enable 2FA. Please try again.';

                if (error?.response?.status === 404 || errorMessage.includes('not yet implemented')) {
                  errorMessage = 'Two-factor authentication is not yet available. This feature will be available soon.';
                }

                Alert.alert('2FA Not Available', errorMessage);
              }
            },
          },
        ]
      );
    }
  };

  const handleResetPIN = () => {
    navigation.navigate('ResetPIN');
  };

  const handleDeviceManagement = () => {
    navigation.navigate('DeviceManagement');
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        <View style={styles.infoBanner}>
          <Ionicons name="shield-checkmark" size={24} color={theme.colors.primary} />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>Keep Your Account Secure</Text>
            <Text style={styles.infoDescription}>
              Regularly update your password and enable two-factor authentication for better security.
            </Text>
          </View>
        </View>

        <ProfileSection title="Authentication">
          <SettingRow
            icon="lock-closed-outline"
            label="Change Password"
            description="Update your account password"
            iconColor={theme.colors.blue || theme.colors.primary}
            onPress={handleChangePassword}
          />

          <View style={styles.toggleRow}>
            <View style={styles.toggleLeft}>
              <View style={[styles.iconContainer, { backgroundColor: (theme.colors.green || theme.colors.primary) + '15' }]}>
                <Ionicons 
                  name="shield-checkmark-outline" 
                  size={22} 
                  color={theme.colors.green || theme.colors.primary} 
                />
              </View>
              <View style={styles.toggleTextContainer}>
                <Text style={styles.toggleLabel}>Two-Factor Authentication</Text>
                <Text style={styles.toggleDescription}>
                  {twoFactorEnabled ? 'Enabled' : 'Add an extra layer of security'}
                </Text>
              </View>
            </View>
            {(isEnabling2FA || isDisabling2FA) ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <Switch
                value={twoFactorEnabled}
                onValueChange={handleToggle2FA}
                trackColor={{ false: theme.colors.grey300, true: theme.colors.green || theme.colors.primary }}
                thumbColor={theme.colors.white}
              />
            )}
          </View>

          <SettingRow
            icon="keypad-outline"
            label={hasPin ? 'Reset PIN' : 'Set PIN'}
            description={hasPin ? 'Reset your account PIN' : 'Set a PIN to secure your account'}
            iconColor={theme.colors.orange || theme.colors.primary}
            onPress={handleResetPIN}
          />
        </ProfileSection>

        <ProfileSection title="Sessions & Devices">
          <SettingRow
            icon="phone-portrait-outline"
            label="Device Management"
            description="Manage trusted devices and active sessions"
            iconColor={theme.colors.grey600 || theme.colors.primary}
            onPress={handleDeviceManagement}
          />
        </ProfileSection>

        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>Security Tips</Text>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={16} color={theme.colors.success || theme.colors.green} />
            <Text style={styles.tipText}>Use a strong, unique password</Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={16} color={theme.colors.success || theme.colors.green} />
            <Text style={styles.tipText}>Enable two-factor authentication</Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={16} color={theme.colors.success || theme.colors.green} />
            <Text style={styles.tipText}>Review active sessions regularly</Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={16} color={theme.colors.success || theme.colors.green} />
            <Text style={styles.tipText}>Never share your password</Text>
          </View>
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

  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.grey100 || theme.colors.grey200,
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  toggleTextContainer: {
    flex: 1,
  },
  toggleLabel: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs / 2,
  },
  toggleDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
  },

  tipsSection: {
    backgroundColor: theme.colors.white,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.lg,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.sm,
    borderWidth: 1,
    borderColor: theme.colors.grey200,
  },
  tipsTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  tipText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
});

export default SecuritySettingsScreen;


