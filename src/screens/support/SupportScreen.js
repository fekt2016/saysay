import React, { useLayoutEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../theme';
import LogoIcon from '../../components/header/LogoIcon';
import HeaderSearchInput from '../../components/header/HeaderSearchInput';
import HeaderAvatar from '../../components/header/HeaderAvatar';

const SupportScreen = () => {
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => <LogoIcon />,
      headerTitle: () => <HeaderSearchInput />,
      headerRight: () => <HeaderAvatar />,
    });
  }, [navigation]);

  const supportCategories = [
    {
      id: 'orders',
      title: 'Order & Delivery Issues',
      description: 'Track your orders, report delivery problems, request order modifications, or get help with shipping questions.',
      icon: 'cube-outline',
      department: 'Orders & Delivery',
      color: '#ffc400',
      bgColor: '#FFF9E6',
    },
    {
      id: 'payments',
      title: 'Payment & Billing',
      description: 'Get assistance with payment methods, refunds, billing questions, payment failures, and transaction issues.',
      icon: 'card-outline',
      department: 'Payments & Billing',
      color: '#0078cc',
      bgColor: '#E6F0FF',
    },
    {
      id: 'shipping',
      title: 'Shipping & Returns',
      description: 'Help with shipping options, return requests, exchange processes, and delivery address changes.',
      icon: 'car-outline',
      department: 'Shipping & Returns',
      color: '#00C896',
      bgColor: '#E6F7F3',
    },
    {
      id: 'account',
      title: 'Account & Profile',
      description: 'Support for account management, profile updates, password resets, security settings, and account verification.',
      icon: 'person-outline',
      department: 'Account & Profile',
      color: '#9C27B0',
      bgColor: '#F3E5F5',
    },
  ];

  const quickLinks = [
    {
      title: 'Help Center',
      screen: 'HelpCenter',
      icon: 'book-outline',
    },
    {
      title: 'Terms & Policies',
      screen: 'Terms',
      icon: 'document-text-outline',
    },
    {
      title: 'Shopping Guides',
      screen: 'HelpCenterTabs',
      icon: 'school-outline',
    },
  ];

  const handleCategoryPress = (category) => {

    navigation.navigate('SupportChat', {
      department: category.department,
    });
  };

  const handleQuickLinkPress = (link) => {
    try {
      navigation.navigate(link.screen);
    } catch (error) {
      console.log('Navigation error:', error);
    }
  };

  const handleViewTickets = () => {
    navigation.navigate('TicketsList');
  };

  const handleChatSupport = () => {
    navigation.navigate('SupportChat');
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
            <Ionicons name="headset" size={48} color={theme.colors.primary} />
          </View>
          <Text style={styles.heroTitle}>We're Here to Help You</Text>
          <Text style={styles.heroSubtext}>
            Get support with your orders, payments, shipping, and account questions.
            Our customer service team is ready to assist you 24/7.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How Can We Help You?</Text>
          <View style={styles.categoriesGrid}>
            {supportCategories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={styles.categoryCard}
                onPress={() => handleCategoryPress(category)}
                activeOpacity={0.7}
              >
                <View style={[styles.categoryIconContainer, { backgroundColor: category.bgColor }]}>
                  <Ionicons name={category.icon} size={32} color={category.color} />
                </View>
                <Text style={styles.categoryTitle}>{category.title}</Text>
                <Text style={styles.categoryDescription}>{category.description}</Text>
                <View style={[styles.categoryButton, { backgroundColor: category.color }]}>
                  <Text style={styles.categoryButtonText}>Open Ticket</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Help Resources</Text>
          <View style={styles.quickLinksGrid}>
            {quickLinks.map((link, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickLinkCard}
                onPress={() => handleQuickLinkPress(link)}
                activeOpacity={0.7}
              >
                <Ionicons name={link.icon} size={24} color={theme.colors.primary} />
                <Text style={styles.quickLinkText}>{link.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Support Tickets</Text>
          <View style={styles.ticketsSection}>
            <Text style={styles.ticketsDescription}>
              View and manage all your support tickets
            </Text>
            <TouchableOpacity
              style={styles.ticketsButton}
              onPress={handleViewTickets}
              activeOpacity={0.7}
            >
              <Ionicons name="ticket-outline" size={20} color={theme.colors.white} />
              <Text style={styles.ticketsButtonText}>View My Tickets</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.chatSection}>
          <Text style={styles.chatTitle}>Need Immediate Assistance?</Text>
          <Text style={styles.chatDescription}>
            Chat with our support agents in real-time for instant help
          </Text>
          <TouchableOpacity
            style={styles.chatButton}
            onPress={handleChatSupport}
            activeOpacity={0.7}
          >
            <Ionicons name="chatbubbles-outline" size={20} color={theme.colors.white} />
            <Text style={styles.chatButtonText}>Chat With Support Agent</Text>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xl,
  },

  heroSection: {
    backgroundColor: theme.colors.white,
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.grey200,
  },
  heroIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  heroTitle: {
    fontSize: theme.typography.fontSize['2xl'] || 28,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  heroSubtext: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: theme.typography.fontSize.base * 1.6,
    paddingHorizontal: theme.spacing.md,
  },

  section: {
    paddingHorizontal: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },

  categoriesGrid: {
    gap: theme.spacing.md,
  },
  categoryCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.sm,
    borderWidth: 1,
    borderColor: theme.colors.grey200,
  },
  categoryIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  categoryTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  categoryDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: theme.typography.fontSize.sm * 1.6,
    marginBottom: theme.spacing.md,
  },
  categoryButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  categoryButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.white,
  },

  quickLinksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  quickLinkCard: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.grey200,
    gap: theme.spacing.xs,
  },
  quickLinkText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },

  ticketsSection: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
    ...theme.shadows.sm,
    borderWidth: 1,
    borderColor: theme.colors.grey200,
  },
  ticketsDescription: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  ticketsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.full,
    gap: theme.spacing.sm,
  },
  ticketsButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.white,
  },

  chatSection: {
    backgroundColor: theme.colors.primary,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.lg,
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
  },
  chatTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.white,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  chatDescription: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.white,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    opacity: 0.9,
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.full,
    gap: theme.spacing.sm,
  },
  chatButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
});

export default SupportScreen;


