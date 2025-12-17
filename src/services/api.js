import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { getApiBaseUrl } from '../utils/getBaseUrl';
import { getCurrentScreen, getCurrentRouteParams } from '../utils/screenTracker';
import logger from '../utils/logger';

const API_CONFIG = {
  TIMEOUT: 60000, 
  AUTH_TIMEOUT: 30000, 
};

const PUBLIC_ROUTES = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/product',
  '/product/category-counts',
  '/product/eazshop', 
  '/seller/public-profile',
  '/seller/profile/:sellerId',
  '/public/docs',
  '/health-check',
  'follow/:sellerId/followers',
  '/users/register',
  '/users/signup',
  'users/login',
  '/users/send-otp', 
  '/users/verify-otp', 
  '/users/forgot-password', 
  '/users/verify-reset-otp', 
  '/users/reset-password', 
  '/users/resend-otp', 
  '/wishlist/sync',
  '/discount',
  '/newsletter',
  '/search/results',
  '/search/suggestions', 
  '/search/query', 
  '/recommendations/products', 
  '/neighborhoods', 
  '/neighborhoods/search', 
  '/shipping/pickup-centers', 
];

const PUBLIC_GET_ENDPOINTS = [
  /^\/product\/[a-fA-F\d]{24}$/,  
  /^\/product\/\d+$/,             
  /^\/product\/eazshop$/,         
  /^\/seller\/[^/]+\/public-profile$/,  
  /^\/seller\/public\/[^/]+$/,     
  /^\/seller\/(?!me\/)[^/]+\/products$/, 
  /^\/category\/[^/]+$/,           
  /^\/categories$/,                
  /^\/categories\/parents$/,       
  /^\/categories\/[a-fA-F\d]{24}$/, 
  /^\/public\/.+$/,                
  /^\/neighborhoods\/search/,       
  /^\/neighborhoods\/city\/.+/,    
  /^\/neighborhoods\/[a-fA-F\d]{24}$/, 
  /^\/neighborhoods\/[a-fA-F\d]{24}\/map-url$/, 
  /^\/order\/track\/.+$/,          
  /^\/shipping\/pickup-centers/,   
  /^\/search\/suggestions\/.+/,   
  /^\/search\/query\/.+/,          
  /^\/recommendations\/products\/[a-fA-F\d]{24}\/related/, 
  /^\/recommendations\/products\/[a-fA-F\d]{24}\/also-bought/, 
  /^\/recommendations\/products\/[a-fA-F\d]{24}\/ai-similar/, 
  /^\/recommendations\/products\/trending/, 
  
  /^\/categories(\/.*)?$/,         
  /^\/product(\/.*)?$/,            
  /^\/seller\/public(\/.*)?$/,    
  /^\/search(\/.*)?$/,             
];

const normalizePath = (path) => {
  if (!path) return '/';
  let normalized = path.split('?')[0].split('#')[0];
  normalized = normalized.replace(/\/+$/, '');
  return normalized === '' ? '/' : `/${normalized}`.replace('//', '/');
};

