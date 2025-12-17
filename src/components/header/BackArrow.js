import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';

/**
 * BackArrow - Reusable back arrow component for navigation headers
 * 
 * Features:
 * - Only shows if navigation.canGoBack() === true
 * - Calls navigation.goBack() on press
 * - Consistent styling across app
 * - Respects safe areas
 * 
 * Usage:
 * ```jsx
 * useLayoutEffect(() => {
 *   navigation.setOptions({
 *     headerLeft: () => <BackArrow />,
 *   });
 * }, [navigation]);
 * ```
