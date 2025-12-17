import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

export const useCoupons = () => {
  return useQuery({
    queryKey: ['coupons'],
    queryFn: async () => {
      const response = await api.get('/coupon/my-coupons');
      return response.data;
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const useApplyCoupon = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (couponCode) => {
      const response = await api.post('/coupon/apply', { code: couponCode });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['cart']);
    },
  });
};

export default {
  useCoupons,
  useApplyCoupon,
};
