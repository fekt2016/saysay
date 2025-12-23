import api from './api';

export const orderService = {
  createOrder: async (data) => {
    try {
      console.log('[orderApi] Creating order with data:', {
        orderItemsCount: data?.orderItems?.length || 0,
        paymentMethod: data?.paymentMethod,
        deliveryMethod: data?.deliveryMethod,
        hasAddress: !!data?.address,
        hasCoupon: !!data?.couponCode,
      });
      
    const response = await api.post("/order", data);
      
      console.log('[orderApi] ✅ Order created successfully:', {
        orderId: response?.data?.data?.order?._id || response?.data?.order?._id,
        orderNumber: response?.data?.data?.order?.orderNumber || response?.data?.order?.orderNumber,
      });
      
    return response;
    } catch (error) {
      console.error('[orderApi] ❌ Order creation error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
        request: error.request ? 'Request made but no response' : 'No request made',
        isAxiosError: error.isAxiosError,
        code: error.code,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL,
        },
      });
      
      // Re-throw with enhanced error message
      const errorMessage = 
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Failed to create order';
      
      const enhancedError = new Error(errorMessage);
      enhancedError.response = error.response;
      enhancedError.status = error.response?.status;
      enhancedError.isAxiosError = error.isAxiosError;
      enhancedError.originalError = error;
      
      throw enhancedError;
    }
  },

  getAllOrders: async () => {
    const response = await api.get("/order");
    return response;
  },

  getSellersOrders: async () => {
    const response = await api.get("/order/get-seller-orders");
    return response;
  },

  getSellerOrderById: async (id) => {
    try {
      const response = await api.get(`/order/seller-order/${id}`);
      return response.data;
    } catch (error) {
      console.log("API Error - getSellerOrderById:", error);
      throw new Error(error.response?.data?.message || "Failed to fetch order");
    }
  },

  getUserOrderById: async (id) => {
    try {
      const response = await api.get(`/order/get-user-order/${id}`);
      return response.data;
    } catch (error) {
      console.log("API Error - getUserOrderById:", error);
      throw new Error(error.response?.data?.message || "Failed to fetch order");
    }
  },

  getUserOrders: async () => {
    try {
      const response = await api.get(`/order/get-user-orders`);
      return response.data;
    } catch (error) {
      console.log("API Error - getUserOrders:", error);
      throw new Error(error.response?.data?.message || "Failed to fetch orders");
    }
  },

  deleteOrder: async (id) => {
    const response = await api.delete(`/order/${id}`);
    return response;
  },

  getOrderByTrackingNumber: async (trackingNumber) => {
    try {
      const response = await api.get(`/order/track/${trackingNumber}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching order by tracking number:", error);
      throw error;
    }
  },

  updateOrderAddress: async ({ orderId, addressId }) => {
    const response = await api.patch(`/order/${orderId}/shipping-address`, {
      addressId,
    });
    return response.data;
  },

  updateOrderAddressAndRecalculate: async ({ orderId, addressId, shippingType }) => {
    const response = await api.patch(`/order/${orderId}/update-address`, {
      addressId,
      shippingType,
    });
    return response.data;
  },

  payShippingDifference: async (orderId) => {
    const response = await api.post(`/order/${orderId}/pay-shipping-difference`);
    return response.data;
  },

  validateCart: async (cartData) => {
    const response = await api.post('/order/validate-cart', cartData);
    return response.data;
  },
};

export default orderService;
