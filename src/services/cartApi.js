import api from './api';

const cartApi = {
  getCart: async () => {
    const response = await api.get("/cart");
    return response;
  },

  addToCart: async (productId, quantity, variantId) => {
    try {
      const variantIdValue = typeof variantId === 'object' && variantId?._id 
        ? variantId._id 
        : variantId;
      
      const response = await api.post("/cart", {
        productId,
        quantity,
        variantId: variantIdValue || undefined,
      });
      return response;
    } catch (error) {
      console.error("Error adding to cart:", error);
      throw error;
    }
  },

  updateCartItem: async (itemId, quantity) => {
    const response = await api.patch(`/cart/items/${itemId}`, { quantity });
    return response;
  },

  removeCartItem: async (itemId) => {
    await api.delete(`/cart/items/${itemId}`);
    return itemId;
  },

  clearCart: async () => {
    await api.delete("/cart");
    return [];
  },
};

export default cartApi;
