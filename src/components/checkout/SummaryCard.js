
 
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../theme';


const SummaryCard = ({ children, style }) => {
  return (
    <View style={[styles.container, style]}>
      {children}
    </View>
  );
};

export const SummaryItem = ({ label, value, isTotal = false }) => {
  return (
    <View style={[styles.item, isTotal && styles.totalItem]}>
      <Text style={[styles.label, isTotal && styles.totalLabel]}>
        {label}
      </Text>
      <Text style={[styles.value, isTotal && styles.totalValue]}>
        {value}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.md,
    borderWidth: 1,
    borderColor: theme.colors.grey200,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: theme.spacing.sm,
  },
  totalItem: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.grey200,
  },
  label: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.grey700,
  },
  value: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.grey900,
    fontWeight: theme.typography.fontWeight.medium,
  },
  totalLabel: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.grey900,
  },
  totalValue: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary700,
  },
});

export default SummaryCard;



