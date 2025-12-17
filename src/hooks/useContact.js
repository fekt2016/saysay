import { useMutation } from '@tanstack/react-query';
import api from '../services/api';

export const useContact = () => {
  return useMutation({
    mutationFn: async (contactData) => {
      const res = await api.post('/contact', contactData);
      return res.data;
    },
  });
};

export default {
  useContact,
};
