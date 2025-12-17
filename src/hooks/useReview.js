import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import reviewApi from '../services/reviewApi';

export const useGetProductReviews = (productId, options = {}) => {
  return useQuery({
    queryKey: ["reviews", productId],
    queryFn: async () => {
      const response = await reviewApi.getProductReviews(productId);
      
      if (__DEV__) {
        console.log("[useGetProductReviews] response", response);
      }
      return response;
    },
    enabled: options.enabled !== false && !!productId && productId !== 'undefined' && productId !== 'null',
    ...options,
  });
};

export const useProductReviews = useGetProductReviews;

export const useCreateReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    queryKey: ["reviews"],
    mutationFn: async (data) => {
      const res = await reviewApi.createReview(data);
      return res;
    },
    onSuccess: (data, variables) => {
      
      queryClient.invalidateQueries({ queryKey: ["reviews", variables.product] });
      
      queryClient.invalidateQueries({ queryKey: ["products", variables.product] });
      
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      if (__DEV__) {
        console.log("Review created successfully!!!");
      }
    },
    onError: (error) => {
      console.error("Review submission failed:", error);
      
    },
  });
};

export default {
  useGetProductReviews,
  useProductReviews, 
  useCreateReview,
};
