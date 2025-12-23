import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import authApi from '../services/authApi';

export const useActiveDevices = () => {
  return useQuery({
    queryKey: ['deviceSessions'],
    queryFn: async () => {
      try {
        const response = await authApi.getActiveDevices();
        
        // Debug logging
        if (__DEV__) {
          console.log('[useActiveDevices] API Response:', {
            hasResponse: !!response,
            responseKeys: response ? Object.keys(response) : [],
            hasData: !!response?.data,
            dataKeys: response?.data ? Object.keys(response.data) : [],
            hasDevices: !!response?.data?.devices,
            devicesLength: response?.data?.devices?.length || 0,
            status: response?.status,
            rawResponse: JSON.stringify(response, null, 2),
          });
        }
        
        // Backend returns: { status: 'success', data: { devices: [...], count: ... } }
        // authApi.getActiveDevices() returns response.data, so we get: { status: 'success', data: { devices: [...] } }
        const devices = 
          response?.data?.devices ||        // Standard structure: response.data.devices
          response?.devices ||               // Fallback: direct devices array
          (Array.isArray(response?.data) ? response.data : []); // Fallback: data is array
        
        if (__DEV__) {
          console.log('[useActiveDevices] Extracted devices:', {
            devicesLength: devices?.length || 0,
            devices: devices,
          });
        }
        
        // Ensure we return an array
        const deviceArray = Array.isArray(devices) ? devices : [];
        
        if (__DEV__ && deviceArray.length === 0) {
          console.warn('[useActiveDevices] No devices found. Response structure:', {
            response,
            extractedDevices: devices,
          });
        }
        
        return deviceArray;
      } catch (error) {
        console.error('[useActiveDevices] Error fetching devices:', error);
        console.error('[useActiveDevices] Error details:', {
          message: error?.message,
          response: error?.response?.data,
          status: error?.response?.status,
          url: error?.config?.url,
        });
        // Return empty array on error instead of throwing
        return [];
      }
    },
    staleTime: 1000 * 60 * 2,
    retry: 1, // Only retry once on failure
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