const isPublicRoute = (path, method = 'get') => {
  const normalizedPath = normalizePath(path);
  
  
  if (PUBLIC_ROUTES.includes(normalizedPath)) {
    return true;
  }

  
  if (method === 'get') {
    return PUBLIC_GET_ENDPOINTS.some((pattern) => pattern.test(normalizedPath));
  }

  return false;
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

if (__DEV__) {
  const baseUrl = getApiBaseUrl();
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  logger.debug('[API] ========================================');
  logger.debug('[API] BASE URL =', baseUrl);
  logger.debug('[API] EXPO_PUBLIC_API_URL =', envUrl || 'NOT SET (using default)');
  logger.debug('[API] Timeout =', API_CONFIG.TIMEOUT, 'ms');
  
  
  if (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')) {
    logger.debug('[API] ℹ️  Using localhost - OK for iOS Simulator and Android Emulator');
    logger.debug('[API] ℹ️  For physical devices, use network IP via EXPO_PUBLIC_API_URL');
  }
  logger.debug('[API] ========================================');
}

api.interceptors.request.use(
  async (config) => {
    
    const url = config.url || '';
    let relativePath = url;
    
    
    if (url.startsWith('http')) {
      try {
        const parsedUrl = new URL(url);
        const baseUrlObj = new URL(getApiBaseUrl());
        let path = parsedUrl.pathname;
        if (path.startsWith(baseUrlObj.pathname)) {
          path = path.substring(baseUrlObj.pathname.length);
        }
        relativePath = path;
      } catch (e) {
        relativePath = url.split('?')[0];
      }
    } else {
      relativePath = url.split('?')[0];
    }
    
    const normalizedPath = normalizePath(relativePath);
    const method = (config.method || 'get').toLowerCase();

    
    if (isPublicRoute(normalizedPath, method)) {
      logger.debug(`[API] Public route - skipping auth: ${method.toUpperCase()} ${normalizedPath}`);
      return config;
    }

    
    try {
      const token = await SecureStore.getItemAsync('user_token');
      if (token && token.trim().length > 0) {
        config.headers.Authorization = `Bearer ${token}`;
        
        
        try {
          const storedDeviceId = await SecureStore.getItemAsync('device_id');
          if (storedDeviceId) {
            config.headers['x-device-id'] = storedDeviceId;
          }
        } catch (storeError) {
          
        }
        
        
        config.headers['x-platform'] = 'eazmainapp';
        
        config.headers['x-mobile'] = 'true';
        
        
        const currentScreen = getCurrentScreen();
        const routeParams = getCurrentRouteParams();
        config.headers['x-client-app'] = 'Saysay';
        config.headers['x-client-screen'] = currentScreen;
        if (routeParams && Object.keys(routeParams).length > 0) {
          
          try {
            const paramsStr = JSON.stringify(routeParams);
            if (paramsStr.length < 200) {
              config.headers['x-client-screen-params'] = paramsStr;
            } else {
              
              const essential = {};
              if (routeParams.orderId) essential.orderId = routeParams.orderId;
              if (routeParams.productId) essential.productId = routeParams.productId;
              if (routeParams.categoryId) essential.categoryId = routeParams.categoryId;
              config.headers['x-client-screen-params'] = JSON.stringify(essential);
            }
          } catch (e) {
            
          }
        }
        
        
        if (normalizedPath.includes('/payment') || normalizedPath.includes('/order')) {
          logger.debug(`[API] 🔐 AUTH TOKEN ATTACHED for: ${method.toUpperCase()} ${normalizedPath}`);
          
        } else if (__DEV__) {
          logger.debug(`[API] ✅ Token attached for: ${method.toUpperCase()} ${normalizedPath}`);
        }
      } else {
        
        try {
          const userData = await SecureStore.getItemAsync('user_data');
          if (userData) {
            logger.error(`[API] ❌ NO TOKEN FOUND but user data exists - INCONSISTENT STATE`);
            logger.error(`[API] ❌ User should log out and log back in to fix this`);
            logger.error(`[API] ❌ Protected route: ${method.toUpperCase()} ${normalizedPath}`);
          } else {
            logger.error(`[API] ❌ NO TOKEN FOUND for protected route: ${method.toUpperCase()} ${normalizedPath}`);
            logger.error(`[API] ❌ User is not logged in`);
          }
        } catch (checkError) {
          logger.error(`[API] ❌ NO TOKEN FOUND for protected route: ${method.toUpperCase()} ${normalizedPath}`, checkError);
        }
        
        if (normalizedPath.includes('/payment') || normalizedPath.includes('/order') || normalizedPath.includes('/creditbalance')) {
          logger.error(`[API] ❌ This will cause a 401 error!`);
          logger.error(`[API] 🔧 SOLUTION: User must log out and log back in`);
        }
      }
    } catch (error) {
      logger.error('[API] ❌ Error getting token from SecureStore:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    
    logger.debug(`[API] ✅ ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    return response;
  },
  async (error) => {
    
    const url = error.config?.url || 'unknown';
    const method = error.config?.method?.toUpperCase() || 'UNKNOWN';
    const baseURL = error.config?.baseURL || 'unknown';
    
    if (error.code === 'ECONNABORTED') {
      const timeout = error.config?.timeout || API_CONFIG.TIMEOUT;
      logger.error(`[API] ❌ TIMEOUT: ${method} ${url} - Request exceeded ${timeout}ms`);
      logger.error(`[API] ❌ Backend is too slow or unreachable`);
      logger.error(`[API] ❌ Base URL: ${baseURL}`);
      if (__DEV__) {
        logger.debug(`[API] 🔧 TROUBLESHOOTING:`);
        logger.debug(`[API]   1. Check if backend is running: cd backend && npm start`);
        logger.debug(`[API]   2. Test backend connectivity: curl ${baseURL.replace('/api/v1', '')}/health-check`);
        logger.debug(`[API]   3. Verify IP address is correct: ${baseURL}`);
        logger.debug(`[API]   4. Check network connection (WiFi/network settings)`);
        logger.debug(`[API]   5. For iOS Simulator: Try http://localhost:4000`);
        logger.debug(`[API]   6. For Android Emulator: Use http://10.0.2.2:4000`);
        logger.debug(`[API]   7. For physical devices: Use your Mac's network IP (check backend logs)`);
        logger.debug(`[API]   8. Set EXPO_PUBLIC_API_URL to override: EXPO_PUBLIC_API_URL=http://YOUR_IP:4000`);
      }
    } else if (error.response) {
      logger.error(`[API] ❌ ${method} ${url} - ${error.response.status} ${error.response.statusText}`, error.response.data);
    } else if (error.request) {
      logger.error(`[API] ❌ ${method} ${url} - No response received (network error)`);
      logger.error(`[API] ❌ Base URL: ${baseURL}`);
      logger.error(`[API] ❌ Error code: ${error.code || 'N/A'}`);
      if (__DEV__) {
        logger.debug(`[API] 🔧 TROUBLESHOOTING:`);
        logger.debug(`[API]   1. Is backend running? Check: cd backend && npm start`);
        logger.debug(`[API]   2. Test backend: curl ${baseURL.replace('/api/v1', '')}/health-check`);
        logger.debug(`[API]   3. For iOS Simulator, backend should be accessible at: http://localhost:4000`);
        logger.debug(`[API]   4. For Android Emulator, backend should be accessible at: http://10.0.2.2:4000`);
        logger.debug(`[API]   5. Check backend logs for connection attempts`);
      }
    } else {
      logger.error(`[API] ❌ ${method} ${url} - ${error.message}`, error);
    }
    
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      const isOtpVerification = url.includes('/verify-otp');
      const isOtpError = error.response?.data?.message?.includes('OTP') || 
                         error.response?.data?.message?.includes('Wrong OTP') ||
                         error.response?.data?.message?.includes('Invalid OTP');
      
      const isNotificationEndpoint = url.includes('/notifications');
      
      
      
      
      if (isOtpVerification || isOtpError) {
        logger.warn('[API] ⚠️ 401 from OTP verification - NOT clearing auth data (user is still logging in)');
        logger.warn('[API] ⚠️ Error:', error.response?.data?.message || 'OTP verification failed');
      } else if (isNotificationEndpoint) {
        
        
        logger.warn('[API] ⚠️ 401 from notification endpoint - NOT clearing auth data');
        logger.warn('[API] ⚠️ This might be a temporary issue. Error:', error.response?.data?.message || 'Unauthorized');
        
      } else {
        
        logger.error('[API] ❌ 401 Unauthorized - Clearing authentication data');
        try {
          const tokenExists = await SecureStore.getItemAsync('user_token');
          const userDataExists = await SecureStore.getItemAsync('user_data');
          
          if (tokenExists || userDataExists) {
            logger.warn('[API] ⚠️ Found stale auth data - clearing it');
            await SecureStore.deleteItemAsync('user_token');
            await SecureStore.deleteItemAsync('user_data');
            logger.debug('[API] ✅ Stale auth data cleared');
          }
        } catch (e) {
          logger.error('[API] ❌ Error clearing storage:', e);
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
