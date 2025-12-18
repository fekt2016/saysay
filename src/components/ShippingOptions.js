
 
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, KeyboardAvoidingView, ScrollView, Text, TextInput, TouchableHighlight, TouchableOpacity, TouchableWithoutFeedback, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGetShippingOptions } from '../hooks/useShipping';
import { calculateCartWeight } from '../utils/calculateCartWeight';
import { theme } from '../theme';


const ShippingOptions = ({
  weight,
  city,
  neighborhoodName,
  fragile = false,
  items,
  selectedShippingType,
  onSelect,
}) => {
  const [localSelected, setLocalSelected] = useState(selectedShippingType || 'standard');

  // Calculate weight if not provided - ensure minimum 0.5kg
  const calculatedWeight = items && items.length > 0 ? calculateCartWeight(items) : 0.5;
  const totalWeight = weight && weight > 0 ? weight : calculatedWeight;

  // Normalize city name (ACCRA -> Accra, TEMA -> Tema)
  const normalizedCity = city ? (city.charAt(0).toUpperCase() + city.slice(1).toLowerCase()) : null;

  // Fetch shipping options using neighborhood-based ShippingZone system
  const {
    data: shippingData,
    isLoading,
    error,
  } = useGetShippingOptions({
    neighborhoodName,
    city: normalizedCity,
    weight: totalWeight,
    fragile: fragile || false,
    enabled: !!(neighborhoodName && normalizedCity && totalWeight > 0),
  });

  // Update local state when prop changes
  useEffect(() => {
    if (selectedShippingType) {
      setLocalSelected(selectedShippingType);
    }
  }, [selectedShippingType]);

  // When fragile or shippingData changes, automatically recalculate and update the selected option
  useEffect(() => {
    if (shippingData?.options && localSelected && onSelect) {
      const option = shippingData.options.find((opt) => opt.type === localSelected);
      if (option && option.available) {
        const fee = option.fee || 0;
        if (fee > 0) {
          onSelect({
            shippingType: localSelected,
            shippingFee: fee,
            deliveryEstimate: option.estimate || '',
            zone: shippingData?.zone?.name,
            distanceKm: shippingData?.distance,
            breakdown: option.breakdown,
          });
        }
      }
    }
  }, [fragile, shippingData?.options, localSelected, onSelect]);

  // Handle selection
  const handleSelect = (shippingType) => {
    setLocalSelected(shippingType);
    if (onSelect) {
      const option = shippingData?.options?.find((opt) => opt.type === shippingType);
      if (option && option.available) {
        onSelect({
          shippingType,
          shippingFee: option.fee || 0,
          deliveryEstimate: option.estimate || '',
          zone: shippingData?.zone?.name,
          distanceKm: shippingData?.distance,
          breakdown: option.breakdown,
        });
      }
    }
  };

  if (isLoading) {
    return (
      <ShippingOptionsContainer>
        <LoadingContainer>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <LoadingText>Calculating shipping fees...</LoadingText>
        </LoadingContainer>
      </ShippingOptionsContainer>
    );
  }

  if (error) {
    return (
      <ShippingOptionsContainer>
        <ErrorContainer>
          <ErrorText>
            {error?.response?.data?.message || 'Failed to calculate shipping fees'}
          </ErrorText>
        </ErrorContainer>
      </ShippingOptionsContainer>
    );
  }

  if (!shippingData?.options || shippingData.options.length === 0) {
    return (
      <ShippingOptionsContainer>
        <ErrorContainer>
          <ErrorText>No shipping options available</ErrorText>
        </ErrorContainer>
      </ShippingOptionsContainer>
    );
  }

  const standardOption = shippingData.options.find((opt) => opt.type === 'standard');
  const sameDayOption = shippingData.options.find((opt) => opt.type === 'same_day');
  const expressOption = shippingData.options.find((opt) => opt.type === 'express');

  return (
    <ShippingOptionsContainer>
      <View style={styles.shippingOptionsTitle}>
        <Text style={styles.shippingOptionsTitleText}>Select Delivery Speed</Text>
      </View>

      {/* Standard Delivery */}
      {standardOption && (
        <TouchableOpacity
          style={[
            styles.shippingCard,
            localSelected === 'standard' && styles.shippingCardSelected,
          ]}
          onPress={() => handleSelect('standard')}
          activeOpacity={0.7}
        >
          <View style={styles.shippingCardContent}>
            <View style={styles.shippingCardLeft}>
              <View
                style={[
                  styles.shippingIconContainer,
                  localSelected === 'standard' && styles.shippingIconContainerSelected,
                ]}
              >
                <Text style={styles.shippingIcon}>⏰</Text>
              </View>
              <View style={styles.shippingInfo}>
                <Text
                  style={[
                    styles.shippingTitle,
                    localSelected === 'standard' && styles.shippingTitleSelected,
                  ]}
                >
                  Standard Delivery
                </Text>
                <Text style={styles.shippingDescription}>2-3 business days</Text>
                {standardOption.estimate && (
                  <Text style={styles.shippingEstimate}>
                    Estimated: {standardOption.estimate}
                  </Text>
                )}
              </View>
            </View>
            <View style={styles.shippingCardRight}>
              {localSelected === 'standard' && (
                <View style={styles.shippingCheckmark}>
                  <Text style={styles.shippingCheckmarkText}>✓</Text>
                </View>
              )}
              <Text
                style={[
                  styles.shippingPrice,
                  localSelected === 'standard' && styles.shippingPriceSelected,
                ]}
              >
                GH₵{standardOption.fee?.toFixed(2) || '0.00'}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      )}

      {/* Next Day Delivery */}
      {sameDayOption && (
        <TouchableOpacity
          style={[
            styles.shippingCard,
            localSelected === 'same_day' && styles.shippingCardSelected,
            !sameDayOption.available && styles.shippingCardDisabled,
          ]}
          onPress={() => sameDayOption.available && handleSelect('same_day')}
          activeOpacity={sameDayOption.available ? 0.7 : 1}
          disabled={!sameDayOption.available}
        >
          <View style={styles.shippingCardContent}>
            <View style={styles.shippingCardLeft}>
              <View
                style={[
                  styles.shippingIconContainer,
                  localSelected === 'same_day' && styles.shippingIconContainerSelected,
                  !sameDayOption.available && styles.shippingIconContainerDisabled,
                ]}
              >
                <Text style={styles.shippingIcon}>🚚</Text>
              </View>
              <View style={styles.shippingInfo}>
                <View style={styles.shippingTitleRow}>
                  <Text
                    style={[
                      styles.shippingTitle,
                      localSelected === 'same_day' && styles.shippingTitleSelected,
                      !sameDayOption.available && styles.shippingTitleDisabled,
                    ]}
                  >
                    Next Day Delivery
                  </Text>
                  {!sameDayOption.available && (
                    <View style={styles.unavailableBadge}>
                      <Text style={styles.unavailableBadgeText}>Unavailable</Text>
                    </View>
                  )}
                </View>
                <Text
                  style={[
                    styles.shippingDescription,
                    !sameDayOption.available && styles.shippingDescriptionDisabled,
                  ]}
                >
                  Arrives Tomorrow
                </Text>
                {!sameDayOption.available && sameDayOption.cutOff && (
                  <Text style={styles.unavailableReason}>
                    Cut-off time: {sameDayOption.cutOff}
                  </Text>
                )}
                {sameDayOption.estimate && sameDayOption.available && (
                  <Text style={styles.shippingEstimate}>
                    Estimated: {sameDayOption.estimate}
                  </Text>
                )}
              </View>
            </View>
            <View style={styles.shippingCardRight}>
              {localSelected === 'same_day' && (
                <View style={styles.shippingCheckmark}>
                  <Text style={styles.shippingCheckmarkText}>✓</Text>
                </View>
              )}
              <Text
                style={[
                  styles.shippingPrice,
                  localSelected === 'same_day' && styles.shippingPriceSelected,
                  !sameDayOption.available && styles.shippingPriceDisabled,
                ]}
              >
                GH₵{sameDayOption.fee?.toFixed(2) || '0.00'}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      )}

      {/* Express Delivery */}
      {expressOption && (
        <TouchableOpacity
          style={[
            styles.shippingCard,
            localSelected === 'express' && styles.shippingCardSelected,
            !expressOption.available && styles.shippingCardDisabled,
          ]}
          onPress={() => expressOption.available && handleSelect('express')}
          activeOpacity={expressOption.available ? 0.7 : 1}
          disabled={!expressOption.available}
        >
          <View style={styles.shippingCardContent}>
            <View style={styles.shippingCardLeft}>
              <View
                style={[
                  styles.shippingIconContainer,
                  styles.shippingIconContainerExpress,
                  localSelected === 'express' && styles.shippingIconContainerSelected,
                  !expressOption.available && styles.shippingIconContainerDisabled,
                ]}
              >
                <Text style={styles.shippingIcon}>🚀</Text>
              </View>
              <View style={styles.shippingInfo}>
                <View style={styles.shippingTitleRow}>
                  <Text
                    style={[
                      styles.shippingTitle,
                      localSelected === 'express' && styles.shippingTitleSelected,
                      !expressOption.available && styles.shippingTitleDisabled,
                    ]}
                  >
                    Express Delivery
                  </Text>
                  {expressOption.available && (
                    <View style={styles.expressBadge}>
                      <Text style={styles.expressBadgeText}>Fastest</Text>
                    </View>
                  )}
                  {!expressOption.available && (
                    <View style={styles.unavailableBadge}>
                      <Text style={styles.unavailableBadgeText}>Unavailable</Text>
                    </View>
                  )}
                </View>
                <Text
                  style={[
                    styles.shippingDescription,
                    !expressOption.available && styles.shippingDescriptionDisabled,
                  ]}
                >
                  Same day delivery
                </Text>
                {expressOption.estimate && expressOption.available && (
                  <Text style={styles.shippingEstimate}>
                    Estimated: {expressOption.estimate}
                  </Text>
                )}
              </View>
            </View>
            <View style={styles.shippingCardRight}>
              {localSelected === 'express' && (
                <View style={styles.shippingCheckmark}>
                  <Text style={styles.shippingCheckmarkText}>✓</Text>
                </View>
              )}
              <Text
                style={[
                  styles.shippingPrice,
                  localSelected === 'express' && styles.shippingPriceSelected,
                  !expressOption.available && styles.shippingPriceDisabled,
                ]}
              >
                GH₵{expressOption.fee?.toFixed(2) || '0.00'}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      )}
    </ShippingOptionsContainer>
  );
};

