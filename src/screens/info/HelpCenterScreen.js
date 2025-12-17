import React, { useState, useLayoutEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../theme';
import LogoIcon from '../../components/header/LogoIcon';

const HelpCenterScreen = () => {
  const navigation = useNavigation();
  const [searchTerm, setSearchTerm] = useState('');

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => <LogoIcon />,
      headerTitle: 'Help Center',
      headerStyle: {
        backgroundColor: theme.colors.white,
      },
      headerShadowVisible: false,
    });
  }, [navigation]);

  const helpCategories = [
    {
      id: 'orders',
      title: 'Orders & Delivery',
      description: 'Track orders, delivery issues, and order modifications',
      icon: 'bag-outline',
      color: theme.colors.blue || theme.colors.primary,
    },
    {
      id: 'payments',
      title: 'Payments & Billing',
      description: 'Payment methods, refunds, and billing questions',
      icon: 'card-outline',
      color: theme.colors.green || theme.colors.primary,
    },
    {
      id: 'shipping',
      title: 'Shipping & Returns',
      description: 'Shipping options, returns, and exchanges',
      icon: 'car-outline',
      color: theme.colors.indigo || theme.colors.primary,
    },
    {
      id: 'account',
      title: 'Account & Profile',
      description: 'Account management, profile updates, and security',
      icon: 'person-outline',
      color: theme.colors.yellow || theme.colors.primary,
    },
    {
      id: 'products',
      title: 'Products & Care',
      description: 'Product information, care guides, and warranties',
      icon: 'cube-outline',
      color: theme.colors.red || theme.colors.primary,
    },
    {
      id: 'returns',
      title: 'Returns & Refunds',
      description: 'Return process, refund policy, and exchanges',
      icon: 'return-down-back-outline',
      color: theme.colors.orange || theme.colors.primary,
    },
  ];

  const quickLinks = [
    {
      title: 'Contact Support',
      description: 'Get in touch with our support team',
      icon: 'shield-checkmark-outline',
      screen: 'Contact',
    },
    {
      title: 'FAQ',
      description: 'Frequently asked questions',
      icon: 'help-circle-outline',
      screen: 'HelpCenterTabs',
    },
    {
      title: 'Shipping Policy',
      description: 'Learn about our shipping options',
      icon: 'car-outline',
      screen: 'ShippingPolicy',
    },
    {
      title: 'Privacy Policy',
      description: 'How we protect your data',
      icon: 'lock-closed-outline',
      screen: 'PrivacyPolicy',
    },
  ];

  const handleCategoryPress = (categoryId) => {

    navigation.navigate('HelpCenterTabs', { category: categoryId });
  };

  const handleQuickLinkPress = (screen) => {
    if (screen === 'HelpCenterTabs') {
      navigation.navigate('HelpCenterTabs');
    } else {

      navigation.navigate(screen);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        <View style={styles.heroSection}>
          <View style={styles.heroIconContainer}>
            <Ionicons name="book-outline" size={48} color={theme.colors.primary} />
          </View>
          <Text style={styles.heroTitle}>Help Center</Text>
          <Text style={styles.heroSubtitle}>
            Find answers to your questions and get the support you need
          </Text>
        </View>

        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Ionicons
              name="search-outline"
              size={20}
              color={theme.colors.textSecondary}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for help articles, FAQs, or topics..."
              placeholderTextColor={theme.colors.textSecondary}
              value={searchTerm}
              onChangeText={setSearchTerm}
              onSubmitEditing={() => {
                if (searchTerm.trim()) {
                  navigation.navigate('HelpCenterTabs', { searchTerm: searchTerm.trim() });
                }
              }}
            />
            {searchTerm.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSearchTerm('');
                  navigation.navigate('HelpCenterTabs', { searchTerm: '' });
                }}
                style={styles.clearButton}
              >
                <Ionicons name="close-circle" size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Browse by Category</Text>
          <Text style={styles.sectionDescription}>
            Find help articles organized by topic
          </Text>
          <View style={styles.categoriesGrid}>
            {helpCategories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={styles.categoryCard}
                onPress={() => handleCategoryPress(category.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.categoryIconContainer, { backgroundColor: category.color + '20' }]}>
                  <Ionicons name={category.icon} size={24} color={category.color} />
                </View>
                <Text style={styles.categoryTitle}>{category.title}</Text>
                <Text style={styles.categoryDescription}>{category.description}</Text>
                <View style={styles.categoryLink}>
                  <Text style={styles.categoryLinkText}>Learn More</Text>
                  <Ionicons name="chevron-forward" size={16} color={category.color} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.section, styles.quickLinksSection]}>
          <Text style={styles.sectionTitle}>Quick Links</Text>
          <Text style={styles.sectionDescription}>
            Common resources and support options
          </Text>
          <View style={styles.quickLinksGrid}>
            {quickLinks.map((link, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickLinkCard}
                onPress={() => handleQuickLinkPress(link.screen)}
                activeOpacity={0.7}
              >
                <View style={styles.quickLinkIconContainer}>
                  <Ionicons name={link.icon} size={24} color={theme.colors.primary} />
                </View>
                <Text style={styles.quickLinkTitle}>{link.title}</Text>
                <Text style={styles.quickLinkDescription}>{link.description}</Text>
                <View style={styles.quickLinkArrow}>
                  <Text style={styles.quickLinkArrowText}>Visit</Text>
                  <Ionicons name="chevron-forward" size={16} color={theme.colors.primary} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.ctaSection}>
          <Text style={styles.ctaTitle}>Still Need Help?</Text>
          <Text style={styles.ctaSubtitle}>
            Our support team is here to assist you 24/7
          </Text>
          <View style={styles.ctaButtons}>
            <TouchableOpacity
              style={styles.ctaButton}
              onPress={() => navigation.navigate('Contact')}
              activeOpacity={0.7}
            >
              <Text style={styles.ctaButtonText}>Contact Support</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.ctaButton, styles.ctaButtonOutline]}
              onPress={() => navigation.navigate('Support')}
              activeOpacity={0.7}
            >
              <Text style={[styles.ctaButtonText, styles.ctaButtonTextOutline]}>
                Open Support Ticket
              </Text>
            </TouchableOpacity>
          </View>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xl,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.md,
  },
  heroIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary100 || theme.colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  heroTitle: {
    fontSize: theme.typography.fontSize['2xl'] || 28,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  searchSection: {
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg || 12,
    borderWidth: 2,
    borderColor: theme.colors.grey200,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  searchIcon: {
    marginRight: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textPrimary,
    paddingVertical: theme.spacing.xs,
  },
  clearButton: {
    padding: theme.spacing.xs,
  },
  section: {
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  sectionDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '48%',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg || 12,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.grey200,
  },
  categoryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  categoryTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold || theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  categoryDescription: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
    lineHeight: theme.typography.fontSize.xs * 1.4,
  },
  categoryLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryLinkText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  quickLinksSection: {
    backgroundColor: theme.colors.grey50 || theme.colors.grey100,
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg || 12,
    marginHorizontal: theme.spacing.md,
  },
  quickLinksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickLinkCard: {
    width: '48%',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md || 10,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.grey200,
  },
  quickLinkIconContainer: {
    marginBottom: theme.spacing.sm,
  },
  quickLinkTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold || theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  quickLinkDescription: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
    lineHeight: theme.typography.fontSize.xs * 1.4,
  },
  quickLinkArrow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickLinkArrowText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.medium,
    marginRight: theme.spacing.xs,
  },
  ctaSection: {
    backgroundColor: theme.colors.primary,
    marginHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.lg || 12,
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.white,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  ctaSubtitle: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.white,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
    opacity: 0.9,
  },
  ctaButtons: {
    width: '100%',
    gap: theme.spacing.md,
  },
  ctaButton: {
    backgroundColor: theme.colors.white,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md || 10,
    alignItems: 'center',
  },
  ctaButtonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: theme.colors.white,
  },
  ctaButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  ctaButtonTextOutline: {
    color: theme.colors.white,
  },
});

export default HelpCenterScreen;


