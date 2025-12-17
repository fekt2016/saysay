import React, { useState, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { useWalletBalance, useInitiateTopup } from '../../hooks/useWallet';
import { useAuth } from '../../hooks/useAuth';

const AddMoneyScreen = () => {
  const navigation = useNavigation();
  const { data: balanceData } = useWalletBalance();
  const { user } = useAuth();
  const initiateTopup = useInitiateTopup();
  const [amount, setAmount] = useState('');
  const [selectedAmount, setSelectedAmount] = useState(null);

  const balance = balanceData?.data?.wallet?.balance || balanceData?.data?.balance || balanceData?.balance || 0;
  const quickAmounts = [50, 100, 200, 500, 1000, 2000];

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Add Money',
    });
  }, [navigation]);

  const handleAmountSelect = (value) => {
    setSelectedAmount(value);
    setAmount(value.toString());
  };

  const handleTopup = () => {
    const topupAmount = parseFloat(amount);

    if (!topupAmount || topupAmount < 1) {
      Alert.alert('Error', 'Minimum top-up amount is ₵1.00');
      return;
    }

    if (topupAmount > 10000) {
      Alert.alert('Error', 'Maximum top-up amount is ₵10,000.00');
      return;
    }

    const userEmail = user?.email;
    if (!userEmail) {
      Alert.alert('Error', 'Email is required for payment. Please update your profile.');
      return;
    }

    Alert.alert(
      'Confirm Top-up',
      `Add ₵${topupAmount.toFixed(2)} to your wallet?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Proceed',
          onPress: () => {
            initiateTopup.mutate(
              {
                amount: topupAmount,
                email: userEmail,
              },
              {
                onSuccess: (data) => {
                  console.log('[AddMoneyScreen] Topup initiated successfully:', data);

                  const authorizationUrl = 
                    data?.data?.authorizationUrl ||
                    data?.data?.authorization_url ||
                    data?.authorizationUrl 
                    data?.authorization_url;

                  if (!authorizationUrl) {
                    Alert.alert('Error', 'Failed to get payment URL. Please try again.');
                    return;
                  }

                  try {
                    const url = new URL(authorizationUrl);
                    const isValidPaystack = 
                      url.hostname === 'paystack.com' 
                      url.hostname.endsWith('.paystack.com') 
                      url.hostname === 'checkout.paystack.com';

                    if (!isValidPaystack) {
                      Alert.alert('Error', 'Invalid payment URL. Please contact support.');
                      return;
                    }
                  } catch (error) {
                    Alert.alert('Error', 'Invalid payment URL format. Please contact support.');
                    return;
                  }

                  navigation.navigate('WalletTopupWebView', {
                    authorizationUrl,
                    amount: topupAmount,
                    email: userEmail,
                  });
                },
                onError: (error) => {
                  console.error('[AddMoneyScreen] Topup error:', error);
                  const errorMessage = 
                    error?.response?.data?.message ||
                    error?.message 
                    'Payment initialization failed. Please try again.';
                  Alert.alert('Error', errorMessage);
                },
              }
            );
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Current Balance</Text>
          <Text style={styles.balanceAmount}>₵{balance.toFixed(2)}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Enter Amount</Text>
          <View style={styles.amountInputContainer}>
            <Text style={styles.currencySymbol}>₵</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0.00"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={(text) => {
                const numericValue = text.replace(/[^0-9.]/g, '');
                setAmount(numericValue);
                setSelectedAmount(null);
              }}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Amounts</Text>
          <View style={styles.quickAmountsGrid}>
            {quickAmounts.map((value) => (
              <TouchableOpacity
                key={value}
                style={[
                  styles.quickAmountButton,
                  selectedAmount === value && styles.quickAmountButtonActive,
                ]}
                onPress={() => handleAmountSelect(value)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.quickAmountText,
                    selectedAmount === value && styles.quickAmountTextActive,
                  ]}
                >
                  ₵{value}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoText}>💡 Minimum top-up: ₵1.00</Text>
          <Text style={styles.infoText}>💡 Maximum top-up: ₵10,000.00</Text>
          <Text style={styles.infoText}>💡 Secure payment via Paystack</Text>
          <Text style={styles.infoText}>💡 Funds available immediately</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.topupButton, (!amount || parseFloat(amount) < 10) && styles.topupButtonDisabled]}
          onPress={handleTopup}
          disabled={!amount || parseFloat(amount) < 1 || initiateTopup.isPending}
          activeOpacity={0.7}
        >
          {initiateTopup.isPending ? (
            <ActivityIndicator size="small" color={theme.colors.white} />
          ) : (
            <Text style={styles.topupButtonText}>
              Add ₵{amount ? parseFloat(amount).toFixed(2) : '0.00'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
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
  },
  contentContainer: {
    padding: theme.spacing.md,
    paddingBottom: 100, 
  },
  balanceCard: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md || 12,
    padding: theme.spacing.xl,
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  balanceLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: theme.spacing.xs,
  },
  balanceAmount: {
    fontSize: theme.typography.fontSize['3xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.white,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md || 12,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.white,
  },
  currencySymbol: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
    marginRight: theme.spacing.sm,
  },
  amountInput: {
    flex: 1,
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
    paddingVertical: theme.spacing.md,
  },
  quickAmountsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  quickAmountButton: {
    flex: 1,
    minWidth: '30%',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.md || 12,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  quickAmountButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  quickAmountText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text,
  },
  quickAmountTextActive: {
    color: theme.colors.white,
  },
  infoCard: {
    backgroundColor: theme.colors.grey100,
    borderRadius: theme.borderRadius.md || 12,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  infoText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: theme.typography.fontSize.sm * theme.typography.lineHeight.normal,
  },
  footer: {
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.white,
  },
  topupButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md || 12,
    alignItems: 'center',
  },
  topupButtonDisabled: {
    opacity: 0.5,
  },
  topupButtonText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.white,
  },
});

export default AddMoneyScreen;


