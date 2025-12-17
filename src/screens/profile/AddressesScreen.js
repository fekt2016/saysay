import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  StyleSheet,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

import { useGetUserAddress, useDeleteAddress, useCreateAddress, useUpdateAddress } from '../../hooks/useAddress';
import AppInput from '../../components/AppInput';
import AppButton from '../../components/AppButton';
import NeighborhoodAutocomplete from '../../components/NeighborhoodAutocomplete';
import locationApi from '../../services/locationApi';
import { sanitizePhone, sanitizeDigitalAddress, sanitizeText, sanitizeAddress } from '../../utils/sanitize';

import { theme } from '../../theme';

const AddressesScreen = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [formErrors, setFormErrors] = useState();

  const { data: addressData, isLoading, refetch } = useGetUserAddress();
  const { mutate: deleteAddress, isPending: isDeleting } = useDeleteAddress();
  const { mutate: createAddress, isPending: isCreating } = useCreateAddress();
  const { mutate: updateAddress, isPending: isUpdating } = useUpdateAddress();

  const addresses = useMemo(
    () => addressData?.data?.data?.addresses || [],
    [addressData]
  );

  const [formData, setFormData] = useState({
    fullName: '',
    contactPhone: '',
    streetAddress: '',
    area: '',
    landmark: '',
    city: '',
    region: '',
    country: 'Ghana',
    additionalInformation: '',
    digitalAddress: '',
    isDefault: false,
  });

  const resetForm = () => {
    setFormData({
      fullName: '',
      contactPhone: '',
      streetAddress: '',
      area: '',
      landmark: '',
      city: '',
      region: '',
      country: 'Ghana',
      additionalInformation: '',
      digitalAddress: '',
      isDefault: false,
    });
    setEditingAddress(null);
    setFormErrors();
    setLocationError('');
    setShowOverlay(false);
  };

  useEffect(() => {
    if (!showOverlay) {
      resetForm();
    }
  }, [showOverlay]);

  useEffect(() => {
    if (editingAddress && addresses.length > 0) {
      const address = addresses.find(addr => addr._id === editingAddress || addr.id === editingAddress);
      if (address) {
        setFormData({
          fullName: address.fullName || '',
          contactPhone: address.contactPhone || '',
          streetAddress: address.streetAddress || '',
          area: address.area || '',
          landmark: address.landmark || '',
          city: address.city || '',
          region: address.region || '',
          country: address.country || 'Ghana',
          additionalInformation: address.additionalInformation || '',
          digitalAddress: address.digitalAddress || '',
          isDefault: address.isDefault || false,
        });
      }
    }
  }, [editingAddress, addresses]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleOpenAdd = () => {
    setEditingAddress(null);
    setShowOverlay(true);
  };

  const handleOpenEdit = (addressId) => {
    setEditingAddress(addressId);
    setShowOverlay(true);
  };

  const handleCloseOverlay = () => {
    resetForm();
  };

  const handleInputChange = (field, value) => {
    setFormErrors();
    setLocationError('');

    if (field === 'contactPhone') {
      const digits = sanitizePhone(value);
      let formatted = digits;
      if (digits.length > 3) {
        formatted = `${digits.substring(0, 3)} ${digits.substring(3, 6)}`;
        if (digits.length > 6) {
          formatted += ` ${digits.substring(6, 10)}`;
        }
      }
      setFormData(prev => ({ ...prev, [field]: formatted }));
      return;
    }

    if (field === 'digitalAddress') {
      const cleaned = sanitizeDigitalAddress(value);
      let formatted = cleaned;
      if (cleaned.length > 2) {
        formatted = `${cleaned.substring(0, 2)}-${cleaned.substring(2, 5)}`;
        if (cleaned.length > 5) {
          formatted += `-${cleaned.substring(5, 9)}`;
        }
      }
      setFormData(prev => ({ ...prev, [field]: formatted }));
      return;
    }

    if (field === 'city') {
      setFormData(prev => ({ ...prev, [field]: value.toUpperCase() }));
      return;
    }

    if (['fullName', 'streetAddress', 'area', 'landmark', 'region'].includes(field)) {
      setFormData(prev => ({ ...prev, [field]: value.toLowerCase() }));
      return;
    }

    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateDigitalAddress = (address) => {
    if (!address) return true; 
    const cleaned = address.replace(/[^A-Z0-9]/g, '');
    return /^[A-Z]{2}\d{7}$/.test(cleaned);
  };

  const validateForm = () => {
    const errors = {};
    const requiredFields = ['fullName', 'streetAddress', 'area', 'city', 'region', 'contactPhone'];

    requiredFields.forEach((field) => {
      if (!formData[field]) {
        errors[field] = 'This field is required';
      }
    });

    if (formData.city && !['ACCRA', 'TEMA'].includes(formData.city.toUpperCase())) {
      errors.city = 'EazShop currently delivers only in Accra and Tema';
    }

    if (formData.contactPhone) {
      const digits = formData.contactPhone.replace(/\D/g, '');
      const pattern = /^(020|023|024|025|026|027|028|029|050|054|055|056|057|059)\d{7}$/;
      if (!pattern.test(digits)) {
        errors.contactPhone = 'Invalid Ghana phone number';
      }
    }

    if (formData.country === 'Ghana' && !validateDigitalAddress(formData.digitalAddress)) {
      errors.digitalAddress = 'Please use format: GA-123-4567';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const getCurrentLocation = async () => {
    setIsFetchingLocation(true);
    setLocationError('');

    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setLocationError('Permission to access location was denied');
      setIsFetchingLocation(false);
      Alert.alert('Location Permission Denied', 'Please enable location services in your device settings.');
      return;
    }

    try {
      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = location.coords;

      const response = await locationApi.reverseGeocode(latitude, longitude);
      const data = response?.data || response;

      if (data.error) {
        throw new Error(data.error);
      }

      const addressComponents = data.address || {};
      const digitalAddress = `GA-${String(Math.abs(Math.floor(longitude))).padStart(3, '0')}-${String(Math.floor((Math.abs(latitude) % 1) * 10000)).padStart(4, '0')}`;

      setFormData(prev => ({
        ...prev,
        streetAddress: (addressComponents.road || addressComponents.highway || '').toLowerCase(),
        area: (addressComponents.neighborhood || addressComponents.sublocality || addressComponents.sublocality_level_1 || '').toLowerCase(),
        landmark: (addressComponents.landmark || '').toLowerCase(),
        city: (addressComponents.city || addressComponents.town || addressComponents.village || addressComponents.county || '').toUpperCase(),
        region: (addressComponents.state || addressComponents.region || '').toLowerCase(),
        digitalAddress: digitalAddress,
      }));
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      setLocationError('Failed to get address details. Please enter manually.');
      Alert.alert('Location Error', 'Failed to get address details. Please enter manually.');
    } finally {
      setIsFetchingLocation(false);
    }
  };

  const handleSaveAddress = () => {

    if (formData.country === 'Ghana' && !validateDigitalAddress(formData.digitalAddress)) {
      setFormErrors(prev => ({ ...prev, digitalAddress: 'Please use format: GA-123-4567' }));
      return;
    }

    if (!validateForm()) {
      return;
    }

    const dataToSend = {
      ...formData,

      fullName: sanitizeText(formData.fullName || '', 100).toLowerCase(),
      streetAddress: sanitizeAddress(formData.streetAddress || '').toLowerCase(),
      area: sanitizeText(formData.area || '', 100).toLowerCase(),
      landmark: sanitizeText(formData.landmark || '', 100).toLowerCase(),
      city: sanitizeText(formData.city || '', 50).toLowerCase(),
      region: sanitizeText(formData.region || '', 50).toLowerCase(),
      country: sanitizeText(formData.country || 'Ghana', 50).toLowerCase(),
      additionalInformation: sanitizeText(formData.additionalInformation || '', 500).toLowerCase(),

      digitalAddress: (formData.digitalAddress || '').replace(/[^A-Z0-9]/g, '').toUpperCase().substring(0, 9),

      contactPhone: sanitizePhone(formData.contactPhone || ''),

      isDefault: formData.isDefault,
    };

    if (editingAddress) {
      const addressId = editingAddress;
      updateAddress(
        { id: addressId, data: dataToSend },
        {
          onSuccess: () => {
            Alert.alert('Success', 'Address updated successfully');
            resetForm();
            refetch();
          },
          onError: (error) => {
            Alert.alert('Error', error.response?.data?.message || 'Failed to update address');
          },
        }
      );
    } else {
      createAddress(dataToSend, {
        onSuccess: () => {
          Alert.alert('Success', 'Address added successfully');
          resetForm();
          refetch();
        },
        onError: (error) => {
          Alert.alert('Error', error.response?.data?.message || 'Failed to create address');
        },
      });
    }
  };

  const handleDeleteAddress = (addressId) => {
    Alert.alert(
      'Delete Address',
      'Are you sure you want to delete this address?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteAddress(addressId, {
              onSuccess: () => {
                Alert.alert('Success', 'Address deleted successfully');
              },
              onError: (error) => {
                Alert.alert('Error', error.message || 'Failed to delete address');
              },
            });
          },
        },
      ]
    );
  };

  const renderAddress = ({ item }) => (
    <View style={styles.addressCard}>
      <View style={styles.addressHeader}>
        <View style={styles.addressIcon}>
          <Ionicons name="location" size={20} color={theme.colors.primary} />
        </View>
        <View style={styles.addressInfo}>
          <Text style={styles.addressName}>{item.fullName}</Text>
          {item.isDefault && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultBadgeText}>Default</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.addressBody}>
        <Text style={styles.addressText}>{item.streetAddress}</Text>
        <Text style={styles.addressText}>
          {item.area}, {item.city}
        </Text>
        <Text style={styles.addressText}>{item.region}</Text>
        {item.digitalAddress && (
          <View style={styles.addressDigitalRow}>
            <Ionicons name="mail-outline" size={14} color={theme.colors.primary} />
            <Text style={styles.addressDigital}>{item.digitalAddress}</Text>
          </View>
        )}
        <View style={styles.addressPhoneRow}>
          <Ionicons name="call-outline" size={14} color={theme.colors.textPrimary} />
          <Text style={styles.addressPhone}>{item.contactPhone}</Text>
        </View>
      </View>

      <View style={styles.addressActions}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => handleOpenEdit(item._id)}
        >
          <Ionicons name="create-outline" size={16} color={theme.colors.primary} />
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteAddress(item._id)}
          disabled={isDeleting}
        >
          <Ionicons name="trash-outline" size={16} color={theme.colors.error} />
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoading && !refreshing) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Addresses</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading addresses...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Addresses</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleOpenAdd}
        >
          <Ionicons name="add" size={20} color={theme.colors.primary} />
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={addresses}
        renderItem={renderAddress}
        keyExtractor={(item) => item._id || item.id}
        contentContainerStyle={styles.addressList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="location-outline" size={64} color={theme.colors.grey400} />
            <Text style={styles.emptyTitle}>No addresses saved</Text>
            <Text style={styles.emptyText}>
              Add an address to make checkout faster
            </Text>
            <TouchableOpacity
              style={styles.addAddressButton}
              onPress={handleOpenAdd}
            >
              <LinearGradient
                colors={[theme.colors.primary, theme.colors.primary600 || theme.colors.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.addAddressGradient}
              >
                <Text style={styles.addAddressText}>Add Address</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        }
      />

      <Modal
        visible={showOverlay}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseOverlay}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editingAddress ? 'Edit Address' : 'Add New Address'}
                </Text>
                <TouchableOpacity onPress={handleCloseOverlay} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.modalScrollView}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <AppInput
                  label="Full Name *"
                  value={formData.fullName}
                  onChangeText={(value) => handleInputChange('fullName', value)}
                  placeholder="Full name"
                  error={formErrors.fullName}
                />

                <AppInput
                  label="Contact Number *"
                  value={formData.contactPhone}
                  onChangeText={(value) => handleInputChange('contactPhone', value)}
                  placeholder="020 123 4567"
                  keyboardType="phone-pad"
                  error={formErrors.contactPhone}
                  hint="Format: 020, 023, 024, etc. followed by 7 digits"
                />

                <AppInput
                  label="Street Address *"
                  value={formData.streetAddress}
                  onChangeText={(value) => handleInputChange('streetAddress', value)}
                  placeholder="123 Main Street"
                  error={formErrors.streetAddress}
                />

                <NeighborhoodAutocomplete
                  label="Neighborhood/Area *"
                  value={formData.area}
                  onChangeText={(value) => handleInputChange('area', value)}
                  city={formData.city}
                  placeholder="Search neighborhood (e.g., Nima, Cantonments)"
                  onSelect={(neighborhood) => {
                    handleInputChange('area', neighborhood.name);
                  }}
                  error={formErrors.area}
                />

                <AppInput
                  label="Landmark"
                  value={formData.landmark}
                  onChangeText={(value) => handleInputChange('landmark', value)}
                  placeholder="Near Osu Castle (optional)"
                />

                <AppInput
                  label="City *"
                  value={formData.city}
                  onChangeText={(value) => handleInputChange('city', value)}
                  placeholder="Select City"
                  error={formErrors.city}
                  hint="EazShop currently delivers only in Accra and Tema"
                  select
                  options={[{ label: 'Accra', value: 'ACCRA' }, { label: 'Tema', value: 'TEMA' }]}
                />

                <AppInput
                  label="Region *"
                  value={formData.region}
                  onChangeText={(value) => handleInputChange('region', value)}
                  placeholder="Greater Accra"
                  error={formErrors.region}
                />

                <View style={styles.formGroup}>
                  <View style={styles.labelRow}>
                    <Text style={styles.label}>Digital Address</Text>
                    <TouchableOpacity
                      onPress={getCurrentLocation}
                      disabled={isFetchingLocation || formData.country !== 'Ghana'}
                      style={[styles.locationButton, (isFetchingLocation || formData.country !== 'Ghana') && styles.locationButtonDisabled]}
                    >
                      {isFetchingLocation ? (
                        <ActivityIndicator size="small" color={theme.colors.white} />
                      ) : (
                        <>
                          <Ionicons name="locate-outline" size={14} color={theme.colors.white} />
                          <Text style={styles.locationButtonText}>Auto-detect</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                  <AppInput
                    value={formData.digitalAddress}
                    onChangeText={(value) => handleInputChange('digitalAddress', value)}
                    placeholder="GA-123-4567"
                    error={formErrors.digitalAddress}
                    disabled={formData.country !== 'Ghana'}
                    hint={formData.country === 'Ghana' ? 'Format: GA-123-4567 (Ghana Post GPS)' : 'Digital address only available for Ghana'}
                  />
                  {locationError && <Text style={styles.errorText}>{locationError}</Text>}
                </View>

                <AppInput
                  label="Country"
                  value={formData.country}
                  onChangeText={(value) => handleInputChange('country', value)}
                  placeholder="Select Country"
                  select
                  options={[
                    { label: 'Ghana', value: 'Ghana' },
                    { label: 'Nigeria', value: 'Nigeria' },
                    { label: 'South Africa', value: 'South Africa' },
                    { label: 'Kenya', value: 'Kenya' },
                    { label: 'Other', value: 'Other' },
                  ]}
                />

                <AppInput
                  label="Additional Information"
                  value={formData.additionalInformation}
                  onChangeText={(value) => handleInputChange('additionalInformation', value)}
                  placeholder="Apartment number, floor, landmarks, delivery instructions..."
                  multiline
                  numberOfLines={3}
                />

                <View style={styles.checkboxGroup}>
                  <TouchableOpacity
                    style={styles.checkboxContainer}
                    onPress={() => handleInputChange('isDefault', !formData.isDefault)}
                    disabled={isCreating || isUpdating}
                  >
                    <View style={[styles.checkbox, formData.isDefault && styles.checkboxChecked]}>
                      {formData.isDefault && <Ionicons name="checkmark" size={16} color={theme.colors.white} />}
                    </View>
                    <Text style={styles.checkboxLabel}>Set as default shipping address</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.modalActions}>
                  <AppButton
                    title="Cancel"
                    variant="secondary"
                    size="md"
                    onPress={resetForm}
                    disabled={isCreating || isUpdating}
                    style={styles.modalButton}
                  />
                  <AppButton
                    title={editingAddress ? 'Update Address' : 'Save Address'}
                    variant="primary"
                    size="md"
                    onPress={handleSaveAddress}
                    loading={isCreating || isUpdating}
                    disabled={isCreating || isUpdating}
                    style={styles.modalButton}
                  />
                </View>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
  },
  addButtonText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.semiBold,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
  },
  addressList: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  addressCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  addressIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  addressInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressName: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.textPrimary,
    marginRight: theme.spacing.sm,
  },
  defaultBadge: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 2,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
  },
  defaultBadgeText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.white,
    fontWeight: theme.typography.fontWeight.semiBold,
  },
  addressBody: {
    marginBottom: theme.spacing.md,
  },
  addressText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  addressDigitalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  addressDigital: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary,
  },
  addressPhoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  addressPhone: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textPrimary,
  },
  addressActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: theme.colors.grey200,
    paddingTop: theme.spacing.sm,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.xs,
    gap: theme.spacing.xs,
  },
  editButtonText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.semiBold,
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: theme.spacing.xs,
    gap: theme.spacing.xs,
  },
  deleteButtonText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.error,
    fontWeight: theme.typography.fontWeight.semiBold,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing['4xl'],
  },
  emptyTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  addAddressButton: {
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
  },
  addAddressGradient: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    alignItems: 'center',
  },
  addAddressText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.white,
  },
  modalContainer: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    maxHeight: '90%',
    paddingBottom: theme.spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.grey200,
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScrollView: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
  },
  modalActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  modalButton: {
    flex: 1,
  },
  errorText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.error,
    marginTop: theme.spacing.xs,
    marginLeft: theme.spacing.sm,
  },
  formGroup: {
    marginBottom: theme.spacing.md,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  label: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.textPrimary,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.xs,
  },
  locationButtonDisabled: {
    backgroundColor: theme.colors.grey300,
    opacity: 0.5,
  },
  locationButtonText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.white,
    fontWeight: theme.typography.fontWeight.semiBold,
  },
  checkboxGroup: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: theme.colors.grey400,
    borderRadius: theme.borderRadius.sm,
    marginRight: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.white,
  },
  checkboxChecked: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  checkboxLabel: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textPrimary,
    flex: 1,
  },
});

export default AddressesScreen;


