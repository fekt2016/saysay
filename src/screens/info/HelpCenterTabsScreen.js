import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import HelpQAItem from '../../components/HelpQAItem';
import qaData from '../../data/qaData';

const HelpCenterTabsScreen = ({ navigation, route }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (route?.params?.searchTerm) {
      setSearchTerm(route.params.searchTerm);
    }
    if (route?.params?.category) {
      const categoryParam = route.params.category.toLowerCase();
      const categoryIndex = qaData.findIndex(
        (cat) => cat?.category?.toLowerCase()?.includes(categoryParam)
      );
      if (categoryIndex !== -1) {
        setActiveTab(categoryIndex);
      }
    }
  }, [route?.params]);

  const categories = useMemo(() => qaData.map((cat) => cat.category), []);
  const tabLabels = categories;

  const currentCategoryData = qaData[activeTab] || { items: [] };

  const displayItems = useMemo(() => {
    if (searchTerm.trim()) {

      const matchingItems = [];
      qaData.forEach((category) => {
        category.items.forEach((item) => {
          if (
            item.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.a.toLowerCase().includes(searchTerm.toLowerCase())
          ) {
            matchingItems.push(item);
          }
        });
      });
      return matchingItems;
    }

    return currentCategoryData.items || [];
  }, [searchTerm, activeTab, currentCategoryData]);

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>

      <View style={styles.headerSection}>
        <Text style={styles.headerTitle}>How can we help you?</Text>
        <Text style={styles.headerSubtitle}>
          Browse our frequently asked questions organized by category, or search for specific topics.
        </Text>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Ionicons
            name="search-outline"
            size={20}
            color={theme.colors.textSecondary}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for help articles, FAQs, or topics..."
            placeholderTextColor={theme.colors.textSecondary}
            value={searchTerm}
            onChangeText={handleSearch}
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchTerm('')}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {!searchTerm.trim() && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsContainer}
          contentContainerStyle={styles.tabsContent}
        >
          {tabLabels.map((tab, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.tab,
                activeTab === index && styles.tabActive,
              ]}
              onPress={() => setActiveTab(index)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === index && styles.tabTextActive,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {searchTerm.trim() && (
          <View style={styles.searchResultsHeader}>
            <Text style={styles.searchResultsText}>
              {displayItems.length} result{displayItems.length !== 1 ? 's' : ''} found for "{searchTerm}"
            </Text>
          </View>
        )}

        {displayItems && displayItems.length > 0 ? (
          displayItems.map((item, index) => (
            <HelpQAItem key={index} question={item.q} answer={item.a} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons
              name="help-circle-outline"
              size={64}
              color={theme.colors.grey400}
            />
            <Text style={styles.emptyStateText}>
              {searchTerm.trim()
                ? "No results found. Try adjusting your search terms."
                : "No questions available in this category."}
            </Text>
          </View>
        )}

        {displayItems.length > 0 && (
          <View style={styles.ctaSection}>
            <Text style={styles.ctaTitle}>Still need help?</Text>
            <Text style={styles.ctaSubtitle}>
              Can't find what you're looking for? Contact our support team.
            </Text>
            <TouchableOpacity
              style={styles.ctaButton}
              onPress={() => navigation.navigate('Contact')}
              activeOpacity={0.7}
            >
              <Text style={styles.ctaButtonText}>Contact Support</Text>
            </TouchableOpacity>
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
  headerSection: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.grey200,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  headerSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: theme.typography.fontSize.sm * 1.5,
  },
  searchSection: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.grey200,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg || 12,
    borderWidth: 2,
    borderColor: theme.colors.grey200,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  searchIcon: {
    marginRight: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textPrimary,
    paddingVertical: theme.spacing.xs,
  },
  clearButton: {
    padding: theme.spacing.xs,
  },
  tabsContainer: {
    backgroundColor: theme.colors.white,
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.grey200,
  },
  tabsContent: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  tab: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginRight: theme.spacing.sm,
    borderRadius: theme.borderRadius.md || 10,
    backgroundColor: theme.colors.grey100,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    backgroundColor: theme.colors.primary100 || theme.colors.primary + '20',
    borderBottomColor: theme.colors.primary,
  },
  tabText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textSecondary,
  },
  tabTextActive: {
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.semibold || theme.typography.fontWeight.bold,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  searchResultsHeader: {
    marginBottom: theme.spacing.md,
  },
  searchResultsText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing['3xl'] || theme.spacing.xl * 2,
    paddingHorizontal: theme.spacing.md,
  },
  emptyStateText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.md,
    lineHeight: theme.typography.fontSize.base * 1.5,
  },
  ctaSection: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg || 12,
    padding: theme.spacing.xl,
    alignItems: 'center',
    marginTop: theme.spacing.xl,
  },
  ctaTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.white,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  ctaSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.white,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
    opacity: 0.9,
  },
  ctaButton: {
    backgroundColor: theme.colors.white,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.md || 10,
    minWidth: 200,
    alignItems: 'center',
  },
  ctaButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
});

export default HelpCenterTabsScreen;


