import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SellerScreen from '../screens/sellers/SellerScreen';
import SellersListScreen from '../screens/sellers/SellersListScreen';
import ProductDetailScreen from '../screens/products/ProductDetailScreen';

const Stack = createNativeStackNavigator();

const SellerNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="SellersList"
        component={SellersListScreen}
      />
      <Stack.Screen
        name="Seller"
        component={SellerScreen}
        options={{ presentation: 'card' }}
      />
      <Stack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={{ presentation: 'card' }}
      />
    </Stack.Navigator>
  );
};

export default SellerNavigator;
