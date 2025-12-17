import React, { useLayoutEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { useAuth } from '../../hooks/useAuth';
import { useGetOrders } from '../../hooks/useOrder';
import { useCreditBalance } from '../../hooks/useCreditBalance';

import { theme } from '../../theme';

const AccountSettingScreen = () => {
  const navigation = useNavigation();
  const { user, logout } = useAuth();

  const { data: ordersData } = useGetOrders();
  const orders = ordersData?.data?.orders || ordersData?.orders || ordersData || [];
  const orderCount = Array.isArray(orders) ? orders.length : 0;

  const { data: creditBalanceData } = useCreditBalance();
  const creditBalance = creditBalanceData?.data?.wallet?.balance || 
                        creditBalanceData?.data?.creditbalance?.balance || 
                        creditBalanceData?.data?.balance || 
                        0;

  const displayBalance = typeof creditBalance === 'number' && !isNaN(creditBalance) 
    ? creditBalance.toFixed(2) 
    : '0.00';

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <View style={styles.headerLeftContainer}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.headerBackButton}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerUserName} numberOfLines={1}>
            {user?.name || 'User'}
          </Text>
        </View>
      ),
      headerTitle: '',
      headerRight: () => (
        <TouchableOpacity
          style={styles.headerSettingsButton}
          onPress={() => navigation.navigate('Settings')}
          activeOpacity={0.7}
        >
          <Ionicons name="settings-outline" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, user?.name]);

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive', 
          onPress: async () => {
            await logout();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Auth', params: { screen: 'Login' } }],
            });
          }
        },
      ]
    );
  };

  const photoUrl = user?.photo || user?.profilePicture || user?.avatar || user?.image;

  const accountItems = [
    { 
      icon: 'wallet-outline', 
      label: 'Wallet Balance', 
      screen: 'CreditBalance',
      description: `Balance: GH₵${displayBalance}`,
      color: theme.colors.green || theme.colors.primary,
    },
  ];

  const shoppingItems = [
    { 
      icon: 'cube-outline', 
      label: 'My Orders', 
      screen: 'Orders',
      badge: orderCount > 0 ? orderCount.toString() : null,
      color: theme.colors.primary,
    },
    { 
      icon: 'heart-outline', 
      label: 'Wishlist', 
      screen: 'Wishlist',
      color: theme.colors.error,
    },
    { 
      icon: 'location-outline', 
      label: 'My Addresses', 
      screen: 'Addresses',
      description: 'Manage shipping addresses',
      color: theme.colors.blue || theme.colors.primary,
    },
    { 
      icon: 'card-outline', 
      label: 'Payment Methods', 
      screen: 'PaymentMethod',
      description: 'Manage payment options',
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
      icon: 'ticket-outline',
      label: 'Support Tickets',
      description: 'Create and manage support tickets',
      screen: 'Support',
      color: theme.colors.orange || theme.colors.primary,
    },
  ];

  const legalItems = [
    {
      icon: 'document-outline',
      label: 'Terms & Conditions',
      screen: 'Terms',
      color: theme.colors.textSecondary,
    },
    {
      icon: 'shield-checkmark-outline',
      label: 'Privacy Policy',
      screen: 'PrivacyPolicy',
      color: theme.colors.textSecondary,
    },
    {
      icon: 'information-circle-outline',
      label: 'About Us',
      screen: 'About',
      color: theme.colors.textSecondary,
    },
  ];

  const renderSection = (title, items, showDescription = false) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>
        {items.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={() => navigation.navigate(item.screen)}
            activeOpacity={0.7}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: item.color + '15' }]}>
                <Ionicons name={item.icon} size={22} color={item.color} />
              </View>
              <View style={styles.menuItemText}>
                <View style={styles.menuItemLabelRow}>
                  <Text style={styles.menuText}>{item.label}</Text>
                  {item.badge && (
                    <>
                      <View style={{ width: theme.spacing.xs }} />
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{item.badge}</Text>
                      </View>
                    </>
                  )}
                </View>
                {showDescription && item.description && (
                  <Text style={styles.menuDescription}>{item.description}</Text>
                )}
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >

        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              {photoUrl ? (
                <Image
                  source={{ uri: photoUrl }}
                  style={styles.avatar}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>
                    {(user?.name || user?.firstName || user?.email || 'U').charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <TouchableOpacity
                style={styles.editAvatarButton}
                onPress={() => navigation.navigate('Settings')}
                activeOpacity={0.7}
              >
                <Ionicons name="camera" size={14} color={theme.colors.white} />
              </TouchableOpacity>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.name || 'User'}</Text>
              <Text style={styles.profileEmail}>{user?.email || user?.phone || ''}</Text>
            </View>
          </View>

          <View style={styles.statsContainer}>
            <TouchableOpacity
              style={styles.statItem}
              onPress={() => navigation.navigate('Orders')}
              activeOpacity={0.7}
            >
              <Text style={styles.statValue}>{orderCount}</Text>
              <Text style={styles.statLabel}>Orders</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity
              style={styles.statItem}
              onPress={() => navigation.navigate('Wishlist')}
              activeOpacity={0.7}
            >
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Wishlist</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity
              style={styles.statItem}
              onPress={() => navigation.navigate('Addresses')}
              activeOpacity={0.7}
            >
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Addresses</Text>
            </TouchableOpacity>
          </View>
        </View>

        {accountItems.length > 0 && renderSection('Account', accountItems, true)}

        {renderSection('Shopping', shoppingItems, true)}

        {renderSection('Support', supportItems, true)}

        {renderSection('Legal', legalItems)}

        <View style={styles.logoutSection}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={20} color={theme.colors.error} />
            <View style={{ width: theme.spacing.sm }} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Version 1.0.0</Text>
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
  headerLeftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 8,
  },
  headerBackButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  headerUserName: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  headerSettingsButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
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
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    ...theme.shadows.md,
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
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: theme.colors.white,
  },
  avatarPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: theme.colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: theme.colors.white,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
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
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.grey200,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs / 2,
  },
  statLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: theme.colors.grey200,
  },

  section: {
    marginTop: theme.spacing.md,
    marginHorizontal: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
  },
  sectionContent: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    ...theme.shadows.sm,
    borderWidth: 1,
    borderColor: theme.colors.grey200,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.grey100 || theme.colors.grey200,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  menuItemText: {
    flex: 1,
  },
  menuItemLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textPrimary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  menuDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs / 2,
  },
  badge: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.white,
  },

  logoutSection: {
    marginTop: theme.spacing.lg,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.white,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.error + '30',
    gap: theme.spacing.sm,
  },
  logoutText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.error,
  },

  versionContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  versionText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
  },
});

export default AccountSettingScreen;


