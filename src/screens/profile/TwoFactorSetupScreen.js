import React, { useState, useLayoutEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import useAuthHook from '../../hooks/useAuth';
import { theme } from '../../theme';
import AppButton from '../../components/AppButton';
import AppInput from '../../components/AppInput';
import LogoIcon from '../../components/header/LogoIcon';

const TwoFactorSetupScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const queryClient = useQueryClient();
  const { verifyTwoFactor, refetchAuth } = useAuthHook();

  const { qrCodeUrl, secret, backupCodes } = route.params || {};

  const qrCodeImageUrl = qrCodeUrl 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeUrl)}`
    : null;

  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [isSetupComplete, setIsSetupComplete] = useState(false);

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
      headerTitle: 'Setup Two-Factor Authentication',
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

  const handleVerify = async () => {
    if (!verificationCode.trim()) {
      Alert.alert('Error', 'Please enter the verification code from your authenticator app');
      return;
    }

    if (verificationCode.length !== 6) {
      Alert.alert('Error', 'Verification code must be 6 digits');
      return;
    }

    setIsVerifying(true);
    try {
      await verifyTwoFactor.mutateAsync(verificationCode.trim(), {
        onSuccess: (response) => {
          setIsSetupComplete(true);

          queryClient.invalidateQueries({ queryKey: ['auth'] });
          queryClient.invalidateQueries({ queryKey: ['profile'] });
          queryClient.refetchQueries({ queryKey: ['auth'] });
          queryClient.refetchQueries({ queryKey: ['profile'] });

          refetchAuth();

          Alert.alert(
            'Success',
            'Two-factor authentication has been successfully enabled!',
            [
              {
                text: 'OK',
                onPress: () => {
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
            'Invalid verification code. Please try again.';
          Alert.alert('Verification Failed', errorMessage);
        },
      });
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to verify code. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsVerifying(false);
    }
  };

  const formatSecret = (secret) => {
    if (!secret) return '';
    return secret.replace(/(.{4})/g, '$1 ').trim();
  };

  const copySecret = () => {
    Alert.alert('Secret Key', `Your secret key: ${secret}\n\nCopy this manually if needed.`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        <View style={styles.infoBanner}>
          <Ionicons name="shield-checkmark" size={24} color={theme.colors.primary} />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>Secure Your Account</Text>
            <Text style={styles.infoDescription}>
              Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.) to
              enable two-factor authentication.
            </Text>
          </View>
        </View>

        {qrCodeImageUrl && (
          <View style={styles.qrSection}>
            <Text style={styles.sectionTitle}>Scan QR Code</Text>
            <View style={styles.qrContainer}>
              <Image
                source={{ uri: qrCodeImageUrl }}
                style={styles.qrCode}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.qrInstructions}>
              Open your authenticator app and scan this QR code
            </Text>
          </View>
        )}

        {secret && (
          <View style={styles.secretSection}>
            <Text style={styles.sectionTitle}>Can't Scan QR Code?</Text>
            <Text style={styles.secretDescription}>
              Enter this code manually in your authenticator app:
            </Text>
            <TouchableOpacity
              style={styles.secretContainer}
              onPress={() => setShowSecret(!showSecret)}
              activeOpacity={0.7}
            >
              <Text style={styles.secretText}>
                {showSecret ? formatSecret(secret) : '•••• •••• •••• •••• •••• ••••'}
              </Text>
              <Ionicons
                name={showSecret ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.copyButton}
              onPress={copySecret}
              activeOpacity={0.7}
            >
              <Ionicons name="copy-outline" size={16} color={theme.colors.primary} />
              <Text style={styles.copyButtonText}>Copy Secret Key</Text>
            </TouchableOpacity>
          </View>
        )}

        {!isSetupComplete && (
          <View style={styles.verificationSection}>
            <Text style={styles.sectionTitle}>Verify Setup</Text>
            <Text style={styles.verificationDescription}>
              Enter the 6-digit code from your authenticator app to complete setup:
            </Text>

            <AppInput
              label="Verification Code"
              placeholder="000000"
              value={verificationCode}
              onChangeText={(text) => setVerificationCode(text.replace(/[^0-9]/g, '').slice(0, 6))}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus={false}
              containerStyle={styles.inputContainer}
            />

            <AppButton
              title={isVerifying ? 'Verifying...' : 'Verify & Enable 2FA'}
              onPress={handleVerify}
              loading={isVerifying || verifyTwoFactor.isPending}
              disabled={verificationCode.length !== 6 || isVerifying || verifyTwoFactor.isPending}
              fullWidth
              style={styles.verifyButton}
            />
          </View>
        )}

        {backupCodes && backupCodes.length > 0 && (
          <View style={styles.backupSection}>
            <View style={styles.backupHeader}>
              <Ionicons name="key-outline" size={20} color={theme.colors.warning || theme.colors.orange} />
              <Text style={styles.backupTitle}>Backup Codes</Text>
            </View>
            <Text style={styles.backupDescription}>
              Save these backup codes in a safe place. You can use them to access your account if
              you lose your authenticator device.
            </Text>
            <View style={styles.backupCodesContainer}>
              {backupCodes.map((code, index) => (
                <View key={index} style={styles.backupCodeItem}>
                  <Text style={styles.backupCodeText}>{code}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity
              style={styles.saveBackupButton}
              onPress={() => {
                Alert.alert('Save Backup Codes', 'Please take a screenshot or write down these codes.');
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="download-outline" size={16} color={theme.colors.primary} />
              <Text style={styles.saveBackupButtonText}>Save Backup Codes</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.helpSection}>
          <Text style={styles.helpTitle}>Need Help?</Text>
          <View style={styles.helpItem}>
            <Ionicons name="information-circle-outline" size={16} color={theme.colors.textSecondary} />
            <Text style={styles.helpText}>
              Download Google Authenticator or Authy from your app store
            </Text>
          </View>
          <View style={styles.helpItem}>
            <Ionicons name="information-circle-outline" size={16} color={theme.colors.textSecondary} />
            <Text style={styles.helpText}>
              Codes refresh every 30 seconds for security
            </Text>
          </View>
          <View style={styles.helpItem}>
            <Ionicons name="information-circle-outline" size={16} color={theme.colors.textSecondary} />
            <Text style={styles.helpText}>
              Keep your backup codes safe - you'll need them if you lose your device
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
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

  qrSection: {
    backgroundColor: theme.colors.white,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.sm,
    borderWidth: 1,
    borderColor: theme.colors.grey200,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  qrContainer: {
    backgroundColor: theme.colors.white,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: theme.colors.grey200,
    marginBottom: theme.spacing.md,
  },
  qrCode: {
    width: 200,
    height: 200,
  },
  qrInstructions: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },

  secretSection: {
    backgroundColor: theme.colors.white,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.sm,
    borderWidth: 1,
    borderColor: theme.colors.grey200,
  },
  secretDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  secretContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.grey100,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
  },
  secretText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: 'monospace',
    color: theme.colors.textPrimary,
    flex: 1,
    letterSpacing: 2,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    alignSelf: 'flex-start',
  },
  copyButtonText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },

  verificationSection: {
    backgroundColor: theme.colors.white,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.sm,
    borderWidth: 1,
    borderColor: theme.colors.grey200,
  },
  verificationDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  inputContainer: {
    marginBottom: theme.spacing.md,
  },
  verifyButton: {
    marginTop: theme.spacing.sm,
  },

  backupSection: {
    backgroundColor: theme.colors.white,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.sm,
    borderWidth: 1,
    borderColor: theme.colors.warning + '30' || theme.colors.orange + '30',
  },
  backupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  backupTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  backupDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
    lineHeight: theme.typography.fontSize.sm * 1.5,
  },
  backupCodesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  backupCodeItem: {
    backgroundColor: theme.colors.grey100,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    minWidth: 100,
  },
  backupCodeText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: 'monospace',
    color: theme.colors.textPrimary,
    fontWeight: theme.typography.fontWeight.medium,
    textAlign: 'center',
  },
  saveBackupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    alignSelf: 'flex-start',
  },
  saveBackupButtonText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },

  helpSection: {
    backgroundColor: theme.colors.white,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.sm,
    borderWidth: 1,
    borderColor: theme.colors.grey200,
  },
  helpTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  helpItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  helpText: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: theme.typography.fontSize.sm * 1.5,
  },
});

export default TwoFactorSetupScreen;


