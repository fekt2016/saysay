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

  /**
   * Calculate shipping fee based on neighborhood
   * POST /api/v1/shipping/calc-shipping
