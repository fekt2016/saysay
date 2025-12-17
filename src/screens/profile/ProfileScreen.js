 
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../../hooks/useAuth';
import { useUpdateProfile } from '../../hooks/useProfile';
import { useCreditBalance } from '../../hooks/useCreditBalance';

import AppInput from '../../components/AppInput';
import AppButton from '../../components/AppButton';

import { theme } from '../../theme';

const ProfileScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const { mutate: updateProfile, isPending: isUpdating } = useUpdateProfile();
  
  // Get credit balance
  const { data: creditBalanceData } = useCreditBalance();
  const creditBalance = creditBalanceData?.data?.wallet?.balance || 
                        creditBalanceData?.data?.creditbalance?.balance || 
                        creditBalanceData?.data?.balance || 
                        0;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      return;
    }

    updateProfile(formData, {
      onSuccess: () => {
        Alert.alert('Success', 'Profile updated successfully', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      },
      onError: (error) => {
        Alert.alert('Error', error.message || 'Failed to update profile');
      },
    });
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive', 
          onPress: async () => {
            await logout();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Auth', params: { screen: 'Login' } }],
            });
          }
        },
      ]
    );
  };

  // Get user photo
  const photoUrl = user?.photo || user?.profilePicture || user?.avatar || user?.image;

  // Settings items
  const settingsItems = [
    {
      icon: 'notifications-outline',
      label: 'Notifications',
      description: 'Manage notification preferences',
      screen: 'Notifications',
      color: theme.colors.orange || theme.colors.primary,
    },
    {
      icon: 'shield-checkmark-outline',
      label: 'Permissions',
      description: 'Manage notification permissions',
      screen: 'Permission',
      color: theme.colors.purple || theme.colors.primary,
    },
    {
      icon: 'wallet-outline',
      label: 'Credit Balance',
      description: `Balance: GH₵${creditBalance.toFixed(2)}`,
      screen: 'CreditBalance',
      color: theme.colors.green || theme.colors.primary,
    },
    {
      icon: 'lock-closed-outline',
      label: 'Security',
      description: 'Password & Two-Factor Authentication',
      screen: 'ChangePassword', // Placeholder - SecuritySettingsScreen not found
      color: theme.colors.blue || theme.colors.primary,
    },
  ];

  // Note: Language, Region, DeviceManagement, AppVersion screens available
  // These would need to be created if needed

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Edit Profile</Text>
            
      
            <View style={styles.avatarSection}>
              {photoUrl ? (
                <Image
                  source={{ uri: photoUrl }}
                  style={styles.avatar}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>
                    {(user?.name || user?.firstName || user?.email || 'U').charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <TouchableOpacity style={styles.changePhotoButton}>
                <Text style={styles.changePhotoText}>Change Photo</Text>
              </TouchableOpacity>
            </View>

            {/* Form */}
            <View style={styles.form}>
              <AppInput
                label="Full Name"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Enter your full name"
                error={errors.name}
                autoCapitalize="words"
              />

              <AppInput
                label="Email"
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                placeholder="Enter your email"
                error={errors.email}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <AppInput
                label="Phone"
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                placeholder="024XXXXXXX"
                error={errors.phone}
                keyboardType="phone-pad"
              />

              <View style={styles.buttonWrapper}>
                <AppButton
                  title="Save Changes"
                  onPress={handleSave}
                  loading={isUpdating}
                  fullWidth
                />
              </View>

              <View style={styles.linkWrapper}>
                <TouchableOpacity onPress={() => navigation.navigate('ChangePassword')}>
                  <Text style={styles.linkText}>Change Password</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Settings Links Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Settings</Text>
            
            <View style={styles.settingsList}>
              {settingsItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.settingsItem}
                  onPress={() => navigation.navigate(item.screen)}
                  activeOpacity={0.7}
                >
                  <View style={styles.settingsItemLeft}>
                    <View style={[styles.settingsIcon, { backgroundColor: item.color + '15' }]}>
                      <Ionicons name={item.icon} size={22} color={item.color} />
                    </View>
                    <View style={styles.settingsItemText}>
                      <Text style={styles.settingsItemLabel}>{item.label}</Text>
                      <Text style={styles.settingsItemDescription}>{item.description}</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              ))}

              {/* App Version */}
              <View style={styles.settingsItem}>
                <View style={styles.settingsItemLeft}>
                  <View style={[styles.settingsIcon, { backgroundColor: (theme.colors.textSecondary || theme.colors.primary) + '15' }]}>
                    <Ionicons name="information-circle-outline" size={22} color={theme.colors.textSecondary || theme.colors.primary} />
                  </View>
                  <View style={styles.settingsItemText}>
                    <Text style={styles.settingsItemLabel}>App Version</Text>
                    <Text style={styles.settingsItemDescription}>Version 1.0.0</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Logout Button */}
          <View style={styles.logoutSection}>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <Ionicons name="log-out-outline" size={20} color={theme.colors.error} />
              <View style={{ width: theme.spacing.sm }} />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.grey200,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xl,
  },
  section: {
    backgroundColor: theme.colors.white,
    marginTop: theme.spacing.sm,
    marginHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.sm,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.lg,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: theme.colors.white,
    marginBottom: theme.spacing.md,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: theme.colors.white,
    marginBottom: theme.spacing.md,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  changePhotoButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  changePhotoText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  form: {
    marginTop: theme.spacing.md,
  },
  buttonWrapper: {
    marginTop: theme.spacing.lg,
  },
  linkWrapper: {
    marginTop: theme.spacing.md,
    alignItems: 'center',
  },
  linkText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  settingsList: {
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.grey50 || theme.colors.background,
    marginBottom: theme.spacing.xs,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingsIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  settingsItemText: {
    flex: 1,
  },
  settingsItemLabel: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs / 2,
  },
  settingsItemDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  logoutSection: {
    marginTop: theme.spacing.lg,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.white,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.error + '30',
  },
  logoutText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.error,
  },
});

export default ProfileScreen;