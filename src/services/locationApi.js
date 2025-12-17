import api from './api';

const locationApi = {
  convertCoordinatesToDigitalAddress: async (lat, lng) => {
    const response = await api.get('/location/convert-coordinates', {
      params: { lat, lng },
    });
    return response.data;
  },

  reverseGeocode: async (lat, lng) => {
    const response = await api.get('/location/reverse-geocode', {
      params: { lat, lng },
    });
    return response.data;
  },

  lookupDigitalAddressFull: async (digitalAddress) => {
    const response = await api.post('/location/lookup-digital-address', {
      digitalAddress,
    });
    return response.data;
  },

  hybridLocationLookup: async (lat, lng) => {
    const response = await api.get('/location/hybrid-lookup', {
      params: { lat, lng },
    });
    return response.data;
  },
};

export default locationApi;
