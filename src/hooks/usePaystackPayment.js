import paymentApi from '../services/paymentApi';

export const usePaystackPayment = () => {
  
  
  const initializePaystackPayment = async ({ orderId, amount, email }) => {
    try {
      
      
      const response = await paymentApi.initializePaystack(orderId, amount, email);

      
      console.log('[usePaystackPayment] 🔍 DEBUG - Full response structure:');
      console.log('[usePaystackPayment] response type:', typeof response);
      console.log('[usePaystackPayment] response:', JSON.stringify(response, null, 2));
      console.log('[usePaystackPayment] response.data:', response.data);
      console.log('[usePaystackPayment] response.data?.data:', response.data?.data);
      console.log('[usePaystackPayment] response.data?.data?.authorization_url:', response.data?.data?.authorization_url);
      console.log('[usePaystackPayment] response.data?.authorization_url:', response.data?.authorization_url);

      
      
      
      
      const redirectUrl =
        response?.data?.data?.authorization_url || 
        response?.data?.data?.authorizationUrl ||
        response?.data?.authorization_url ||
        response?.data?.authorizationUrl ||
        response?.authorization_url;
      
      console.log('[usePaystackPayment] 🔍 Extracted redirectUrl:', redirectUrl);
      console.log('[usePaystackPayment] redirectUrl type:', typeof redirectUrl);
      console.log('[usePaystackPayment] redirectUrl length:', redirectUrl?.length);
      
      if (!redirectUrl || typeof redirectUrl !== 'string' || redirectUrl.trim() === '') {
        console.error('[usePaystackPayment] ❌ No valid redirect URL found in response!');
        console.error('[usePaystackPayment] Full response:', JSON.stringify(response, null, 2));
        throw new Error('Invalid payment response: missing redirect URL');
      }

      console.log('[usePaystackPayment] ✅ Payment initialized successfully');
      console.log('[usePaystackPayment] Redirect URL:', redirectUrl);
      return { redirectTo: redirectUrl };
    } catch (error) {
      console.error('[usePaystackPayment] Payment initialization error:', error);
      throw error;
    }
  };

  return { initializePaystackPayment };
};

export default usePaystackPayment;
