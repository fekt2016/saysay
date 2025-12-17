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

import { useAuth } from '../../hooks/useAuth';

import AppButton from '../../components/AppButton';
import AppInput from '../../components/AppInput';
import Logo from '../../components/Logo';

import { theme } from '../../theme';

const RegisterScreen = ({ navigation }) => {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    passwordConfirm: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!formData.name || !formData.email || !formData.phone || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    if (formData.password !== formData.passwordConfirm) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await register(formData);

      if (response?.requiresVerification || response?.data?.requiresVerification) {

        navigation.navigate('OtpVerification', {
          email: formData.email,
          phone: formData.phone,
          isAccountVerification: true, 
        });
      } else {

        Alert.alert('Success', 'Account created! Please login.', [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login'),
          },
        ]);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Registration failed. Please try again.');
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
            <Logo 
              variant="default" 
              onPress={() => navigation.navigate('Main', {
                screen: 'HomeTab',
                params: {
                  screen: 'Home',
                },
              })}
            />
          </LinearGradient>

          <View style={styles.formContainer}>
            <View style={styles.header}>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Sign up to start shopping</Text>
            </View>

            <View style={styles.form}>
              <AppInput
                label="Full Name"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Enter your full name"
                autoCapitalize="words"
              />
              <AppInput
                label="Email"
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <AppInput
                label="Phone"
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                placeholder="024XXXXXXX"
                keyboardType="phone-pad"
              />
              <AppInput
                label="Password"
                value={formData.password}
                onChangeText={(text) => setFormData({ ...formData, password: text })}
                placeholder="Enter your password (min 8 characters)"
                secureTextEntry
              />
              <AppInput
                label="Confirm Password"
                value={formData.passwordConfirm}
                onChangeText={(text) => setFormData({ ...formData, passwordConfirm: text })}
                placeholder="Confirm your password"
                secureTextEntry
              />

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <View style={styles.buttonWrapper}>
                <AppButton
                  title="Create Account"
                  onPress={handleRegister}
                  loading={loading}
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
                  title="Already have an account? Sign In"
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
    paddingVertical: theme.spacing['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
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
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
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
    marginVertical: theme.spacing.lg,
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

export default RegisterScreen;