export default ShippingOptions;



const ShippingOptionsContainer = ({style, ...props}) => (
  <View {...props} style={[styles.shippingOptionsContainer, style]} />
);


const ShippingOptionCard = ({style, ...props}) => (
  <TouchableOpacity {...props} style={[styles.shippingOptionCard, style]} />
);


const OptionContent = ({style, ...props}) => (
  <View {...props} style={[styles.optionContent, style]} />
);


const OptionHeader = ({style, ...props}) => (
  <View {...props} style={[styles.optionHeader, style]} />
);


const OptionIcon = ({style, ...props}) => (
  <View {...props} style={[styles.optionIcon, style]} />
);


const IconText = ({style, ...props}) => (
  <Text {...props} style={[styles.iconText, style]} />
);


const OptionInfo = ({style, ...props}) => (
  <View {...props} style={[styles.optionInfo, style]} />
);


const OptionTitle = ({style, ...props}) => (
  <Text {...props} style={[styles.optionTitle, style]} />
);


const OptionDescription = ({style, ...props}) => (
  <Text {...props} style={[styles.optionDescription, style]} />
);


const UnavailableText = ({style, ...props}) => (
  <Text {...props} style={[styles.unavailableText, style]} />
);


const OptionPrice = ({style, ...props}) => (
  <Text {...props} style={[styles.optionPrice, style]} />
);


