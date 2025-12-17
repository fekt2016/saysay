import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Logo from '../Logo';

/**
 * LogoIcon - Small logo component for header left
 */
const LogoIcon = () => {
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
    <TouchableOpacity onPress={handlePress} activeOpacity={0.8} style={styles.container}>
      <Logo variant="compact" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 20,
  },
});

export default LogoIcon;
