import React, { useState, useLayoutEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useResetPin } from '../../hooks/useProfile';
import { useAuth } from '../../hooks/useAuth';
import useAuthHook from '../../hooks/useAuth';
import { useFocusEffect } from '@react-navigation/native';

import AppInput from '../../components/AppInput';
import AppButton from '../../components/AppButton';
import LogoIcon from '../../components/header/LogoIcon';

import { theme } from '../../theme';

const ResetPINScreen = ({ navigation }) => {
  const { mutate: resetPin, isPending } = useResetPin();
  const { user } = useAuth();
  const { profileData, refetchAuth } = useAuthHook();

  const hasPin = 
    user?.securitySettings?.hasPin === true ||
    profileData?.securitySettings?.hasPin === true ||
    false;

  useFocusEffect(
    useCallback(() => {
      refetchAuth();
    }, [refetchAuth])
  );

  const [formData, setFormData] = useState({
    currentPin: '',
    newPin: '',
    confirmPin: '',
  });
  const [errors, setErrors] = useState({});

  const PIN_LENGTH = 4;

  useLayoutEffect(() => {
    navigation.setOptions({
      title: hasPin ? 'Reset PIN' : 'Set PIN',
    });
  }, [navigation, hasPin]);

  const isValidPin = (pin) => {
    return /^\d+$/.test(pin) && pin.length === PIN_LENGTH;
  };

  const validateForm = () => {
    const newErrors = {};

    if (hasPin) {
      if (!formData.currentPin.trim()) {
        newErrors.currentPin = 'Current PIN is required';
      } else if (!isValidPin(formData.currentPin)) {
        newErrors.currentPin = `PIN must be ${PIN_LENGTH} digits`;
      }
    }

    if (!formData.newPin.trim()) {
      newErrors.newPin = hasPin ? 'New PIN is required' : 'PIN is required';
    } else if (!isValidPin(formData.newPin)) {
      newErrors.newPin = `PIN must be ${PIN_LENGTH} digits`;
    } else if (hasPin && formData.currentPin === formData.newPin) {
      newErrors.newPin = 'New PIN must be different from current PIN';
    }

    if (!formData.confirmPin.trim()) {
      newErrors.confirmPin = 'Please confirm your PIN';
    } else if (!isValidPin(formData.confirmPin)) {
      newErrors.confirmPin = `PIN must be ${PIN_LENGTH} digits`;
    } else if (formData.newPin !== formData.confirmPin) {
      newErrors.confirmPin = 'PINs do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    const pinData = {
      newPin: formData.newPin,
    };

    if (hasPin && formData.currentPin) {
      pinData.currentPin = formData.currentPin;
    }

    resetPin(pinData, {
      onSuccess: (response) => {
        Alert.alert(
          'Success',
          hasPin ? 'Your PIN has been reset successfully.' : 'Your PIN has been set successfully.',
          [
            {
              text: 'OK',
              onPress: () => {

                setFormData({
                  currentPin: '',
                  newPin: '',
                  confirmPin: '',
                });
                setErrors({});

                refetchAuth();

                navigation.goBack();
              },
            },
          ]
        );
      },
      onError: (error) => {
        const errorMessage =
          error?.response?.data?.message ||
          error?.message ||
          'Failed to reset PIN. Please try again.';

        if (errorMessage.toLowerCase().includes('no pin set') ||
            errorMessage.toLowerCase().includes('set a pin first')) {

          setErrors({ 
            currentPin: null,
            newPin: 'Please set your PIN',
          });

          return;
        }

        if (errorMessage.toLowerCase().includes('current pin') ||
            errorMessage.toLowerCase().includes('incorrect pin') ||
            errorMessage.toLowerCase().includes('wrong pin') ||
            errorMessage.toLowerCase().includes('invalid pin')) {
          setErrors({ currentPin: errorMessage });
        } else {
          Alert.alert('Error', errorMessage);
        }
      },
    });
  };

  const updateField = (field, value) => {

    const numericValue = value.replace(/[^0-9]/g, '');

    const limitedValue = numericValue.slice(0, PIN_LENGTH);

    setFormData((prev) => ({ ...prev, [field]: limitedValue }));

    if (errors && errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const isFormValid = () => {
    const baseValid = (
      formData.newPin.length === PIN_LENGTH &&
      formData.confirmPin.length === PIN_LENGTH &&
      formData.newPin === formData.confirmPin
    );

    if (hasPin) {
      return (
        baseValid &&
        formData.currentPin.length === PIN_LENGTH &&
        formData.currentPin !== formData.newPin
      );
    }

    return baseValid;
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          <View style={styles.infoBanner}>
            <Ionicons name="keypad" size={24} color={theme.colors.primary} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>
                {hasPin ? 'Reset Your PIN' : 'Set Your PIN'}
              </Text>
              <Text style={styles.infoDescription}>
                {hasPin 
                  ? `Enter your current PIN and choose a new ${PIN_LENGTH}-digit PIN for your account security.`
                  : `Choose a ${PIN_LENGTH}-digit PIN to secure your account. You'll use this PIN for quick access and secure transactions.`
                }
              </Text>
            </View>
          </View>

          <View style={styles.formContainer}>

            {hasPin && (
              <View style={styles.inputWrapper}>
                <AppInput
                  label="Current PIN"
                  value={formData.currentPin}
                  onChangeText={(value) => updateField('currentPin', value)}
                  placeholder={`Enter ${PIN_LENGTH}-digit current PIN`}
                  secureTextEntry={true}
                  keyboardType="numeric"
                  maxLength={PIN_LENGTH}
                  error={errors.currentPin}
                />
              </View>
            )}

            <View style={styles.inputWrapper}>
              <AppInput
                label={hasPin ? 'New PIN' : 'PIN'}
                value={formData.newPin}
                onChangeText={(value) => updateField('newPin', value)}
                placeholder={`Enter ${PIN_LENGTH}-digit ${hasPin ? 'new ' : ''}PIN`}
                secureTextEntry={true}
                keyboardType="numeric"
                maxLength={PIN_LENGTH}
                error={errors.newPin}
              />
            </View>

            <View style={styles.inputWrapper}>
              <AppInput
                label={hasPin ? 'Confirm New PIN' : 'Confirm PIN'}
                value={formData.confirmPin}
                onChangeText={(value) => updateField('confirmPin', value)}
                placeholder={`Confirm ${PIN_LENGTH}-digit ${hasPin ? 'new ' : ''}PIN`}
                secureTextEntry={true}
                keyboardType="numeric"
                maxLength={PIN_LENGTH}
                error={errors.confirmPin}
              />
            </View>

            <View style={styles.requirementsContainer}>
              <Text style={styles.requirementsTitle}>PIN Requirements:</Text>
              <View style={styles.requirementItem}>
                <Ionicons
                  name={formData.newPin.length === PIN_LENGTH ? 'checkmark-circle' : 'ellipse-outline'}
                  size={16}
                  color={
                    formData.newPin.length === PIN_LENGTH
                      ? theme.colors.success || theme.colors.green
                      : theme.colors.grey400
                  }
                />
                <Text
                  style={[
                    styles.requirementText,
                    formData.newPin.length === PIN_LENGTH && styles.requirementTextMet,
                  ]}
                >
                  Must be exactly {PIN_LENGTH} digits
                </Text>
              </View>
              {hasPin && (
                <View style={styles.requirementItem}>
                  <Ionicons
                    name={
                      formData.newPin !== formData.currentPin && formData.newPin.length === PIN_LENGTH
                        ? 'checkmark-circle'
                        : 'ellipse-outline'
                    }
                    size={16}
                    color={
                      formData.newPin !== formData.currentPin && formData.newPin.length === PIN_LENGTH
                        ? theme.colors.success || theme.colors.green
                        : theme.colors.grey400
                    }
                  />
                  <Text
                    style={[
                      styles.requirementText,
                      formData.newPin !== formData.currentPin &&
                        formData.newPin.length === PIN_LENGTH &&
                        styles.requirementTextMet,
                    ]}
                  >
                    Different from current PIN
                  </Text>
                </View>
              )}
              <View style={styles.requirementItem}>
                <Ionicons
                  name={formData.newPin === formData.confirmPin && formData.confirmPin.length === PIN_LENGTH
                    ? 'checkmark-circle'
                    : 'ellipse-outline'}
                  size={16}
                  color={
                    formData.newPin === formData.confirmPin && formData.confirmPin.length === PIN_LENGTH
                      ? theme.colors.success || theme.colors.green
                      : theme.colors.grey400
                  }
                />
                <Text
                  style={[
                    styles.requirementText,
                    formData.newPin === formData.confirmPin &&
                      formData.confirmPin.length === PIN_LENGTH &&
                      styles.requirementTextMet,
                  ]}
                >
                  PINs match
                </Text>
              </View>
            </View>

            <View style={styles.buttonWrapper}>
              <AppButton
                title={hasPin ? 'Reset PIN' : 'Set PIN'}
                onPress={handleSubmit}
                loading={isPending}
                disabled={isPending || !isFormValid()}
                fullWidth
              />
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xl,
  },

  infoBanner: {
    flexDirection: 'row',
    backgroundColor: theme.colors.primary + '10',
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  infoTextContainer: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  infoTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs / 2,
  },
  infoDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: theme.typography.fontSize.sm * 1.5,
  },

  formContainer: {
    backgroundColor: theme.colors.white,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.sm,
  },
  inputWrapper: {
    marginBottom: theme.spacing.md,
  },

  requirementsContainer: {
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.grey50 || theme.colors.background,
    borderRadius: theme.borderRadius.sm,
  },
  requirementsTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  requirementText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.sm,
  },
  requirementTextMet: {
    color: theme.colors.success || theme.colors.green,
  },

  buttonWrapper: {
    marginTop: theme.spacing.lg,
  },
});

export default ResetPINScreen;


