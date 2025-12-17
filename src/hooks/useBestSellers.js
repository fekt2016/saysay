import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export const useBestSellers = (options = {}) => {
  const { page = 1, limit = 20 } = options;

  return useQuery({
    queryKey: ['best-sellers', page, limit],
    queryFn: async () => {
      const response = await api.get('/product/best-sellers', {
        params: { page, limit },
      });
      return response.data;
    },
    staleTime: 1000 * 60 * 5,
  });
};

export default useBestSellers;
