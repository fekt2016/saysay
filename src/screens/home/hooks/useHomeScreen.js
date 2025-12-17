import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import useProduct from '../../../hooks/useProduct';
import { useCategory } from '../../../hooks/useCategory';
import { useEazShop } from '../../../hooks/useEazShop';
import { useGetFeaturedSellers } from '../../../hooks/useSellers';
import {
  extractProducts,
  extractCategories,
  extractEazShopProducts,
  extractSellers,
} from '../utils/homeScreen.utils';
import { CATEGORY_LIMIT, SELLER_LIMIT } from '../constants/homeScreen.constants';
import LogoIcon from '../../../components/header/LogoIcon';
import HeaderSearchInput from '../../../components/header/HeaderSearchInput';
import HeaderAvatar from '../../../components/header/HeaderAvatar';export const useHomeScreen = () => {
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => <LogoIcon />,
      headerTitle: () => <HeaderSearchInput />,
      headerRight: () => <HeaderAvatar />,
    });
  }, [navigation]);

  const { getProducts } = useProduct();
  const { data: productsData, isLoading: isProductsLoading, refetch: refetchProducts, error: productsError } = getProducts;

  const { getCategories } = useCategory();
  const { data: categoriesData, isLoading: isCategoriesLoading, refetch: refetchCategories, error: categoriesError } = getCategories;

  const { useGetEazShopProducts } = useEazShop();
  const { data: eazshopData, isLoading: isEazShopLoading, refetch: refetchEazShop } = useGetEazShopProducts();

  const { data: sellersData, isLoading: isSellersLoading, refetch: refetchSellers } = useGetFeaturedSellers({ limit: SELLER_LIMIT });

  const products = useMemo(() => extractProducts(productsData), [productsData]);
  const categories = useMemo(() => extractCategories(categoriesData, CATEGORY_LIMIT), [categoriesData]);
  const eazshopProducts = useMemo(() => extractEazShopProducts(eazshopData), [eazshopData]);
  const sellers = useMemo(() => extractSellers(sellersData), [sellersData]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchProducts(),
        refetchCategories(),
        refetchEazShop(),
        refetchSellers(),
      ]);
    } catch (error) {
      console.error('[HomeScreen] Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refetchProducts, refetchCategories, refetchEazShop, refetchSellers]);

  useEffect(() => {
    const interval = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return {

    refreshing,
    heroIndex,
    setHeroIndex,

    products,
    categories,
    eazshopProducts,
    sellers,

    isProductsLoading,
    isCategoriesLoading,
    isEazShopLoading,
    isSellersLoading,

    productsError,
    categoriesError,

    handleRefresh,
  };
};


