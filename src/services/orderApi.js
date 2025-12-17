import api from './api';

export const orderService = {
  createOrder: async (data) => {
    const response = await api.post("/order", data);
    return response;
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
