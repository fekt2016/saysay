
 
import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { theme } from '../../theme';


const AddressCard = ({
  address,
  selected = false,
  onPress,
  isDefault = false,
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.container, selected && styles.selected]}
    >
      <View style={styles.content}>
        <View
          style={[
            styles.iconContainer,
            selected && styles.iconContainerSelected,
          ]}
        >
          <Text style={styles.icon}>📍</Text>
        </View>
        <View style={styles.info}>
          <Text
            style={[styles.streetAddress, selected && styles.streetAddressSelected]}
          >
            {address.streetAddress}
          </Text>
          {address.area && (
            <Text style={styles.text}>{address.area}</Text>
          )}
          {address.landmark && (
            <Text style={styles.text}>{address.landmark}</Text>
          )}
          <Text style={styles.text}>
            {address.city}, {address.region}
          </Text>
          <Text style={styles.text}>{address.contactPhone}</Text>
          {isDefault && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultBadgeText}>Default Address</Text>
            </View>
          )}
        </View>
        {selected && (
          <View style={styles.checkmark}>
            <Text style={styles.checkmarkText}>✓</Text>
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
  streetAddress: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.grey900,
    marginBottom: theme.spacing.xs,
  },
  streetAddressSelected: {
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.primary700,
  },
  text: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.grey600,
    lineHeight: theme.typography.lineHeight.normal * theme.typography.fontSize.sm,
  },
  defaultBadge: {
    alignSelf: 'flex-start',
    marginTop: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    backgroundColor: theme.colors.green700,
    borderRadius: theme.borderRadius.md,
  },
  defaultBadgeText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.white,
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
  checkmarkText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
  },
});

export default AddressCard;


