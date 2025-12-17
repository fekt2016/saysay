import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CategoriesScreen from '../screens/categories/CategoriesScreen';
import CategoryScreen from '../screens/categories/CategoryScreen';
import ProductListScreen from '../screens/products/ProductListScreen';
import ProductDetailScreen from '../screens/products/ProductDetailScreen';
import { defaultHeaderOptions } from './headerConfig';

const Stack = createNativeStackNavigator();

const CategoryStack = () => {
  return (
    <Stack.Navigator
      screenOptions={defaultHeaderOptions}
    >
      <Stack.Screen 
        name="Categories" 
        component={CategoriesScreen}
        options={{
          title: 'Categories',
        }}
      />
      <Stack.Screen
        name="Category"
        component={CategoryScreen}
        options={{ 
          presentation: 'card',
          title: 'Category',
        }}
      />
      <Stack.Screen
        name="CategoryProducts"
        component={ProductListScreen}
        options={{ 
          presentation: 'card',
          title: 'Products',
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

export default CategoryStack;
