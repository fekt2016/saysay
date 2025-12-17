import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

export const useProductReviews = (productId, options = {}) => {
  const { page = 1, limit = 20 } = options;

  return useQuery({
    queryKey: ['product-reviews', productId, page, limit],
    queryFn: async () => {
      const response = await api.get(`/product/${productId}/reviews`, {
        params: { page, limit },
      });
      return response.data;
    },
    enabled: !!productId,
    staleTime: 1000 * 60 * 5,
  });
};

export const useCreateReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, reviewData }) => {
      const response = await api.post(`/product/${productId}/reviews`, reviewData);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['product-reviews', variables.productId]);
      queryClient.invalidateQueries(['product', variables.productId]);
    },
  });
};

export default {
  useProductReviews,
  useCreateReview,
};
