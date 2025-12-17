import api from './api';

const creditBalanceApi = {
  getCreditBalance: async () => {
    const response = await api.get('/creditbalance/balance');
    return response.data;
  },
  updateCreditBalance: (data) => api.patch('/balance', data),
};

export default creditBalanceApi;
