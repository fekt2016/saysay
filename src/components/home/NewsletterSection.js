
 
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme';


const NewsletterSection = ({ onSubscribe }) => {
  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.newsletterSection}
    >
      <Text style={styles.newsletterIcon}>✉️</Text>
      <Text style={styles.newsletterTitle}>Subscribe to our Newsletter</Text>
      <Text style={styles.newsletterDesc}>Get the latest updates on new products and upcoming sales</Text>
      <TouchableOpacity style={styles.newsletterButton} onPress={onSubscribe}>
        <Text style={styles.newsletterButtonText}>Subscribe</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  newsletterSection: {
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.xl,
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.xl,
    alignItems: 'center',
  },
  newsletterIcon: {
    fontSize: 48,
    marginBottom: theme.spacing.md,
  },
  newsletterTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.white,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  newsletterDesc: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.white,
    opacity: 0.9,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  newsletterButton: {
    backgroundColor: theme.colors.white,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: theme.borderRadius.full,
  },
  newsletterButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.primary,
  },
});

export default NewsletterSection;



