import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export const useNewArrivals = (options = {}) => {
  const { page = 1, limit = 20 } = options;

  return useQuery({
    queryKey: ['new-arrivals', page, limit],
    queryFn: async () => {
      const response = await api.get('/product/new-arrivals', {
        params: { page, limit },
      });
      return response.data;
    },
    staleTime: 1000 * 60 * 5,
  });
};

export default useNewArrivals;
