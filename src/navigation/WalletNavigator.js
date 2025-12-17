import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CreditBalanceScreen from '../screens/wallet/CreditBalanceScreen';
import AddMoneyScreen from '../screens/wallet/AddMoneyScreen';
import TopupSuccessScreen from '../screens/wallet/TopupSuccessScreen';
import { defaultHeaderOptions } from './headerConfig';

const Stack = createNativeStackNavigator();

const WalletNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={defaultHeaderOptions}
    >
      <Stack.Screen
        name="CreditBalance"
        component={CreditBalanceScreen}
        options={{ title: 'Wallet Balance' }}
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
    </Stack.Navigator>
  );
};

export default WalletNavigator;
