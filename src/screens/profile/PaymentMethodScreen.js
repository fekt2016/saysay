import React, { useState, useMemo, useLayoutEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import EmptyState from '../../components/EmptyState';
import LogoIcon from '../../components/header/LogoIcon';
import {
  usePaymentMethods,
  useAddPaymentMethod,
  useDeletePaymentMethod,
  useSetDefaultPaymentMethod,
} from '../../hooks/usePaymentMethods';

const PaymentMethodScreen = ({ navigation }) => {

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => <LogoIcon />,
      headerTitle: 'Payment Methods',
      headerTitleStyle: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.textPrimary,
      },
      headerStyle: {
        backgroundColor: theme.colors.white,
      },
      headerTintColor: theme.colors.textPrimary,
    });
  }, [navigation]);
  const { data: paymentMethodsData, isLoading } = usePaymentMethods();
  console.log('[PaymentMethodScreen] Payment methods data:', paymentMethodsData);
  const addPaymentMethod = useAddPaymentMethod();
  const deletePaymentMethod = useDeletePaymentMethod();
  const setDefaultMethod = useSetDefaultPaymentMethod();

  const [showAddModal, setShowAddModal] = useState(false);
  const [mobileFormData, setMobileFormData] = useState({
    provider: 'MTN',
    phone: '',
    name: '',
    isDefault: false,
  });
  const [bankFormData, setBankFormData] = useState({
    bankName: '',
    accountNumber: '',
    accountName: '',
    branch: '',
    isDefault: false,
  });

  const paymentMethods = useMemo(() => {

    let methods = [];

    if (paymentMethodsData) {

      if (paymentMethodsData?.data?.paymentMethods && Array.isArray(paymentMethodsData.data.paymentMethods)) {
        methods = paymentMethodsData.data.paymentMethods;
      } 

      else if (Array.isArray(paymentMethodsData.data)) {
        methods = paymentMethodsData.data;
      }

      else if (Array.isArray(paymentMethodsData.paymentMethods)) {
        methods = paymentMethodsData.paymentMethods;
      }

      else if (Array.isArray(paymentMethodsData)) {
        methods = paymentMethodsData;
      }
    }

    if (__DEV__) {
      console.log('[PaymentMethodScreen] Raw payment methods data:', JSON.stringify(paymentMethodsData, null, 2));
      console.log('[PaymentMethodScreen] Extracted payment methods:', methods);
      console.log('[PaymentMethodScreen] Payment methods count:', methods.length);
      if (methods.length > 0) {
        console.log('[PaymentMethodScreen] First payment method:', methods[0]);
      }
    }

    return Array.isArray(methods) ? methods : [];
  }, [paymentMethodsData]);

  const defaultMethodsCount = paymentMethods.filter((method) => method.isDefault).length;
  const mobileMoneyMethods = paymentMethods.filter((method) => method.type === 'mobile_money').length;
  const bankMethods = paymentMethods.filter((method) => method.type === 'bank_transfer').length;

  const hasPaymentMethods = paymentMethods.length > 0;
  const hasDefaultMethod = paymentMethods.some((method) => method.isDefault);

  const formatPhoneNumber = (value) => {
    if (!value) return '';
    const digits = value.replace(/\D/g, '');
    let formattedValue = digits;
    if (digits.length > 0 && digits[0] !== '0') {
      formattedValue = '0' + digits;
    }
    return formattedValue.substring(0, 10);
  };

  const formatPhoneForAPI = (phone) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    return `+233${cleaned.substring(1)}`;
  };

  const handleSetDefault = async (id) => {
    try {
      await setDefaultMethod.mutateAsync(id);
      Alert.alert('Success', 'Payment method set as default');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to set default payment method');
    }
  };

  const handleDelete = (id) => {
    Alert.alert(
      'Delete Payment Method',
      'Are you sure you want to delete this payment method?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deletePaymentMethod.mutate(id, {
              onSuccess: () => {
                Alert.alert('Success', 'Payment method deleted');
              },
            });
          },
        },
      ]
    );
  };

  const handleAddPaymentMethod = async (type) => {
    try {
      let methodData;

      if (type === 'mobile_money') {

        if (!mobileFormData.phone || !mobileFormData.name) {
          Alert.alert('Error', 'Please fill in all required fields');
          return;
        }

        if (mobileFormData.phone.length !== 10) {
          Alert.alert('Error', 'Please enter a valid 10-digit phone number');
          return;
        }

        methodData = {
          type: 'mobile_money',
          provider: mobileFormData.provider,
          mobileNumber: formatPhoneForAPI(mobileFormData.phone),
          mobileName: mobileFormData.name,
          isDefault: mobileFormData.isDefault || !hasPaymentMethods,
        };
      } else {

        if (!bankFormData.bankName || !bankFormData.accountNumber || !bankFormData.accountName) {
          Alert.alert('Error', 'Please fill in all required fields');
          return;
        }

        methodData = {
          type: 'bank_transfer',
          bankName: bankFormData.bankName,
          accountNumber: bankFormData.accountNumber,
          accountName: bankFormData.accountName,
          branch: bankFormData.branch,
          isDefault: bankFormData.isDefault || !hasPaymentMethods,
        };
      }

      await addPaymentMethod.mutateAsync(methodData, {
        onSuccess: () => {

          setShowAddModal(false);
          setMobileFormData({ provider: 'MTN', phone: '', name: '', isDefault: false });
          setBankFormData({ bankName: '', accountNumber: '', accountName: '', branch: '', isDefault: false });
          Alert.alert('Success', 'Payment method added successfully');
        },
      });
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to add payment method');
    }
  };

  const renderProviderIcon = (method) => {
    const iconName =
      method.type === 'mobile_money' ? 'phone-portrait-outline' : 'business-outline';
    const iconColor =
      method.type === 'mobile_money'
        ? method.provider === 'MTN'
          ? '#FFD700'
          : method.provider === 'Vodafone'
          ? '#E60000'
          : '#FF0000'
        : theme.colors.primary;

    return (
      <View style={[styles.providerIconContainer, { backgroundColor: iconColor + '20' }]}>
        <Ionicons name={iconName} size={24} color={iconColor} />
      </View>
    );
  };

  const renderPaymentMethod = ({ item }) => {
    const isDefault = item.isDefault || false;

    return (
      <View style={[styles.methodCard, isDefault && styles.methodCardDefault]}>
        <View style={styles.methodHeader}>
          <View style={styles.methodInfo}>
            {renderProviderIcon(item)}
            <View style={styles.methodDetails}>
              <Text style={styles.methodName}>
                {item.type === 'mobile_money'
                  ? `${item.provider} Mobile Money`
                  : item.bankName}
              </Text>
              <Text style={styles.methodNumber}>
                {item.type === 'mobile_money'
                  ? item.mobileNumber?.replace('+233', '0') || item.phone
                  : `••••${item.accountNumber?.slice(-4) || ''}`}
              </Text>
              {item.type === 'bank_transfer' && item.accountName && (
                <Text style={styles.methodAccountName}>{item.accountName}</Text>
              )}
            </View>
          </View>
          {isDefault && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultBadgeText}>Default</Text>
            </View>
          )}
        </View>

        <View style={styles.methodActions}>
          {!isDefault && (
            <TouchableOpacity
              style={styles.setDefaultButton}
              onPress={() => handleSetDefault(item._id || item.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.setDefaultButtonText}>Set as Default</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete(item._id || item.id)}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={18} color={theme.colors.error} />
            <Text style={styles.deleteButtonText}>Remove</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        <View style={styles.subtitleSection}>
          <Text style={styles.subtitle}>
            Manage your mobile money and bank transfer options
          </Text>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{defaultMethodsCount}</Text>
            <Text style={styles.statLabel}>Default</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{mobileMoneyMethods}</Text>
            <Text style={styles.statLabel}>Mobile Money</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{bankMethods}</Text>
            <Text style={styles.statLabel}>Bank Accounts</Text>
          </View>
        </View>

        {!showAddModal && (
          <View style={styles.actionSection}>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddModal(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={20} color={theme.colors.white} />
              <Text style={styles.addButtonText}>Add Payment Method</Text>
            </TouchableOpacity>
          </View>
        )}

        {showAddModal && (
          <View style={styles.formCard}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>Add Payment Method</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowAddModal(false);
                  setMobileFormData({ provider: 'MTN', phone: '', name: '', isDefault: false });
                  setBankFormData({ bankName: '', accountNumber: '', accountName: '', branch: '', isDefault: false });
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formSectionTitle}>Mobile Money</Text>
              <View style={styles.formContent}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Mobile Money Provider</Text>
                  <View style={styles.selectContainer}>
                    <TouchableOpacity
                      style={styles.select}
                      onPress={() => {

                        Alert.alert(
                          'Select Provider',
                          'Choose a provider',
                          [
                            { text: 'MTN', onPress: () => setMobileFormData({ ...mobileFormData, provider: 'MTN' }) },
                            { text: 'Vodafone', onPress: () => setMobileFormData({ ...mobileFormData, provider: 'Vodafone' }) },
                            { text: 'AirtelTigo', onPress: () => setMobileFormData({ ...mobileFormData, provider: 'AirtelTigo' }) },
                            { text: 'Cancel', style: 'cancel' },
                          ]
                        );
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.selectText}>{mobileFormData.provider} Mobile Money</Text>
                      <Ionicons name="chevron-down" size={20} color={theme.colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Phone Number</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0241234567"
                    keyboardType="phone-pad"
                    maxLength={10}
                    value={mobileFormData.phone}
                    onChangeText={(text) => {
                      const formatted = formatPhoneNumber(text);
                      setMobileFormData({ ...mobileFormData, phone: formatted });
                    }}
                  />
                  <Text style={styles.hint}>Enter number without country code (e.g. 0241234567)</Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Account Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="John Doe"
                    value={mobileFormData.name}
                    onChangeText={(text) => setMobileFormData({ ...mobileFormData, name: text })}
                  />
                </View>

                {hasPaymentMethods && (
                  <TouchableOpacity
                    style={styles.checkboxContainer}
                    onPress={() => setMobileFormData({ ...mobileFormData, isDefault: !mobileFormData.isDefault })}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.checkbox, mobileFormData.isDefault && styles.checkboxChecked]}>
                      {mobileFormData.isDefault && (
                        <Ionicons name="checkmark" size={16} color={theme.colors.white} />
                      )}
                    </View>
                    <Text style={styles.checkboxLabel}>Set as default payment method</Text>
                  </TouchableOpacity>
                )}
                {!hasPaymentMethods && (
                  <View style={styles.infoBox}>
                    <Ionicons name="information-circle-outline" size={16} color={theme.colors.primary} />
                    <Text style={styles.infoText}>
                      This will be set as your default payment method
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.submitButton, addPaymentMethod.isPending && styles.submitButtonDisabled]}
                  onPress={() => handleAddPaymentMethod('mobile_money')}
                  disabled={addPaymentMethod.isPending}
                  activeOpacity={0.7}
                >
                  {addPaymentMethod.isPending ? (
                    <ActivityIndicator size="small" color={theme.colors.white} />
                  ) : (
                    <>
                      <Ionicons name="checkmark" size={20} color={theme.colors.white} />
                      <Text style={styles.submitButtonText}>Save Mobile Money</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formSectionTitle}>Bank Transfer</Text>
              <View style={styles.formContent}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Bank Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ecobank Ghana"
                    value={bankFormData.bankName}
                    onChangeText={(text) => setBankFormData({ ...bankFormData, bankName: text })}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Account Number</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0241234567890"
                    keyboardType="numeric"
                    value={bankFormData.accountNumber}
                    onChangeText={(text) => setBankFormData({ ...bankFormData, accountNumber: text })}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Account Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="John Doe"
                    value={bankFormData.accountName}
                    onChangeText={(text) => setBankFormData({ ...bankFormData, accountName: text })}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Branch (Optional)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Accra Central"
                    value={bankFormData.branch}
                    onChangeText={(text) => setBankFormData({ ...bankFormData, branch: text })}
                  />
                </View>

                {hasPaymentMethods && (
                  <TouchableOpacity
                    style={styles.checkboxContainer}
                    onPress={() => setBankFormData({ ...bankFormData, isDefault: !bankFormData.isDefault })}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.checkbox, bankFormData.isDefault && styles.checkboxChecked]}>
                      {bankFormData.isDefault && (
                        <Ionicons name="checkmark" size={16} color={theme.colors.white} />
                      )}
                    </View>
                    <Text style={styles.checkboxLabel}>Set as default payment method</Text>
                  </TouchableOpacity>
                )}
                {!hasPaymentMethods && (
                  <View style={styles.infoBox}>
                    <Ionicons name="information-circle-outline" size={16} color={theme.colors.primary} />
                    <Text style={styles.infoText}>
                      This will be set as your default payment method
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.submitButton, addPaymentMethod.isPending && styles.submitButtonDisabled]}
                  onPress={() => handleAddPaymentMethod('bank_transfer')}
                  disabled={addPaymentMethod.isPending}
                  activeOpacity={0.7}
                >
                  {addPaymentMethod.isPending ? (
                    <ActivityIndicator size="small" color={theme.colors.white} />
                  ) : (
                    <>
                      <Ionicons name="checkmark" size={20} color={theme.colors.white} />
                      <Text style={styles.submitButtonText}>Save Bank Account</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : paymentMethods.length > 0 ? (
          <View style={styles.methodsList}>
            <FlatList
              data={paymentMethods}
              renderItem={renderPaymentMethod}
              keyExtractor={(item) => item._id || item.id}
              scrollEnabled={false}
            />
          </View>
        ) : (
          <View style={styles.emptyStateContainer}>
            <EmptyState
              icon="💳"
              title="No payment methods"
              message="You haven't added any payment methods yet"
            />
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddModal(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={20} color={theme.colors.white} />
              <Text style={styles.addButtonText}>Add Payment Method</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.securitySection}>
          <View style={styles.securityContent}>
            <Ionicons name="shield-checkmark-outline" size={24} color={theme.colors.primary} />
            <Text style={styles.securityText}>
              Your payment details are securely stored and encrypted. We never share your financial
              information with third parties.
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
  subtitleSection: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl || 20,
    padding: theme.spacing.md,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: theme.colors.grey200,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: theme.colors.grey200,
    marginHorizontal: theme.spacing.sm,
  },
  statValue: {
    fontSize: theme.typography.fontSize['2xl'] || 24,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  actionSection: {
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md || 12,
    gap: theme.spacing.sm,
  },
  addButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold || theme.typography.fontWeight.bold,
    color: theme.colors.white,
  },
  formCard: {
    backgroundColor: theme.colors.white,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.lg || 16,
    padding: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  formTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  formSection: {
    marginBottom: theme.spacing.lg,
  },
  formSectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  formContent: {
    gap: theme.spacing.md,
  },
  inputGroup: {
    marginBottom: theme.spacing.md,
  },
  inputLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold || theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.grey300,
    borderRadius: theme.borderRadius.md || 10,
    padding: theme.spacing.sm,
    fontSize: theme.typography.fontSize.base,
    backgroundColor: theme.colors.white,
    color: theme.colors.textPrimary,
  },
  hint: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  selectContainer: {
    borderWidth: 1,
    borderColor: theme.colors.grey300,
    borderRadius: theme.borderRadius.md || 10,
    overflow: 'hidden',
  },
  select: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.white,
  },
  selectText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textPrimary,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: theme.colors.grey300,
    marginRight: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  checkboxLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textPrimary,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md || 10,
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold || theme.typography.fontWeight.bold,
    color: theme.colors.white,
  },
  loadingContainer: {
    paddingVertical: theme.spacing.xl,
    alignItems: 'center',
  },
  methodsList: {
    paddingHorizontal: theme.spacing.md,
  },
  methodCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg || 16,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.grey200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  methodCardDefault: {
    borderColor: theme.colors.primary200 || theme.colors.primary,
    borderLeftWidth: 4,
  },
  methodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  methodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  providerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.md || 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  methodDetails: {
    flex: 1,
  },
  methodName: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold || theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  methodNumber: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  methodAccountName: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  defaultBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs / 2,
    borderRadius: theme.borderRadius.sm || 6,
  },
  defaultBadgeText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold || theme.typography.fontWeight.bold,
    color: theme.colors.white,
  },
  methodActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  setDefaultButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.primary100 || theme.colors.primary + '20',
    borderRadius: theme.borderRadius.md || 10,
    alignItems: 'center',
  },
  setDefaultButtonText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.primary,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.error + '15',
    borderRadius: theme.borderRadius.md || 10,
    gap: theme.spacing.xs,
  },
  deleteButtonText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.error,
  },
  emptyStateContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xl,
    alignItems: 'center',
  },
  securitySection: {
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.lg,
    backgroundColor: theme.colors.primary100 || theme.colors.primary + '10',
    borderRadius: theme.borderRadius.lg || 16,
    padding: theme.spacing.md,
  },
  securityContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
  },
  securityText: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: theme.typography.fontSize.sm * 1.5,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary100 || theme.colors.primary + '15',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm || 8,
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  infoText: {
    flex: 1,
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.primary,
  },
});

export default PaymentMethodScreen;


