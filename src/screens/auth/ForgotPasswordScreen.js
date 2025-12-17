import React, { useState } from 'react';
import {
  View,
  Text,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import AppButton from '../../components/AppButton';
import AppInput from '../../components/AppInput';

import authApi from '../../services/authApi';

import { theme } from '../../theme';

const ForgotPasswordScreen = ({ navigation }) => {
  const [loginId, setLoginId] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState('request'); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRequestOtp = async () => {
    if (!loginId) {
      setError('Please enter your email or phone');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await authApi.sendPasswordResetOtp(loginId);
      setStep('verify');
      Alert.alert('Success', 'OTP sent to your email/phone');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) {
      setError('Please enter the OTP');
      return;
    }

    console.log('🔐 [OTP] Password Reset - User entered OTP:', otp);

    setLoading(true);
    setError('');

    try {
      await authApi.verifyPasswordResetOtp(loginId, otp);
      setStep('reset');
    } catch (error) {
      setError(error.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await authApi.resetPassword(loginId, otp, newPassword);
      Alert.alert('Success', 'Password reset successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('Login'),
        },
      ]);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to reset password');
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

          <LinearGradient
            colors={[theme.colors.primary, theme.colors.primary600 || theme.colors.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
          >
            <Text style={styles.logo}>🔐</Text>
            <Text style={styles.appName}>Reset Password</Text>
          </LinearGradient>

          <View style={styles.formContainer}>
            <View style={styles.header}>
              <Text style={styles.title}>
                {step === 'request' && 'Forgot Password?'}
                {step === 'verify' && 'Verify OTP'}
                {step === 'reset' && 'New Password'}
              </Text>
              <Text style={styles.subtitle}>
                {step === 'request' && 'Enter your email or phone to receive OTP'}
                {step === 'verify' && 'Enter the OTP sent to your email/phone'}
                {step === 'reset' && 'Enter your new password'}
              </Text>
            </View>

            <View style={styles.form}>
              {step === 'request' && (
                <>
                  <AppInput
                    label="Email or Phone"
                    value={loginId}
                    onChangeText={setLoginId}
                    placeholder="Enter your email or phone"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  {error ? <Text style={styles.errorText}>{error}</Text> : null}

                  <View style={styles.buttonWrapper}>
                    <AppButton
                      title="Send OTP"
                      onPress={handleRequestOtp}
                      loading={loading}
                      fullWidth
                    />
                  </View>
                </>
              )}

              {step === 'verify' && (
                <>
                  <AppInput
                    label="OTP"
                    value={otp}
                    onChangeText={setOtp}
                    placeholder="Enter 6-digit OTP"
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                  {error ? <Text style={styles.errorText}>{error}</Text> : null}

                  <View style={styles.buttonWrapper}>
                    <AppButton
                      title="Verify OTP"
                      onPress={handleVerifyOtp}
                      loading={loading}
                      fullWidth
                    />
                  </View>

                  <View style={styles.linkButtonWrapper}>
                    <AppButton
                      title="Resend OTP"
                      onPress={handleRequestOtp}
                      variant="outline"
                      fullWidth
                    />
                  </View>
                </>
              )}

              {step === 'reset' && (
                <>
                  <AppInput
                    label="New Password"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="Enter new password (min 8 characters)"
                    secureTextEntry
                  />
                  {error ? <Text style={styles.errorText}>{error}</Text> : null}

                  <View style={styles.buttonWrapper}>
                    <AppButton
                      title="Reset Password"
                      onPress={handleResetPassword}
                      loading={loading}
                      fullWidth
                    />
                  </View>
                </>
              )}

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.linkButtonWrapper}>
                <AppButton
                  title="Back to Login"
                  onPress={() => navigation.navigate('Login')}
                  variant="ghost"
                  fullWidth
                />
              </View>
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
    paddingVertical: theme.spacing['3xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    fontSize: 64,
    marginBottom: theme.spacing.md,
  },
  appName: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.white,
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
  },
  title: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
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
});

export default ForgotPasswordScreen;


