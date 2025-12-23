import api from './api';

const shippingService = {
  
  getPickupCenters: async (city = null) => {
    const params = city ? { city } : {};
    const response = await api.get('/shipping/pickup-centers', { params });
    return response.data;
  },

  
  calculateShippingQuote: async (buyerCity, items, method = 'dispatch', pickupCenterId = null, deliverySpeed = 'standard') => {
    console.log('[shippingApi] calculateShippingQuote called with:', {
      buyerCity,
      itemsCount: items?.length,
      items: items,
      method,
      pickupCenterId,
      deliverySpeed,
    });
    
    const response = await api.post('/shipping/quote', {
      buyerCity,
      items,
      method,
      pickupCenterId,
      deliverySpeed,
    });
    
    return response.data;
  },


  calcShipping: async (data) => {
    const response = await api.post('/shipping/calc-shipping', data);
    return response.data;
  },

  /**
   * Get shipping options based on neighborhood, city, weight, and fragile status
   * GET /api/v1/shipping/options
   */
  getShippingOptions: async (params) => {
    const response = await api.get('/shipping/options', { params });
    return response.data;
  },
};

export default shippingService;
