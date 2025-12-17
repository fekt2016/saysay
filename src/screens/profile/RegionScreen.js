import React, { useState, useEffect, useLayoutEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../../theme';
import ProfileSection from '../../components/profile/ProfileSection';
import LogoIcon from '../../components/header/LogoIcon';const RegionScreen = () => {
  const navigation = useNavigation();
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => <LogoIcon />,
      headerTitle: 'Region',
      headerStyle: {
        backgroundColor: theme.colors.white,
      },
      headerShadowVisible: false,
    });
  }, [navigation]);

  const countries = [
    { code: 'GH', name: 'Ghana', flag: '🇬🇭', currency: 'GHS' },
    { code: 'NG', name: 'Nigeria', flag: '🇳🇬', currency: 'NGN' },
    { code: 'ZA', name: 'South Africa', flag: '🇿🇦', currency: 'ZAR' },
    { code: 'KE', name: 'Kenya', flag: '🇰🇪', currency: 'KES' },
    { code: 'TZ', name: 'Tanzania', flag: '🇹🇿', currency: 'TZS' },
    { code: 'UG', name: 'Uganda', flag: '🇺🇬', currency: 'UGX' },
    { code: 'RW', name: 'Rwanda', flag: '🇷🇼', currency: 'RWF' },
    { code: 'ET', name: 'Ethiopia', flag: '🇪🇹', currency: 'ETB' },
    { code: 'EG', name: 'Egypt', flag: '🇪🇬', currency: 'EGP' },
    { code: 'MA', name: 'Morocco', flag: '🇲🇦', currency: 'MAD' },
    { code: 'TN', name: 'Tunisia', flag: '🇹🇳', currency: 'TND' },
    { code: 'DZ', name: 'Algeria', flag: '🇩🇿', currency: 'DZD' },
    { code: 'SN', name: 'Senegal', flag: '🇸🇳', currency: 'XOF' },
    { code: 'CI', name: 'Ivory Coast', flag: '🇨🇮', currency: 'XOF' },
    { code: 'CM', name: 'Cameroon', flag: '🇨🇲', currency: 'XAF' },
    { code: 'AO', name: 'Angola', flag: '🇦🇴', currency: 'AOA' },
    { code: 'MZ', name: 'Mozambique', flag: '🇲🇿', currency: 'MZN' },
    { code: 'ZM', name: 'Zambia', flag: '🇿🇲', currency: 'ZMW' },
    { code: 'ZW', name: 'Zimbabwe', flag: '🇿🇼', currency: 'USD' },
    { code: 'BW', name: 'Botswana', flag: '🇧🇼', currency: 'BWP' },
    { code: 'US', name: 'United States', flag: '🇺🇸', currency: 'USD' },
    { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', currency: 'GBP' },
    { code: 'CA', name: 'Canada', flag: '🇨🇦', currency: 'CAD' },
    { code: 'AU', name: 'Australia', flag: '🇦🇺', currency: 'AUD' },
    { code: 'FR', name: 'France', flag: '🇫🇷', currency: 'EUR' },
    { code: 'DE', name: 'Germany', flag: '🇩🇪', currency: 'EUR' },
    { code: 'IT', name: 'Italy', flag: '🇮🇹', currency: 'EUR' },
    { code: 'ES', name: 'Spain', flag: '🇪🇸', currency: 'EUR' },
    { code: 'NL', name: 'Netherlands', flag: '🇳🇱', currency: 'EUR' },
    { code: 'BE', name: 'Belgium', flag: '🇧🇪', currency: 'EUR' },
    { code: 'CH', name: 'Switzerland', flag: '🇨🇭', currency: 'CHF' },
    { code: 'AT', name: 'Austria', flag: '🇦🇹', currency: 'EUR' },
    { code: 'SE', name: 'Sweden', flag: '🇸🇪', currency: 'SEK' },
    { code: 'NO', name: 'Norway', flag: '🇳🇴', currency: 'NOK' },
    { code: 'DK', name: 'Denmark', flag: '🇩🇰', currency: 'DKK' },
    { code: 'FI', name: 'Finland', flag: '🇫🇮', currency: 'EUR' },
    { code: 'PL', name: 'Poland', flag: '🇵🇱', currency: 'PLN' },
    { code: 'PT', name: 'Portugal', flag: '🇵🇹', currency: 'EUR' },
    { code: 'GR', name: 'Greece', flag: '🇬🇷', currency: 'EUR' },
    { code: 'IE', name: 'Ireland', flag: '🇮🇪', currency: 'EUR' },
    { code: 'CN', name: 'China', flag: '🇨🇳', currency: 'CNY' },
    { code: 'JP', name: 'Japan', flag: '🇯🇵', currency: 'JPY' },
    { code: 'KR', name: 'South Korea', flag: '🇰🇷', currency: 'KRW' },
    { code: 'IN', name: 'India', flag: '🇮🇳', currency: 'INR' },
    { code: 'SG', name: 'Singapore', flag: '🇸🇬', currency: 'SGD' },
    { code: 'MY', name: 'Malaysia', flag: '🇲🇾', currency: 'MYR' },
    { code: 'TH', name: 'Thailand', flag: '🇹🇭', currency: 'THB' },
    { code: 'VN', name: 'Vietnam', flag: '🇻🇳', currency: 'VND' },
    { code: 'PH', name: 'Philippines', flag: '🇵🇭', currency: 'PHP' },
    { code: 'ID', name: 'Indonesia', flag: '🇮🇩', currency: 'IDR' },
    { code: 'BR', name: 'Brazil', flag: '🇧🇷', currency: 'BRL' },
    { code: 'MX', name: 'Mexico', flag: '🇲🇽', currency: 'MXN' },
    { code: 'AR', name: 'Argentina', flag: '🇦🇷', currency: 'ARS' },
    { code: 'CL', name: 'Chile', flag: '🇨🇱', currency: 'CLP' },
    { code: 'CO', name: 'Colombia', flag: '🇨🇴', currency: 'COP' },
    { code: 'PE', name: 'Peru', flag: '🇵🇪', currency: 'PEN' },
    { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪', currency: 'AED' },
    { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', currency: 'SAR' },
    { code: 'IL', name: 'Israel', flag: '🇮🇱', currency: 'ILS' },
    { code: 'TR', name: 'Turkey', flag: '🇹🇷', currency: 'TRY' },
    { code: 'RU', name: 'Russia', flag: '🇷🇺', currency: 'RUB' },
  ];

  const filteredCountries = useMemo(() => {
    if (!searchQuery.trim()) {
      return countries;
    }
    const query = searchQuery.toLowerCase().trim();
    return countries.filter(
      (country) =>
        country.name.toLowerCase().includes(query) 
        country.code.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  useEffect(() => {
    loadRegionPreference();
  }, []);

  const loadRegionPreference = async () => {
    try {
      const savedRegion = await AsyncStorage.getItem('app_region');
      if (savedRegion) {
        const parsed = JSON.parse(savedRegion);
        setSelectedRegion(parsed);
      } else {

        const defaultRegion = countries.find(c => c.code === 'GH') || countries[0];
        setSelectedRegion(defaultRegion);
      }
    } catch (error) {
      console.error('Error loading region preference:', error);
      const defaultRegion = countries.find(c => c.code === 'GH') || countries[0];
      setSelectedRegion(defaultRegion);
    } finally {
      setIsLoading(false);
    }
  };

  const saveRegionPreference = async (country) => {
    setIsSaving(true);
    try {
      await AsyncStorage.setItem('app_region', JSON.stringify(country));
      setSelectedRegion(country);

      Alert.alert(
        'Region Updated',
        `Your region has been set to ${country.name}. Prices and delivery options will be updated for this region.`,
        [
          {
            text: 'OK',
            onPress: () => {},
          },
        ]
      );
    } catch (error) {
      console.error('Error saving region preference:', error);
      Alert.alert('Error', 'Failed to save region preference. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCountrySelect = (country) => {
    if (country.code === selectedRegion?.code) {
      return; 
    }

    saveRegionPreference(country);
  };

  const renderCountryRow = ({ item: country, index }) => {
    const isSelected = country.code === selectedRegion?.code;
    const isLast = index === filteredCountries.length - 1;

    return (
      <TouchableOpacity
        style={[
          styles.countryRow,
          isLast && styles.lastCountryRow,
        ]}
        onPress={() => handleCountrySelect(country)}
        activeOpacity={0.7}
        disabled={isSaving}
      >
        <View style={styles.countryLeft}>
          <Text style={styles.countryFlag}>{country.flag}</Text>
          <View style={styles.countryInfo}>
            <Text style={styles.countryName}>{country.name}</Text>
            <Text style={styles.countryCode}>{country.code} • {country.currency}</Text>
          </View>
        </View>
        <View style={styles.countryRight}>
          {isSaving && isSelected ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : isSelected ? (
            <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
          ) : (
            <View style={styles.radioButton}>
              <View style={styles.radioButtonInner} />
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading region preferences...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        <View style={styles.infoBanner}>
          <Ionicons name="globe-outline" size={24} color={theme.colors.primary} />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>Select Region</Text>
            <Text style={styles.infoDescription}>
              Choose your country/region to see accurate pricing and delivery options for your location.
            </Text>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search-outline" size={20} color={theme.colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search countries..."
              placeholderTextColor={theme.colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                style={styles.clearButton}
                activeOpacity={0.7}
              >
                <Ionicons name="close-circle" size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ProfileSection title="Available Regions">
          {filteredCountries.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={48} color={theme.colors.textSecondary} />
              <Text style={styles.emptyTitle}>No Countries Found</Text>
              <Text style={styles.emptyText}>
                Try searching with a different term.
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredCountries}
              renderItem={renderCountryRow}
              keyExtractor={(item) => item.code}
              scrollEnabled={false}
              ListFooterComponent={
                filteredCountries.length > 0 ? (
                  <View style={styles.listFooter} />
                ) : null
              }
            />
          )}
        </ProfileSection>

        {selectedRegion && (
          <View style={styles.currentSelection}>
            <Text style={styles.currentSelectionLabel}>Current Region:</Text>
            <View style={styles.currentSelectionValueContainer}>
              <Text style={styles.currentSelectionFlag}>{selectedRegion.flag}</Text>
              <Text style={styles.currentSelectionValue}>{selectedRegion.name}</Text>
            </View>
          </View>
        )}

        <View style={styles.infoNotice}>
          <Ionicons name="information-circle-outline" size={16} color={theme.colors.textSecondary} />
          <Text style={styles.infoNoticeText}>
            Changing your region will update product prices and delivery options. Some changes may require refreshing the app.
          </Text>
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

  searchContainer: {
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.grey200,
    paddingHorizontal: theme.spacing.md,
    height: 48,
  },
  searchIcon: {
    marginRight: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textPrimary,
    paddingVertical: 0,
  },
  clearButton: {
    marginLeft: theme.spacing.sm,
    padding: theme.spacing.xs,
  },

  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.grey100 || theme.colors.grey200,
  },
  lastCountryRow: {
    borderBottomWidth: 0,
  },
  countryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  countryFlag: {
    fontSize: 32,
    marginRight: theme.spacing.md,
  },
  countryInfo: {
    flex: 1,
  },
  countryName: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs / 2,
  },
  countryCode: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  countryRight: {
    marginLeft: theme.spacing.md,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.grey300 || theme.colors.grey400,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'transparent',
  },

  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing['4xl'] || theme.spacing.xl * 2,
    paddingHorizontal: theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  listFooter: {
    height: theme.spacing.md,
  },

  currentSelection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.white,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.grey200,
  },
  currentSelectionLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  currentSelectionValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentSelectionFlag: {
    fontSize: 20,
    marginRight: theme.spacing.xs,
  },
  currentSelectionValue: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.primary,
  },

  infoNotice: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.grey200,
  },
  infoNoticeText: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.sm,
    lineHeight: theme.typography.fontSize.sm * 1.5,
  },
});

export default RegionScreen;


