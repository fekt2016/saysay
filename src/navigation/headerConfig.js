import React from 'react';
import { Image } from 'react-native';
import { theme } from '../theme';
import HeaderLogo from '../components/HeaderLogo';

export const defaultHeaderOptions = {
  headerShown: true,
  headerTransparent: false,
  headerBackVisible: true,
  headerBackTitleVisible: false,
  headerTitleAlign: 'center',
  headerShadowVisible: false,
  headerStyle: {
    backgroundColor: theme.colors.white,
    elevation: 0,
    borderBottomWidth: 0,
  },
  headerTitleStyle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary || theme.colors.grey700,
  },
  headerTintColor: theme.colors.textPrimary || theme.colors.grey700,
  animation: 'slide_from_right',
};

export default defaultHeaderOptions;
