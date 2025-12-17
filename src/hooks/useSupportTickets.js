import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export const useSupportTickets = (options = {}) => {
  const { page = 1, limit = 20, status } = options;

  return useQuery({
    queryKey: ['support-tickets', page, limit, status],
    queryFn: async () => {
      const params = { page, limit };
      if (status) params.status = status;
      
      const response = await api.get('/support/tickets/my', { params });
      return response.data;
    },
    staleTime: 1000 * 60 * 5,
  });
};

export default useSupportTickets;
