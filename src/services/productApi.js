import api from './api';

export const productService = {
  getProductById: async (id) => {
    try {
      const response = await api.get(`/product/${id}`);
      return response;
    } catch (err) {
      console.error("Error fetching product by ID:", err);
      throw err;
    }
  },

  getAllProducts: async () => {
    
    const response = await api.get("/product");
    return response.data;
  },

  getAllProductsBySeller: async () => {
    const response = await api.get("/seller/me/products");
    return response.data;
  },

  createProduct: async (formData) => {
    try {
      const response = await api.post("product", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (err) {
      console.error("Product creation error:", err);
      throw err;
    }
  },

  updateProduct: async (id, productData) => {
    try {
      const response = await api.patch(`/product/${id}`, productData, {
        headers: productData instanceof FormData
          ? { "Content-Type": "multipart/form-data" }
          : {},
      });
      return response.data;
    } catch (err) {
      console.error("Product update error:", err);
      throw err;
    }
  },

  deleteProduct: async (id) => {
    try {
      await api.delete(`/product/${id}`);
      return id;
    } catch (err) {
      console.error("Product deletion error:", err);
      throw err;
    }
  },

  getProductsByCategory: async (categoryId, queryParams) => {
    try {
      const response = await api.get(`/product/category/${categoryId}`, {
        params: queryParams,
      });
      return response.data;
    } catch (err) {
      console.error("Error fetching products by category:", err);
      throw err;
    }
  },

  getSimilarProducts: async (categoryId, currentProductId) => {
    try {
      const response = await api.get(`/product/similar/${categoryId}`, {
        params: { exclude: currentProductId },
      });
      return response.data;
    } catch (err) {
      console.error("Error fetching similar products:", err);
      throw err;
    }
  },

  getAllPublicProductsBySeller: async (sellerId) => {
    
    const response = await api.get(`/product/${sellerId}/public`);
    return response.data;
  },

  getProductCountByCategory: async () => {
    
    const response = await api.get("/product/category-counts");
    return response.data;
  },
};

export default productService;
