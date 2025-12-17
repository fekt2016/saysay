import { useQuery } from '@tanstack/react-query';
import { eazshopService } from '../services/eazshopApi';

const useEazShop = () => {
  
  const useGetEazShopProducts = () =>
    useQuery({
      queryKey: ['eazshop', 'products'],
      queryFn: async () => {
        try {
          const response = await eazshopService.getEazShopProducts();
          return response.data?.products || [];
        } catch (error) {
          console.error('Failed to fetch EazShop products:', error);
          throw new Error('Failed to load EazShop products');
        }
      },
      staleTime: 1000 * 60 * 5,
      retry: 2,
    });

  
  const useGetPickupCenters = (city) =>
    useQuery({
      queryKey: ['eazshop', 'pickup-centers', city],
      queryFn: async () => {
        try {
          const response = await eazshopService.getPickupCenters(city);
          return response.data?.pickupCenters || [];
        } catch (error) {
          console.error('Failed to fetch pickup centers:', error);
          throw new Error('Failed to load pickup centers');
        }
      },
      enabled: !!city,
      staleTime: 1000 * 60 * 10,
      retry: 2,
    });

  return {
    useGetEazShopProducts,
    useGetPickupCenters,
  };
};

export default useEazShop;
export { useEazShop };
