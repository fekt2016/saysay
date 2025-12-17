import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme';
import { useWalletBalance, useVerifyTopup } from '../../hooks/useWallet';

const TopupSuccessScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const routeParams = route?.params || {};
  const initialAmount = routeParams?.amount || 0; 
  const reference = routeParams?.reference;
  const { refetch: refetchBalance, data: balanceData } = useWalletBalance();
  const { mutate: verifyTopup, isPending: isVerifying } = useVerifyTopup();
  const [verificationStatus, setVerificationStatus] = useState('pending'); 
  const [hasVerified, setHasVerified] = useState(false);
  const [shouldAutoRedirect, setShouldAutoRedirect] = useState(false);
  const [verifiedAmount, setVerifiedAmount] = useState(null); 
  const [verifiedBalance, setVerifiedBalance] = useState(null); 
  
  
  const redirectTimerRef = useRef(null);
  const balanceRefetchTimerRef = useRef(null);

  
  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
      if (balanceRefetchTimerRef.current) {
        clearTimeout(balanceRefetchTimerRef.current);
      }
    };
  }, []);

  
  useEffect(() => {
    if (reference && !hasVerified) {
      console.log('[TopupSuccess] Verifying payment with reference:', reference);
      setHasVerified(true);
      
      verifyTopup(
        { reference },
        {
          onSuccess: (data) => {
            console.log('[TopupSuccess] Payment verified successfully:', data);
            setVerificationStatus('success');
            
            
            
            const transactionAmount = data?.data?.transaction?.amount || 
                                     data?.transaction?.amount || 
                                     data?.data?.amount || 
                                     null;
            const walletBalance = data?.data?.wallet?.balance || 
                                 data?.data?.wallet?.availableBalance ||
                                 data?.wallet?.balance ||
                                 null;
            
            if (transactionAmount !== null) {
              setVerifiedAmount(transactionAmount);
              console.log('[TopupSuccess] Actual credited amount:', transactionAmount);
            }
            
            if (walletBalance !== null) {
              setVerifiedBalance(walletBalance);
              console.log('[TopupSuccess] Updated wallet balance:', walletBalance);
            }
            
            
            refetchBalance();
            
            
            setShouldAutoRedirect(true);
            redirectTimerRef.current = setTimeout(() => {
              navigation.navigate('CreditBalance');
            }, 2000);
          },
          onError: (error) => {
            console.error('[TopupSuccess] Payment verification failed:', error);
            setVerificationStatus('failed');
            const errorMessage = 
              error?.response?.data?.message || 
              error?.message || 
              'Payment verification failed. Your wallet will be credited once the payment is confirmed.';
            
            
            Alert.alert(
              'Verification Pending',
              errorMessage + '\n\nIf payment was successful, your wallet will be credited shortly.',
              [{ text: 'OK' }]
            );
            
            
            balanceRefetchTimerRef.current = setTimeout(() => {
              refetchBalance();
            }, 2000);
            
            
            setShouldAutoRedirect(true);
            redirectTimerRef.current = setTimeout(() => {
              navigation.navigate('CreditBalance');
            }, 3000);
          },
        }
      );
    } else if (!reference) {
      
      console.log('[TopupSuccess] No reference provided, refetching balance');
      refetchBalance();
      setVerificationStatus('success'); 
      
      
      setShouldAutoRedirect(true);
      redirectTimerRef.current = setTimeout(() => {
        navigation.navigate('CreditBalance');
      }, 1000);
    }
  }, [reference, hasVerified, verifyTopup, refetchBalance, navigation]);

  const handleContinue = () => {
    
    if (redirectTimerRef.current) {
      clearTimeout(redirectTimerRef.current);
      redirectTimerRef.current = null;
    }
    
    navigation.navigate('CreditBalance');
  };

  const handleViewBalance = () => {
    
    if (redirectTimerRef.current) {
      clearTimeout(redirectTimerRef.current);
      redirectTimerRef.current = null;
    }
    navigation.navigate('CreditBalance');
  };

  
  const displayAmount = verifiedAmount !== null ? verifiedAmount : initialAmount;
  
  
  const currentBalance = verifiedBalance !== null 
    ? verifiedBalance 
    : (balanceData?.data?.wallet?.availableBalance ?? 
       balanceData?.data?.wallet?.balance ?? 
       balanceData?.data?.balance ?? 
       0);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.content}>
        <LinearGradient
          colors={[theme.colors.green500, theme.colors.green700]}
          style={styles.successCard}
        >
          <Text style={styles.successIcon}>✓</Text>
          <Text style={styles.successTitle}>Top-up Successful!</Text>
          <Text style={styles.successAmount}>₵{displayAmount.toFixed(2)}</Text>
          <Text style={styles.successMessage}>
            Your wallet has been credited successfully
          </Text>
          {reference && (
            <Text style={styles.referenceText}>Reference: {reference}</Text>
          )}
          {shouldAutoRedirect && (
            <Text style={styles.redirectText}>Redirecting to wallet...</Text>
          )}
        </LinearGradient>

        <View style={styles.infoSection}>
          <View style={styles.infoItem}>
            <View style={styles.infoItemContent}>
              <Text style={styles.infoLabel}>Amount Added</Text>
              <View style={styles.infoValueContainer}>
                <Text style={styles.infoValue}>₵{displayAmount.toFixed(2)}</Text>
                {verifiedAmount !== null && verifiedAmount !== initialAmount && initialAmount > 0 && (
                  <Text style={styles.amountNote}>
                    (Requested: ₵{initialAmount.toFixed(2)})
                  </Text>
                )}
              </View>
            </View>
          </View>
          {verificationStatus === 'success' && (
            <View style={styles.infoItem}>
              <View style={styles.infoItemContent}>
                <Text style={styles.infoLabel}>Current Balance</Text>
                <Text style={styles.infoValue}>₵{currentBalance.toFixed(2)}</Text>
              </View>
            </View>
          )}
          <View style={styles.infoItem}>
            <View style={styles.infoItemContent}>
              <Text style={styles.infoLabel}>Status</Text>
              {isVerifying ? (
                <View style={styles.statusContainer}>
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                  <Text style={[styles.infoValue, { marginLeft: theme.spacing.xs }]}>Verifying...</Text>
                </View>
              ) : (
                <Text style={[styles.infoValue, styles.statusSuccess]}>
                  {verificationStatus === 'failed' ? 'Pending' : 'Completed'}
                </Text>
              )}
            </View>
          </View>
          {reference && (
            <View style={styles.infoItem}>
              <View style={styles.infoItemContent}>
                <Text style={styles.infoLabel}>Transaction ID</Text>
                <Text style={styles.infoValue}>{reference}</Text>
              </View>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
          activeOpacity={0.7}
        >
          <Text style={styles.continueButtonText}>View Wallet Balance</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={handleViewBalance}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>View Wallet Balance</Text>
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
    padding: theme.spacing.md,
    justifyContent: 'center',
  },
  successCard: {
    borderRadius: theme.borderRadius.xl || 20,
    padding: theme.spacing['2xl'],
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  successIcon: {
    fontSize: 64,
    color: theme.colors.white,
    marginBottom: theme.spacing.md,
  },
  successTitle: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.white,
    marginBottom: theme.spacing.sm,
  },
  successAmount: {
    fontSize: theme.typography.fontSize['4xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.white,
    marginBottom: theme.spacing.sm,
  },
  successMessage: {
    fontSize: theme.typography.fontSize.md,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  referenceText: {
    fontSize: theme.typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: theme.spacing.sm,
  },
  redirectText: {
    fontSize: theme.typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: theme.spacing.md,
    fontStyle: 'italic',
  },
  infoSection: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md || 12,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  infoItem: {
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  infoItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  infoValueContainer: {
    alignItems: 'flex-end',
    flex: 1,
  },
  infoLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  infoValue: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text,
  },
  statusSuccess: {
    color: theme.colors.green700,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountNote: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    marginTop: theme.spacing.xs / 2,
    flexBasis: '100%',
  },
  continueButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md || 12,
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  continueButtonText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.white,
  },
  backButton: {
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.semibold,
  },
});

export default TopupSuccessScreen;
