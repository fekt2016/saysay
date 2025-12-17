
 
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../theme';


const TrustBadges = () => {
  const badges = [
    {
      icon: '🛡️',
      title: 'Secure Payment',
      description: '100% secure payment',
    },
    {
      icon: '🚚',
      title: 'Fast Delivery',
      description: 'Within 24-48 hours',
    },
    {
      icon: '💬',
      title: '24/7 Support',
      description: 'Dedicated support',
    },
  ];

  return (
    <View style={styles.trustSection}>
      <View style={styles.trustGrid}>
        {badges.map((badge, index) => (
          <View key={index} style={styles.trustItem}>
            <Text style={styles.trustIcon}>{badge.icon}</Text>
            <View style={styles.trustInfo}>
              <Text style={styles.trustTitle}>{badge.title}</Text>
              <Text style={styles.trustDesc}>{badge.description}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  trustSection: {
    backgroundColor: theme.colors.white,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.grey200,
  },
  trustGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  trustItem: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
  },
  trustIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  trustInfo: {
    alignItems: 'center',
  },
  trustTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.textPrimary,
    marginBottom: 4,
    textAlign: 'center',
  },
  trustDesc: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});

export default TrustBadges;



