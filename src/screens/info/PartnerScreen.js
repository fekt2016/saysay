import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../theme';
import SectionHeader from '../../components/SectionHeader';

const PartnerScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <SectionHeader title="Partner With Us" />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.title}>Become a Partner</Text>
          <Text style={styles.body}>
            Join Saysay as a partner and grow your business with us. We offer various
            partnership opportunities for sellers, logistics providers, and service partners.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Partnership Benefits</Text>
          <View style={styles.benefitsList}>
            <Text style={styles.benefitItem}>✓ Increased visibility and reach</Text>
            <Text style={styles.benefitItem}>✓ Marketing support</Text>
            <Text style={styles.benefitItem}>✓ Access to analytics and insights</Text>
            <Text style={styles.benefitItem}>✓ Dedicated partner support</Text>
            <Text style={styles.benefitItem}>✓ Competitive commission rates</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Partner Types</Text>
          <View style={styles.partnerCard}>
            <Text style={styles.partnerType}>Seller Partners</Text>
            <Text style={styles.partnerDesc}>
              List your products on Saysay and reach thousands of customers
            </Text>
          </View>
          <View style={styles.partnerCard}>
            <Text style={styles.partnerType}>Logistics Partners</Text>
            <Text style={styles.partnerDesc}>
              Help us deliver products to customers across Ghana
            </Text>
          </View>
          <View style={styles.partnerCard}>
            <Text style={styles.partnerType}>Service Partners</Text>
            <Text style={styles.partnerDesc}>
              Provide value-added services to our customers
            </Text>
          </View>
        </View>

        <View style={styles.ctaSection}>
          <Text style={styles.ctaTitle}>Ready to Partner?</Text>
          <Text style={styles.ctaText}>
            Contact us at partners@eazshop.com or fill out our partnership form.
          </Text>
          <TouchableOpacity style={styles.ctaButton} activeOpacity={0.7}>
            <Text style={styles.ctaButtonText}>Apply Now</Text>
          </TouchableOpacity>
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
  title: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
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
  benefitsList: {
    gap: theme.spacing.sm,
  },
  benefitItem: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text,
    lineHeight: theme.typography.fontSize.md * theme.typography.lineHeight.normal,
  },
  partnerCard: {
    backgroundColor: theme.colors.white,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md || 12,
    marginBottom: theme.spacing.sm,
  },
  partnerType: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  partnerDesc: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: theme.typography.fontSize.sm * theme.typography.lineHeight.normal,
  },
  ctaSection: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md || 12,
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  ctaTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.white,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  ctaText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.white,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
    lineHeight: theme.typography.fontSize.md * theme.typography.lineHeight.normal,
  },
  ctaButton: {
    backgroundColor: theme.colors.white,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md || 12,
  },
  ctaButtonText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
});

export default PartnerScreen;


