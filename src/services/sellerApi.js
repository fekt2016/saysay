import api from './api';

const sellerApi = {
  getFeaturedSellers: async (limit = 8, minRating = 4.0) => {
    try {
      const response = await api.get('/seller/public/featured', {
        params: { limit, minRating },
      });
      
      return response.data.data.sellers;
    } catch (error) {
      console.error('Error fetching featured sellers:', error);
      return [];
    }
  },

  getSellerById: async (sellerId) => {
    try {
      const response = await api.get(`/seller/public/${sellerId}`);
      
      return response.data.data.seller;
    } catch (error) {
      
      if (error.response) {
        if (error.response.status === 404) {
          throw new Error('Seller not found');
        }
        if (error.response.status === 401) {
          throw new Error('Unauthorized access');
        }
      }
      throw new Error('Failed to fetch seller data');
    }
  },

  getSellerProfile: async (sellerId) => {
    try {
      
      const response = await api.get(`/seller/profile/${sellerId}`);
      
      return response;
    } catch (error) {
      console.error('Error fetching seller:', error);
      throw error; 
    }
  },

  getBestSellers: async (params = {}) => {
    const { page = 1, limit = 20, sort = 'orders' } = params;
    
    try {
      const response = await api.get('/seller/public/best-sellers', {
        params: { page, limit, sort },
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching best sellers:', error);
      console.error('Error details:', error.response?.data || error.message);
      
      return { 
        status: 'error',
        data: { 
          sellers: [], 
          total: 0, 
          page, 
          limit, 
          totalPages: 0 
        } 
      };
    }
  },
};

export default sellerApi;
