import api from './api';

export const categoryService = {
  getAllCategories: async (params = {}) => {
    
    const { page = 1, limit = 100 } = params;
    try {
      if (__DEV__) {
        console.log('[CategoryAPI] getAllCategories - Calling /categories with params:', { page, limit });
      }
      const response = await api.get("/categories", {
        params: {
          page,
          limit,
        },
      });
      if (__DEV__) {
        console.log('[CategoryAPI] getAllCategories - Response received:', {
          hasData: !!response.data,
          dataKeys: response.data ? Object.keys(response.data) : [],
          status: response.status,
        });
      }
      
      return response.data;
    } catch (error) {
      console.error('[CategoryAPI] getAllCategories - Error:', error);
      console.error('[CategoryAPI] Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw error;
    }
  },

  getCategory: async (id) => {
    const response = await api.get(`/categories/${id}`);
    return response.data;
  },

  createCategory: async (categoryData) => {
    const config =
      categoryData instanceof FormData
        ? { headers: { "Content-Type": "multipart/form-data" } }
        : {};
    const response = await api.post("/categories", categoryData, config);
    return response.data;
  },

  updateCategory: async (id, categoryData) => {
    const config =
      categoryData instanceof FormData
        ? { headers: { "Content-Type": "multipart/form-data" } }
        : {};
    const response = await api.put(`/categories/${id}`, categoryData, config);
    return response.data;
  },

  deleteCategory: async (id) => {
    await api.delete(`/categories/${id}`);
    return id;
  },

  getParentCategories: async () => {
    try {
      const response = await api.get("/categories/parents");
      console.log('[CategoryAPI] getParentCategories response structure:', {
        hasData: !!response.data,
        dataKeys: response.data ? Object.keys(response.data) : [],
        hasCategories: !!response.data?.categories,
        hasDataCategories: !!response.data?.data?.categories,
      });
      return response.data;
    } catch (error) {
      console.error('[CategoryAPI] Error fetching parent categories:', error);
      console.error('[CategoryAPI] Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw error;
    }
  },
};

export default categoryService;
