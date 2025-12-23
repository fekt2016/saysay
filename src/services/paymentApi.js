import api from './api';
import logger from '../utils/logger';

const isValidPaystackUrl = (url) => {
  try {
    const parsed = new URL(url);
    
    return (
      parsed.hostname === 'paystack.com' ||
      parsed.hostname.endsWith('.paystack.com') ||
      parsed.hostname === 'checkout.paystack.com'
    );
  } catch {
    return false;
  }
};

const paymentApi = {
  
  initializePaystack: async (orderId, amount, email) => {
    try {
      logger.debug('[paymentApi] Initializing Paystack Payment:', { orderId, amount, email });
      
      
      if (!orderId) {
        logger.error('[paymentApi] ❌ Order ID is missing!');
        throw new Error('Order ID is required');
      }
      
      if (!email || email.trim() === '') {
        logger.error('[paymentApi] ❌ Email is missing!');
        throw new Error('Email is required');
      }
      
      
      
      const requestBody = {
        orderId: String(orderId), 
        email: String(email).trim(), 
      };
      
      
      if (amount !== undefined && amount !== null) {
        requestBody.amount = Number(amount);
      }
      
      logger.debug('[paymentApi] Request body:', requestBody);
      
      const response = await api.post('/payment/paystack/initialize', requestBody);
      
      logger.debug('[paymentApi] ✅ Payment initialization successful');
      
      
      
      const redirectUrl =
        response.data?.data?.authorization_url || 
        response.data?.data?.authorizationUrl ||
        response.data?.authorization_url ||
        response.data?.authorizationUrl;
      
      logger.debug('[paymentApi] Extracted redirectUrl:', redirectUrl);
      
      if (!redirectUrl) {
        logger.error('[paymentApi] ❌ No redirect URL found in response!');
        throw new Error('Invalid payment response: missing redirect URL');
      }
      
      if (!isValidPaystackUrl(redirectUrl)) {
        logger.error('[paymentApi] Invalid Paystack redirect URL:', redirectUrl);
        throw new Error('Invalid payment redirect URL. Please contact support.');
      }

      logger.debug('[paymentApi] ✅ Valid Paystack URL extracted');
      return response.data;
    } catch (error) {
      logger.error('[paymentApi] Payment initialization error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw error;
    }
  },

  
  verifyPaystackPayment: async (reference, orderId) => {
    try {
      logger.debug('[paymentApi] Verifying Paystack payment:', { reference, orderId });
      const response = await api.get('/payment/paystack/verify', {
        params: {
          reference,
          orderId,
        },
      });

      logger.debug('[paymentApi] ✅ Payment verification successful');
      return response.data;
    } catch (error) {
      logger.error('[paymentApi] Payment verification error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw error;
    }
  },
};

export default paymentApi;
