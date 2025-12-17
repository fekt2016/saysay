import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../theme';
import SectionHeader from '../../components/SectionHeader';
import { getContactEmail } from '../../config/contactInfo';
import contactInfo from '../../config/contactInfo';

const TermsScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <SectionHeader title="Terms of Service" />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.lastUpdated}>Last updated: {new Date().toLocaleDateString()}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
          <Text style={styles.body}>
            By accessing and using Saysay, you accept and agree to be bound by these Terms
            of Service. If you do not agree, please do not use our platform.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Use of the Platform</Text>
          <Text style={styles.body}>
            You agree to use Saysay only for lawful purposes and in accordance with these Terms.
            You must not use the platform in any way that could damage, disable, or impair
            the service.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Account Registration</Text>
          <Text style={styles.body}>
            You are responsible for maintaining the confidentiality of your account credentials.
            You agree to provide accurate and complete information when creating an account.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Products and Pricing</Text>
          <Text style={styles.body}>
            We strive to provide accurate product information and pricing. However, we reserve
            the right to correct any errors and to change prices at any time without notice.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Payment and Orders</Text>
          <Text style={styles.body}>
            All payments are processed securely. By placing an order, you agree to pay the
            total amount including taxes and shipping fees. Orders are subject to acceptance
            and availability.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Limitation of Liability</Text>
          <Text style={styles.body}>
            Saysay shall not be liable for any indirect, incidental, or consequential damages
            arising from your use of the platform.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Us</Text>
          <Text style={styles.body}>
            For questions about these Terms, contact us at:
            {'\n\n'}Email: {getContactEmail('legal')}
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

export default TermsScreen;


