import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export const useBrowserHistory = () => {
  return useQuery({
    queryKey: ['browser-history'],
    queryFn: async () => {
      const res = await api.get('/browser-history');
      return res.data;
    },
    staleTime: 1000 * 60 * 5,
  });
};

export default {
  useBrowserHistory,
};
