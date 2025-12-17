import React from 'react';
import { View, Image, TouchableOpacity, StyleSheet } from 'react-native';

const Logo = ({ 
  variant = "default",
  onPress = null,
  style = {},
  ...props 
}) => {
  const logoHeight = variant === "compact" ? 50 : variant === "icon" ? 50 : 70;
  const logoWidth = variant === "compact" ? 80 : variant === "icon" ? 100 : 120;

  const logoContent = (
    <View style={[styles.container, style]} {...props}>
      <Image
        source={require('../../assets/logosay.png')}
        style={[styles.logoImage, { width: logoWidth, height: logoHeight }]}
        resizeMode="contain"
      />
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        {logoContent}
      </TouchableOpacity>
    );
  }

  return logoContent;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    flexShrink: 0,
  },
});

export default Logo;
