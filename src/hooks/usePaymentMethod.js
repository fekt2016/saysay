import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

export const usePaymentMethods = () => {
  return useQuery({
    queryKey: ['payment-methods'],
    queryFn: async () => {
      const res = await api.get('/payment-methods');
      return res.data;
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const useAddPaymentMethod = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (paymentData) => {
      const res = await api.post('/payment-methods', paymentData);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['payment-methods']);
    },
  });
};

export const useRemovePaymentMethod = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (paymentMethodId) => {
      const res = await api.delete(`/payment-methods/${paymentMethodId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['payment-methods']);
    },
  });
};

export default {
  usePaymentMethods,
  useAddPaymentMethod,
  useRemovePaymentMethod,
};
