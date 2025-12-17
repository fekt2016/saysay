import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';

const OnboardingSlide = ({ title, description, icon, iconColor }) => {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>

        <View style={styles.iconContainer}>
          <Ionicons 
            name={icon || 'checkmark-circle'} 
            size={120} 
            color={iconColor || theme.colors.primary} 
          />
        </View>

        <Text style={styles.title}>{title}</Text>

        <Text style={styles.description}>{description}</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background || '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl || 32,
    paddingVertical: theme.spacing.xxl || 48,
  },
  iconContainer: {
    marginBottom: theme.spacing.xxl || 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: theme.typography?.h1?.fontSize || 32,
    fontWeight: theme.typography?.h1?.fontWeight || 'bold',
    color: theme.colors.text || '#000000',
    textAlign: 'center',
    marginBottom: theme.spacing.lg || 16,
    lineHeight: 40,
  },
  description: {
    fontSize: theme.typography?.body?.fontSize || 16,
    color: theme.colors.textSecondary || '#666666',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: theme.spacing.md || 16,
  },
});

export default OnboardingSlide;


