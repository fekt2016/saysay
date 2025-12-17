import React, { useState, useMemo, useCallback, useLayoutEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Image,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

import { useGetCategories, useGetParentCategories } from '../../hooks/useCategory';
import { useAuth } from '../../hooks/useAuth';

import LogoIcon from '../../components/header/LogoIcon';
import HeaderSearchInput from '../../components/header/HeaderSearchInput';
import HeaderAvatar from '../../components/header/HeaderAvatar';

import { theme } from '../../theme';

const CategoriesScreen = () => {
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedParentCategory, setSelectedParentCategory] = useState(null);

  const { user, isAuthenticated } = useAuth();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => <LogoIcon />,
      headerTitle: () => <HeaderSearchInput />,
      headerRight: () => <HeaderAvatar />,
    });
  }, [navigation]);

  const { data: categoriesData, isLoading, error, refetch } = useGetCategories();
  const { data: parentCategoriesData, isLoading: isParentCategoriesLoading } = useGetParentCategories();

  const parentCategories = useMemo(() => {
    if (!parentCategoriesData) return [];
    return (
      parentCategoriesData?.data?.categories ||
      parentCategoriesData?.categories ||
      parentCategoriesData?.results ||
      []
    );
  }, [parentCategoriesData]);

  const allCategories = useMemo(() => {
    if (!categoriesData) return [];

    if (Array.isArray(categoriesData)) {
      return categoriesData;
    }
    if (categoriesData?.results && Array.isArray(categoriesData.results)) {
      return categoriesData.results;
    }
    if (categoriesData?.data?.results && Array.isArray(categoriesData.data.results)) {
      return categoriesData.data.results;
    }
    if (categoriesData?.data && Array.isArray(categoriesData.data)) {
      return categoriesData.data;
    }

    return [];
  }, [categoriesData]);

  const subcategories = useMemo(() => {
    if (!selectedParentCategory) return [];
    const filtered = allCategories.filter(
      cat => {
        const parentId = cat.parentCategory?._id || cat.parentCategory || cat.parent?._id || cat.parent || cat.parentId;
        const matches = parentId === selectedParentCategory || String(parentId) === String(selectedParentCategory);
        if (matches) {
          console.log('[CategoriesScreen] Found subcategory:', cat.name, 'parentId:', parentId, 'selectedParentCategory:', selectedParentCategory);
        }
        return matches;
      }
    );
    console.log('[CategoriesScreen] Subcategories for parent', selectedParentCategory, ':', filtered.length, filtered.map(c => c.name));
    return filtered;
  }, [allCategories, selectedParentCategory]);

  const categories = useMemo(() => {
    if (!selectedParentCategory) {

      return allCategories.filter(cat => {
        const hasParent = cat.parentCategory || cat.parentCategory?._id || cat.parent || cat.parentId;
        return !hasParent;
      });
    }

    return subcategories;
  }, [allCategories, selectedParentCategory, subcategories]);

  const handleParentCategorySelect = useCallback((parentId) => {
    const newSelection = parentId === selectedParentCategory ? null : parentId;
    console.log('[CategoriesScreen] Selecting parent category:', newSelection);
    setSelectedParentCategory(newSelection);
  }, [selectedParentCategory]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      console.error('[CategoriesScreen] Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleCategoryPress = (category) => {
    navigation.navigate('Category', {
      categoryId: category._id || category.id,
      categoryName: category.name,
      id: category._id || category.id,
      name: category.name,
    });
  };

  const renderCategory = ({ item }) => {
    const categoryImage = item.image || item.imageCover || item.photo;
    return (
      <TouchableOpacity
        style={styles.categoryCard}
        onPress={() => handleCategoryPress(item)}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={[theme.colors.primary + '10', theme.colors.primary + '05']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.categoryGradient}
        >
          <View style={styles.categoryContent}>
            <View style={styles.categoryIcon}>
              {categoryImage ? (
                <Image
                  source={{ uri: categoryImage }}
                  style={styles.categoryImage}
                  resizeMode="cover"
                />
              ) : (
                <Text style={styles.categoryEmoji}>📁</Text>
              )}
            </View>
            <View style={styles.categoryInfo}>
              <Text style={styles.categoryName}>{item.name || 'Category'}</Text>
              {item.description && (
                <Text style={styles.categoryDescription} numberOfLines={2}>
                  {item.description}
                </Text>
              )}
              <Text style={styles.productCount}>
                {item.productCount || 0} products
              </Text>
            </View>
            <Text style={styles.arrow}>→</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  if (isLoading && !refreshing) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading categories...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !categoriesData) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Failed to load categories</Text>
          <Text style={styles.errorMessage}>
            {error?.message || 'Something went wrong. Please try again.'}
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => refetch()}
            activeOpacity={0.7}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>

      {parentCategories.length > 0 && (
        <View style={styles.parentCategoriesContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.parentCategoriesContent}
          >
            <TouchableOpacity
              style={[
                styles.parentCategoryTab,
                !selectedParentCategory && styles.parentCategoryTabActive,
              ]}
              onPress={() => handleParentCategorySelect(null)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.parentCategoryTabText,
                  !selectedParentCategory && styles.parentCategoryTabTextActive,
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
            {parentCategories.map((parent) => {
              const isSelected = selectedParentCategory === (parent._id || parent.id);
              return (
                <TouchableOpacity
                  key={parent._id || parent.id}
                  style={[
                    styles.parentCategoryTab,
                    isSelected && styles.parentCategoryTabActive,
                  ]}
                  onPress={() => handleParentCategorySelect(parent._id || parent.id)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.parentCategoryTabText,
                      isSelected && styles.parentCategoryTabTextActive,
                    ]}
                  >
                    {parent.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      <SafeAreaView style={styles.splitContainer} edges={['bottom']}>

        {selectedParentCategory && (
          <View style={styles.subcategoriesSidebar}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.subcategoriesSidebarContent}
            >
              <View style={styles.subcategoriesHeader}>
                <Text style={styles.subcategoriesHeaderText}>Subcategories</Text>
                <Text style={styles.subcategoriesCount}>
                  {subcategories.length} {subcategories.length === 1 ? 'item' : 'items'}
                </Text>
              </View>
              {subcategories.length > 0 ? (
                subcategories.map((sub) => (
                  <TouchableOpacity
                    key={sub._id || sub.id}
                    style={styles.subcategoryItem}
                    onPress={() => handleCategoryPress(sub)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.subcategoryItemText}>
                      {sub.name}
                    </Text>
                    <Text style={styles.subcategoryArrow}>→</Text>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.subcategoriesEmpty}>
                  <Text style={styles.subcategoriesEmptyText}>No subcategories</Text>
                </View>
              )}
            </ScrollView>
          </View>
        )}

        <View style={styles.categoriesContainer}>
          <FlatList
            data={categories}
            renderItem={renderCategory}
            keyExtractor={(item) => item._id?.toString() || Math.random().toString()}
            contentContainerStyle={styles.categoryList}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[theme.colors.primary]}
                tintColor={theme.colors.primary}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>📂</Text>
                <Text style={styles.emptyTitle}>No categories available</Text>
                <Text style={styles.emptyText}>
                  Check back later for new categories
                </Text>
              </View>
            }
          />
        </View>
      </SafeAreaView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  categoryCount: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
  },
  categoryList: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  categoryCard: {
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryGradient: {
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.grey200,
  },
  categoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
  },
  categoryIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  categoryEmoji: {
    fontSize: 24,
  },
  categoryImage: {
    width: '100%',
    height: '100%',
    borderRadius: 25,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  categoryDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  productCount: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.semiBold,
  },
  arrow: {
    fontSize: 24,
    color: theme.colors.primary,
    marginLeft: theme.spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing['4xl'],
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: theme.spacing.lg,
  },
  emptyTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: theme.spacing.md,
  },
  errorTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  errorMessage: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.md,
  },
  retryButtonText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
  },

  parentCategoriesContainer: {
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.grey200,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  parentCategoriesContent: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
  },
  parentCategoryTab: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginRight: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.grey100,
  },
  parentCategoryTabActive: {
    backgroundColor: theme.colors.primary,
  },
  parentCategoryTabText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textSecondary,
  },
  parentCategoryTabTextActive: {
    color: theme.colors.white,
    fontWeight: theme.typography.fontWeight.semiBold,
  },

  splitContainer: {
    flex: 1,
    flexDirection: 'row',
  },

  subcategoriesSidebar: {
    width: 140,
    backgroundColor: theme.colors.white,
    borderRightWidth: 1,
    borderRightColor: theme.colors.grey200,
  },
  subcategoriesSidebarContent: {
    paddingVertical: theme.spacing.sm,
  },
  subcategoriesHeader: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.grey200,
    backgroundColor: theme.colors.grey50,
  },
  subcategoriesHeaderText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: theme.spacing.xs,
  },
  subcategoriesCount: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  subcategoriesEmpty: {
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  subcategoriesEmptyText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  subcategoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.grey100,
  },
  subcategoryItemText: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textPrimary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  subcategoryArrow: {
    fontSize: 16,
    color: theme.colors.primary,
    marginLeft: theme.spacing.xs,
  },

  categoriesContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
});

export default CategoriesScreen;


