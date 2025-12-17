import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CategoryScreen from '../screens/categories/CategoryScreen';
import ProductDetailScreen from '../screens/products/ProductDetailScreen';

const Stack = createNativeStackNavigator();

const CategoryNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="Category"
        component={CategoryScreen}
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

export default CategoryNavigator;
