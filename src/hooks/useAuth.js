import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';
import authApi from '../services/authApi';
import logger from '../utils/logger';

const extractDeviceIdFromToken = async (token) => {
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (payload?.deviceId) {
        await SecureStore.setItemAsync('device_id', payload.deviceId);
        logger.debug('✅ [Auth] Device ID stored');
      }
    }
  } catch (e) {
    logger.warn('⚠️ [Auth] Could not extract device ID from token:', e.message);
  }
};

const storeAuthData = async (token, userData) => {
  await SecureStore.setItemAsync('user_token', token);
  await SecureStore.setItemAsync('user_data', JSON.stringify(userData));
  await extractDeviceIdFromToken(token);
  
  const storedToken = await SecureStore.getItemAsync('user_token');
  if (storedToken !== token) {
    throw new Error('Failed to store authentication token');
  }
};

const clearAuthData = async () => {
  try {
    await SecureStore.deleteItemAsync('user_token');
    await SecureStore.deleteItemAsync('user_data');
    await SecureStore.deleteItemAsync('device_id');
    logger.debug('✅ [Auth] Secure storage cleared');
  } catch (storageError) {
    logger.error('❌ [Auth] Error clearing secure storage:', storageError);
  }
};

export const useAuth = () => {
  const queryClient = useQueryClient();

  const {
    data: user,
    isLoading,
    error: authError,
  } = useQuery({
    queryKey: ['auth', 'user'],
    queryFn: async () => {
      const token = await SecureStore.getItemAsync('user_token');
      
      if (!token) {
        return null;
      }

      try {
        const response = await authApi.getCurrentUser();
        const userData = response?.data?.data || response?.data || response;

        if (userData && (userData._id || userData.id)) {
          await SecureStore.setItemAsync('user_data', JSON.stringify(userData));
          return userData;
        }

        await clearAuthData();
        return null;
      } catch (error) {
        const isTimeout = error?.code === 'ECONNABORTED' || error?.message?.includes('timeout');
        const isNetworkError = error?.code === 'ERR_NETWORK' || !error?.response;
        const isUnauthorized = error?.response?.status === 401;

        if (isUnauthorized) {
          logger.error('❌ [Auth] Token validation error: 401 Unauthorized');
          await clearAuthData();
          return null;
        }

        if (isTimeout || isNetworkError) {
          logger.warn('⚠️ [Auth] Network/timeout error, using cached data');
          const storedUserData = await SecureStore.getItemAsync('user_data');
          if (storedUserData) {
            try {
              return JSON.parse(storedUserData);
            } catch (e) {
              logger.error('❌ [Auth] Error parsing cached user data:', e);
              await clearAuthData();
              return null;
            }
          }
        }

        await clearAuthData();
        return null;
      }
    },
    staleTime: 1000 * 60 * 5,
    retry: (failureCount, error) => {
      if (error?.response?.status === 401) {
        return false;
      }
      return failureCount < 2;
    },
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  const isAuthenticated = !!user && !authError;

  const login = useMutation({
    mutationFn: async ({ email, password }) => {
      logger.debug('🔐 [Login] Starting login flow for email:', email);
      const response = await authApi.login(email, password);

      if (response?.requires2FA || response?.status === '2fa_required') {
        logger.debug('🔐 [Login] 2FA required');
        return {
          requires2FA: true,
          loginSessionId: response.loginSessionId,
          email: response.data?.email,
          userId: response.data?.userId,
        };
      }

      const token = response?.token;
      const userData = response?.user;

      if (!token) {
        throw new Error('Login failed: No authentication token received');
      }

      if (!userData || !userData.id) {
        throw new Error('Login failed: No user data received');
      }

      await storeAuthData(token, userData);

      logger.debug('✅ [Login] Login successful, token stored');
      logger.debug('👤 [Login] User logged in:', {
        id: userData.id || userData._id,
        email: userData.email,
        name: userData.name || userData.firstName,
        role: userData.role,
      });

      return { success: true, user: userData };
    },
    onSuccess: (data) => {
      if (data?.success) {
        queryClient.setQueryData(['auth', 'user'], data.user);
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
        queryClient.invalidateQueries({ queryKey: ['notification-settings'] });
        queryClient.invalidateQueries({ queryKey: ['profile'] });
        logger.debug('✅ [Login] Auth state updated and queries invalidated');
      }
    },
    onError: (error) => {
      logger.error('❌ [Login] Login error:', error);
    },
  });

  const verify2FALogin = useMutation({
    mutationFn: async ({ loginSessionId, twoFactorCode }) => {
      logger.debug('🔐 [2FA Login] Verifying 2FA code');
      const response = await authApi.verify2FALogin(loginSessionId, twoFactorCode);

      const token = response?.token;
      const userData = response?.user;

      if (!token) {
        throw new Error('2FA verification failed: No authentication token received');
      }

      if (!userData || !userData.id) {
        throw new Error('2FA verification failed: No user data received');
      }

      await storeAuthData(token, userData);

      logger.debug('✅ [2FA Login] 2FA verified, login successful');
      logger.debug('👤 [2FA Login] User logged in:', {
        id: userData.id || userData._id,
        email: userData.email,
        name: userData.name || userData.firstName,
        role: userData.role,
      });

      return { success: true, user: userData };
    },
    onSuccess: (data) => {
      if (data?.success) {
        queryClient.setQueryData(['auth', 'user'], data.user);
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
        queryClient.invalidateQueries({ queryKey: ['notification-settings'] });
        queryClient.invalidateQueries({ queryKey: ['profile'] });
        logger.debug('✅ [2FA Login] Auth state updated and queries invalidated');
      }
    },
    onError: (error) => {
      logger.error('❌ [2FA Login] Error:', error);
    },
  });

  const verifyOtpAndLogin = useMutation({
    mutationFn: async ({ loginId, otp, password, twoFactorCode = null }) => {
      logger.debug('🔐 [OTP] Verifying OTP and logging in for loginId:', loginId);
      const response = await authApi.verifyOtp(loginId, otp, password, twoFactorCode);

      if (response?.status === '2fa_required' || response?.requires2FA) {
        logger.debug('🔐 [2FA] Two-factor authentication required');
        return {
          requires2FA: true,
          userId: response?.data?.userId,
          email: response?.data?.email,
          phone: response?.data?.phone,
        };
      }

      const token = response?.token;
      const userData = response?.user || response?.data?.user || response?.data || response;

      logger.debug('🔐 [OTP] Token extracted:', token ? 'Present' : 'MISSING');
      logger.debug('🔐 [OTP] User data extracted:', userData ? 'Present' : 'Missing');

      if (!token) {
        logger.error('❌ [OTP] No token in response!');
        throw new Error('Login failed: No authentication token received');
      }

      if (!userData || !userData.id) {
        logger.error('❌ [OTP] No user data in response!');
        throw new Error('Login failed: No user data received');
      }

      await storeAuthData(token, userData);

      logger.debug('✅ [OTP] Token and user data stored and verified successfully');
      logger.debug('👤 [OTP Login] User logged in:', {
        id: userData.id || userData._id,
        email: userData.email,
        name: userData.name || userData.firstName,
        role: userData.role,
      });

      return { success: true, user: userData };
    },
    onSuccess: (data) => {
      if (data?.success) {
        queryClient.setQueryData(['auth', 'user'], data.user);
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
        queryClient.invalidateQueries({ queryKey: ['notification-settings'] });
        queryClient.invalidateQueries({ queryKey: ['profile'] });
        logger.debug('✅ [OTP Login] Auth state updated and queries invalidated');
      }
    },
    onError: (error) => {
      logger.error('❌ [OTP] Login error:', error);
    },
  });

  const register = useMutation({
    mutationFn: async (registerData) => {
      const response = await authApi.register(registerData);
      return response;
    },
  });

  const logout = useMutation({
    mutationFn: async () => {
      logger.debug('🔓 [Auth] Logging out user...');
      
      try {
        await Promise.race([
          authApi.logout(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Logout timeout')), 5000)
          ),
        ]);
        logger.debug('✅ [Auth] Logout API call successful');
      } catch (error) {
        logger.warn('⚠️ [Auth] Logout API call failed, proceeding with local cleanup:', error.message);
      }
      
      await clearAuthData();
    },
    onSuccess: () => {
      queryClient.setQueryData(['auth', 'user'], null);
      queryClient.removeQueries({ queryKey: ['notifications'] });
      queryClient.removeQueries({ queryKey: ['notification-settings'] });
      queryClient.removeQueries({ queryKey: ['deviceSessions'] });
      queryClient.removeQueries({ queryKey: ['profile'] });
      queryClient.cancelQueries({ queryKey: ['notifications'] });
      queryClient.cancelQueries({ queryKey: ['notification-settings'] });
      queryClient.cancelQueries({ queryKey: ['deviceSessions'] });
      queryClient.clear();
      logger.debug('✅ [Auth] User logged out successfully, cache cleared');
    },
    onError: async () => {
      await clearAuthData();
      queryClient.setQueryData(['auth', 'user'], null);
      queryClient.clear();
    },
  });

  const userId = user?.id || user?._id;

  const {
    data: profileData,
    isLoading: isProfileLoading,
    error: profileError,
  } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      try {
        const response = await authApi.getProfile();
        return response?.data?.data || response?.data || response || null;
      } catch (error) {
        if (error.response?.status === 401 || error.response?.status === 404) {
          return null;
        }
        return null;
      }
    },
    enabled: !!userId && !isLoading,
    staleTime: 1000 * 60 * 5,
    retry: (failureCount, error) => {
      if (error?.response?.status === 401 || error?.response?.status === 404) {
        return false;
      }
      return failureCount < 2;
    },
  });

  const enableTwoFactor = useMutation({
    mutationFn: async () => {
      const response = await authApi.enableTwoFactor();
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'user'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  const disableTwoFactor = useMutation({
    mutationFn: async (verificationCode) => {
      const response = await authApi.disableTwoFactor(verificationCode);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'user'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  const getTwoFactorSetup = useMutation({
    mutationFn: async () => {
      const response = await authApi.getTwoFactorSetup();
      return response;
    },
  });

  const verifyTwoFactor = useMutation({
    mutationFn: async (code) => {
      const response = await authApi.verifyTwoFactor(code);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'user'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  return {
    user,
    isLoading: isLoading || isProfileLoading,
    isAuthenticated,
    profileData,
    authError,
    profileError,
    isAdmin: user?.role === 'admin',
    isSeller: user?.role === 'seller',
    isBuyer: !user?.role || user?.role === 'buyer',
    login: async (email, password) => {
      return login.mutateAsync({ email, password });
    },
    verify2FALogin: async (loginSessionId, twoFactorCode) => {
      return verify2FALogin.mutateAsync({ loginSessionId, twoFactorCode });
    },
    verifyOtpAndLogin: async (loginId, otp, password, twoFactorCode = null) => {
      return verifyOtpAndLogin.mutateAsync({ loginId, otp, password, twoFactorCode });
    },
    register: async (registerData) => {
      return register.mutateAsync(registerData);
    },
    logout: async () => {
      return logout.mutateAsync();
    },
    refetchAuth: () => {
      return queryClient.invalidateQueries({ queryKey: ['auth', 'user'] });
    },
    enableTwoFactor: {
      mutate: enableTwoFactor.mutate,
      mutateAsync: enableTwoFactor.mutateAsync,
      isPending: enableTwoFactor.isPending,
      error: enableTwoFactor.error,
    },
    disableTwoFactor: {
      mutate: disableTwoFactor.mutate,
      mutateAsync: disableTwoFactor.mutateAsync,
      isPending: disableTwoFactor.isPending,
      error: disableTwoFactor.error,
    },
    getTwoFactorSetup: {
      mutate: getTwoFactorSetup.mutate,
      mutateAsync: getTwoFactorSetup.mutateAsync,
      isPending: getTwoFactorSetup.isPending,
      error: getTwoFactorSetup.error,
    },
    verifyTwoFactor: {
      mutate: verifyTwoFactor.mutate,
      mutateAsync: verifyTwoFactor.mutateAsync,
      isPending: verifyTwoFactor.isPending,
      error: verifyTwoFactor.error,
    },
    isEnabling2FA: enableTwoFactor.isPending,
    isDisabling2FA: disableTwoFactor.isPending,
  };
};

export default useAuth;
