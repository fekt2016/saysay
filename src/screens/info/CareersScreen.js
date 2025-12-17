import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../theme';
import SectionHeader from '../../components/SectionHeader';
import InfoCard from '../../components/InfoCard';

const CareersScreen = ({ navigation }) => {
  const positions = [
    {
      title: 'Senior Frontend Developer',
      department: 'Engineering',
      location: 'Accra, Ghana',
      type: 'Full-time',
    },
    {
      title: 'Product Designer',
      department: 'Design',
      location: 'Accra, Ghana',
      type: 'Full-time',
    },
    {
      title: 'Marketing Manager',
      department: 'Marketing',
      location: 'Accra, Ghana',
      type: 'Full-time',
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <SectionHeader title="Careers" />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.introSection}>
          <Text style={styles.introTitle}>Join Our Team</Text>
          <Text style={styles.introText}>
            We're always looking for talented individuals to join our growing team.
            Explore open positions below and help us build the future of e-commerce in Ghana.
          </Text>
        </View>

        <View style={styles.positionsSection}>
          <Text style={styles.sectionTitle}>Open Positions</Text>
          {positions.map((position, index) => (
            <InfoCard
              key={index}
              title={position.title}
              description={`${position.department} • ${position.location} • ${position.type}`}
              icon="💼"
              onPress={() => {}}
            />
          ))}
        </View>

        <View style={styles.ctaSection}>
          <Text style={styles.ctaTitle}>Don't see a role that fits?</Text>
          <Text style={styles.ctaText}>
            Send us your resume at careers@eazshop.com and we'll keep you in mind for future opportunities.
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
  introSection: {
    marginBottom: theme.spacing.xl,
  },
  introTitle: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  introText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text,
    lineHeight: theme.typography.fontSize.md * theme.typography.lineHeight.relaxed,
  },
  positionsSection: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  ctaSection: {
    backgroundColor: theme.colors.grey100,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md || 12,
    marginBottom: theme.spacing.xl,
  },
  ctaTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  ctaText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text,
    lineHeight: theme.typography.fontSize.md * theme.typography.lineHeight.normal,
  },
});

export default CareersScreen;


