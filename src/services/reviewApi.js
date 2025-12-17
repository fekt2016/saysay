import api from './api';

const reviewApi = {
  getProductReviews: (productId) => api.get(`/product/${productId}/reviews`),
  get: (id) => api.get(`/review/${id}`),
  createReview: (data) => {
    
    const isFormData = data instanceof FormData;
    const config = isFormData
      ? {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      : {};
    return api.post('/review', data, config);
  },
  update: (id, data) => {
    const isFormData = data instanceof FormData;
    const config = isFormData
      ? {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      : {};
    return api.patch(`/review/${id}`, data, config);
  },
  delete: (id) => api.delete(`/review/${id}`),
};

export default reviewApi;