const Checkmark = ({style, ...props}) => (
  <Text {...props} style={[styles.checkmark, style]} />
);


const LoadingContainer = ({style, ...props}) => (
  <View {...props} style={[styles.loadingContainer, style]} />
);


const LoadingText = ({style, ...props}) => (
  <Text {...props} style={[styles.loadingText, style]} />
);


const ErrorContainer = ({style, ...props}) => (
  <View {...props} style={[styles.errorContainer, style]} />
);


const ErrorText = ({style, ...props}) => (
  <Text {...props} style={[styles.errorText, style]} />
);


const styles = StyleSheet.create({
  shippingOptionsContainer: {
    gap: theme.spacing.md,
  },
  shippingOptionsTitle: {
    marginBottom: theme.spacing.sm,
  },
  shippingOptionsTitleText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.grey900,
  },
  shippingCard: {
    borderWidth: 2.5,
    borderColor: theme.colors.grey200,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.white,
    ...theme.shadows.sm,
    position: 'relative',
  },
  shippingCardSelected: {
    borderColor: theme.colors.primary500,
    backgroundColor: theme.colors.primary50,
    ...theme.shadows.md,
  },
  shippingCardDisabled: {
    opacity: 0.6,
    borderColor: theme.colors.grey300,
    backgroundColor: theme.colors.grey50,
  },
  shippingCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  shippingCardLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: theme.spacing.md,
  },
  shippingCardRight: {
    alignItems: 'flex-end',
    gap: theme.spacing.xs,
  },
  shippingIconContainer: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.grey100,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  shippingIconContainerSelected: {
    backgroundColor: theme.colors.primary500,
  },
  shippingIconContainerExpress: {
    backgroundColor: theme.colors.amber100,
  },
  shippingIconContainerDisabled: {
    backgroundColor: theme.colors.grey200,
  },
  shippingIcon: {
    fontSize: 24,
  },
  shippingInfo: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  shippingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flexWrap: 'wrap',
  },
  shippingTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.grey900,
  },
  shippingTitleSelected: {
    color: theme.colors.primary700,
    fontWeight: theme.typography.fontWeight.bold,
  },
  shippingTitleDisabled: {
    color: theme.colors.grey500,
  },
  shippingDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.grey600,
    lineHeight: theme.typography.lineHeight.normal * theme.typography.fontSize.sm,
  },
  shippingDescriptionDisabled: {
    color: theme.colors.grey400,
  },
  shippingEstimate: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.grey500,
    marginTop: theme.spacing.xs / 2,
  },
  shippingPrice: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.grey900,
    textAlign: 'right',
  },
  shippingPriceSelected: {
    color: theme.colors.primary700,
    fontSize: theme.typography.fontSize.xl,
  },
  shippingPriceDisabled: {
    color: theme.colors.grey400,
  },
  shippingCheckmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.primary500,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.sm,
  },
  shippingCheckmarkText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
  },
  expressBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs / 2,
    backgroundColor: theme.colors.amber500,
    borderRadius: theme.borderRadius.sm,
  },
  expressBadgeText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.white,
    fontWeight: theme.typography.fontWeight.bold,
    letterSpacing: 0.5,
  },
  unavailableBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs / 2,
    backgroundColor: theme.colors.grey300,
    borderRadius: theme.borderRadius.sm,
  },
  unavailableBadgeText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.grey700,
    fontWeight: theme.typography.fontWeight.medium,
  },
  unavailableReason: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.red600,
    marginTop: theme.spacing.xs / 2,
    fontStyle: 'italic',
  },
  // Legacy styles for backward compatibility
  shippingOptionCard: {
    borderWidth: 2,
  },
  optionContent: {
    flexDirection: 'column',
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIcon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 20,
  },
  optionInfo: {
    flex: 1,
    flexDirection: 'column',
  },
  optionTitle: {
  },
  optionDescription: {
  },
  unavailableText: {
  },
  optionPrice: {
    textAlign: 'right',
  },
  checkmark: {
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  loadingText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.grey600,
    marginLeft: theme.spacing.sm,
  },
  errorContainer: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.red50,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.red200,
  },
  errorText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.red700,
    fontWeight: theme.typography.fontWeight.medium,
    textAlign: 'center',
  },
});

