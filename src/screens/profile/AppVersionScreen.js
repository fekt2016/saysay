import React, { useLayoutEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { theme } from '../../theme';
import LogoIcon from '../../components/header/LogoIcon';
import ProfileSection from '../../components/profile/ProfileSection';const AppVersionScreen = () => {
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => <LogoIcon />,
      headerTitle: 'App Version',
      headerStyle: {
        backgroundColor: theme.colors.white,
      },
      headerShadowVisible: false,
    });
  }, [navigation]);

  const appName = Constants.expoConfig?.name || 'EazShop';
  const appVersion = Constants.expoConfig?.version || '1.0.0';
  const buildNumber = Platform.select({
    ios: Constants.expoConfig?.ios?.buildNumber || '1.0.0',
    android: Constants.expoConfig?.android?.versionCode?.toString() || '1',
    default: '1.0.0',
  });
  const environment = __DEV__ ? 'Development' : 'Production';
  const bundleId = Platform.select({
    ios: Constants.expoConfig?.ios?.bundleIdentifier || 'com.eazshop.buyer',
    android: Constants.expoConfig?.android?.package || 'com.eazshop.buyer',
    default: 'com.eazshop.buyer',
  });

  const appInfoItems = [
    {
      label: 'App Name',
      value: appName,
      icon: 'apps-outline',
    },
    {
      label: 'Version',
      value: appVersion,
      icon: 'document-text-outline',
    },
    {
      label: 'Build Number',
      value: buildNumber,
      icon: 'construct-outline',
    },
    {
      label: 'Environment',
      value: environment,
      icon: 'server-outline',
      badge: environment === 'Production' ? 'prod' : 'dev',
    },
    {
      label: 'Platform',
      value: Platform.OS === 'ios' ? 'iOS' : Platform.OS === 'android' ? 'Android' : 'Unknown',
      icon: 'phone-portrait-outline',
    },
    {
      label: 'Bundle ID',
      value: bundleId,
      icon: 'key-outline',
      isLong: true,
    },
  ];

  const renderInfoRow = (item, index) => {
    const isLast = index === appInfoItems.length - 1;

    return (
      <View key={item.label} style={[styles.infoRow, isLast && styles.lastInfoRow]}>
        <View style={styles.infoLeft}>
          <View style={[styles.infoIconContainer, { backgroundColor: theme.colors.primary + '15' }]}>
            <Ionicons name={item.icon} size={20} color={theme.colors.primary} />
          </View>
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoLabel}>{item.label}</Text>
            <Text style={[styles.infoValue, item.isLong && styles.infoValueLong]} numberOfLines={item.isLong ? 2 : 1}>
              {item.value}
            </Text>
          </View>
        </View>
        {item.badge && (
          <View style={[
            styles.badge,
            item.badge === 'prod' ? styles.badgeProd : styles.badgeDev
          ]}>
            <Text style={styles.badgeText}>{item.badge.toUpperCase()}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        <View style={styles.appIconSection}>
          <View style={styles.appIconContainer}>
            <Ionicons name="cube-outline" size={64} color={theme.colors.primary} />
          </View>
          <Text style={styles.appName}>{appName}</Text>
          <Text style={styles.appVersion}>Version {appVersion}</Text>
        </View>

        <ProfileSection title="App Information">
          {appInfoItems.map((item, index) => renderInfoRow(item, index))}
        </ProfileSection>

        <View style={styles.legalSection}>
          <Text style={styles.legalTitle}>Legal Notice</Text>
          <Text style={styles.legalText}>
            This application is protected by copyright laws and international copyright treaties, as well as other intellectual property laws and treaties.
          </Text>
          <Text style={styles.legalText}>
            © {new Date().getFullYear()} EazWorld. All rights reserved.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Thank you for using {appName}
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

  appIconSection: {
    alignItems: 'center',
    paddingVertical: theme.spacing['4xl'] || theme.spacing.xl * 2,
    paddingHorizontal: theme.spacing.xl,
  },
  appIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 24,
    backgroundColor: theme.colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  appName: {
    fontSize: theme.typography.fontSize['2xl'] || theme.typography.fontSize.xl * 1.5,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  appVersion: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.grey100 || theme.colors.grey200,
  },
  lastInfoRow: {
    borderBottomWidth: 0,
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs / 2,
  },
  infoValue: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textPrimary,
  },
  infoValueLong: {
    fontSize: theme.typography.fontSize.sm,
  },

  badge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm || 12,
    marginLeft: theme.spacing.sm,
  },
  badgeProd: {
    backgroundColor: theme.colors.green + '20',
  },
  badgeDev: {
    backgroundColor: theme.colors.orange + '20',
  },
  badgeText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
  },

  legalSection: {
    backgroundColor: theme.colors.white,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.lg,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.grey200,
  },
  legalTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  legalText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
    lineHeight: theme.typography.fontSize.xs * 1.6,
    marginBottom: theme.spacing.xs,
  },

  footer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.md,
  },
  footerText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
});

export default AppVersionScreen;


