import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Logo from './Logo';

const HeaderLogo = ({ style }) => {
  const navigation = useNavigation();

  const handlePress = () => {
    navigation.navigate('Main', {
      screen: 'HomeTab',
      params: {
        screen: 'Home',
      },
    });
  };

  return (
    <TouchableOpacity 
      onPress={handlePress} 
      activeOpacity={0.8}
      style={[{ paddingHorizontal: 8 }, style]}
    >
      <Logo variant="compact" />
    </TouchableOpacity>
  );
};

export default HeaderLogo;
