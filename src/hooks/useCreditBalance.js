import { useQuery } from '@tanstack/react-query';
import creditBalanceApi from '../services/creditbalanceApi';
import useAuth from './useAuth';

export const useCreditBalance = () => {
  const { isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: ['creditbalance'],
    queryFn: async () => {
      const response = await creditBalanceApi.getCreditBalance();
      return response;
    },
    enabled: !!isAuthenticated, // Only run when user is authenticated
    retry: (failureCount, error) => {
      // Don't retry on 401 errors
      if (error?.response?.status === 401) {
        return false;
      }
      return failureCount < 2;
    },
  });
};
