import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../theme';
import SectionHeader from '../../components/SectionHeader';

const ShippingInfoScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <SectionHeader title="Shipping Information" />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Areas</Text>
          <Text style={styles.body}>
            We deliver to all major cities and towns across Ghana. Delivery times vary
            by location, typically 1-3 business days for urban areas and 3-5 business
            days for rural areas.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shipping Fees</Text>
          <View style={styles.feeCard}>
            <Text style={styles.feeItem}>• Standard Delivery: ₵10 - ₵30</Text>
            <Text style={styles.feeItem}>• Express Delivery: ₵30 - ₵50</Text>
            <Text style={styles.feeItem}>• Free shipping on orders over ₵200</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Options</Text>
          <View style={styles.optionCard}>
            <Text style={styles.optionTitle}>Home Delivery</Text>
            <Text style={styles.optionDesc}>
              We deliver directly to your doorstep. Make sure someone is available to receive the package.
            </Text>
          </View>
          <View style={styles.optionCard}>
            <Text style={styles.optionTitle}>Pickup Points</Text>
            <Text style={styles.optionDesc}>
              Choose from our network of pickup centers for convenient collection.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tracking Your Order</Text>
          <Text style={styles.body}>
            Once your order is shipped, you'll receive a tracking number via SMS and email.
            Use this to track your order in real-time through the Orders section.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    padding: theme.spacing.md,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  body: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text,
    lineHeight: theme.typography.fontSize.md * theme.typography.lineHeight.relaxed,
  },
  feeCard: {
    backgroundColor: theme.colors.white,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md || 12,
  },
  feeItem: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
    lineHeight: theme.typography.fontSize.md * theme.typography.lineHeight.normal,
  },
  optionCard: {
    backgroundColor: theme.colors.white,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md || 12,
    marginBottom: theme.spacing.sm,
  },
  optionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  optionDesc: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: theme.typography.fontSize.sm * theme.typography.lineHeight.normal,
  },
});

export default ShippingInfoScreen;


