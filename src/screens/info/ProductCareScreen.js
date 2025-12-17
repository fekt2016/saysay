import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../theme';
import SectionHeader from '../../components/SectionHeader';

const ProductCareScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <SectionHeader title="Product Care Guide" />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>General Care Tips</Text>
          <Text style={styles.body}>
            Taking good care of your products ensures they last longer and maintain their quality.
            Follow these general guidelines for different product categories.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Clothing & Textiles</Text>
          <View style={styles.tipCard}>
            <Text style={styles.tipItem}>• Follow washing instructions on the label</Text>
            <Text style={styles.tipItem}>• Wash dark colors separately</Text>
            <Text style={styles.tipItem}>• Air dry when possible to preserve fabric</Text>
            <Text style={styles.tipItem}>• Store in a cool, dry place</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Electronics</Text>
          <View style={styles.tipCard}>
            <Text style={styles.tipItem}>• Keep away from moisture and extreme temperatures</Text>
            <Text style={styles.tipItem}>• Use original chargers and accessories</Text>
            <Text style={styles.tipItem}>• Clean with a soft, dry cloth</Text>
            <Text style={styles.tipItem}>• Store in original packaging when not in use</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Home & Kitchen</Text>
          <View style={styles.tipCard}>
            <Text style={styles.tipItem}>• Clean regularly with appropriate cleaners</Text>
            <Text style={styles.tipItem}>• Follow manufacturer's care instructions</Text>
            <Text style={styles.tipItem}>• Store in dry, well-ventilated areas</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Need More Help?</Text>
          <Text style={styles.body}>
            For specific product care instructions, check the product page or contact
            the seller directly. You can also reach our support team for assistance.
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
  tipCard: {
    backgroundColor: theme.colors.white,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md || 12,
  },
  tipItem: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
    lineHeight: theme.typography.fontSize.md * theme.typography.lineHeight.normal,
  },
});

export default ProductCareScreen;


