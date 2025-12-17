import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

export const usePermissions = () => {
  return useQuery({
    queryKey: ['permissions'],
    queryFn: async () => {
      const res = await api.get('/permissions');
      return res.data;
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const useUpdatePermission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (permissionData) => {
      const res = await api.patch('/permissions', permissionData);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['permissions']);
    },
  });
};

export default {
  usePermissions,
  useUpdatePermission,
};
