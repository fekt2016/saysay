import api from './api';

export const eazshopService = {
  
  getEazShopProducts: async () => {
    try {
      
      const response = await api.get('/product/eazshop');
      return response.data;
    } catch (error) {
      console.error('Error fetching EazShop products:', error);
      
      return { data: { products: [] }, results: 0 };
    }
  },

  
  getEazShopOrders: async () => {
    try {
      const response = await api.get('/eazshop/orders');
      return response.data;
    } catch (error) {
      console.error('Error fetching EazShop orders:', error);
      throw error;
    }
  },

  
  getEazShopShippingFees: async () => {
    try {
      const response = await api.get('/eazshop/shipping-fees');
      return response.data;
    } catch (error) {
      console.error('Error fetching EazShop shipping fees:', error);
      throw error;
    }
  },

  
  updateEazShopShippingFees: async (fees) => {
    try {
      const response = await api.patch('/eazshop/shipping-fees', fees);
      return response.data;
    } catch (error) {
      console.error('Error updating EazShop shipping fees:', error);
      throw error;
    }
  },

  
  getPickupCenters: async (city) => {
    try {
      const params = city ? { city } : {};
      const response = await api.get('/eazshop/pickup-centers', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching pickup centers:', error);
      throw error;
    }
  },
};
