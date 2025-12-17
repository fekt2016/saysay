import React, { useLayoutEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useNotificationSettings, useUpdateNotificationSetting } from '../../hooks/useNotification';
import { theme } from '../../theme';
import ProfileSection from '../../components/profile/ProfileSection';
import LogoIcon from '../../components/header/LogoIcon';const NotificationSettingsScreen = () => {
  const navigation = useNavigation();
  const { data: settings, isLoading } = useNotificationSettings();
  const updateSetting = useUpdateNotificationSetting();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => <LogoIcon />,
      headerTitle: 'Notification Settings',
      headerStyle: {
        backgroundColor: theme.colors.white,
      },
      headerShadowVisible: false,
    });
  }, [navigation]);

  const pushSettings = settings?.push || settings?.app || {};
  const emailSettings = settings?.email || {};
  const smsSettings = settings?.sms || {};

  const handleToggle = (path, label) => {
    const currentValue = getNestedValue(settings, path);
    const newValue = !currentValue;

    updateSetting.mutate(
      { path, value: newValue },
      {
        onSuccess: () => {},
        onError: (error) => {
          Alert.alert(
            'Error',
            `Failed to update ${label}. Please try again.`,
            [{ text: 'OK' }]
          );
        },
      }
    );
  };

  const getNestedValue = (obj, path) => {
    const keys = path.split('.');
    let current = obj;
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return false; 
      }
    }
    return current;
  };

  const renderToggleRow = (icon, label, description, path, disabled = false, iconColor = theme.colors.primary) => {
    const value = getNestedValue(settings, path);
    const isUpdating = updateSetting.isPending;

    return (
      <View style={styles.toggleRow}>
        <View style={styles.toggleLeft}>
          <View style={[styles.iconContainer, { backgroundColor: iconColor + '15' }]}>
            <Ionicons name={icon} size={22} color={iconColor} />
          </View>
          <View style={styles.toggleTextContainer}>
            <Text style={[styles.toggleLabel, disabled && styles.disabledText]}>
              {label}
            </Text>
            {description && (
              <Text style={[styles.toggleDescription, disabled && styles.disabledText]}>
                {description}
              </Text>
            )}
          </View>
        </View>
        {isUpdating ? (
          <ActivityIndicator size="small" color={theme.colors.primary} />
        ) : (
          <Switch
            value={value}
            onValueChange={() => handleToggle(path, label)}
            trackColor={{ 
              false: theme.colors.grey300, 
              true: theme.colors.primary 
            }}
            thumbColor={theme.colors.white}
            disabled={disabled}
          />
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading notification settings...</Text>
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
          <Ionicons name="notifications-outline" size={24} color={theme.colors.primary} />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>Manage Your Notifications</Text>
            <Text style={styles.infoDescription}>
              Choose which notifications you want to receive. You can change these settings at any time.
            </Text>
          </View>
        </View>

        <ProfileSection title="Order Notifications">
          {renderToggleRow(
            'cube-outline',
            'Order Updates',
            'Get notified about order status changes',
            'push.orderUpdates',
            false,
            theme.colors.blue || theme.colors.primary
          )}
          {renderToggleRow(
            'car-outline',
            'Delivery Updates',
            'Track your package delivery status',
            'push.restockAlerts', 
            false,
            theme.colors.green || theme.colors.primary
          )}
          {renderToggleRow(
            'card-outline',
            'Refunds',
            'Notifications about refunds and returns',
            'push.accountActivity', 
            false,
            theme.colors.orange || theme.colors.primary
          )}
        </ProfileSection>

        <ProfileSection title="Promotions">
          {renderToggleRow(
            'pricetag-outline',
            'Promotions & Offers',
            'Receive special offers and discounts',
            'push.promotions',
            false,
            theme.colors.purple || theme.colors.primary
          )}
          {renderToggleRow(
            'megaphone-outline',
            'Marketing Notifications',
            'Newsletters and promotional content',
            'email.newsletters', 
            false,
            theme.colors.pink || theme.colors.primary
          )}
        </ProfileSection>

        <ProfileSection title="System">
          {renderToggleRow(
            'download-outline',
            'App Updates',
            'Notifications about app updates and new features',
            'push.recommendations', 
            false,
            theme.colors.indigo || theme.colors.primary
          )}
          {renderToggleRow(
            'shield-checkmark-outline',
            'Security Alerts',
            'Important security notifications (required)',
            'sms.securityAlerts',
            true, 
            theme.colors.red || theme.colors.primary
          )}
        </ProfileSection>

        <View style={styles.footerInfo}>
          <Ionicons name="information-circle-outline" size={16} color={theme.colors.textSecondary} />
          <Text style={styles.footerText}>
            Security alerts are always enabled to keep your account safe. You can manage other notification preferences above.
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
  disabledText: {
    opacity: 0.6,
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

export default NotificationSettingsScreen;


