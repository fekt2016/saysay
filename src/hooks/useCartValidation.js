import { useMutation } from '@tanstack/react-query';
import { orderService } from '../services/orderApi';

export const useValidateCart = () => {
  return useMutation({
    mutationFn: async (cartData) => {
      try {

        const response = await orderService.validateCart(cartData);
        return response;
      } catch (error) {
        console.error('[useValidateCart] Cart validation error:', error);
        throw error;
      }
    },
  });
};


