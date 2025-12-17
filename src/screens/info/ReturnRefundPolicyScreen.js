import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../theme';
import SectionHeader from '../../components/SectionHeader';
import { getContactEmail } from '../../config/contactInfo';
import contactInfo from '../../config/contactInfo';

const ReturnRefundPolicyScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <SectionHeader title="Return & Refund Policy" />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.lastUpdated}>Last updated: {new Date().toLocaleDateString()}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Return Eligibility</Text>
          <Text style={styles.body}>
            Items can be returned within 7 days of delivery if they are unused, in original
            packaging, and with all tags attached. Some items may not be eligible for return
            (e.g., perishables, personalized items).
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. How to Return</Text>
          <Text style={styles.body}>
            To initiate a return, go to your Orders section, select the order, and click
            "Return Item". Follow the instructions to complete the return process.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Refund Process</Text>
          <Text style={styles.body}>
            Once we receive and inspect your returned item, we will process your refund within
            5-10 business days. Refunds will be issued to the original payment method.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Shipping Costs</Text>
          <Text style={styles.body}>
            Return shipping costs are the responsibility of the customer unless the item
            was defective or incorrect. In such cases, we will cover the return shipping.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Exchanges</Text>
          <Text style={styles.body}>
            We offer exchanges for items of different sizes or colors, subject to availability.
            Contact our support team to arrange an exchange.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Us</Text>
          <Text style={styles.body}>
            For return or refund inquiries, contact us at:
            {'\n\n'}Email: {getContactEmail('returns')}
            {'\n'}Phone: {contactInfo.phone.primary}
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
  lastUpdated: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
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
});

export default ReturnRefundPolicyScreen;


