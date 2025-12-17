import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const getSessionId = async () => {
  try {
    return await AsyncStorage.getItem('wishlist_session_id');
  } catch (error) {
    console.error('Error getting session ID:', error);
    return null;
  }
};

export const generateSessionId = () => {
  return `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const saveSessionId = async (sessionId) => {
  try {
    await AsyncStorage.setItem('wishlist_session_id', sessionId);
  } catch (error) {
    console.error('Error saving session ID:', error);
  }
};

export const clearSessionId = async () => {
  try {
    await AsyncStorage.removeItem('wishlist_session_id');
  } catch (error) {
    console.error('Error clearing session ID:', error);
  }
};

const isAuthenticated = async () => {
  try {
    const token = await require('expo-secure-store').getItemAsync('user_token');
    return !!token;
  } catch {
    return false;
  }
};

const wishlistApi = {
  getWishlist: async () => {
    const authenticated = await isAuthenticated();
    if (authenticated) {
      const response = await api.get("/wishlist");
      return response.data;
    } else {
      let sessionId = await getSessionId();
      if (!sessionId) {
        sessionId = generateSessionId();
        await saveSessionId(sessionId);
      }
      const response = await api.post("/wishlist/guest", { sessionId });
      return response.data;
    }
  },

  addToWishlist: async (productId) => {
    const authenticated = await isAuthenticated();
    if (authenticated) {
      const response = await api.post("/wishlist", { productId });
      return response.data;
    } else {
      let sessionId = await getSessionId();
      if (!sessionId) {
        sessionId = generateSessionId();
        await saveSessionId(sessionId);
      }
      const response = await api.post("/wishlist/guest/add", {
        sessionId,
        productId,
      });
      return response.data;
    }
  },

  removeFromWishlist: async (productId) => {
    const authenticated = await isAuthenticated();
    if (authenticated) {
      const response = await api.delete(`/wishlist/${productId}`);
      return response.data;
    } else {
      const sessionId = await getSessionId();
      if (!sessionId) {
        throw new Error("No session found for guest user");
      }
      const response = await api.post("/wishlist/guest/remove", {
        sessionId,
        productId,
      });
      return response.data;
    }
  },

  mergeWishlists: async () => {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      throw new Error("User must be authenticated to sync wishlist");
    }
    const sessionId = await getSessionId();
    if (!sessionId) {
      throw new Error("No guest wishlist to sync");
    }
    const response = await api.post("/wishlist/merge", { sessionId });
    await clearSessionId();
    return response;
  },

  checkInWishlist: async (productId) => {
    const authenticated = await isAuthenticated();
    if (authenticated) {
      const response = await api.get(`/wishlist/check/${productId}`);
      return response.data;
    } else {
      const sessionId = await getSessionId();
      if (!sessionId) {
        return { inWishlist: false };
      }
      try {
        const response = await api.post("/wishlist/guest", { sessionId });
        const wishlist = response.data.wishlist;
        const inWishlist = wishlist.products.some(
          (item) => item.product._id === productId || item.product === productId
        );
        return { inWishlist };
      } catch (error) {
        console.error("Error checking wishlist:", error);
        return { inWishlist: false };
      }
    }
  },

  getOrCreateGuestWishlist: async () => {
    let sessionId = await getSessionId();
    if (!sessionId) {
      return { data: { wishlist: { products: [] } } };
    }
    const response = await api.post("/wishlist/guest", { sessionId });
    return response.data;
  },

  addToGuestWishlist: async (productId) => {
    let sessionId = await getSessionId();
    if (!sessionId) {
      sessionId = generateSessionId();
      await saveSessionId(sessionId);
    }
    const response = await api.post("/wishlist/guest/add", {
      sessionId,
      productId,
    });
    return response.data;
  },

  removeFromGuestWishlist: async (productId) => {
    const sessionId = await getSessionId();
    if (!sessionId) {
      throw new Error("No session found for guest user");
    }
    const response = await api.post("/wishlist/guest/remove", {
      sessionId,
      productId,
    });
    return response.data;
  },
};

export default wishlistApi;
