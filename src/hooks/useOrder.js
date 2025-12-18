import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { orderService } from '../services/orderApi';
import useAuth from './useAuth';

export const getOrderStructure = (orderData) => {
  if (!orderData) return [];

  if (orderData?.data?.data?.orderss) {
    return orderData?.data?.data?.orders;
  }
  if (orderData?.data?.orders) {
    return orderData?.data?.orders;
  }
};

export const useGetSellerOrder = (orderId) => {
  return useQuery({
    queryKey: ["sellerOrder", orderId],
    queryFn: async () => {
      if (!orderId) throw new Error("Order ID is required");
      const data = await orderService.getSellerOrderById(orderId);
      return data?.data?.order || null;
    },
    enabled: !!orderId,
    retry: (failureCount, error) => {
      if (
        error.message.includes("404") ||
        error.message.includes("403") ||
        error.message.includes("Order not found")
      ) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

export const useGetSellerOrders = () => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ["seller-orders"],
    queryFn: async () => {
      try {
        const response = await orderService.getSellersOrders();
        return response;
      } catch (error) {
        console.error("Order fetch error:", error);
        throw new Error(
          error.response?.data?.message || "Failed to load orders"
        );
      }
    },
    retry: 2,
    staleTime: 1000 * 60 * 5,
  });
};

export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      try {
        const response = await orderService.createOrder(data);
        queryClient.invalidateQueries({ queryKey: ["orders"] });
        return response;
      } catch (error) {
        console.error("Order fetch error:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
};

export const useGetUserOrders = () => {
  const { isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const data = await orderService.getUserOrders();
      return data;
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

export const useGetUserOrderById = (id) => {
  return useQuery({
    queryKey: ["order", id], 
    queryFn: async () => {
      if (!id) {
        console.log("[useGetUserOrderById] No ID provided, returning null");
        return null;
      }
      console.log("[useGetUserOrderById] Fetching order with ID:", id);
      const response = await orderService.getUserOrderById(id);
      console.log("[useGetUserOrderById] API Response structure:", {
        hasData: !!response?.data,
        hasOrder: !!response?.data?.order,
        hasStatus: !!response?.status,
        keys: response ? Object.keys(response) : null,
        dataKeys: response?.data ? Object.keys(response.data) : null,
      });
      
      
      
      return response.data || response; 
    },
    enabled: !!id, 
    retry: 2,
    staleTime: 5 * 60 * 1000, 
    refetchOnWindowFocus: false, 
    refetchOnMount: false, 
    refetchOnReconnect: false, 
  });
};

export const useDeleteOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const response = await orderService.deleteOrder(id);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
};

export const useUpdateOrderAddress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, addressId }) => {
      const response = await orderService.updateOrderAddress({ orderId, addressId });
      return response;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["order", variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
};

export const useUpdateOrderAddressAndRecalculate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, addressId, shippingType }) => {
      const response = await orderService.updateOrderAddressAndRecalculate({
        orderId,
        addressId,
        shippingType,
      });
      return response;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["order", variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
};

export const usePayShippingDifference = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderId) => {
      const response = await orderService.payShippingDifference(orderId);
      return response;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["order", variables] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
};

export const useGetOrders = () => useGetUserOrders();
export const useGetOrderById = (id) => useGetUserOrderById(id);
