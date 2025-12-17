import api from './api';

const followApi = {
  followSeller: async (sellerId) => {
    try {
      const response = await api.post(`/follow/${sellerId}`);
      return response.data;
    } catch (error) {
      console.error('[API] Follow error:', error.response?.data || error.message);
      throw error;
    }
  },

  unfollowSeller: async (sellerId) => {
    try {
      const response = await api.delete(`/follow/${sellerId}`);
      return response.data;
    } catch (error) {
      console.error('[API] Unfollow error:', error.response?.data || error.message);
      throw error;
    }
  },

  getFollowedShops: async () => {
    try {
      const response = await api.get('/follow');
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 'Failed to get followed shops'
      );
    }
  },

  getSellerFollowers: async (sellerId) => {
    try {
      const response = await api.get(`/follow/${sellerId}/followers`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 'Failed to get seller followers'
      );
    }
  },

  getFollowStatus: async (sellerId) => {
    try {
      const response = await api.get(`/follow/status/${sellerId}`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        
        return { isFollowing: false, followersCount: 0 };
      }
      throw new Error(
        error.response?.data?.message || 'Failed to get follow status'
      );
    }
  },
};

export default followApi;
