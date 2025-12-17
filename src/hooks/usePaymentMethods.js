import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

export const usePaymentMethods = () => {
  return useQuery({
    queryKey: ['paymentMethods'], 
    queryFn: async () => {
      
      
      
      
      try {
        const response = await api.get('/paymentmethod/me');
        if (__DEV__) {
          console.log('[usePaymentMethods] Full response:', response);
          console.log('[usePaymentMethods] Response data:', response.data);
          console.log('[usePaymentMethods] Response data structure:', JSON.stringify(response.data, null, 2));
        }
        
        return response.data;
      } catch (error) {
        if (__DEV__) {
          console.error('[usePaymentMethods] Error:', error);
          console.error('[usePaymentMethods] Error response:', error.response?.data);
        }
        throw error;
      }
    },
    staleTime: 0, 
    refetchOnMount: true, 
    refetchOnWindowFocus: false, 
  });
};

export const useAddPaymentMethod = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (paymentData) => {
      
      
      const response = await api.post('/paymentmethod', paymentData);
      if (__DEV__) {
        console.log('[useAddPaymentMethod] Response:', response.data);
      }
      return response.data;
    },
    onSuccess: (data) => {
      if (__DEV__) {
        console.log('[useAddPaymentMethod] Success, invalidating queries');
      }
      
      queryClient.invalidateQueries({ queryKey: ['paymentMethods'] });
      
      queryClient.refetchQueries({ queryKey: ['paymentMethods'] });
    },
    onError: (error) => {
      if (__DEV__) {
        console.error('[useAddPaymentMethod] Error:', error);
        console.error('[useAddPaymentMethod] Error response:', error.response?.data);
      }
    },
  });
};

export const useDeletePaymentMethod = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (paymentMethodId) => {
      
      const response = await api.delete(`/paymentmethod/${paymentMethodId}`);
      return response.data;
    },
    onSuccess: () => {
      
      queryClient.invalidateQueries({ queryKey: ['paymentMethods'] });
      queryClient.refetchQueries({ queryKey: ['paymentMethods'] });
    },
  });
};

export const useSetDefaultPaymentMethod = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (paymentMethodId) => {
      
      const response = await api.patch(`/paymentmethod/set-Default/${paymentMethodId}`);
      return response.data;
    },
    onSuccess: () => {
      
      queryClient.invalidateQueries({ queryKey: ['paymentMethods'] });
      queryClient.refetchQueries({ queryKey: ['paymentMethods'] });
    },
  });
};

export default {
  usePaymentMethods,
  useAddPaymentMethod,
  useDeletePaymentMethod,
  useSetDefaultPaymentMethod,
};
