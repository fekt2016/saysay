import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

export const useWalletBalance = () => {
  return useQuery({
    queryKey: ['wallet-balance'],
    queryFn: async () => {
      const response = await api.get('/wallet/balance');
      return response.data;
    },
    staleTime: 1000 * 60 * 2, 
    refetchOnMount: true, 
    refetchOnWindowFocus: false, 
  });
};

export const useWalletTransactions = (options = {}) => {
  const { page = 1, limit = 20 } = options;

  return useQuery({
    queryKey: ['wallet-transactions', page, limit],
    queryFn: async () => {
      const response = await api.get('/wallet/transactions', {
        params: { page, limit },
      });
      return response.data;
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const useInitiateTopup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ amount, email }) => {
      const response = await api.post('/wallet/topup', { amount, email });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] });
    },
  });
};

export const useVerifyTopup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reference }) => {
      const response = await api.post('/wallet/verify', { reference });
      return response.data;
    },
    onSuccess: (data) => {
      
      
      const wallet = data?.data?.wallet || data?.wallet;
      
      if (wallet) {
        
        queryClient.setQueryData(['wallet-balance'], {
          status: 'success',
          data: {
            wallet: {
              balance: wallet.balance || 0,
              availableBalance: wallet.availableBalance || wallet.balance || 0,
              holdAmount: wallet.holdAmount || 0,
              currency: wallet.currency || 'GHS',
              lastUpdated: wallet.lastUpdated || new Date().toISOString(),
            },
          },
        });
        console.log('[useVerifyTopup] ✅ Updated wallet balance cache immediately:', wallet);
      }
      
      
      queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] });
      
      
      queryClient.refetchQueries({ queryKey: ['wallet-balance'] });
    },
  });
};

export default {
  useWalletBalance,
  useWalletTransactions,
  useInitiateTopup,
  useVerifyTopup,
};
