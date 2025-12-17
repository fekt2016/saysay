import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import BackArrow from './BackArrow';
import { theme } from '../../theme';

/**
 * DefaultHeader - Standard header component for detail/form screens
 * 
 * Layout: [← Back] [Title] [optional right]
 * 
 * Features:
 * - Shows back arrow only if canGoBack
 * - Centered title text
 * - Optional right component
 * - Consistent styling
 * 
 * Usage in useLayoutEffect:
 * ```jsx
 * useLayoutEffect(() => {
 *   navigation.setOptions({
 *     headerLeft: () => <BackArrow />,
 *     headerTitle: 'Screen Title',
 *     headerTitleAlign: 'center',
 *     headerStyle: {
 *       backgroundColor: theme.colors.white,
 *       elevation: 0,
 *     },
 *     headerTitleStyle: {
 *       fontSize: theme.typography.fontSize.lg,
 *       fontWeight: theme.typography.fontWeight.bold,
 *       color: theme.colors.textPrimary,
 *     },
 *     headerShadowVisible: false,
 *     headerBackVisible: false, 
 *   });
 * }, [navigation]);
 * ```
 * 
 * Or use the helper function:
 * ```jsx
 * useLayoutEffect(() => {
 *   setDefaultHeader(navigation, 'Screen Title');
 * }, [navigation]);
 * ```
