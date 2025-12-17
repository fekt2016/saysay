import React, { useState, useRef, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Alert, Text, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { theme } from '../../theme';
import logger from '../../utils/logger';

const PaystackWebViewScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const webViewRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [currentUrl, setCurrentUrl] = useState('');

  const { authorizationUrl, orderId, amount, email } = route.params || {};

  useEffect(() => {
    logger.debug('[PaystackWebView] 🔍 Screen mounted with params:');
    console.log('[PaystackWebView] Route params:', route.params);
    console.log('[PaystackWebView] authorizationUrl:', authorizationUrl);
    console.log('[PaystackWebView] orderId:', orderId);
    console.log('[PaystackWebView] amount:', amount);
    console.log('[PaystackWebView] email:', email);
    console.log('[PaystackWebView] hasAuthorizationUrl:', !!authorizationUrl);
    console.log('[PaystackWebView] authorizationUrl type:', typeof authorizationUrl);
    console.log('[PaystackWebView] authorizationUrl length:', authorizationUrl?.length);

    if (!authorizationUrl) {
      logger.error('[PaystackWebView] ❌ Missing authorizationUrl in route params');
      logger.debug('[PaystackWebView] Route params:', route.params);
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
      logger.debug('[PaystackWebView] ✅ Authorization URL received:', authorizationUrl);
      console.log('[PaystackWebView] ✅ Will load URL in WebView');
    }
  }, [authorizationUrl, navigation, route.params]);

  const handleNavigationStateChange = (navState) => {
    const { url } = navState;
    console.log('[PaystackWebView] 🔍 Navigation state changed:');
    console.log('[PaystackWebView] URL:', url);
    console.log('[PaystackWebView] Loading:', navState.loading);
    console.log('[PaystackWebView] Title:', navState.title);
    setCurrentUrl(url);
    setLoading(navState.loading);

    if (!url) return;

    const isOrderConfirmation = url.includes('/order-confirmation') || url.includes('order-confirmation');
    const isPaymentComplete = url.includes('payment-complete');
    const isCallbackUrl = isOrderConfirmation || isPaymentComplete;

    if (isCallbackUrl) {
      logger.debug('[PaystackWebView] Detected redirect to callback URL');

      try {

        let urlObj;
        try {
          urlObj = new URL(url);
        } catch {

          const orderIdMatch = url.match(/[?&]orderId=([^&]+)/);
          const referenceMatch = url.match(/[?&]reference=([^&]+)/) || url.match(/[?&]trxref=([^&]+)/);

          if (orderIdMatch) {
            const extractedOrderId = decodeURIComponent(orderIdMatch[1]);
            const reference = referenceMatch ? decodeURIComponent(referenceMatch[1]) : null;

            logger.debug('[PaystackWebView] Extracted from URL string');

            navigation.replace('OrderComplete', {
              orderId: extractedOrderId,
              reference,
              paymentMethod: 'mobile_money',
              needsVerification: !!reference,
            });
            return;
          }
          return;
        }

        const params = new URLSearchParams(urlObj.search);

        const extractedOrderId = params.get('orderId') || orderId;
        const reference = params.get('reference') || params.get('trxref');

        logger.debug('[PaystackWebView] Extracted params');

        if (extractedOrderId) {

          navigation.replace('OrderComplete', {
            orderId: extractedOrderId,
            reference: reference || null,
            paymentMethod: 'mobile_money',
            needsVerification: !!reference,
          });
        }
      } catch (error) {
        logger.error('[PaystackWebView] Error parsing redirect URL:', error);

        const orderIdMatch = url.match(/[?&]orderId=([^&]+)/);
        const referenceMatch = url.match(/[?&]reference=([^&]+)/) || url.match(/[?&]trxref=([^&]+)/);

        if (orderIdMatch) {
          const extractedOrderId = decodeURIComponent(orderIdMatch[1]);
          const reference = referenceMatch ? decodeURIComponent(referenceMatch[1]) : null;

          navigation.replace('OrderComplete', {
            orderId: extractedOrderId,
            reference,
            paymentMethod: 'mobile_money',
            needsVerification: !!reference,
          });
        }
      }
    }
  };

  const handleError = (syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    logger.error('[PaystackWebView] WebView error:', nativeEvent);

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
      'Are you sure you want to cancel this payment? You can complete it later from your orders page.',
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
        onError={handleError}
        onHttpError={handleError}
        onLoadStart={() => {
          console.log('[PaystackWebView] 🔍 WebView onLoadStart');
          console.log('[PaystackWebView] Loading URL:', authorizationUrl);
          setLoading(true);
        }}
        onLoadEnd={() => {
          console.log('[PaystackWebView] ✅ WebView onLoadEnd');
          console.log('[PaystackWebView] Current URL:', currentUrl);
          setLoading(false);
        }}
        onLoad={() => {
          console.log('[PaystackWebView] ✅ WebView onLoad - Page loaded successfully');
        }}
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

export default PaystackWebViewScreen;


