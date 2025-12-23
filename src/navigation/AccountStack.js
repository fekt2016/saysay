import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import AccountSettingScreen from '../screens/profile/AccountSettingScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import SettingsScreen from '../screens/profile/SettingsScreen';
import AddressesScreen from '../screens/profile/AddressesScreen';
import NotificationsScreen from '../screens/profile/NotificationsScreen';
import NotificationSettingsScreen from '../screens/profile/NotificationSettingsScreen';
import LanguageScreen from '../screens/profile/LanguageScreen';
import RegionScreen from '../screens/profile/RegionScreen';
import AppVersionScreen from '../screens/profile/AppVersionScreen';
import ChatScreen from '../screens/support/ChatScreen';
import TicketsListScreen from '../screens/support/TicketsListScreen';
import SupportScreen from '../screens/support/SupportScreen';
import SupportChatScreen from '../screens/support/SupportChatScreen';
import TicketDetailScreen from '../screens/support/TicketDetailScreen';
import WishlistScreen from '../screens/wishlist/WishlistScreen';
import OrdersScreen from '../screens/orders/OrdersScreen';
import OrderDetailScreen from '../screens/orders/OrderDetailScreen';
import TrackingScreen from '../screens/orders/TrackingScreen';
import PaymentMethodScreen from '../screens/profile/PaymentMethodScreen';
import PermissionScreen from '../screens/profile/PermissionScreen';
import SecuritySettingsScreen from '../screens/profile/SecuritySettingsScreen';
import ChangePasswordScreen from '../screens/profile/ChangePasswordScreen';
import ResetPINScreen from '../screens/profile/ResetPINScreen';
import TwoFactorSetupScreen from '../screens/profile/TwoFactorSetupScreen';
import DeviceManagementScreen from '../screens/profile/DeviceManagementScreen';
import CreditBalanceScreen from '../screens/wallet/CreditBalanceScreen';
import AddMoneyScreen from '../screens/wallet/AddMoneyScreen';
import TopupSuccessScreen from '../screens/wallet/TopupSuccessScreen';
import WalletTopupWebViewScreen from '../screens/wallet/WalletTopupWebViewScreen';
import AboutScreen from '../screens/info/AboutScreen';
import ContactScreen from '../screens/info/ContactScreen';
import HelpCenterScreen from '../screens/info/HelpCenterScreen';
import HelpCenterTabsScreen from '../screens/info/HelpCenterTabsScreen';
import PrivacyPolicyScreen from '../screens/info/PrivacyPolicyScreen';
import TermsScreen from '../screens/info/TermsScreen';
import { defaultHeaderOptions } from './headerConfig';
import { useAuth } from '../hooks/useAuth';
import { theme } from '../theme';
import { hideTabBarOptions, hideTabBarModalOptions } from './tabVisibility';

const Stack = createNativeStackNavigator();

