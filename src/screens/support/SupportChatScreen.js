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
  Image,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { useAuth } from '../../hooks/useAuth';
import { useCreateTicket } from '../../hooks/useSupport';
import { useGetUserOrders } from '../../hooks/useOrder';

import AppInput from '../../components/AppInput';
import AppButton from '../../components/AppButton';
import LogoIcon from '../../components/header/LogoIcon';

import { theme } from '../../theme';

const SupportChatScreen = ({ route, navigation }) => {
  const { user } = useAuth();
  const { mutate: createTicket, isPending: isSubmitting } = useCreateTicket();
  const { orderId, orderNumber, department: preselectedDepartment } = route.params || {};

  const { data: ordersData } = useGetUserOrders();
  const orders = ordersData?.data?.orders || ordersData?.data || [];

  const [formData, setFormData] = useState({
    department: preselectedDepartment || '',
    title: '',
    message: '',
    priority: 'medium',
    relatedOrderId: orderId || '',
    relatedProductId: '',
  });

  const [errors, setErrors] = useState({});
  const [attachments, setAttachments] = useState([]);
  const [showDepartmentPicker, setShowDepartmentPicker] = useState(false);
  const [showOrderPicker, setShowOrderPicker] = useState(false);
  const [showProductPicker, setShowProductPicker] = useState(false);

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
      headerTitle: 'Create Ticket',
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

  useEffect(() => {
    if (preselectedDepartment) {
      setFormData((prev) => ({ ...prev, department: preselectedDepartment }));
    }
    if (orderId) {
      setFormData((prev) => ({ ...prev, relatedOrderId: orderId }));
    }
  }, [preselectedDepartment, orderId]);

  const departments = [
    'Orders & Delivery',
    'Payments & Billing',
    'Shipping & Returns',
    'Account & Profile',
  ];

  const priorities = [
    { label: 'Low', value: 'low' },
    { label: 'Medium', value: 'medium' },
    { label: 'High', value: 'high' },
    { label: 'Urgent', value: 'urgent' },
  ];

  const selectedOrder = orders.find((o) => o._id === formData.relatedOrderId);

  const handleChange = (field, value) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };
      if (field === 'department') {
        newData.relatedOrderId = orderId || '';
        newData.relatedProductId = '';
      }
      if (field === 'relatedOrderId') {
        newData.relatedProductId = '';
      }
      return newData;
    });
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'We need access to your photos to attach images to your ticket.',
        [{ text: 'OK' }]
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      allowsMultipleSelection: false,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
        Alert.alert('Error', 'File size must be less than 5MB');
        return;
      }

      const newAttachment = {
        uri: asset.uri,
        name: asset.fileName || `attachment-${Date.now()}.jpg`,
        type: asset.type || 'image/jpeg',
      };

      if (attachments.length < 5) {
        setAttachments((prev) => [...prev, newAttachment]);
      } else {
        Alert.alert('Limit Reached', 'You can attach up to 5 images');
      }
    }
  };

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.department.trim()) {
      newErrors.department = 'Department is required';
    }
    if (!formData.title.trim()) {
      newErrors.title = 'Subject is required';
    }
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    const ticketPayload = {
      department: formData.department,
      title: formData.title,
      message: formData.message,
      priority: formData.priority,
      attachments: attachments.length > 0 ? attachments : undefined,
    };

    if (formData.relatedOrderId) {
      ticketPayload.relatedOrderId = formData.relatedOrderId;
    }
    if (formData.relatedProductId) {
      ticketPayload.relatedProductId = formData.relatedProductId;
    }

    createTicket(ticketPayload, {
      onSuccess: (response) => {
        Alert.alert(
          'Success',
          'Your support ticket has been created successfully. We\'ll get back to you soon.',
          [
            {
              text: 'OK',
              onPress: () => {
                navigation.navigate('TicketsList');
              },
            },
          ]
        );
      },
      onError: (error) => {
        const errorMessage =
          error?.response?.data?.message ||
          error?.message ||
          'Failed to create support ticket. Please try again.';
        Alert.alert('Error', errorMessage);
      },
    });
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
          {orderId && (
            <View style={styles.orderBanner}>
              <Ionicons name="cube-outline" size={20} color={theme.colors.primary} />
              <Text style={styles.orderBannerText}>
                Getting help with Order #{orderNumber || orderId.slice(-6)}
              </Text>
            </View>
          )}

          <View style={styles.formContainer}>
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>
                Department <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={[
                  styles.selectButton,
                  errors.department && styles.selectButtonError,
                ]}
                onPress={() => {
                  if (!preselectedDepartment) {
                    setShowDepartmentPicker(true);
                  }
                }}
                disabled={isSubmitting || !!preselectedDepartment}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.selectButtonText,
                    !formData.department && styles.selectButtonPlaceholder,
                  ]}
                >
                  {formData.department || 'Select a department'}
                </Text>
                {!preselectedDepartment && (
                  <Ionicons
                    name="chevron-down-outline"
                    size={20}
                    color={theme.colors.textSecondary}
                  />
                )}
              </TouchableOpacity>
              {errors.department && (
                <Text style={styles.errorText}>{errors.department}</Text>
              )}
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.label}>
                Subject <Text style={styles.required}>*</Text>
              </Text>
              <AppInput
                value={formData.title}
                onChangeText={(value) => handleChange('title', value)}
                placeholder="Brief description of your issue"
                error={errors.title}
                disabled={isSubmitting}
              />
            </View>

            {((formData.department === 'Orders & Delivery' ||
              formData.department === 'Shipping & Returns' ||
              formData.department === 'Payments & Billing') &&
              !orderId) && (
                <View style={styles.inputWrapper}>
                  <Text style={styles.label}>Related Order (Optional)</Text>
                  <TouchableOpacity
                    style={styles.selectButton}
                    onPress={() => {
                      if (orders.length === 0) {
                        Alert.alert(
                          'No Orders',
                          'You don\'t have any orders yet. You can still submit a ticket without selecting an order.'
                        );
                        return;
                      }
                      setShowOrderPicker(true);
                    }}
                    disabled={isSubmitting}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.selectButtonText,
                        !formData.relatedOrderId && styles.selectButtonPlaceholder,
                      ]}
                    >
                      {formData.relatedOrderId
                        ? `Order #${orders.find((o) => o._id === formData.relatedOrderId)?.orderNumber || formData.relatedOrderId.slice(-8)}`
                        : 'Select an order (optional)'}
                    </Text>
                    <Ionicons
                      name="chevron-down-outline"
                      size={20}
                      color={theme.colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
              )}

            {formData.relatedOrderId && selectedOrder?.orderItems && (
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Related Product (Optional)</Text>
                <TouchableOpacity
                  style={styles.selectButton}
                  onPress={() => {
                    const items = selectedOrder.orderItems || [];
                    if (items.length === 0) return;
                    setShowProductPicker(true);
                  }}
                  disabled={isSubmitting}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.selectButtonText,
                      !formData.relatedProductId && styles.selectButtonPlaceholder,
                    ]}
                  >
                    {formData.relatedProductId
                      ? selectedOrder.orderItems.find(
                          (item) =>
                            (item.product?._id || item.product || item.productId) ===
                            formData.relatedProductId
                        )?.product?.name || 'Selected'
                      : 'Select a product (optional)'}
                  </Text>
                  <Ionicons
                    name="chevron-down-outline"
                    size={20}
                    color={theme.colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Priority</Text>
              <View style={styles.priorityContainer}>
                {priorities.map((priority) => (
                  <TouchableOpacity
                    key={priority.value}
                    style={[
                      styles.priorityButton,
                      formData.priority === priority.value && styles.priorityButtonActive,
                    ]}
                    onPress={() => handleChange('priority', priority.value)}
                    disabled={isSubmitting}
                  >
                    <Text
                      style={[
                        styles.priorityButtonText,
                        formData.priority === priority.value &&
                          styles.priorityButtonTextActive,
                      ]}
                    >
                      {priority.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.label}>
                Message <Text style={styles.required}>*</Text>
              </Text>
              <AppInput
                value={formData.message}
                onChangeText={(value) => handleChange('message', value)}
                placeholder="Please provide detailed information about your issue..."
                multiline
                numberOfLines={6}
                error={errors.message}
                disabled={isSubmitting}
              />
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Attachments (Optional)</Text>
              <Text style={styles.helperText}>
                You can attach up to 5 images (max 5MB each)
              </Text>
              <TouchableOpacity
                style={styles.attachButton}
                onPress={handlePickImage}
                disabled={isSubmitting || attachments.length >= 5}
              >
                <Ionicons name="attach-outline" size={20} color={theme.colors.primary} />
                <Text style={styles.attachButtonText}>
                  {attachments.length >= 5 ? 'Limit Reached' : 'Attach Image'}
                </Text>
              </TouchableOpacity>

              {attachments.length > 0 && (
                <View style={styles.attachmentsContainer}>
                  {attachments.map((attachment, index) => (
                    <View key={index} style={styles.attachmentItem}>
                      <Image source={{ uri: attachment.uri }} style={styles.attachmentImage} />
                      <TouchableOpacity
                        style={styles.removeAttachmentButton}
                        onPress={() => removeAttachment(index)}
                      >
                        <Ionicons name="close-circle" size={24} color={theme.colors.error} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.buttonWrapper}>
              <AppButton
                title="Submit Ticket"
                onPress={handleSubmit}
                loading={isSubmitting}
                disabled={isSubmitting}
                fullWidth
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={showDepartmentPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDepartmentPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Department</Text>
              <TouchableOpacity
                onPress={() => setShowDepartmentPicker(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              {departments.map((dept) => (
                <TouchableOpacity
                  key={dept}
                  style={[
                    styles.modalOption,
                    formData.department === dept && styles.modalOptionSelected,
                  ]}
                  onPress={() => {
                    handleChange('department', dept);
                    setShowDepartmentPicker(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      formData.department === dept && styles.modalOptionTextSelected,
                    ]}
                  >
                    {dept}
                  </Text>
                  {formData.department === dept && (
                    <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showOrderPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowOrderPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Order</Text>
              <TouchableOpacity
                onPress={() => setShowOrderPicker(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => {
                  handleChange('relatedOrderId', '');
                  setShowOrderPicker(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.modalOptionText}>None (Optional)</Text>
              </TouchableOpacity>
              {orders.map((order) => (
                <TouchableOpacity
                  key={order._id}
                  style={[
                    styles.modalOption,
                    formData.relatedOrderId === order._id && styles.modalOptionSelected,
                  ]}
                  onPress={() => {
                    handleChange('relatedOrderId', order._id);
                    setShowOrderPicker(false);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.modalOptionContent}>
                    <Text
                      style={[
                        styles.modalOptionText,
                        formData.relatedOrderId === order._id && styles.modalOptionTextSelected,
                      ]}
                    >
                      Order #{order.orderNumber || order._id?.slice(-8)}
                    </Text>
                    <Text style={styles.modalOptionSubtext}>
                      {new Date(order.createdAt).toLocaleDateString()} • GH₵{' '}
                      {(order.totalPrice || 0).toFixed(2)}
                    </Text>
                  </View>
                  {formData.relatedOrderId === order._id && (
                    <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showProductPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowProductPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Product</Text>
              <TouchableOpacity
                onPress={() => setShowProductPicker(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => {
                  handleChange('relatedProductId', '');
                  setShowProductPicker(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.modalOptionText}>None (Optional)</Text>
              </TouchableOpacity>
              {selectedOrder?.orderItems?.map((item, index) => {
                const productId = item.product?._id || item.product || item.productId;
                const productName = item.product?.name || 'Product';
                const quantity = item.quantity || 1;
                return (
                  <TouchableOpacity
                    key={productId || index}
                    style={[
                      styles.modalOption,
                      formData.relatedProductId === productId && styles.modalOptionSelected,
                    ]}
                    onPress={() => {
                      handleChange('relatedProductId', productId);
                      setShowProductPicker(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.modalOptionText,
                        formData.relatedProductId === productId && styles.modalOptionTextSelected,
                      ]}
                    >
                      {productName} - Qty: {quantity}
                    </Text>
                    {formData.relatedProductId === productId && (
                      <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
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

  orderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary + '15',
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
    gap: theme.spacing.sm,
  },
  orderBannerText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.primary,
    flex: 1,
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
  label: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  required: {
    color: theme.colors.error,
  },
  helperText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.error,
    marginTop: theme.spacing.xs,
  },

  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: theme.colors.grey300,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.white,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    minHeight: 48,
  },
  selectButtonError: {
    borderColor: theme.colors.error,
  },
  selectButtonText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textPrimary,
    flex: 1,
  },
  selectButtonPlaceholder: {
    color: theme.colors.grey400,
  },

  priorityContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  priorityButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.grey100,
    borderWidth: 1,
    borderColor: theme.colors.grey300,
  },
  priorityButtonActive: {
    backgroundColor: theme.colors.primary + '15',
    borderColor: theme.colors.primary,
  },
  priorityButtonText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  priorityButtonTextActive: {
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.semibold,
  },

  attachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: theme.colors.grey300,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.grey50,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  attachButtonText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  attachmentsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  attachmentItem: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: theme.borderRadius.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.grey300,
  },
  attachmentImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeAttachmentButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: theme.colors.white,
    borderRadius: 12,
  },

  buttonWrapper: {
    marginTop: theme.spacing.lg,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: theme.borderRadius.xl || 20,
    borderTopRightRadius: theme.borderRadius.xl || 20,
    maxHeight: '80%',
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
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  modalCloseButton: {
    padding: theme.spacing.xs,
  },
  modalBody: {
    maxHeight: 400,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.grey100,
  },
  modalOptionSelected: {
    backgroundColor: theme.colors.primary + '10',
  },
  modalOptionContent: {
    flex: 1,
  },
  modalOptionText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textPrimary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  modalOptionTextSelected: {
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  modalOptionSubtext: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs / 2,
  },
});

export default SupportChatScreen;


