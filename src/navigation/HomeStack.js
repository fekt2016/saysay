import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/home/HomeScreen';
import ProductDetailScreen from '../screens/products/ProductDetailScreen';
// import ProductListScreen from '../screens/products/ProductListScreen';
// import BestSellersScreen from '../screens/home/BestSellersScreen';
// import NewArrivalsScreen from '../screens/home/NewArrivalsScreen';
// import DealsScreen from '../screens/home/DealsScreen';
// import ReviewScreen from '../screens/reviews/ReviewScreen';
// import SellersListScreen from '../screens/sellers/SellersListScreen';
// import SellerScreen from '../screens/sellers/SellerScreen';
import { defaultHeaderOptions } from './headerConfig';

const Stack = createNativeStackNavigator();

const HomeStack = () => {
  return (
    <Stack.Navigator
      screenOptions={defaultHeaderOptions}
    >
      <Stack.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          headerShown: true,
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
      {/* <Stack.Screen
        name="CategoryProducts"
        component={ProductListScreen}
        options={{ 
          presentation: 'card',
          title: 'Products',
        }}
      />
      <Stack.Screen
        name="BestSellers"
        component={BestSellersScreen}
        options={{ 
          presentation: 'card',
          title: 'Best Sellers',
        }}
      />
      <Stack.Screen
        name="NewArrivals"
        component={NewArrivalsScreen}
        options={{ 
          presentation: 'card',
          title: 'New Arrivals',
        }}
      />
      <Stack.Screen
        name="Deals"
        component={DealsScreen}
        options={{ 
          presentation: 'card',
          title: 'Deals',
        }}
      />
      <Stack.Screen
        name="Review"
        component={ReviewScreen}
        options={{ 
          presentation: 'card',
          title: 'Reviews',
        }}
      />
      <Stack.Screen
        name="SellersList"
        component={SellersListScreen}
        options={{ 
          presentation: 'card',
          title: 'Sellers',
        }}
      />
      <Stack.Screen
        name="Seller"
        component={SellerScreen}
        options={{ 
          presentation: 'card',
          title: 'Seller',
        }}
      /> */}
    </Stack.Navigator>
  );
};

export default HomeStack;
