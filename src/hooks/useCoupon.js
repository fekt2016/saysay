import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

export const useMyCoupons = () => {
  return useQuery({
    queryKey: ['my-coupons'],
    queryFn: async () => {
      const res = await api.get('/coupon/my-coupons');
      return res.data;
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const useApplyCoupon = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ couponCode, orderAmount, productIds, categoryIds, sellerIds }) => {
      const res = await api.post('/coupon/apply', { 
        couponCode, 
        orderAmount, 
        productIds, 
        categoryIds, 
        sellerIds 
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['cart']);
    },
  });
};

export default {
  useMyCoupons,
  useApplyCoupon,
};
