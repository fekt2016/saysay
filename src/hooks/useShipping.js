import { useQuery, useMutation } from '@tanstack/react-query';
import shippingService from '../services/shippingApi';

export const useGetPickupCenters = (city = null) => {
  return useQuery({
    queryKey: ['pickup-centers', city],
    queryFn: async () => {
      const response = await shippingService.getPickupCenters(city);

      if (response?.data?.pickupCenters) {
        return response.data.pickupCenters;
      }
      if (response?.data?.data?.pickupCenters) {
        return response.data.data.pickupCenters;
      }
      if (Array.isArray(response?.data)) {
        return response.data;
      }
      if (Array.isArray(response)) {
        return response;
      }
      return [];
    },
    enabled: !!city, // Only run query when city is provided
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    retry: 2,
  });
};

export const useCalculateShippingQuote = () => {
  return useMutation({
    mutationFn: ({ buyerCity, items, method, pickupCenterId, deliverySpeed }) => {
      return shippingService.calculateShippingQuote(buyerCity, items, method, pickupCenterId, deliverySpeed);
    },
  });
};

export const useCalcShipping = () => {
  return useMutation({
    mutationFn: (data) => shippingService.calcShipping(data),
  });
};

export const useGetShippingOptions = (params) => {
  return useQuery({
    queryKey: ['shipping-options', params],
    queryFn: async () => {
      const { fragile, ...apiParams } = params;
      const response = await shippingService.getShippingOptions({
        ...apiParams,
        fragile: fragile || false,
      });
      return response?.data || response;
    },
    enabled: params?.enabled !== false && !!(params?.neighborhoodId || (params?.neighborhoodName && params?.city)) && !!params?.weight && params?.weight > 0,
    staleTime: 1000 * 60 * 5, 
  });
};


