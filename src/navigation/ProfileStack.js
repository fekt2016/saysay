import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AccountSettingScreen from '../screens/profile/ProfileScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import AddressesScreen from '../screens/profile/AddressesScreen';
import NotificationsScreen from '../screens/profile/NotificationsScreen';
import PaymentMethodScreen from '../screens/profile/PaymentMethodScreen';
import BrowserHistoryScreen from '../screens/profile/BrowserHistoryScreen';
import FollowScreen from '../screens/profile/FollowScreen';
import PermissionScreen from '../screens/profile/PermissionScreen';
import ChatScreen from '../screens/support/ChatScreen';
import WishlistScreen from '../screens/wishlist/WishlistScreen';
import CouponScreen from '../screens/coupons/CouponScreen';
import ProductDetailScreen from '../screens/products/ProductDetailScreen';
import { defaultHeaderOptions } from './headerConfig';

const Stack = createNativeStackNavigator();

const ProfileStack = () => {
  return (
    <Stack.Navigator
      screenOptions={defaultHeaderOptions}
    >
      <Stack.Screen 
        name="Profile" 
        component={AccountSettingScreen}
        options={{ title: 'Profile' }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ 
          presentation: 'card',
          title: 'Edit Profile',
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
        name="PaymentMethod"
        component={PaymentMethodScreen}
        options={{ 
          presentation: 'card',
          title: 'Payment Methods',
        }}
      />
      <Stack.Screen
        name="BrowserHistory"
        component={BrowserHistoryScreen}
        options={{ 
          presentation: 'card',
          title: 'Browser History',
        }}
      />
      <Stack.Screen
        name="Follow"
        component={FollowScreen}
        options={{ 
          presentation: 'card',
          title: 'Follow',
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
        name="Coupon"
        component={CouponScreen}
        options={{ 
          presentation: 'card',
          title: 'Coupons',
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
        name="Wishlist"
        component={WishlistScreen}
        options={{ 
          presentation: 'card',
          title: 'Wishlist',
        }}
      />
      <Stack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={{ 
          presentation: 'card',
          title: 'Product Details',
        }}
      />
    </Stack.Navigator>
  );
};

export default ProfileStack;
