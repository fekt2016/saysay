
 
import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';

const PaymentMethodCard = ({
  icon,
  title,
  description,
  selected = false,
  disabled = false,
  onPress,
  children, // Additional content (e.g., bank details, balance info)
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      style={[
        styles.container,
        selected && styles.selected,
        disabled && styles.disabled,
      ]}
    >
      <View style={styles.content}>
          <View
            style={[
              styles.iconContainer,
              selected && styles.iconContainerSelected,
            ]}
          >
            {typeof icon === 'string' && icon.startsWith('ionicons:') ? (
              <Ionicons 
                name={icon.replace('ionicons:', '')} 
                size={20} 
                color={selected ? theme.colors.white : theme.colors.textPrimary} 
              />
            ) : (
              <Text style={styles.icon}>{icon}</Text>
            )}
          </View>
        <View style={styles.info}>
          <Text
            style={[
              styles.title,
              selected && styles.titleSelected,
              disabled && styles.titleDisabled,
            ]}
          >
            {title}
          </Text>
          <Text style={styles.description}>{description}</Text>
          {children && <View style={styles.children}>{children}</View>}
        </View>
        {selected && (
          <View style={styles.checkmark}>
            <Ionicons name="checkmark" size={14} color={theme.colors.white} />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 2.5,
    borderColor: theme.colors.grey200,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.white,
    position: 'relative',
    ...theme.shadows.sm,
  },
  selected: {
    borderColor: theme.colors.primary500,
    backgroundColor: theme.colors.primary50,
    ...theme.shadows.md,
  },
  disabled: {
    opacity: 0.6,
    borderColor: theme.colors.grey300,
    backgroundColor: theme.colors.grey50,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.grey100,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconContainerSelected: {
    backgroundColor: theme.colors.primary500,
  },
  icon: {
    fontSize: 20,
  },
  info: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  title: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.grey900,
    marginBottom: theme.spacing.xs,
  },
  titleSelected: {
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.primary700,
  },
  titleDisabled: {
    color: theme.colors.grey500,
  },
  description: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.grey600,
    lineHeight: theme.typography.lineHeight.normal * theme.typography.fontSize.sm,
  },
  children: {
    marginTop: theme.spacing.sm,
  },
  checkmark: {
    position: 'absolute',
    top: theme.spacing.md,
    right: theme.spacing.md,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.primary500,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.md,
  },
});

export default PaymentMethodCard;


