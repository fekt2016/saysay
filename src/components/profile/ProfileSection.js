
 
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../theme';


const ProfileSection = ({ title, children, style }) => {
  return (
    <View style={[styles.container, style]}>
      {title && (
        <Text style={styles.title}>{title}</Text>
      )}
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: theme.spacing.lg,
  },
  title: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  content: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    marginHorizontal: theme.spacing.md,
    overflow: 'hidden',
    ...theme.shadows.sm,
    borderWidth: 1,
    borderColor: theme.colors.grey200,
  },
});

export default ProfileSection;



