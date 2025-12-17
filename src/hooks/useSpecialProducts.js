import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export const useBestSellers = (options = {}) => {
  return useQuery({
    queryKey: ['best-sellers', options],
    queryFn: async () => {
      const params = {
        sort: 'popular',
        ...options,
      };
      const res = await api.get('/product', { params });
      return res.data;
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const useNewArrivals = (options = {}) => {
  return useQuery({
    queryKey: ['new-arrivals', options],
    queryFn: async () => {
      const params = {
        sort: 'newest',
        ...options,
      };
      const res = await api.get('/product', { params });
      return res.data;
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const useDeals = (options = {}) => {
  return useQuery({
    queryKey: ['deals', options],
    queryFn: async () => {
      const params = {
        onSale: true,
        ...options,
      };
      const res = await api.get('/product', { params });
      return res.data;
    },
    staleTime: 1000 * 60 * 5,
  });
};

export default {
  useBestSellers,
  useNewArrivals,
  useDeals,
};
