
 
import React from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { theme } from '../../theme';
import AppButton from '../AppButton';


const CouponField = ({
  value,
  onChangeText,
  onApply,
  loading = false,
  disabled = false,
  message,
  success = false,
  error,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Enter coupon code"
          placeholderTextColor={theme.colors.grey400}
          value={value}
          onChangeText={onChangeText}
          editable={!loading && !disabled}
          autoCapitalize="characters"
        />
        <AppButton
          title={loading ? '...' : 'Apply'}
          variant="secondary"
          size="sm"
          onPress={onApply}
          disabled={loading || disabled}
          loading={loading}
          style={styles.button}
        />
      </View>
      {message && (
        <Text style={[styles.message, success && styles.messageSuccess]}>
          {message}
        </Text>
      )}
      {error && (
        <Text style={styles.error}>{error}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
    position: 'relative',
  },
  inputContainer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  input: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.grey300,
    borderRadius: theme.borderRadius.sm,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.grey900,
    backgroundColor: theme.colors.white,
  },
  button: {
    minWidth: 80,
  },
  message: {
    marginTop: theme.spacing.xs,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.red700,
  },
  messageSuccess: {
    color: theme.colors.green700,
  },
  error: {
    marginTop: theme.spacing.xs,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.red700,
  },
});

export default CouponField;



