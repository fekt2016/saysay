import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import CartScreen from '../screens/cart/CartScreen';
import CheckoutScreen from '../screens/checkout/CheckoutScreen';
import PaystackWebViewScreen from '../screens/checkout/PaystackWebViewScreen';
import OrderCompleteScreen from '../screens/orders/OrderCompleteScreen';
import { defaultHeaderOptions } from './headerConfig';
import { useAuth } from '../../hooks/useAuth';

const Stack = createNativeStackNavigator();

const CartStack = () => {
  const navigation = useNavigation();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
    }
  }, [isAuthenticated, navigation]);

  return (
    <Stack.Navigator
      screenOptions={defaultHeaderOptions}
    >
      <Stack.Screen 
        name="Cart" 
        component={CartScreen}
        options={{
          title: 'Cart',
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
        name="Checkout"
        component={CheckoutScreen}
        options={{ 
          presentation: 'card',
          title: 'Checkout',
        }}
      />
      <Stack.Screen
        name="PaystackWebView"
        component={PaystackWebViewScreen}
        options={{ 
          presentation: 'card', 
          gestureEnabled: false,
          title: 'Payment',
        }}
      />
      <Stack.Screen
        name="OrderComplete"
        component={OrderCompleteScreen}
        options={{ 
          presentation: 'card', 
          gestureEnabled: false,
          title: 'Order Confirmation',
        }}
      />
    </Stack.Navigator>
  );
};

export default CartStack;

