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
        console.log('[useCreateOrder] Creating order...');
        const response = await orderService.createOrder(data);
        console.log('[useCreateOrder] ✅ Order created successfully');
        return response;
      } catch (error) {
        console.error("[useCreateOrder] ❌ Order creation error:", {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
          isAxiosError: error.isAxiosError,
          stack: error.stack,
        });
        // Re-throw the error so it can be handled by onError callback
        throw error;
      }
    },
    onSuccess: (data) => {
      // Invalidate order queries
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["order"] });
      
      // CRITICAL: Invalidate wallet balance if order was paid with credit balance
      // This ensures the UI updates immediately to show the deducted amount
      const order = data?.data?.order || data?.order || data?.data || data;
      const paymentMethod = order?.paymentMethod;
      const isWalletPayment = paymentMethod === 'credit_balance' || paymentMethod === 'wallet';
      
      if (isWalletPayment) {
        console.log('[useCreateOrder] 💰 Wallet payment detected - invalidating wallet balance');
        queryClient.invalidateQueries({ queryKey: ["wallet-balance"] });
        queryClient.invalidateQueries({ queryKey: ["creditBalance"] });
        // Immediately refetch to update UI
        queryClient.refetchQueries({ queryKey: ["wallet-balance"] });
      }
      
      // CRITICAL: Invalidate product queries to refresh stock
      // Note: Stock will be reduced after payment, but we invalidate here
      // to ensure fresh data is fetched when user navigates back
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product"] });
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      // Invalidate all product-related queries (including category-products, seller products, etc.)
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey;
          return (
            (Array.isArray(key) && key[0] === 'products') ||
            (Array.isArray(key) && key[0] === 'product') ||
            (Array.isArray(key) && key[0] === 'category-products')
          );
        },
      });
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
