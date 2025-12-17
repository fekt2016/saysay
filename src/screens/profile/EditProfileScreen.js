import React, { useState, useEffect, useLayoutEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../../hooks/useAuth';
import { useUpdateProfile, useUploadAvatar } from '../../hooks/useProfile';

import AppInput from '../../components/AppInput';
import AppButton from '../../components/AppButton';
import EditAvatar from '../../components/profile/EditAvatar';
import LogoIcon from '../../components/header/LogoIcon';

import { theme } from '../../theme';

const EditProfileScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { mutate: updateProfile, isPending: isUpdating } = useUpdateProfile();
  const { mutate: uploadAvatar, isPending: isUploadingAvatar } = useUploadAvatar();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    gender: '',
    dateOfBirth: '',
  });
  const [errors, setErrors] = useState();
  const [showGenderPicker, setShowGenderPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Edit Profile',
    });
  }, [navigation]);

  useEffect(() => {
    if (user) {

      const userGender = user.gender || '';
      let displayGender = '';
      if (userGender) {

        const genderDisplayMap = {
          'male': 'Male',
          'female': 'Female',
          'other': 'Other',
          'prefer_not_to_say': 'Prefer not to say',
        };
        displayGender = genderDisplayMap[userGender.toLowerCase()] 
          (userGender.charAt(0).toUpperCase() + userGender.slice(1).toLowerCase());
      }

      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        gender: displayGender, 
        dateOfBirth: user.dateOfBirth || user.dob || '',
      });
    }
  }, [user]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone is required';
    } else {
      const digits = formData.phone.replace(/\D/g, '');
      const pattern = /^(020|023|024|025|026|027|028|029|050|054|055|056|057|059)\d{7}$/;
      if (!pattern.test(digits)) {
        newErrors.phone = 'Invalid Ghana phone number';
      }
    }

    if (formData.dateOfBirth) {
      const date = new Date(formData.dateOfBirth);
      if (isNaN(date.getTime())) {
        newErrors.dateOfBirth = 'Invalid date format';
      } else {
        const today = new Date();
        const age = today.getFullYear() - date.getFullYear();
        if (age < 13) {
          newErrors.dateOfBirth = 'You must be at least 13 years old';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageSelected = (asset) => {
    setSelectedImage(asset);

    uploadAvatar(asset, {
      onSuccess: (data) => {
        Alert.alert('Success', 'Profile photo updated successfully');
      },
      onError: (error) => {
        Alert.alert('Error', error?.response?.data?.message || 'Failed to upload photo');
      },
    });
  };

  const handleSave = () => {
    if (!validateForm()) {
      return;
    }

    const updateData = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
    };

    if (formData.gender) {
      const genderBackendMap = {
        'Male': 'male',
        'Female': 'female',
        'Other': 'other',
        'Prefer not to say': 'prefer_not_to_say',
      };
      updateData.gender = genderBackendMap[formData.gender] || formData.gender.toLowerCase();
    }

    if (formData.dateOfBirth) {

      const dateValue = formData.dateOfBirth;
      if (typeof dateValue === 'string' && dateValue.includes('T')) {
        updateData.dateOfBirth = dateValue;
      } else {
        const date = new Date(dateValue);
        if (!isNaN(date.getTime())) {
          updateData.dateOfBirth = date.toISOString();
        }
      }
    }

    updateProfile(updateData, {
      onSuccess: () => {
        Alert.alert('Success', 'Profile updated successfully', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      },
      onError: (error) => {
        Alert.alert('Error', error?.response?.data?.message || 'Failed to update profile');
      },
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const handleDateSelect = (year, month, day) => {
    const date = new Date(year, month - 1, day);
    const isoDate = date.toISOString().split('T')[0];
    setFormData({ ...formData, dateOfBirth: isoDate });
    setShowDatePicker(false);
  };

  const showDatePickerModal = () => {

    const currentDate = formData.dateOfBirth ? new Date(formData.dateOfBirth) : new Date();
    const currentDay = currentDate.getDate();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    Alert.prompt(
      'Date of Birth',
      'Enter your date of birth (DD/MM/YYYY)\nExample: 15/03/1990',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'OK',
          onPress: (dateStr) => {
            if (dateStr) {

              let day, month, year;

              if (dateStr.includes('/')) {
                const parts = dateStr.split('/');
                if (parts.length === 3) {
                  day = parseInt(parts[0], 10);
                  month = parseInt(parts[1], 10);
                  year = parseInt(parts[2], 10);
                }
              } else if (dateStr.includes('-')) {
                const parts = dateStr.split('-');
                if (parts.length === 3) {

                  if (parts[0].length === 4) {
                    year = parseInt(parts[0], 10);
                    month = parseInt(parts[1], 10);
                    day = parseInt(parts[2], 10);
                  } else {
                    day = parseInt(parts[0], 10);
                    month = parseInt(parts[1], 10);
                    year = parseInt(parts[2], 10);
                  }
                }
              }

              if (day && month && year && day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900) {
                handleDateSelect(year, month, day);
              } else {
                Alert.alert('Error', 'Invalid date. Please use DD/MM/YYYY format');
              }
            }
          },
        },
      ],
      'plain-text',
      formData.dateOfBirth ? formatDate(formData.dateOfBirth) : `${currentDay}/${currentMonth}/${currentYear}`
    );
  };

  const genderOptions = ['Male', 'Female', 'Other', 'Prefer not to say'];

  const genderMap = {
    'Male': 'male',
    'Female': 'female',
    'Other': 'other',
    'Prefer not to say': 'prefer_not_to_say',
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          <View style={styles.avatarCard}>
            <EditAvatar
              user={user}
              onPhotoChange={handleImageSelected}
              isUploading={isUploadingAvatar}
            />
          </View>

          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>Personal Information</Text>

            <AppInput
              label="Full Name"
              value={formData.name}
              onChangeText={(text) => {
                setFormData({ ...formData, name: text });
                if (errors.name) setErrors({ ...errors, name: null });
              }}
              placeholder="Enter your full name"
              error={errors.name}
              autoCapitalize="words"
            />

            <View>
              <AppInput
                label="Email Address"
                value={formData.email}
                onChangeText={(text) => {
                  setFormData({ ...formData, email: text });
                  if (errors.email) setErrors({ ...errors, email: null });
                }}
                placeholder="Enter your email"
                error={errors.email}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={false} 
              />
              <Text style={styles.hintText}>
                Email cannot be changed for security reasons
              </Text>
            </View>

            <AppInput
              label="Phone Number"
              value={formData.phone}
              onChangeText={(text) => {
                setFormData({ ...formData, phone: text });
                if (errors.phone) setErrors({ ...errors, phone: null });
              }}
              placeholder="024XXXXXXX"
              error={errors.phone}
              keyboardType="phone-pad"
            />

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Gender</Text>
              <TouchableOpacity
                style={[styles.pickerButton, errors.gender && styles.pickerButtonError]}
                onPress={() => setShowGenderPicker(true)}
                activeOpacity={0.7}
              >
                <Text style={[styles.pickerText, !formData.gender && styles.pickerPlaceholder]}>
                  {formData.gender || 'Select gender'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
              {errors.gender && (
                <Text style={styles.errorText}>{errors.gender}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Date of Birth (Optional)</Text>
              <TouchableOpacity
                style={[styles.pickerButton, errors.dateOfBirth && styles.pickerButtonError]}
                onPress={showDatePickerModal}
                activeOpacity={0.7}
              >
                <Text style={[styles.pickerText, !formData.dateOfBirth && styles.pickerPlaceholder]}>
                  {formData.dateOfBirth ? formatDate(formData.dateOfBirth) : 'Select date of birth'}
                </Text>
                <Ionicons name="calendar-outline" size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
              {errors.dateOfBirth && (
                <Text style={styles.errorText}>{errors.dateOfBirth}</Text>
              )}
            </View>
          </View>

          <View style={styles.buttonSection}>
            <AppButton
              title="Save Changes"
              onPress={handleSave}
              loading={isUpdating}
              fullWidth
            />
          </View>

          <View style={styles.linkSection}>
            <TouchableOpacity
              onPress={() => navigation.navigate('ChangePassword')}
              activeOpacity={0.7}
            >
              <Text style={styles.linkText}>Change Password</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={showGenderPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowGenderPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Gender</Text>
              <TouchableOpacity
                onPress={() => setShowGenderPicker(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              {genderOptions.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.modalOption,
                    formData.gender === option && styles.modalOptionSelected,
                  ]}
                  onPress={() => {

                    setFormData({ ...formData, gender: option });
                    setShowGenderPicker(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      formData.gender === option && styles.modalOptionTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                  {formData.gender === option && (
                    <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
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
    paddingBottom: theme.spacing.xl,
  },
  avatarCard: {
    backgroundColor: theme.colors.white,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    borderRadius: 16,
    paddingVertical: theme.spacing.lg,
    ...theme.shadows.sm,
    borderWidth: 1,
    borderColor: theme.colors.grey200,
  },
  formCard: {
    backgroundColor: theme.colors.white,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.lg,
    borderRadius: 16,
    padding: theme.spacing.lg,
    ...theme.shadows.sm,
    borderWidth: 1,
    borderColor: theme.colors.grey200,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.lg,
  },
  inputContainer: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: theme.colors.grey300,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.white,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    minHeight: 48,
  },
  pickerButtonError: {
    borderColor: theme.colors.error,
  },
  pickerText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textPrimary,
    flex: 1,
  },
  pickerPlaceholder: {
    color: theme.colors.grey400,
  },
  errorText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.error,
    marginTop: theme.spacing.xs,
  },
  hintText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs / 2,
    fontStyle: 'italic',
  },
  buttonSection: {
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  linkSection: {
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  linkText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.semibold,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.grey200,
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    padding: theme.spacing.md,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.xs,
  },
  modalOptionSelected: {
    backgroundColor: theme.colors.primary + '10',
  },
  modalOptionText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textPrimary,
  },
  modalOptionTextSelected: {
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.primary,
  },
});

export default EditProfileScreen;


