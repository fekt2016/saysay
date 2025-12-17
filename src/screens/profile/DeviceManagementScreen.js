import React, { useLayoutEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useActiveDevices, useLogoutDevice, useLogoutAllOtherDevices } from '../../hooks/useDeviceManagement';
import { theme } from '../../theme';
import ProfileSection from '../../components/profile/ProfileSection';
import LogoIcon from '../../components/header/LogoIcon';
import AppButton from '../../components/AppButton';const DeviceManagementScreen = () => {
  const navigation = useNavigation();
  const { data: devices, isLoading, refetch, isRefetching } = useActiveDevices();
  const logoutDevice = useLogoutDevice();
  const logoutAllOthers = useLogoutAllOtherDevices();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => <LogoIcon />,
      headerTitle: 'Device Management',
      headerStyle: {
        backgroundColor: theme.colors.white,
      },
      headerShadowVisible: false,
    });
  }, [navigation]);

  const onRefresh = React.useCallback(() => {
    refetch();
  }, [refetch]);

  const getDeviceIcon = (deviceType) => {
    const type = deviceType?.toLowerCase() || 'desktop';
    switch (type) {
      case 'mobile':
        return 'phone-portrait-outline';
      case 'tablet':
        return 'tablet-portrait-outline';
      case 'desktop':
        return 'desktop-outline';
      default:
        return 'hardware-chip-outline';
    }
  };

  const getPlatformName = (userAgent, deviceType) => {
    if (deviceType) {
      return deviceType.charAt(0).toUpperCase() + deviceType.slice(1);
    }
    if (userAgent) {
      if (userAgent.includes('iPhone') || userAgent.includes('iOS')) {
        return 'iOS';
      }
      if (userAgent.includes('Android')) {
        return 'Android';
      }
      if (userAgent.includes('Windows')) {
        return 'Windows';
      }
      if (userAgent.includes('Mac')) {
        return 'macOS';
      }
      if (userAgent.includes('Linux')) {
        return 'Linux';
      }
    }
    return Platform.OS === 'ios' ? 'iOS' : Platform.OS === 'android' ? 'Android' : 'Unknown';
  };

  const formatLastActive = (dateString) => {
    if (!dateString) return 'Unknown';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diff = now - date;
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);

      if (minutes < 1) return 'Just now';
      if (minutes < 60) return `${minutes}m ago`;
      if (hours < 24) return `${hours}h ago`;
      if (days < 7) return `${days}d ago`;

      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return 'Unknown';
    }
  };

  const getDeviceName = (device) => {

    if (device.device && device.device !== 'Unknown') {
      return device.device;
    }
    if (device.os && device.os !== 'Unknown') {
      return `${device.os} Device`;
    }
    if (device.browser && device.browser !== 'Unknown') {
      return `${device.browser} Device`;
    }
    const platform = getPlatformName(device.userAgent, device.deviceType);
    return `${platform} Device`;
  };

  const handleLogoutDevice = (device) => {
    const deviceName = getDeviceName(device);
    const deviceId = device.deviceId || device._id;

    if (!deviceId) {
      Alert.alert('Error', 'Device ID not found. Please refresh and try again.');
      return;
    }

    Alert.alert(
      'Logout Device',
      `Are you sure you want to logout from ${deviceName}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            logoutDevice.mutate(deviceId, {
              onSuccess: () => {
                Alert.alert('Success', 'Device logged out successfully');

                setTimeout(() => {
                  refetch();
                }, 500);
              },
              onError: (error) => {
                const errorMessage = error.response?.data?.message 
                                   error.message 
                                   'Failed to logout device. Please try again.';
                Alert.alert('Error', errorMessage);
              },
            });
          },
        },
      ]
    );
  };

  const handleLogoutAllOthers = () => {
    const otherDevicesCount = devices?.filter(d => !d.isCurrentDevice && d.isActive)?.length || 0;

    if (otherDevicesCount === 0) {
      Alert.alert('Info', 'No other devices to logout');
      return;
    }

    Alert.alert(
      'Logout All Other Devices',
      `Are you sure you want to logout from ${otherDevicesCount} other device${otherDevicesCount > 1 ? 's' : ''}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout All',
          style: 'destructive',
          onPress: () => {
            logoutAllOthers.mutate(undefined, {
              onSuccess: () => {
                Alert.alert('Success', 'All other devices logged out successfully');

                setTimeout(() => {
                  refetch();
                }, 500);
              },
              onError: (error) => {
                const errorMessage = error.response?.data?.message 
                                   error.message 
                                   'Failed to logout devices. Please try again.';
                Alert.alert('Error', errorMessage);
              },
            });
          },
        },
      ]
    );
  };

  const renderDeviceCard = (device, index) => {
    const isCurrent = device.isCurrentDevice || false; 
    const deviceName = getDeviceName(device);
    const platform = device.os || getPlatformName(device.userAgent, device.deviceType);
    const browser = device.browser || 'Unknown Browser';
    const lastActive = formatLastActive(device.lastActivity);
    const iconName = getDeviceIcon(device.deviceType);

    return (
      <View key={device.deviceId || device._id || index} style={styles.deviceCard}>
        <View style={styles.deviceLeft}>
          <View style={[styles.deviceIconContainer, isCurrent && styles.currentDeviceIcon]}>
            <Ionicons 
              name={iconName} 
              size={28} 
              color={isCurrent ? theme.colors.primary : theme.colors.textSecondary} 
            />
          </View>
          <View style={styles.deviceInfo}>
            <View style={styles.deviceHeader}>
              <Text style={styles.deviceName}>{deviceName}</Text>
              {isCurrent && (
                <View style={styles.currentBadge}>
                  <Text style={styles.currentBadgeText}>Current Device</Text>
                </View>
              )}
            </View>
            <Text style={styles.devicePlatform}>{platform}</Text>
            {browser !== 'Unknown Browser' && (
              <Text style={styles.deviceBrowser}>{browser}</Text>
            )}
            <Text style={styles.deviceLocation}>
              {device.location || device.ipAddress || 'Unknown location'}
            </Text>
            <Text style={styles.deviceTime}>Last active: {lastActive}</Text>
          </View>
        </View>
        {!isCurrent && (
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={() => handleLogoutDevice(device)}
            disabled={logoutDevice.isPending}
            activeOpacity={0.7}
          >
            {logoutDevice.isPending ? (
              <ActivityIndicator size="small" color={theme.colors.error || theme.colors.red} />
            ) : (
              <Ionicons name="log-out-outline" size={20} color={theme.colors.error || theme.colors.red} />
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading devices...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const deviceList = devices || [];
  const otherDevicesCount = deviceList.filter(d => !d.isCurrentDevice && d.isActive).length;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >

        <View style={styles.infoBanner}>
          <Ionicons name="phone-portrait-outline" size={24} color={theme.colors.primary} />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>Active Devices</Text>
            <Text style={styles.infoDescription}>
              Manage devices that are currently signed in to your account. You can logout from devices you no longer use.
            </Text>
          </View>
        </View>

        {otherDevicesCount > 0 && (
          <View style={styles.actionButtonContainer}>
            <AppButton
              title={`Logout All Other Devices (${otherDevicesCount})`}
              onPress={handleLogoutAllOthers}
              variant="outline"
              fullWidth
              disabled={logoutAllOthers.isPending || logoutDevice.isPending}
              loading={logoutAllOthers.isPending}
            />
          </View>
        )}

        <ProfileSection title={`Active Devices (${deviceList.length})`}>
          {deviceList.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="phone-portrait-outline" size={48} color={theme.colors.textSecondary} />
              <Text style={styles.emptyTitle}>No Active Devices</Text>
              <Text style={styles.emptyText}>
                You don't have any active devices signed in to your account.
              </Text>
            </View>
          ) : (
            deviceList.map((device, index) => renderDeviceCard(device, index))
          )}
        </ProfileSection>

        <View style={styles.footerInfo}>
          <Ionicons name="information-circle-outline" size={16} color={theme.colors.textSecondary} />
          <Text style={styles.footerText}>
            Logging out from a device will sign you out of that device. You'll need to sign in again to access your account from that device.
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

  actionButtonContainer: {
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
  },

  deviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.grey100 || theme.colors.grey200,
  },
  deviceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  deviceIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.grey100 || theme.colors.grey200,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  currentDeviceIcon: {
    backgroundColor: theme.colors.primary + '15',
  },
  deviceInfo: {
    flex: 1,
  },
  deviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs / 2,
  },
  deviceName: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
    flex: 1,
  },
  currentBadge: {
    backgroundColor: theme.colors.primary + '20',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm || 12,
    marginLeft: theme.spacing.sm,
  },
  currentBadgeText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.primary,
  },
  devicePlatform: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs / 2,
  },
  deviceBrowser: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs / 2,
  },
  deviceLocation: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs / 2,
  },
  deviceTime: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  logoutButton: {
    padding: theme.spacing.sm,
    marginLeft: theme.spacing.sm,
  },

  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing['4xl'] || theme.spacing.xl * 2,
    paddingHorizontal: theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },

  footerInfo: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.lg,
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

export default DeviceManagementScreen;


