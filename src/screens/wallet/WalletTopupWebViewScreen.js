import React, { useState, useRef, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Alert, Text, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { theme } from '../../theme';
import logger from '../../utils/logger';const WalletTopupWebViewScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const queryClient = useQueryClient();
  const webViewRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [currentUrl, setCurrentUrl] = useState('');
  const hasRedirectedRef = useRef(false); 

  const { authorizationUrl, amount, email } = route.params || {};

  useEffect(() => {
    logger.debug('[WalletTopupWebView] Screen mounted with params:', {
      authorizationUrl,
      amount,
      email,
      hasAuthorizationUrl: !!authorizationUrl,
    });

    if (!authorizationUrl) {
      logger.error('[WalletTopupWebView] ❌ Missing authorizationUrl in route params');
      logger.debug('[WalletTopupWebView] Route params:', route.params);
      Alert.alert(
        'Error',
        'Payment URL is missing. Please try again.',
        [
          {
            text: 'Go Back',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } else {
      logger.debug('[WalletTopupWebView] ✅ Authorization URL received');
    }
  }, [authorizationUrl, navigation, route.params]);

  const extractReferenceFromUrl = (url) => {
    try {

      const urlObj = new URL(url);
      const params = new URLSearchParams(urlObj.search);
      return params.get('reference') || params.get('trxref');
    } catch {

      const referenceMatch = url.match(/[?&]reference=([^&]+)/) || url.match(/[?&]trxref=([^&]+)/);
      if (referenceMatch) {
        return decodeURIComponent(referenceMatch[1]);
      }
    }
    return null;
  };

  const handlePaymentRedirect = async (url, reference) => {
    if (hasRedirectedRef.current) {
      logger.debug('[WalletTopupWebView] Already redirected, ignoring duplicate');
      return;
    }

    hasRedirectedRef.current = true;
    logger.debug('[WalletTopupWebView] ✅ Payment callback detected, closing WebView');

    navigation.replace('TopupSuccess', {
      amount: amount || null,
      reference: reference || null,
    });

    queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
    queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] });
  };

  const handleNavigationStateChange = (navState) => {
    const { url } = navState;
    setCurrentUrl(url);
    setLoading(navState.loading);

    logger.debug('[WalletTopupWebView] 🔍 URL changed:', {
      url,
      loading: navState.loading,
      canGoBack: navState.canGoBack,
      hasRedirected: hasRedirectedRef.current,
    });

    if (!url || hasRedirectedRef.current) return;

    const isCancelled = 
      url.includes('cancel') 
      url.includes('cancelled') 
      url.includes('payment-cancel') 
      url.includes('payment-cancelled');

    if (isCancelled) {
      logger.debug('[WalletTopupWebView] ❌ Payment cancelled by user');
      hasRedirectedRef.current = true;
      Alert.alert(
        'Payment Cancelled',
        'Your payment was cancelled. You can try again anytime.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
      return;
    }

    const isTopupCallback = url.includes('/wallet/topup-callback') || url.includes('topup-callback');
    const isTopupSuccess = url.includes('/wallet/topup-success') || url.includes('topup-success');
    const isCallbackUrl = isTopupCallback || isTopupSuccess;

    const isDeepLinkCallback = 
      url.startsWith('saysay:
      url.startsWith('saysay:

    if (isCallbackUrl || isDeepLinkCallback) {
      logger.debug('[WalletTopupWebView] ✅ Detected redirect to callback URL');

      try {

        let urlObj;
        let reference = null;

        try {
          urlObj = new URL(url);
          const params = new URLSearchParams(urlObj.search);

          reference = params.get('trxref') || params.get('reference');
        } catch {

          const referenceMatch = url.match(/[?&]reference=([^&]+)/) || url.match(/[?&]trxref=([^&]+)/);
          if (referenceMatch) {
            reference = decodeURIComponent(referenceMatch[1]);
          }
        }

        logger.debug('[WalletTopupWebView] Extracted reference');

        if (reference) {

          handlePaymentRedirect(url, reference);
        } else {

          logger.warn('[WalletTopupWebView] No reference found in URL, navigating anyway');
          handlePaymentRedirect(url, null);
        }
      } catch (error) {
        logger.error('[WalletTopupWebView] Error parsing redirect URL:', error);

        handlePaymentRedirect(url, null);
      }
    }
  };

  const handleError = (syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    logger.error('[WalletTopupWebView] WebView error:', nativeEvent);

    Alert.alert(
      'Payment Error',
      'There was an error loading the payment page. Please try again.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => navigation.goBack(),
        },
        {
          text: 'Retry',
          onPress: () => {
            if (webViewRef.current && authorizationUrl) {
              webViewRef.current.reload();
            }
          },
        },
      ]
    );
  };

  const handleClose = () => {
    Alert.alert(
      'Cancel Payment?',
      'Are you sure you want to cancel this payment? You can complete it later.',
      [
        {
          text: 'Continue Payment',
          style: 'cancel',
        },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: () => {
            navigation.goBack();
          },
        },
      ]
    );
  };

  if (!authorizationUrl) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Payment URL is missing</Text>
          <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Complete Payment</Text>
        <View style={styles.placeholder} />
      </View>

      <WebView
        ref={webViewRef}
        source={{ uri: authorizationUrl }}
        onNavigationStateChange={handleNavigationStateChange}
        onShouldStartLoadWithRequest={(request) => {
          const { url } = request;

          logger.debug('[WalletTopupWebView] 🔍 onShouldStartLoadWithRequest:', {
            url,
            navigationType: request.navigationType,
          });

          const isTopupCallback = url.includes('/wallet/topup-callback') || url.includes('topup-callback');
          const isTopupSuccess = url.includes('/wallet/topup-success') || url.includes('topup-success');
          const isDeepLinkCallback = 
            url.startsWith('saysay:
            url.startsWith('saysay:

          if (isTopupCallback || isTopupSuccess || isDeepLinkCallback) {
            logger.debug('[WalletTopupWebView] ✅ PAYSTACK REDIRECT DETECTED!');
            logger.debug('[WalletTopupWebView] 🚫 Blocked callback URL, handling redirect');
            logger.debug('[WalletTopupWebView] 📝 This is the TRIGGER - Paystack redirected automatically after payment');

            if (isDeepLinkCallback) {
              handleNavigationStateChange({ url, loading: false });
              return false; 
            }

          }

          return true;
        }}
        onError={handleError}
        onHttpError={handleError}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading payment page...</Text>
          </View>
        )}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={true}
        allowsBackForwardNavigationGestures={false}
      />

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Processing payment...</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.white,
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: theme.colors.textPrimary,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  placeholder: {
    width: 32,
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  errorText: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.error,
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  buttonText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semiBold,
  },
});

export default WalletTopupWebViewScreen;


