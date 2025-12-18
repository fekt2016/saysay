import React, { useState } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

import { useAuth } from '../../hooks/useAuth';

import AppButton from '../../components/AppButton';
import AppInput from '../../components/AppInput';

import { theme } from '../../theme';

const LoginScreen = () => {
  const navigation = useNavigation();
  const { login, verify2FALogin } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [step, setStep] = useState('login'); 
  const [loginSessionId, setLoginSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter your email and password');
      return;
    }

    if (!isValidEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await login(email, password);

      if (result.requires2FA) {

        setLoginSessionId(result.loginSessionId);
        setStep('2fa');
      } else if (result.success) {

        navigation.reset({
          index: 0,
          routes: [
            {
              name: 'Main',
              state: {
                routes: [
                  {
                    name: 'HomeTab',
                    state: {
                      routes: [{ name: 'Home' }],
                      index: 0,
                    },
                  },
                ],
                index: 0,
              },
            },
          ],
        });
      }
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    if (!twoFactorCode || twoFactorCode.length !== 6) {
      setError('Please enter a valid 6-digit 2FA code');
      return;
    }

    if (!loginSessionId) {
      setError('Login session expired. Please login again.');
      setStep('login');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await verify2FALogin(loginSessionId, twoFactorCode);

      if (result.success) {

        navigation.reset({
          index: 0,
          routes: [
            {
              name: 'Main',
              state: {
                routes: [
                  {
                    name: 'HomeTab',
                    state: {
                      routes: [{ name: 'Home' }],
                      index: 0,
                    },
                  },
                ],
                index: 0,
              },
            },
          ],
        });
      }
    } catch (error) {
      setError(error.response?.data?.message || error.message || '2FA verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          <View style={styles.headerGradient}>
            <TouchableOpacity
              onPress={() => navigation.navigate('Main', {
                screen: 'HomeTab',
                params: {
                  screen: 'Home',
                },
              })}
              activeOpacity={0.8}
            >
              <Image
                source={require('../../../assets/logo2.png')}
                style={styles.logoImage}
                resizeMode="contain"
                onError={(error) => {
                  console.error('[LoginScreen] Logo load error:', error);
                }}
                onLoad={() => {
                  console.log('[LoginScreen] Logo loaded successfully');
                }}
              />
            </TouchableOpacity>
            <Text style={styles.title}>Welcome Back</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.header}>

              <Text style={styles.subtitle}>
                {step === 'login'
                  ? 'Sign in to continue shopping'
                  : 'Enter your 2FA code from your authenticator app'}
              </Text>
            </View>

            <View style={styles.form}>
              {step === 'login' ? (
                <>
                  <AppInput
                    label="Email"
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Enter your email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                  />
                  <AppInput
                    label="Password"
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter your password"
                    secureTextEntry
                    autoComplete="password"
                  />
                  {error ? <Text style={styles.errorText}>{error}</Text> : null}

                  <View style={styles.buttonWrapper}>
                    <AppButton
                      title="Sign In"
                      onPress={handleLogin}
                      loading={loading}
                      fullWidth
                    />
                  </View>

                  <View style={styles.linkButtonWrapper}>
                    <AppButton
                      title="Forgot Password?"
                      onPress={() => navigation.navigate('ForgotPassword')}
                      variant="ghost"
                      fullWidth
                    />
                  </View>

                  <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>OR</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  <View style={styles.linkButtonWrapper}>
                    <AppButton
                      title="Create Account"
                      onPress={() => navigation.navigate('Register')}
                      variant="outline"
                      fullWidth
                    />
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.twoFactorTitle}>Two-Factor Authentication</Text>
                  <Text style={styles.twoFactorDescription}>
                    Enter the 6-digit code from your authenticator app (Google Authenticator, Authy, etc.)
                  </Text>
                  <AppInput
                    label="2FA Code"
                    value={twoFactorCode}
                    onChangeText={(text) => setTwoFactorCode(text.replace(/[^0-9]/g, '').slice(0, 6))}
                    placeholder="000000"
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                  {error ? <Text style={styles.errorText}>{error}</Text> : null}

                  <View style={styles.buttonWrapper}>
                    <AppButton
                      title="Verify 2FA Code"
                      onPress={handleVerify2FA}
                      loading={loading}
                      fullWidth
                    />
                  </View>

                  <View style={styles.linkButtonWrapper}>
                    <AppButton
                      title="Back to Login"
                      onPress={() => {
                        setStep('login');
                        setTwoFactorCode('');
                        setLoginSessionId(null);
                        setError('');
                      }}
                      variant="ghost"
                      fullWidth
                    />
                  </View>
                </>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  headerGradient: {
    paddingVertical: theme.spacing['xl'],
    paddingHorizontal: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 120,
    height: 120,
    marginBottom: theme.spacing.md,
  },
  formContainer: {
    flex: 1,
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: theme.borderRadius['2xl'],
    borderTopRightRadius: theme.borderRadius['2xl'],
    marginTop: -20,
    paddingTop: theme.spacing.xl,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
    marginTop: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  form: {
    paddingHorizontal: theme.spacing.xl,
  },
  buttonWrapper: {
    marginTop: theme.spacing.lg,
  },
  linkButtonWrapper: {
    marginTop: theme.spacing.md,
  },
  errorText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.error,
    textAlign: 'center',
    marginTop: theme.spacing.md,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.grey300,
  },
  dividerText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginHorizontal: theme.spacing.md,
  },
  twoFactorTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  twoFactorDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
    lineHeight: theme.typography.fontSize.base * 1.5,
  },
});

export default LoginScreen;