const AccountStack = () => {
  const navigation = useNavigation();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
    }
  }, [isAuthenticated, navigation]);

  return (
    <Stack.Navigator
      initialRouteName="Account"
      screenOptions={defaultHeaderOptions}
    >
      <Stack.Screen 
        name="Account" 
        component={AccountSettingScreen}
        options={{
          title: 'Account Settings',
        }}
        listeners={{
          focus: () => {
            if (!isAuthenticated) {
              navigation.navigate('Auth', { screen: 'Login' });
            }
          },
        }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ 
          presentation: 'card',
          title: 'Profile',
        }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ 
          presentation: 'card',
          title: 'Settings',
        }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ 
          presentation: 'modal',
          gestureEnabled: true,
          title: 'Edit Profile',
          ...hideTabBarModalOptions,
        }}
      />
      <Stack.Screen
        name="Addresses"
        component={AddressesScreen}
        options={{ 
          presentation: 'card',
          title: 'My Addresses',
        }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ 
          presentation: 'card',
          title: 'Notifications',
        }}
      />
      <Stack.Screen
        name="NotificationSettings"
        component={NotificationSettingsScreen}
        options={{ 
          presentation: 'card',
          title: 'Notification Settings',
        }}
      />
      <Stack.Screen
        name="Language"
        component={LanguageScreen}
        options={{ 
          presentation: 'card',
          title: 'Language',
        }}
      />
      <Stack.Screen
        name="Region"
        component={RegionScreen}
        options={{ 
          presentation: 'card',
          title: 'Region',
        }}
      />
      <Stack.Screen
        name="AppVersion"
        component={AppVersionScreen}
        options={{ 
          presentation: 'card',
          title: 'App Version',
        }}
      />
      <Stack.Screen
        name="Permission"
        component={PermissionScreen}
        options={{ 
          presentation: 'card',
          title: 'Permissions',
        }}
      />
      <Stack.Screen
        name="SecuritySettings"
        component={SecuritySettingsScreen}
        options={{ 
          presentation: 'card',
          title: 'Security Settings',
          ...hideTabBarOptions,
        }}
      />
      <Stack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{ 
          presentation: 'card',
          title: 'Change Password',
          ...hideTabBarOptions,
        }}
      />
      <Stack.Screen
        name="ResetPIN"
        component={ResetPINScreen}
        options={{ 
          presentation: 'card',
          title: 'Reset PIN',
          ...hideTabBarOptions,
        }}
      />
      <Stack.Screen
        name="TwoFactorSetup"
        component={TwoFactorSetupScreen}
        options={{ 
          presentation: 'card',
          title: 'Setup Two-Factor Authentication',
          ...hideTabBarOptions,
        }}
      />
      <Stack.Screen
        name="DeviceManagement"
        component={DeviceManagementScreen}
        options={{ 
          presentation: 'card',
          title: 'Device Management',
          ...hideTabBarOptions,
        }}
      />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={{ 
          presentation: 'card',
          title: 'Chat Support',
        }}
      />
      <Stack.Screen
        name="Support"
        component={SupportScreen}
        options={{ 
          presentation: 'card',
          title: 'Support',
        }}
      />
      <Stack.Screen
        name="SupportChat"
        component={SupportChatScreen}
        options={{ 
          presentation: 'card',
          title: 'Create Ticket',
        }}
      />
      <Stack.Screen
        name="TicketsList"
        component={TicketsListScreen}
        options={{ 
          presentation: 'card',
          title: 'Support Tickets',
        }}
      />
      <Stack.Screen
        name="TicketDetail"
        component={TicketDetailScreen}
        options={{ 
          presentation: 'card',
          title: 'Ticket Details',
        }}
      />
      <Stack.Screen
        name="Wishlist"
        component={WishlistScreen}
        options={{ 
          presentation: 'card',
          title: 'Wishlist',
        }}
      />
      <Stack.Screen
        name="Orders"
        component={OrdersScreen}
        options={{ 
          presentation: 'card',
          title: 'Orders',
        }}
      />
      <Stack.Screen
        name="OrderDetail"
        component={OrderDetailScreen}
        options={{ 
          presentation: 'card',
          title: 'Order Details',
        }}
      />
      <Stack.Screen
        name="Tracking"
        component={TrackingScreen}
        options={{ 
          presentation: 'card',
          title: 'Track Order',
          ...hideTabBarOptions,
        }}
      />
      <Stack.Screen
        name="PaymentMethod"
        component={PaymentMethodScreen}
        options={{ 
          presentation: 'card',
          headerShown: true,
          headerBackTitleVisible: false,
          ...hideTabBarOptions,
        }}
      />
      <Stack.Screen
        name="CreditBalance"
        component={CreditBalanceScreen}
        options={{ 
          presentation: 'card',
          title: 'Wallet Balance',
        }}
      />
      <Stack.Screen
        name="AddMoney"
        component={AddMoneyScreen}
        options={{ 
          presentation: 'card',
          title: 'Add Money',
        }}
      />
      <Stack.Screen
        name="TopupSuccess"
        component={TopupSuccessScreen}
        options={{ 
          presentation: 'card',
          title: 'Top-up Success',
        }}
      />
      <Stack.Screen
        name="WalletTopupWebView"
        component={WalletTopupWebViewScreen}
        options={{ 
          presentation: 'modal',
          headerShown: false,
          ...hideTabBarModalOptions,
        }}
      />
      <Stack.Screen
        name="About"
        component={AboutScreen}
        options={{ 
          presentation: 'card',
          title: 'About Us',
        }}
      />
      <Stack.Screen
        name="Contact"
        component={ContactScreen}
        options={{ 
          presentation: 'card',
          title: 'Contact Us',
        }}
      />
      <Stack.Screen
        name="HelpCenter"
        component={HelpCenterScreen}
        options={{ 
          presentation: 'card',
          title: 'Help Center',
        }}
      />
      <Stack.Screen
        name="HelpCenterTabs"
        component={HelpCenterTabsScreen}
        options={{ 
          presentation: 'card',
          title: 'FAQs',
        }}
      />
      <Stack.Screen
        name="PrivacyPolicy"
        component={PrivacyPolicyScreen}
        options={{ 
          presentation: 'card',
          title: 'Privacy Policy',
        }}
      />
      <Stack.Screen
        name="Terms"
        component={TermsScreen}
        options={{ 
          presentation: 'card',
          title: 'Terms & Conditions',
        }}
      />
    </Stack.Navigator>
  );
};

export default AccountStack;
