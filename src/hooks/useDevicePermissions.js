import { useState, useEffect, useCallback } from 'react';
import {
  PERMISSION_TYPES,
  getPermissionStatus,
  requestPermission,
  checkAllPermissions,
  isPermissionGranted,
} from '../utils/devicePermissions';export const useDevicePermission = (permissionType, options = ) => {
  const { autoCheck = true, autoRequest = false } = options;
  const [status, setStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      const currentStatus = await getPermissionStatus(permissionType);
      setStatus(currentStatus);
    } catch (error) {
      console.error(`Error checking ${permissionType} permission:`, error);
      setStatus(null);
    } finally {
      setIsLoading(false);
    }
  }, [permissionType]);

  const request = useCallback(async (requestOptions = ) => {
    setIsLoading(true);
    try {
      const granted = await requestPermission(permissionType, requestOptions);

      await checkStatus();
      return granted;
    } catch (error) {
      console.error(`Error requesting ${permissionType} permission:`, error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [permissionType, checkStatus]);

  useEffect(() => {
    if (autoCheck) {
      checkStatus();
    }
  }, [autoCheck, checkStatus]);

  useEffect(() => {
    if (autoRequest && status === 'undetermined') {
      request({ showAlert: false });
    }
  }, [autoRequest, status, request]);

  return {
    status,
    isLoading,
    isGranted: isPermissionGranted(status),
    checkStatus,
    request,
    refresh: checkStatus,
  };
};


