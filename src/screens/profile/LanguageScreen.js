import React, { useState, useEffect, useLayoutEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../../theme';
import ProfileSection from '../../components/profile/ProfileSection';
import LogoIcon from '../../components/header/LogoIcon';const LanguageScreen = () => {
  const navigation = useNavigation();
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => <LogoIcon />,
      headerTitle: 'Language',
      headerStyle: {
        backgroundColor: theme.colors.white,
      },
      headerShadowVisible: false,
    });
  }, [navigation]);

  const languages = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'fr', name: 'French', nativeName: 'Français' },
    { code: 'es', name: 'Spanish', nativeName: 'Español' },
    { code: 'de', name: 'German', nativeName: 'Deutsch' },
    { code: 'it', name: 'Italian', nativeName: 'Italiano' },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
    { code: 'zh', name: 'Chinese', nativeName: '中文' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語' },
    { code: 'ko', name: 'Korean', nativeName: '한국어' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
    { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili' },
  ];

  useEffect(() => {
    loadLanguagePreference();
  }, []);

  const loadLanguagePreference = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem('app_language');
      if (savedLanguage) {
        setSelectedLanguage(savedLanguage);
      } else {

        setSelectedLanguage('en');
      }
    } catch (error) {
      console.error('Error loading language preference:', error);
      setSelectedLanguage('en');
    } finally {
      setIsLoading(false);
    }
  };

  const saveLanguagePreference = async (languageCode) => {
    setIsSaving(true);
    try {
      await AsyncStorage.setItem('app_language', languageCode);
      setSelectedLanguage(languageCode);

      Alert.alert(
        'Language Updated',
        'Your language preference has been saved. Some changes may require restarting the app.',
        [
          {
            text: 'OK',
            onPress: () => {},
          },
        ]
      );
    } catch (error) {
      console.error('Error saving language preference:', error);
      Alert.alert('Error', 'Failed to save language preference. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLanguageSelect = (languageCode) => {
    if (languageCode === selectedLanguage) {
      return; 
    }

    saveLanguagePreference(languageCode);
  };

  const renderLanguageRow = (language, index) => {
    const isSelected = language.code === selectedLanguage;
    const isLast = index === languages.length - 1;

    return (
      <TouchableOpacity
        key={language.code}
        style={[
          styles.languageRow,
          isLast && styles.lastLanguageRow,
        ]}
        onPress={() => handleLanguageSelect(language.code)}
        activeOpacity={0.7}
        disabled={isSaving}
      >
        <View style={styles.languageLeft}>
          <View style={styles.languageInfo}>
            <Text style={styles.languageName}>{language.nativeName}</Text>
            <Text style={styles.languageEnglishName}>{language.name}</Text>
          </View>
        </View>
        <View style={styles.languageRight}>
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
          <Text style={styles.loadingText}>Loading language preferences...</Text>
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
      >

        <View style={styles.infoBanner}>
          <Ionicons name="language-outline" size={24} color={theme.colors.primary} />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>Select Language</Text>
            <Text style={styles.infoDescription}>
              Choose your preferred language for the app. Changes are saved automatically.
            </Text>
          </View>
        </View>

        <ProfileSection title="Available Languages">
          {languages.map((language, index) => renderLanguageRow(language, index))}
        </ProfileSection>

        <View style={styles.restartNotice}>
          <Ionicons name="information-circle-outline" size={20} color={theme.colors.primary} />
          <View style={styles.restartNoticeText}>
            <Text style={styles.restartNoticeTitle}>Restart Required</Text>
            <Text style={styles.restartNoticeDescription}>
              Some language changes may require restarting the app to take full effect. You can continue using the app, but a restart is recommended for the best experience.
            </Text>
          </View>
        </View>

        <View style={styles.currentSelection}>
          <Text style={styles.currentSelectionLabel}>Current Language:</Text>
          <Text style={styles.currentSelectionValue}>
            {languages.find(l => l.code === selectedLanguage)?.nativeName || 'English'}
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

  languageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.grey100 || theme.colors.grey200,
  },
  lastLanguageRow: {
    borderBottomWidth: 0,
  },
  languageLeft: {
    flex: 1,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs / 2,
  },
  languageEnglishName: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  languageRight: {
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

  restartNotice: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.lg,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.primary + '30',
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  restartNoticeText: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  restartNoticeTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs / 2,
  },
  restartNoticeDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: theme.typography.fontSize.sm * 1.5,
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
  currentSelectionValue: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.primary,
  },
});

export default LanguageScreen;


