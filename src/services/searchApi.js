import api from './api';

/**
 * Search API - Matches web app exactly
 * All endpoints are identical to eazmain/src/shared/services/searchApi.js
 */
const searchApi = {
  /**
   * Search products - Same as web app
   * Endpoint: /search/query/:searchTerm
   */
  searchProducts: async (searchTerm) => {
    const response = await api.get(
      `/search/query/${encodeURIComponent(searchTerm)}`
    );
    return response;
  },

  /**
   * Get search suggestions - Same as web app
   * Endpoint: /search/suggestions/:searchTerm
   * Note: Backend returns: { success: true, data: [...] }
   * Returns response.data to match web app behavior
   * Matches: eazmain/src/shared/services/searchApi.js
   */
  searchSuggestions: async (searchTerm) => {
    try {
      const response = await api.get(
        `/search/suggestions/${encodeURIComponent(searchTerm)}`
      );
      return response.data;
    } catch (error) {
      console.error('[searchApi] searchSuggestions error:', error);
      throw error;
    }
  },

  /**
   * Get search results - Same as web app
   * Endpoint: /search/results with query params
   */
  searchResults: async (query) => {
    const response = await api.get(`/search/results`, { params: query });
    return response;
  },
};

export default searchApi;
