import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export const useCategoryProducts = (categoryId, options = {}) => {
  const { page = 1, limit = 20, sort, minPrice, maxPrice, subcategory } = options;

  return useQuery({
    queryKey: ['category-products', categoryId, page, limit, sort, minPrice, maxPrice, subcategory],
    queryFn: async () => {
      const params = {
        page,
        limit,
        ...(sort && { sort }),
        ...(minPrice && { minPrice }),
        ...(maxPrice && { maxPrice }),
        ...(subcategory && { subcategory }),
      };
      
      const response = await api.get(`/product/category/${categoryId}`, { params });
      return response.data;
    },
    enabled: !!categoryId,
    staleTime: 1000 * 60 * 5, 
  });
};

export default useCategoryProducts;
