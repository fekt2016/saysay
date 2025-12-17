import React, { useState, useEffect, useLayoutEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../../theme';
import ProfileSection from '../../components/profile/ProfileSection';
import LogoIcon from '../../components/header/LogoIcon';const DarkModeScreen = () => {
  const navigation = useNavigation();
  const systemColorScheme = useColorScheme(); 
  const [selectedMode, setSelectedMode] = useState('system');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => <LogoIcon />,
      headerTitle: 'Appearance',
      headerStyle: {
        backgroundColor: theme.colors.white,
      },
      headerShadowVisible: false,
    });
  }, [navigation]);

  const themeModes = [
    {
      id: 'system',
      name: 'System Default',
      description: 'Follows your device\'s appearance setting',
      icon: 'phone-portrait-outline',
      preview: {
        backgroundColor: '#f3f4f6',
        textColor: '#374151',
        borderColor: '#e5e7eb',
      },
    },
    {
      id: 'light',
      name: 'Light',
      description: 'Always use light appearance',
      icon: 'sunny-outline',
      preview: {
        backgroundColor: '#ffffff',
        textColor: '#111827',
        borderColor: '#e5e7eb',
      },
    },
    {
      id: 'dark',
      name: 'Dark',
      description: 'Always use dark appearance',
      icon: 'moon-outline',
      preview: {
        backgroundColor: '#1f2937',
        textColor: '#f9fafb',
        borderColor: '#374151',
      },
    },
  ];

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('app_theme_mode');
      if (savedTheme) {
        setSelectedMode(savedTheme);
      } else {

        setSelectedMode('system');
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
      setSelectedMode('system');
    } finally {
      setIsLoading(false);
    }
  };

  const saveThemePreference = async (mode) => {
    setIsSaving(true);
    try {
      await AsyncStorage.setItem('app_theme_mode', mode);
      setSelectedMode(mode);

      const effectiveTheme = mode === 'system' 
        ? (systemColorScheme || 'light')
        : mode;

      Alert.alert(
        'Appearance Updated',
        `Your appearance has been set to ${themeModes.find(m => m.id === mode)?.name || mode}. The app will now use ${effectiveTheme} mode.`,
        [
          {
            text: 'OK',
            onPress: () => {},
          },
        ]
      );
    } catch (error) {
      console.error('Error saving theme preference:', error);
      Alert.alert('Error', 'Failed to save appearance preference. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleModeSelect = (mode) => {
    if (mode === selectedMode) {
      return; 
    }

    saveThemePreference(mode);
  };

  const getEffectiveTheme = () => {
    if (selectedMode === 'system') {
      return systemColorScheme === 'dark' ? 'dark' : 'light';
    }
    return selectedMode;
  };

  const renderThemeModeRow = (mode, index) => {
    const isSelected = mode.id === selectedMode;
    const isLast = index === themeModes.length - 1;
    const effectiveTheme = getEffectiveTheme();

    return (
      <TouchableOpacity
        key={mode.id}
        style={[
          styles.themeRow,
          isLast && styles.lastThemeRow,
        ]}
        onPress={() => handleModeSelect(mode.id)}
        activeOpacity={0.7}
        disabled={isSaving}
      >
        <View style={styles.themeLeft}>
          <View style={[styles.themeIconContainer, { backgroundColor: theme.colors.primary + '15' }]}>
            <Ionicons name={mode.icon} size={24} color={theme.colors.primary} />
          </View>
          <View style={styles.themeInfo}>
            <View style={styles.themeHeader}>
              <Text style={styles.themeName}>{mode.name}</Text>
              {mode.id === 'system' && systemColorScheme && (
                <Text style={styles.systemHint}>
                  ({systemColorScheme === 'dark' ? 'Dark' : 'Light'})
                </Text>
              )}
            </View>
            <Text style={styles.themeDescription}>{mode.description}</Text>
          </View>
        </View>
        <View style={styles.themeRight}>
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

  const renderPreviewCard = (mode) => {
    const isSelected = mode.id === selectedMode;
    if (!isSelected) return null;

    return (
      <View style={[styles.previewCard, { backgroundColor: mode.preview.backgroundColor }]}>
        <View style={styles.previewHeader}>
          <Ionicons 
            name={mode.icon} 
            size={20} 
            color={mode.preview.textColor} 
          />
          <Text style={[styles.previewTitle, { color: mode.preview.textColor }]}>
            Preview
          </Text>
        </View>
        <View style={[styles.previewContent, { borderColor: mode.preview.borderColor }]}>
          <View style={styles.previewItem}>
            <View style={[styles.previewDot, { backgroundColor: mode.preview.textColor }]} />
            <Text style={[styles.previewText, { color: mode.preview.textColor }]}>
              Sample text content
            </Text>
          </View>
          <View style={styles.previewItem}>
            <View style={[styles.previewDot, { backgroundColor: mode.preview.textColor }]} />
            <Text style={[styles.previewText, { color: mode.preview.textColor }]}>
              Secondary information
            </Text>
          </View>
        </View>
        <Text style={[styles.previewHint, { color: mode.preview.textColor }]}>
          This is how {mode.name.toLowerCase()} mode will look
        </Text>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading appearance preferences...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const selectedModeData = themeModes.find(m => m.id === selectedMode);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        <View style={styles.infoBanner}>
          <Ionicons name="color-palette-outline" size={24} color={theme.colors.primary} />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>Appearance</Text>
            <Text style={styles.infoDescription}>
              Choose how the app looks. You can follow your device's setting or choose a specific appearance.
            </Text>
          </View>
        </View>

        <ProfileSection title="Appearance Options">
          {themeModes.map((mode, index) => renderThemeModeRow(mode, index))}
        </ProfileSection>

        {selectedModeData && renderPreviewCard(selectedModeData)}

        <View style={styles.currentSelection}>
          <Text style={styles.currentSelectionLabel}>Current Appearance:</Text>
          <View style={styles.currentSelectionValueContainer}>
            <Ionicons 
              name={selectedModeData.icon} 
              size={16} 
              color={theme.colors.primary} 
            />
            <Text style={styles.currentSelectionValue}>
              {selectedModeData.name}
              {selectedMode === 'system' && systemColorScheme && (
                <Text style={styles.currentSelectionHint}>
                  {' '}({systemColorScheme === 'dark' ? 'Dark' : 'Light'})
                </Text>
              )}
            </Text>
          </View>
        </View>

        {selectedMode === 'system' && (
          <View style={styles.systemInfo}>
            <Ionicons name="information-circle-outline" size={16} color={theme.colors.textSecondary} />
            <Text style={styles.systemInfoText}>
              System Default follows your device's appearance setting. 
              {systemColorScheme 
                ? ` Your device is currently set to ${systemColorScheme} mode.`
                : ' Unable to detect your device\'s appearance setting.'}
            </Text>
          </View>
        )}
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

  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.grey100 || theme.colors.grey200,
  },
  lastThemeRow: {
    borderBottomWidth: 0,
  },
  themeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  themeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  themeInfo: {
    flex: 1,
  },
  themeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs / 2,
  },
  themeName: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textPrimary,
  },
  systemHint: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.xs,
    fontStyle: 'italic',
  },
  themeDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  themeRight: {
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

  previewCard: {
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.lg,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.grey200,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  previewTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    marginLeft: theme.spacing.sm,
  },
  previewContent: {
    borderWidth: 1,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  previewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  previewDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: theme.spacing.sm,
  },
  previewText: {
    fontSize: theme.typography.fontSize.sm,
    flex: 1,
  },
  previewHint: {
    fontSize: theme.typography.fontSize.xs,
    fontStyle: 'italic',
    textAlign: 'center',
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
  currentSelectionValue: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.primary,
    marginLeft: theme.spacing.xs,
  },
  currentSelectionHint: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.normal,
    color: theme.colors.textSecondary,
  },

  systemInfo: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.grey200,
  },
  systemInfoText: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.sm,
    lineHeight: theme.typography.fontSize.sm * 1.5,
  },
});

export default DarkModeScreen;


