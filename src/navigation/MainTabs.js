import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import HomeStack from './HomeStack';
// import SearchStack from './SearchStack';
// import CategoryStack from './CategoryStack';
// import CartStack from './CartStack';
// import WishlistStack from './WishlistStack';
// import AccountStack from './AccountStack';
import { theme } from '../theme';
import { useCartTotals } from '../hooks/useCart';

const Tab = createBottomTabNavigator();

const HIDE_TAB_BAR_ROUTES = ['ProductDetail', 'CategoryProducts', 'Account', 'PaymentMethod', 'Wishlist', 'Support', 'HelpCenter', 'HelpCenterTabs', 'Orders', 'OrderDetail', 'OrderComplete', 'Settings', 'EditProfile', 'CreditBalance', 'AddMoney', 'SecuritySettings', 'ChangePassword', 'ResetPIN', 'NotificationSettings', 'Permission', 'DeviceManagement', 'Language', 'Region', 'AppVersion'];

const getTabBarVisibility = (route) => {
  const routeName = getFocusedRouteNameFromRoute(route) ?? route?.name ?? 'Home';
  if (HIDE_TAB_BAR_ROUTES.includes(routeName)) {
    return false;
  }
  if (route?.name === 'AccountTab') {
    const focusedRouteName = getFocusedRouteNameFromRoute(route);
    if (focusedRouteName === 'Account' || !focusedRouteName) {
      return false;
    }
  }
  return true;
};

const MainTabs = () => {
  const cartTotals = useCartTotals();
  const cartItemCount = cartTotals?.count || 0;

  const tabBarStyle = {
    borderTopWidth: 0,
    paddingBottom: 6,
    paddingTop: 6,
    height: 55,
    backgroundColor: theme.colors.primary600 || theme.colors.primary500 || '#e29800',
    margin: 20,
    borderRadius: 50,
    position: 'absolute',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
    borderTopColor: 'transparent',
  };

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.black950 || '#000000',
        tabBarInactiveTintColor: theme.colors.grey300,
        tabBarStyle: tabBarStyle,
        tabBarLabelStyle: {
          fontSize: theme.typography.fontSize.xs,
          fontWeight: theme.typography.fontWeight.medium,
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStack}
        options={({ route }) => ({
          title: 'Home',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={styles.iconShadow}>
              <Ionicons 
                name={focused ? 'home' : 'home-outline'} 
                size={size || 24} 
                color={color} 
              />
            </View>
          ),
          tabBarStyle: getTabBarVisibility(route) ? tabBarStyle : { height: 0, overflow: 'hidden' },
        })}
      />
      {/* <Tab.Screen
        name="SearchTab"
        component={SearchStack}
        options={{
          title: 'Search',
          tabBarButton: () => null,
        }}
      /> */}
      {/* <Tab.Screen
        name="CategoryTab"
        component={CategoryStack}
        options={{
          title: 'Category',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={styles.iconShadow}>
              <Ionicons 
                name={focused ? 'grid' : 'grid-outline'} 
                size={size || 24} 
                color={color} 
              />
            </View>
          ),
        }}
      /> */}
      {/* <Tab.Screen
        name="CartTab"
        component={CartStack}
        options={({ route }) => ({
          title: 'Cart',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={styles.cartIconContainer}>
              <View style={styles.iconShadow}>
                <Ionicons 
                  name={focused ? 'cart' : 'cart-outline'} 
                  size={size || 24} 
                  color={color} 
                />
              </View>
              {cartItemCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>
                    {cartItemCount > 99 ? '99+' : cartItemCount}
                  </Text>
                </View>
              )}
            </View>
          ),
          tabBarStyle: getTabBarVisibility(route) ? tabBarStyle : { height: 0, overflow: 'hidden' },
        })}
      /> */}
      {/* <Tab.Screen
        name="WishlistTab"
        component={WishlistStack}
        options={({ route }) => ({
          title: 'Wishlist',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={styles.iconShadow}>
              <Ionicons 
                name={focused ? 'heart' : 'heart-outline'} 
                size={size || 24} 
                color={color} 
              />
            </View>
          ),
          tabBarStyle: getTabBarVisibility(route) ? tabBarStyle : { height: 0, overflow: 'hidden' },
        })}
      /> */}
      {/* <Tab.Screen
        name="AccountTab"
        component={AccountStack}
        options={({ route }) => ({
          title: 'Account',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={styles.iconShadow}>
              <Ionicons 
                name={focused ? 'person' : 'person-outline'} 
                size={size || 24} 
                color={color} 
              />
            </View>
          ),
          tabBarStyle: getTabBarVisibility(route) ? tabBarStyle : { height: 0, overflow: 'hidden' },
        })}
      /> */}
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  iconShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  cartIconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadge: {
    position: 'absolute',
    top: -8,
    right: -12,
    minWidth: 20,
    height: 20,
    paddingVertical: 2,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.error,
    borderRadius: theme.borderRadius.round,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  cartBadgeText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.xxs || 10,
    fontWeight: theme.typography.fontWeight.bold,
  },
});

export default MainTabs;
