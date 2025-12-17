import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme';

const AppButton = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  textStyle,
  ...props
}) => {
  const getGradientColors = () => {
    if (variant === 'primary') {
      return [theme.colors.primary, theme.colors.primary600 || theme.colors.primary];
    } else if (variant === 'secondary') {
      return [theme.colors.secondary, theme.colors.grey700 || theme.colors.secondary];
    } else if (variant === 'accent') {
      return [theme.colors.brand500 || theme.colors.primary, theme.colors.brand600 || theme.colors.primary];
    }
    return [theme.colors.primary, theme.colors.primary600 || theme.colors.primary];
  };

  const getButtonStyles = () => {
    const baseStyles = [styles.buttonBase];
    
    if (size === 'sm') baseStyles.push(styles.buttonSm);
    if (size === 'lg') baseStyles.push(styles.buttonLg);
    
    if (variant === 'outline') {
      baseStyles.push(styles.outlineButton);
    }
    
    if (disabled || loading) {
      baseStyles.push(styles.disabled);
    }
    
    return baseStyles;
  };

  const getTextColor = () => {
    if (variant === 'outline') return theme.colors.primary;
    if (variant === 'ghost') return theme.colors.textPrimary;
    return theme.colors.white;
  };

  const getTextStyles = () => {
    const baseStyles = [styles.buttonText, { color: getTextColor() }];
    
    if (size === 'sm') baseStyles.push(styles.textSm);
    if (size === 'lg') baseStyles.push(styles.textLg);
    
    if (textStyle) baseStyles.push(textStyle);
    
    return baseStyles;
  };

  if (variant === 'outline' || variant === 'ghost') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.7}
        style={[
          getButtonStyles(),
          fullWidth && styles.fullWidth,
          style
        ]}
        {...props}
      >
        {loading ? (
          <ActivityIndicator
            color={variant === 'outline' ? theme.colors.primary : theme.colors.textPrimary}
            size="small"
          />
        ) : (
          <Text style={getTextStyles()}>
            {title}
          </Text>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[fullWidth && styles.fullWidth, style]}
      {...props}
    >
      <LinearGradient
        colors={getGradientColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={getButtonStyles()}
      >
        {loading ? (
          <ActivityIndicator color={theme.colors.white} size="small" />
        ) : (
          <Text style={getTextStyles()}>
            {title}
          </Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fullWidth: {
    width: '100%',
  },
  buttonBase: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  buttonSm: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    minHeight: 36,
  },
  buttonLg: {
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    minHeight: 56,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  disabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semiBold,
  },
  textSm: {
    fontSize: theme.typography.fontSize.sm,
  },
  textLg: {
    fontSize: theme.typography.fontSize.lg,
  },
});

export default AppButton;
