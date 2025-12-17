import api from './api';

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
      console.log('[paymentApi] 🔍 DEBUG - Initializing Paystack Payment:');
      console.log('[paymentApi] Order ID:', orderId, '(type:', typeof orderId, ')');
      console.log('[paymentApi] Amount:', amount, '(type:', typeof amount, ')');
      console.log('[paymentApi] Email:', email, '(type:', typeof email, ')');
      console.log('[paymentApi] Endpoint: POST /payment/paystack/initialize');
      
      
      if (!orderId) {
        console.error('[paymentApi] ❌ Order ID is missing!');
        throw new Error('Order ID is required');
      }
      
      if (!email || email.trim() === '') {
        console.error('[paymentApi] ❌ Email is missing!');
        throw new Error('Email is required');
      }
      
      
      
      const requestBody = {
        orderId: String(orderId), 
        email: String(email).trim(), 
      };
      
      
      if (amount !== undefined && amount !== null) {
        requestBody.amount = Number(amount);
      }
      
      console.log('[paymentApi] Request body being sent:', requestBody);
      
      const response = await api.post('/payment/paystack/initialize', requestBody);
      
      console.log('[paymentApi] ✅ Payment initialization successful');
      console.log('[paymentApi] 🔍 DEBUG - Full response structure:');
      console.log('[paymentApi] response:', response);
      console.log('[paymentApi] response.data:', response.data);
      console.log('[paymentApi] response.data?.data:', response.data?.data);
      console.log('[paymentApi] response.data?.data?.authorization_url:', response.data?.data?.authorization_url);
      console.log('[paymentApi] response.data?.authorization_url:', response.data?.authorization_url);

      
      
      const redirectUrl =
        response.data?.data?.authorization_url || 
        response.data?.data?.authorizationUrl ||
        response.data?.authorization_url ||
        response.data?.authorizationUrl;
      
      console.log('[paymentApi] Extracted redirectUrl:', redirectUrl);
      
      if (!redirectUrl) {
        console.error('[paymentApi] ❌ No redirect URL found in response!');
        console.error('[paymentApi] Full response.data:', JSON.stringify(response.data, null, 2));
        throw new Error('Invalid payment response: missing redirect URL');
      }
      
      if (!isValidPaystackUrl(redirectUrl)) {
        console.error('[paymentApi] Invalid Paystack redirect URL:', redirectUrl);
        throw new Error('Invalid payment redirect URL. Please contact support.');
      }

      console.log('[paymentApi] ✅ Valid Paystack URL extracted:', redirectUrl);
      return response.data;
    } catch (error) {
      console.error('[paymentApi] Payment initialization error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw error;
    }
  },

  
  verifyPaystackPayment: async (reference, orderId) => {
    try {
      console.log('[paymentApi] 🔍 Verifying Paystack payment:', { reference, orderId });
      const response = await api.get('/payment/paystack/verify', {
        params: {
          reference,
          orderId,
        },
      });

      console.log('[paymentApi] ✅ Payment verification successful');
      return response.data;
    } catch (error) {
      console.error('[paymentApi] Payment verification error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw error;
    }
  },
};

console.log('[paymentApi] Module loaded. verifyPaystackPayment type:', typeof paymentApi.verifyPaystackPayment);
console.log('[paymentApi] Available methods:', Object.keys(paymentApi));

export default paymentApi;
export { paymentApi };
