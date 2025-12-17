import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import InfoCard from '../../components/InfoCard';
import { theme } from '../../theme';

const SitemapScreen = () => {
  const navigation = useNavigation();

  const categories = [
    { name: 'Shop', screens: ['Home', 'Products', 'Categories', 'Search'] },
    { name: 'Account', screens: ['Profile', 'Orders', 'Addresses', 'Wishlist'] },
    { name: 'Support', screens: ['Help Center', 'Contact', 'Tickets'] },
    { name: 'Info', screens: ['About', 'Careers', 'Partner', 'Policies'] },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Sitemap</Text>
        </View>
        {categories.map((category, index) => (
          <InfoCard
            key={index}
            title={category.name}
            description={category.screens.join(', ')}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { flex: 1, padding: theme.spacing.md },
  header: { marginBottom: theme.spacing.lg },
  title: { fontSize: theme.typography.fontSize['2xl'], fontWeight: theme.typography.fontWeight.bold, color: theme.colors.text },
});

export default SitemapScreen;
