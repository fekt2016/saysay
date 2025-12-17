import api from "./api";

const notificationApi = {
  getUserSettings: async () => {
    const response = await api.get("/notification-settings");
    return response.data.data;
  },

  updateSettings: async (settings) => {
    const response = await api.patch("/notification-settings", settings);
    return response;
  },

  resetSettings: async () => {
    const response = await api.patch("/notification-settings/reset");
    return response;
  },

  
  getNotifications: async (params = {}) => {
    const { limit = 10, sort = '-createdAt', ...otherParams } = params;
    const queryParams = new URLSearchParams();
    
    if (limit) queryParams.append('limit', limit);
    if (sort) queryParams.append('sort', sort);
    
    
    Object.keys(otherParams).forEach(key => {
      if (otherParams[key] !== undefined && otherParams[key] !== null) {
        queryParams.append(key, otherParams[key]);
      }
    });

    const response = await api.get(`/notifications?${queryParams.toString()}`);
    return response.data;
  },

  
  markAsRead: async (notificationId) => {
    const response = await api.patch(`/notifications/read/${notificationId}`);
    return response.data;
  },

  
  getUnreadCount: async () => {
    const response = await api.get("/notifications/unread");
    return response.data;
  },
};

export default notificationApi;
