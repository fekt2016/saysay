import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import WishlistScreen from '../screens/wishlist/WishlistScreen';
import ProductDetailScreen from '../screens/products/ProductDetailScreen';
import { defaultHeaderOptions } from './headerConfig';

const Stack = createNativeStackNavigator();

const WishlistStack = () => {
  return (
    <Stack.Navigator
      screenOptions={defaultHeaderOptions}
    >
      <Stack.Screen 
        name="Wishlist" 
        component={WishlistScreen}
        options={{ 
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

export default WishlistStack;
