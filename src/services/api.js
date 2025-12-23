import axios from 'axios';
import { Platform } from 'react-native';
// SECURITY: Removed SecureStore import - no token storage
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
  '/users/login',
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

// SECURITY: Cookie-only authentication - tokens are in HTTP-only cookies
// withCredentials: true ensures cookies are sent with all requests
const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: API_CONFIG.TIMEOUT,
  withCredentials: true, // CRITICAL: Required for cookie-based authentication
  headers: {
    'Content-Type': 'application/json',
  },
});

if (__DEV__) {
  const baseUrl = getApiBaseUrl();
  const baseUrlWithoutApi = baseUrl.replace('/api/v1', '');
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  logger.debug('[API] ========================================');
  logger.debug('[API] BASE URL =', baseUrl);
  logger.debug('[API] Base URL (without /api/v1) =', baseUrlWithoutApi);
  logger.debug('[API] EXPO_PUBLIC_API_URL =', envUrl || 'NOT SET (using default)');
  logger.debug('[API] Timeout =', API_CONFIG.TIMEOUT, 'ms');
  logger.debug('[API] Platform =', Platform.OS);
  
  if (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')) {
    logger.debug('[API] ℹ️  Using localhost - OK for iOS Simulator');
    logger.debug('[API] ℹ️  For physical devices, use network IP via EXPO_PUBLIC_API_URL');
  } else if (baseUrl.includes('10.0.2.2')) {
    logger.debug('[API] ℹ️  Using 10.0.2.2 - OK for Android Emulator');
    logger.debug('[API] ℹ️  This maps to host machine\'s localhost');
  } else {
    logger.debug('[API] ℹ️  Using network IP - OK for physical devices');
    logger.debug('[API] ℹ️  Ensure device and backend are on same WiFi network');
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

    // SECURITY: Cookie-only authentication - no token storage or manual headers
    // Cookies are automatically sent via withCredentials: true
    // Backend reads from req.cookies.main_jwt (or seller_jwt/admin_jwt based on route)
    
    // Add platform header (non-sensitive metadata)
    config.headers['x-platform'] = 'saysay';
    config.headers['x-mobile'] = 'true';
    
    // Add screen tracking headers (non-sensitive metadata)
    try {
      const currentScreen = getCurrentScreen();
      const routeParams = getCurrentRouteParams();
      config.headers['x-client-app'] = 'Saysay';
      config.headers['x-client-screen'] = currentScreen || 'Unknown';
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
          logger.warn('[API] ⚠️ Error stringifying route params:', e);
        }
      }
    } catch (screenError) {
      logger.warn('[API] ⚠️ Error getting screen info:', screenError);
      config.headers['x-client-app'] = 'Saysay';
      config.headers['x-client-screen'] = 'Unknown';
    }
    
    // Cookie is automatically sent - no manual token attachment needed
    if (__DEV__) {
      logger.debug(`[API] Cookie will be sent automatically for ${method.toUpperCase()} ${normalizedPath}`);
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
      const actualBaseUrl = baseURL.replace('/api/v1', '');
      logger.error(`[API] ❌ TIMEOUT: ${method} ${url} - Request exceeded ${timeout}ms`);
      logger.error(`[API] ❌ Backend is too slow or unreachable`);
      logger.error(`[API] ❌ Base URL: ${baseURL}`);
      logger.error(`[API] ❌ Actual Backend URL: ${actualBaseUrl}`);
      if (__DEV__) {
        logger.debug(`[API] 🔧 TROUBLESHOOTING:`);
        logger.debug(`[API]   1. Check if backend is running: cd backend && npm start`);
        logger.debug(`[API]   2. Test backend connectivity: curl ${actualBaseUrl}/health-check`);
        logger.debug(`[API]   3. Current Base URL: ${actualBaseUrl}`);
        logger.debug(`[API]   4. Check network connection (WiFi/network settings)`);
        logger.debug(`[API]   5. Verify device and backend are on same WiFi network`);
        if (Platform.OS === 'ios') {
          logger.debug(`[API]   6. For iOS Simulator: Try http://localhost:4000`);
          logger.debug(`[API]   7. For iOS Device: Use your Mac's network IP`);
        } else if (Platform.OS === 'android') {
          logger.debug(`[API]   6. For Android Emulator: Use http://10.0.2.2:4000`);
          logger.debug(`[API]   7. For Android Device: Use your Mac's network IP`);
        }
        logger.debug(`[API]   8. Set EXPO_PUBLIC_API_URL in .env: EXPO_PUBLIC_API_URL=${actualBaseUrl}`);
        logger.debug(`[API]   9. Restart Expo with cache cleared: npx expo start -c`);
      }
    } else if (error.response) {
      // Don't log 401 on auth endpoints as error - it's expected when user is not authenticated
      const isAuthEndpoint = url.includes('/users/me') || url.includes('/auth/me') || url.includes('/auth/current-user');
      const isUnauthorized = error.response.status === 401;
      
      if (isUnauthorized && isAuthEndpoint) {
        // 401 on auth endpoint = user not authenticated (normal state, not an error)
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          logger.debug(`[API] User unauthenticated (401) on ${url} - this is expected when not logged in`);
        }
      } else {
        // Log other errors normally
        logger.error(`[API] ❌ ${method} ${url} - ${error.response.status} ${error.response.statusText}`, error.response.data);
      }
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
        // 401 during OTP verification = normal (user is still in login flow)
        if (__DEV__) {
          logger.debug('[API] 401 from OTP verification - NOT clearing auth data (user is still logging in)');
          logger.debug('[API] Error:', error.response?.data?.message || 'OTP verification failed');
        }
      } else if (isNotificationEndpoint) {
        // 401 on notification endpoint = might be cookie issue, not auth failure
        if (__DEV__) {
          logger.debug('[API] 401 from notification endpoint - NOT clearing auth data');
          logger.debug('[API] This might be a temporary issue. Error:', error.response?.data?.message || 'Unauthorized');
        }
        
      } else {
        // Check if this is a password change error
        const errorMessage = error.response?.data?.message || '';
        const isPasswordChangeError = errorMessage.includes('recently changed password') || 
                                     errorMessage.includes('changed password');
        
        // 401 is expected when user is not authenticated - not an error, just unauthenticated state
        const url = error.config?.url || '';
        const isAuthEndpoint = url.includes('/auth/me') || url.includes('/auth/current-user');
        
        if (isAuthEndpoint) {
          // Auth endpoint 401 = user is not authenticated (normal state)
          if (__DEV__) {
            logger.debug('[API] User unauthenticated (401) on auth endpoint - clearing auth data');
          }
        } else {
          // Other endpoint 401 = might be temporary or session issue
          if (__DEV__) {
            logger.debug('[API] 401 on non-auth endpoint - user may need to re-authenticate');
          }
        }
        
        if (isPasswordChangeError && __DEV__) {
          logger.debug('[API] User recently changed password - session invalidated');
        }
        
        // SECURITY: No token storage - cookies are managed by backend
        // Just clear React Query cache - backend cookie is cleared by logout endpoint
        if (__DEV__) {
          logger.debug('[API] 401 response - cookie-based auth, no local storage to clear');
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
