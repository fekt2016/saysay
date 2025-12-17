import React, { useState, useLayoutEffect } from 'react';
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

import { useChangePassword } from '../../hooks/useProfile';

import AppInput from '../../components/AppInput';
import AppButton from '../../components/AppButton';
import LogoIcon from '../../components/header/LogoIcon';

import { theme } from '../../theme';const ChangePasswordScreen = ({ navigation }) => {
  const { mutate: changePassword, isPending } = useChangePassword();

  const [formData, setFormData] = useState({
    passwordCurrent: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerBackButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
      ),
      headerTitle: 'Change Password',
      headerTitleStyle: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.textPrimary,
      },
      headerStyle: {
        backgroundColor: theme.colors.white,
      },
      headerShadowVisible: false,
    });
  }, [navigation]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.passwordCurrent.trim()) {
      newErrors.passwordCurrent = 'Current password is required';
    }

    if (!formData.newPassword.trim()) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    } else if (formData.passwordCurrent === formData.newPassword) {
      newErrors.newPassword = 'New password must be different from current password';
    }

    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    const passwordData = {
      passwordCurrent: formData.passwordCurrent,
      newPassword: formData.newPassword,

      passwordConfirm: formData.confirmPassword,
    };

    changePassword(passwordData, {
      onSuccess: (response) => {
        Alert.alert(
          'Success',
          'Your password has been changed successfully.',
          [
            {
              text: 'OK',
              onPress: () => {

        setFormData({
          passwordCurrent: '',
          newPassword: '',
          confirmPassword: '',
        });
                setErrors();

                navigation.goBack();
              },
            },
          ]
        );
      },
      onError: (error) => {
        const errorMessage =
          error?.response?.data?.message ||
          error?.message 
          'Failed to change password. Please try again.';

        if (errorMessage.toLowerCase().includes('current password') 
            errorMessage.toLowerCase().includes('incorrect password') 
            errorMessage.toLowerCase().includes('wrong')) {
          setErrors({ passwordCurrent: errorMessage });
        } else {
          Alert.alert('Error', errorMessage);
        }
      },
    });
  };

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
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
            <Ionicons name="lock-closed" size={24} color={theme.colors.primary} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>Update Your Password</Text>
              <Text style={styles.infoDescription}>
                Choose a strong password with at least 8 characters for better security.
              </Text>
            </View>
          </View>

          <View style={styles.formContainer}>

            <View style={styles.inputWrapper}>
              <AppInput
                label="Current Password"
                value={formData.passwordCurrent}
                onChangeText={(value) => updateField('passwordCurrent', value)}
                placeholder="Enter your current password"
                secureTextEntry={true}
                error={errors.passwordCurrent}
              />
            </View>

            <View style={styles.inputWrapper}>
              <AppInput
                label="New Password"
                value={formData.newPassword}
                onChangeText={(value) => updateField('newPassword', value)}
                placeholder="Enter new password (min 8 characters)"
                secureTextEntry={true}
                error={errors.newPassword}
              />
            </View>

            <View style={styles.inputWrapper}>
              <AppInput
                label="Confirm New Password"
                value={formData.confirmPassword}
                onChangeText={(value) => updateField('confirmPassword', value)}
                placeholder="Confirm your new password"
                secureTextEntry={true}
                error={errors.confirmPassword}
              />
            </View>

            <View style={styles.requirementsContainer}>
              <Text style={styles.requirementsTitle}>Password Requirements:</Text>
              <View style={styles.requirementItem}>
                <Ionicons
                  name={formData.newPassword.length >= 8 ? 'checkmark-circle' : 'ellipse-outline'}
                  size={16}
                  color={
                    formData.newPassword.length >= 8
                      ? theme.colors.success || theme.colors.green
                      : theme.colors.grey400
                  }
                />
                <Text
                  style={[
                    styles.requirementText,
                    formData.newPassword.length >= 8 && styles.requirementTextMet,
                  ]}
                >
                  At least 8 characters
                </Text>
              </View>
              <View style={styles.requirementItem}>
                <Ionicons
                  name={
                    formData.newPassword !== formData.passwordCurrent && formData.newPassword.length > 0
                      ? 'checkmark-circle'
                      : 'ellipse-outline'
                  }
                  size={16}
                  color={
                    formData.newPassword !== formData.passwordCurrent && formData.newPassword.length > 0
                      ? theme.colors.success || theme.colors.green
                      : theme.colors.grey400
                  }
                />
                <Text
                  style={[
                    styles.requirementText,
                    formData.newPassword !== formData.passwordCurrent &&
                      formData.newPassword.length > 0 &&
                      styles.requirementTextMet,
                  ]}
                >
                  Different from current password
                </Text>
              </View>
              <View style={styles.requirementItem}>
                <Ionicons
                  name={formData.newPassword === formData.confirmPassword && formData.confirmPassword.length > 0
                    ? 'checkmark-circle'
                    : 'ellipse-outline'}
                  size={16}
                  color={
                    formData.newPassword === formData.confirmPassword && formData.confirmPassword.length > 0
                      ? theme.colors.success || theme.colors.green
                      : theme.colors.grey400
                  }
                />
                <Text
                  style={[
                    styles.requirementText,
                    formData.newPassword === formData.confirmPassword &&
                      formData.confirmPassword.length > 0 &&
                      styles.requirementTextMet,
                  ]}
                >
                  Passwords match
                </Text>
              </View>
            </View>

            <View style={styles.buttonWrapper}>
              <AppButton
                title="Change Password"
                onPress={handleSubmit}
                loading={isPending}
                disabled={isPending}
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
  headerBackButton: {
    padding: theme.spacing.xs,
    marginLeft: theme.spacing.sm,
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

export default ChangePasswordScreen;


