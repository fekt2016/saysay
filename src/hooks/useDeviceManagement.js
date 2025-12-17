export const useActiveDevices = () => {
  return useQuery({
    queryKey: ['deviceSessions'],
    queryFn: async () => {
      const response = await authApi.getActiveDevices();

      return response?.data?.devices || response?.devices || [];
    },
    staleTime: 1000 * 60 * 2, 
  });
};export const useLogoutDevice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (deviceId) => {
      if (!deviceId) {
        throw new Error('Device ID is required');
      }
      const response = await authApi.logoutDevice(deviceId);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['deviceSessions']);
    },
    onError: (error) => {
      console.error('[useLogoutDevice] Error logging out device:', error);
    },
  });
};export const useLogoutAllOtherDevices = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await authApi.logoutAllOtherDevices();
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['deviceSessions']);
    },
    onError: (error) => {
      console.error('[useLogoutAllOtherDevices] Error logging out devices:', error);
    },
  });
};


