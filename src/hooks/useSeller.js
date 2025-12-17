import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import sellerApi from '../services/sellerApi';

export const useGetSellerProfile = (sellerId) => {
  return useQuery({
    queryKey: ['seller', sellerId], 
    queryFn: async () => {
      if (!sellerId) throw new Error('Seller ID is required');
      const data = await sellerApi.getSellerProfile(sellerId);
      return data;
    },
    enabled: !!sellerId, 
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    onError: (error) => {
      console.error('Seller error:', error.message);
    },
  });
};

export const useSellerProfile = useGetSellerProfile;

export const useSellerProducts = (sellerId, options = {}) => {
  const { page = 1, limit = 20 } = options;

  return useQuery({
    queryKey: ['seller-products', sellerId, page, limit],
    queryFn: async () => {
      const response = await api.get(`/seller/${sellerId}/products`, {
        params: { page, limit },
      });
      return response.data;
    },
    enabled: !!sellerId,
    staleTime: 1000 * 60 * 5,
  });
};

export const useToggleFollow = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sellerId) => {
      const response = await api.post(`/seller/${sellerId}/follow`);
      return response.data;
    },
    onSuccess: (data, sellerId) => {
      queryClient.invalidateQueries(['seller', sellerId]);
      queryClient.invalidateQueries(['sellers']);
    },
  });
};

export default {
  useSellerProfile,
  useSellerProducts,
  useToggleFollow,
};
