import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { categoryService } from '../services/categoryApi';

export const useCategory = () => {
  const queryClient = useQueryClient();

  
  const getCategories = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      try {
        if (__DEV__) {
          console.log('[useCategory] Fetching categories with limit: 1000');
        }
        const response = await categoryService.getAllCategories({
          limit: 1000,
        });
        
        
        
        if (__DEV__) {
          console.log('[useCategory] Categories fetched:', {
            hasData: !!response,
            dataKeys: response ? Object.keys(response) : [],
            hasResults: !!response?.results,
            resultsLength: response?.results?.length || 0,
          });
        }
        return response;
      } catch (error) {
        console.error("[useCategory] Failed to fetch categories:", error);
        console.error("[useCategory] Error details:", {
          message: error.message,
          code: error.code,
          response: error.response?.data,
          status: error.response?.status,
          timeout: error.code === 'ECONNABORTED',
        });
        
        
        return {
          status: 'error',
          results: [],
          meta: {}
        };
      }
    },
    staleTime: 1000 * 60 * 5, 
    retry: (failureCount, error) => {
      
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        console.warn('[useCategory] Timeout error - not retrying');
        return false;
      }
      
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), 
  });

  
  const useCategoryById = (id) =>
    useQuery({
      queryKey: ["category", id],
      queryFn: async () => {
        if (!id) return null;
        try {
          const res = await api.get(`/categories/${id}`);
          return res.data;
        } catch (error) {
          console.error(`Failed to fetch category ${id}:`, error);
          throw new Error(`Failed to load category: ${error.message}`);
        }
      },
      enabled: !!id,
      staleTime: 1000 * 60 * 5, 
      retry: 2,
    });

  
  const getParentCategories = useQuery({
    queryKey: ["categories", "parents"],
    queryFn: async () => {
      try {
        const response = await categoryService.getParentCategories();
        return response;
      } catch (error) {
        console.error("Failed to fetch parent categories:", error);
        return { categories: [], results: [] };
      }
    },
    staleTime: 1000 * 60 * 5, 
    retry: (failureCount, error) => {
      if (error.code === 'ECONNABORTED') {
        return false;
      }
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  return {
    getCategories,
    getParentCategories,
    useCategoryById,
  };
};

export const useCategoryProducts = (categoryId, options = {}) => {
  return useQuery({
    queryKey: ['category-products', categoryId, options],
    queryFn: async () => {
      const params = {
        category: categoryId,
        ...options,
      };
      const res = await api.get('/product', { params });
      return res.data;
    },
    enabled: !!categoryId,
    staleTime: 1000 * 60 * 5, 
  });
};

export const useGetCategories = () => {
  const { getCategories } = useCategory();
  return getCategories;
};

export const useGetCategoryById = (id) => {
  const { useCategoryById } = useCategory();
  return useCategoryById(id);
};

export const useGetParentCategories = () => {
  const { getParentCategories } = useCategory();
  return getParentCategories;
};

export default {
  useCategoryProducts,
  useCategory,
};
