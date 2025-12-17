import React, { useLayoutEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../theme';
import LogoIcon from '../../components/header/LogoIcon';
import HeaderSearchInput from '../../components/header/HeaderSearchInput';
import HeaderAvatar from '../../components/header/HeaderAvatar';

const PrivacyPolicyScreen = () => {
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => <LogoIcon />,
      headerTitle: () => <HeaderSearchInput />,
      headerRight: () => <HeaderAvatar />,
    });
  }, [navigation]);

  const today = new Date();
  const effectiveDate = today.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handleContactSupport = () => {
    try {
      navigation.navigate('Support');
    } catch {
      navigation.navigate('AccountTab', { screen: 'Chat' });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        <View style={styles.header}>
          <Text style={styles.title}>Privacy Policy</Text>
          <Text style={styles.effectiveDate}>Effective Date: {effectiveDate}</Text>
          <Text style={styles.introText}>
            At EazShop, operated by EazWorld, we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, share, and safeguard your information when you use our marketplace platform, including our website and mobile applications. By using EazShop, you agree to the practices described in this policy.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Introduction</Text>
          <Text style={styles.paragraph}>
            EazShop is an online marketplace operated by EazWorld, connecting buyers with sellers across Ghana and beyond. This Privacy Policy applies to all information collected through our website (eazshop.com), mobile applications, and any other services that link to this policy.
          </Text>
          <Text style={styles.paragraph}>
            We understand the importance of privacy and are dedicated to maintaining the confidentiality and security of your personal information. This policy outlines our practices regarding the collection, use, disclosure, and protection of your data when you interact with our platform as a buyer.
          </Text>
          <Text style={styles.paragraph}>
            Please read this Privacy Policy carefully. If you do not agree with our practices, please do not use our services. We may update this policy from time to time, and we encourage you to review it periodically.
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. What Information We Collect</Text>
          <Text style={styles.paragraph}>
            We collect various types of information to provide you with a seamless shopping experience, process your orders, and improve our services. The information we collect falls into three main categories:
          </Text>

          <Text style={styles.subsectionTitle}>2.1 Information You Provide</Text>
          <View style={styles.bulletList}>
            <View style={styles.bulletItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>
                <Text style={styles.bold}>Account and Profile Information:</Text> When you create an account, we collect your name, email address, phone number, password, and any preferences you set. You may also provide additional profile information such as your date of birth, gender, and communication preferences.
              </Text>
            </View>
            <View style={styles.bulletItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>
                <Text style={styles.bold}>Order and Checkout Information:</Text> To process your purchases, we collect your shipping address, billing address, contact phone number, and payment information. Payment details are processed securely through our payment service providers and are not stored on our servers.
              </Text>
            </View>
            <View style={styles.bulletItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>
                <Text style={styles.bold}>Customer Support Communications:</Text> When you contact our support team, we collect the information you provide, including your messages, inquiries, support tickets, and any attachments you send.
              </Text>
            </View>
            <View style={styles.bulletItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>
                <Text style={styles.bold}>Reviews and User-Generated Content:</Text> When you write product reviews, submit ratings, upload photos or videos, or post comments, we collect and store this content along with your account information.
              </Text>
            </View>
          </View>

          <Text style={styles.subsectionTitle}>2.2 Information from Third-Party Sources</Text>
          <View style={styles.bulletList}>
            <View style={styles.bulletItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>
                <Text style={styles.bold}>Social Media Logins:</Text> If you choose to sign in using social media accounts, we receive information from those platforms, including your name, email address, profile picture, and other information you have authorized them to share.
              </Text>
            </View>
            <View style={styles.bulletItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>
                <Text style={styles.bold}>Payment Providers:</Text> Our payment processors share transaction information with us, including payment method details, transaction status, and fraud prevention data.
              </Text>
            </View>
            <View style={styles.bulletItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>
                <Text style={styles.bold}>Logistics Partners:</Text> Delivery and shipping partners provide us with delivery status updates, address verification, and delivery confirmation information.
              </Text>
            </View>
          </View>

          <Text style={styles.subsectionTitle}>2.3 Information Collected Automatically</Text>
          <View style={styles.bulletList}>
            <View style={styles.bulletItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>
                <Text style={styles.bold}>Device Information:</Text> We automatically collect information about the device you use to access EazShop, including your device model, operating system, browser type and version, language preferences, unique device identifiers, and mobile network information.
              </Text>
            </View>
            <View style={styles.bulletItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>
                <Text style={styles.bold}>Usage Data:</Text> We collect information about how you interact with our platform, including the pages you visit, the time you spend on each page, the links you click, the products you view, your search queries, and the referring website or source that led you to EazShop.
              </Text>
            </View>
            <View style={styles.bulletItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>
                <Text style={styles.bold}>Location Information:</Text> We may collect approximate location information based on your IP address or device settings. This helps us provide location-based services, such as showing you products available in your area or calculating shipping costs.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. How and Why We Use Your Information</Text>
          <Text style={styles.paragraph}>
            We use the information we collect for various purposes to provide, maintain, and improve our services, as well as to comply with legal obligations and protect our platform. Here are the main ways we use your information:
          </Text>
          <View style={styles.bulletList}>
            <View style={styles.bulletItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>
                <Text style={styles.bold}>Account Management:</Text> We use your information to create and maintain your account, authenticate your identity, manage your profile, and provide you with access to our services.
              </Text>
            </View>
            <View style={styles.bulletItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>
                <Text style={styles.bold}>Order Processing:</Text> We use your information to process your orders, facilitate payments, arrange shipping and delivery, handle returns and refunds, and communicate with you about your orders.
              </Text>
            </View>
            <View style={styles.bulletItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>
                <Text style={styles.bold}>Service Improvement:</Text> We analyze usage data and feedback to understand how our platform is used, identify areas for improvement, fix technical issues, optimize performance, and develop new features and services.
              </Text>
            </View>
            <View style={styles.bulletItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>
                <Text style={styles.bold}>Personalization:</Text> We use your browsing history, purchase behavior, preferences, and other information to personalize your experience, recommend products you might like, customize content, and show you relevant offers and promotions.
              </Text>
            </View>
            <View style={styles.bulletItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>
                <Text style={styles.bold}>Communication:</Text> We use your contact information to send you order confirmations, shipping updates, account notifications, customer support responses, and important service announcements.
              </Text>
            </View>
            <View style={styles.bulletItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>
                <Text style={styles.bold}>Security and Fraud Prevention:</Text> We use your information to detect, prevent, and investigate fraudulent transactions, unauthorized access, security threats, and other illegal activities.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. How and Why We Share Your Information</Text>
          <Text style={styles.paragraph}>
            We do not sell your personal information. We share your information only in the circumstances described below and always in accordance with this Privacy Policy:
          </Text>
          <View style={styles.bulletList}>
            <View style={styles.bulletItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>
                <Text style={styles.bold}>Service Providers:</Text> We share information with trusted third-party service providers who perform services on our behalf, including hosting, data storage, IT support, customer service, analytics, marketing, payment processing, and logistics.
              </Text>
            </View>
            <View style={styles.bulletItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>
                <Text style={styles.bold}>Payment Processors:</Text> We share payment and transaction information with payment processors and financial institutions to process payments, prevent fraud, and handle payment-related disputes.
              </Text>
            </View>
            <View style={styles.bulletItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>
                <Text style={styles.bold}>Merchants and Sellers:</Text> When you place an order, we share necessary information with the seller to fulfill your order, including your name, shipping address, contact information, and order details. We never share your full payment card information with sellers.
              </Text>
            </View>
            <View style={styles.bulletItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>
                <Text style={styles.bold}>Legal Compliance:</Text> We may share information with legal advisors, auditors, consultants, and government authorities when necessary for legal compliance, fraud prevention, law enforcement, or to protect our rights and the safety of our users.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Your Rights and Choices</Text>
          <Text style={styles.paragraph}>
            You have several rights and choices regarding your personal information. We are committed to helping you exercise these rights:
          </Text>
          <View style={styles.bulletList}>
            <View style={styles.bulletItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>
                <Text style={styles.bold}>Access and Correction:</Text> You can access and update your account information, including your profile, contact details, and preferences, through your account settings.
              </Text>
            </View>
            <View style={styles.bulletItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>
                <Text style={styles.bold}>Deletion:</Text> You can request deletion of your account and personal information by contacting our support team. We will honor your request subject to legal obligations.
              </Text>
            </View>
            <View style={styles.bulletItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>
                <Text style={styles.bold}>Marketing Preferences:</Text> You can opt out of marketing communications at any time by clicking the "unsubscribe" link in marketing emails, adjusting your notification preferences in your account settings, or contacting our support team.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Children</Text>
          <Text style={styles.paragraph}>
            EazShop is not intended for individuals under the age of 18. We do not knowingly collect personal information from children under 18 without appropriate parental consent.
          </Text>
          <Text style={styles.paragraph}>
            If we discover that we have collected information from a child under 18 without proper authorization, we will delete that information promptly. If you are a parent or guardian and believe that your child has provided us with personal information, please contact us immediately.
          </Text>
          <View style={styles.importantNotice}>
            <Text style={styles.importantText}>
              <Text style={styles.bold}>Important:</Text> If you are under 18, please do not use EazShop or provide any personal information to us. If you are a parent or guardian, please supervise your children's use of the internet and our services.
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Data Security and Retention</Text>
          <Text style={styles.paragraph}>
            We implement administrative, technical, and physical safeguards designed to protect your personal information from unauthorized access, disclosure, alteration, and destruction. These measures include:
          </Text>
          <View style={styles.bulletList}>
            <View style={styles.bulletItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>Encryption of data in transit and at rest</Text>
            </View>
            <View style={styles.bulletItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>Secure payment processing through PCI-DSS compliant payment partners</Text>
            </View>
            <View style={styles.bulletItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>Regular security assessments and vulnerability testing</Text>
            </View>
            <View style={styles.bulletItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>Access controls and authentication mechanisms</Text>
            </View>
          </View>
          <Text style={styles.paragraph}>
            However, no method of transmission over the internet or electronic storage is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>Data Retention:</Text> We retain your personal information only for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law.
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. International Transfers</Text>
          <Text style={styles.paragraph}>
            EazWorld operates globally, and your information may be transferred to, stored in, and processed in countries other than your country of residence. These countries may have data protection laws that differ from those in your jurisdiction.
          </Text>
          <Text style={styles.paragraph}>
            When we transfer your information internationally, we take steps to ensure that appropriate safeguards are in place to protect your data. By using EazShop, you consent to the transfer of your information to countries outside your country of residence.
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Changes to this Privacy Policy</Text>
          <Text style={styles.paragraph}>
            We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or for other reasons. When we make changes, we will update the "Effective Date" at the top of this policy.
          </Text>
          <Text style={styles.paragraph}>
            For material changes that significantly affect your rights or how we use your information, we will provide additional notice through email notifications, prominent notices on our website or mobile app, or other methods as required by applicable law.
          </Text>
          <Text style={styles.paragraph}>
            We encourage you to review this Privacy Policy periodically to stay informed about how we protect your information. Your continued use of EazShop after changes become effective constitutes your acceptance of the updated Privacy Policy.
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. Contact Us</Text>
          <Text style={styles.paragraph}>
            If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
          </Text>
          <View style={styles.bulletList}>
            <View style={styles.bulletItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>
                <Text style={styles.bold}>Email:</Text> privacy@eazworld.com
              </Text>
            </View>
            <View style={styles.bulletItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>
                <Text style={styles.bold}>Support Center:</Text> You can also reach out through our Support Center for general inquiries.
              </Text>
            </View>
          </View>
          <Text style={styles.paragraph}>
            We will respond to your inquiries and requests in a timely manner and in accordance with applicable data protection laws.
          </Text>
        </View>

        <View style={styles.helpSection}>
          <Text style={styles.helpTitle}>Need More Help?</Text>
          <Text style={styles.helpText}>
            If you have questions about your privacy or data protection, our support team is here to assist you.
          </Text>
          <TouchableOpacity
            style={styles.helpButton}
            onPress={handleContactSupport}
            activeOpacity={0.7}
          >
            <Ionicons name="headset-outline" size={20} color={theme.colors.white} />
            <Text style={styles.helpButtonText}>Contact Support</Text>
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
  header: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.grey200,
  },
  title: {
    fontSize: theme.typography.fontSize['2xl'] || 28,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  effectiveDate: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: theme.spacing.md,
  },
  introText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textPrimary,
    lineHeight: theme.typography.fontSize.base * 1.6,
  },
  section: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  subsectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  paragraph: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textPrimary,
    lineHeight: theme.typography.fontSize.base * 1.6,
    marginBottom: theme.spacing.md,
  },
  bulletList: {
    marginTop: theme.spacing.sm,
  },
  bulletItem: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
    paddingLeft: theme.spacing.xs,
  },
  bullet: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textPrimary,
    marginRight: theme.spacing.sm,
    width: 20,
  },
  bulletText: {
    flex: 1,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textPrimary,
    lineHeight: theme.typography.fontSize.base * 1.6,
  },
  bold: {
    fontWeight: theme.typography.fontWeight.bold,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.grey200,
    marginVertical: theme.spacing.lg,
    marginHorizontal: theme.spacing.md,
  },
  importantNotice: {
    backgroundColor: theme.colors.warning + '15' || theme.colors.primary + '15',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.warning || theme.colors.primary,
  },
  importantText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textPrimary,
    lineHeight: theme.typography.fontSize.base * 1.6,
  },
  helpSection: {
    backgroundColor: theme.colors.primary,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.xl,
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
  },
  helpTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.white,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  helpText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.white,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    opacity: 0.9,
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    gap: theme.spacing.sm,
  },
  helpButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
});

export default PrivacyPolicyScreen;


