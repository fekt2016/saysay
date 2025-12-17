import api from './api';

const addressApi = {
  getUserAddresses: async () => {
    try {
      const response = await api.get(`/address`);
      return response;
    } catch (error) {
      console.error("Error fetching user addresses:", error);
      throw error;
    }
  },

  getUserAddress: async () => {
    try {
      const response = await api.get(`/address`);
      return response;
    } catch (error) {
      console.error("Error fetching user addresses:", error);
      throw error;
    }
  },

  createUserAddress: async (addressData) => {
    try {
      const response = await api.post(`/address`, addressData);
      return response;
    } catch (error) {
      console.error("Error creating user address:", error);
      throw error;
    }
  },

  updateUserAddress: async (addressData) => {
    try {
      const { id, data, ...rest } = addressData;
      const addressId = id || addressData.id;
      const body = data || rest;
      const response = await api.patch(`/address/${addressId}`, body);
      return response;
    } catch (error) {
      console.error("Error updating user address:", error);
      throw error;
    }
  },

  deleteUserAddress: async (addressId) => {
    try {
      const response = await api.delete(`/address/${addressId}`);
      return response;
    } catch (error) {
      console.error("Error deleting user address:", error);
      throw error;
    }
  },

  lookupDigitalAddress: async (digitalAddress) => {
    try {
      const response = await api.post(`/address/lookup-digital`, {
        digitalAddress,
      });
      return response.data;
    } catch (error) {
      console.error("Error looking up digital address:", error);
      throw error;
    }
  },

  createAddressWithZone: async (addressData) => {
    try {
      const response = await api.post(`/address/create`, addressData);
      return response.data;
    } catch (error) {
      console.error("Error creating address with zone:", error);
      throw error;
    }
  },
};

export default addressApi;
