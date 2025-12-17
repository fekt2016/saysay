import { useQuery } from '@tanstack/react-query';
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

export const useGetSellerById = (sellerId) => {
  return useQuery({
    queryKey: ['seller', sellerId], 
    queryFn: async () => {
      if (!sellerId) {
        throw new Error('No sellerId provided');
      }

      try {
        const data = await sellerApi.getSellerById(sellerId);
        return data;
      } catch (error) {
        console.error('Error fetching seller:', error);
        throw new Error('Failed to fetch seller data');
      }
    },
    enabled: !!sellerId, 
    staleTime: 5 * 60 * 1000, 
    retry: 2, 
    refetchOnWindowFocus: false,
    onError: (error) => {
      console.error('Seller fetch error:', error.message);
    },
    onSettled: (data, error) => {
      if (error) {
        console.warn(`Error fetching seller ${sellerId}:`, error);
      } else {
        console.log(`Successfully fetched seller ${sellerId}`, data);
      }
    },
  });
};

export const useGetFeaturedSellers = (options = {}) => {
  const { limit = 8, minRating = 4.0 } = options;

  return useQuery({
    queryKey: ['featured-sellers', limit, minRating],
    queryFn: async () => {
      const sellers = await sellerApi.getFeaturedSellers(limit, minRating);
      
      if (Array.isArray(sellers)) {
        return sellers;
      }
      
      if (sellers?.data?.sellers) {
        return sellers.data.sellers;
      }
      if (sellers?.sellers) {
        return sellers.sellers;
      }
      return [];
    },
    staleTime: 5 * 60 * 1000, 
    refetchOnWindowFocus: false,
    onError: (error) => {
      console.error('Featured sellers error:', error.message);
    },
  });
};

export const useSellers = (options = {}) => {
  const { page = 1, limit = 20, search, sort } = options;

  return useQuery({
    queryKey: ['sellers', page, limit, search, sort],
    queryFn: async () => {
      const params = { page, limit };
      if (search) params.search = search;
      if (sort) params.sort = sort;
      
      
      const response = await sellerApi.getFeaturedSellers(limit * page); 
      return { data: { sellers: response, total: response.length } };
    },
    staleTime: 1000 * 60 * 5,
  });
};

export default useSellers;
