import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../theme';
import SectionHeader from '../../components/SectionHeader';
import contactInfo from '../../config/contactInfo';

const AboutScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <SectionHeader title="About Us" />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.title}>Welcome to Saysay</Text>
          <Text style={styles.body}>
            Saysay is your trusted online marketplace, connecting buyers and sellers across Ghana.
            We're committed to providing a seamless shopping experience with quality products,
            secure payments, and reliable delivery.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Mission</Text>
          <Text style={styles.body}>
            To make online shopping accessible, convenient, and enjoyable for everyone in Ghana.
            We believe in supporting local businesses while providing customers with the best
            products and services.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Why Choose Saysay?</Text>
          <View style={styles.featureList}>
            <Text style={styles.featureItem}>✓ Wide selection of products</Text>
            <Text style={styles.featureItem}>✓ Secure payment options</Text>
            <Text style={styles.featureItem}>✓ Fast and reliable delivery</Text>
            <Text style={styles.featureItem}>✓ 24/7 customer support</Text>
            <Text style={styles.featureItem}>✓ Verified sellers</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Us</Text>
          <Text style={styles.body}>
            Email: {contactInfo.email.support}{'\n'}
            Phone: {contactInfo.phone.primary}{'\n'}
            Address: {contactInfo.address.street}
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
    marginBottom: theme.spacing.sm,
  },
  body: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text,
    lineHeight: theme.typography.fontSize.md * theme.typography.lineHeight.relaxed,
    marginBottom: theme.spacing.sm,
  },
  featureList: {
    gap: theme.spacing.sm,
  },
  featureItem: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text,
    lineHeight: theme.typography.fontSize.md * theme.typography.lineHeight.normal,
  },
});

export default AboutScreen;


