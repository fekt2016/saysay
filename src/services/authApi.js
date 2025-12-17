import api from './api';

const authApi = {
  
  login: async (email, password) => {
    console.log('🔐 [Login] Attempting login with email:', email);
    const response = await api.post('/users/login', { email, password });
    console.log('🔐 [Login] Response status:', response.data?.status);
    return response.data;
  },

  
  verify2FALogin: async (loginSessionId, twoFactorCode) => {
    console.log('🔐 [2FA Login] Verifying 2FA code');
    const response = await api.post('/users/verify-2fa-login', {
      loginSessionId,
      twoFactorCode,
    });
    console.log('🔐 [2FA Login] Response status:', response.data?.status);
    return response.data;
  },

  
  sendOtp: async (loginId) => {
    console.log('\n');
    console.log('📧 [OTP] ════════════════════════════════════════════════════════════');
    console.log('📧 [OTP] Requesting OTP for loginId:', loginId);
    console.log('📧 [OTP] ════════════════════════════════════════════════════════════');
    
    const response = await api.post('/users/send-otp', { loginId });
    
    
    const otp = response.data?.otp;
    
    if (otp) {
      console.log('\n');
      console.log('✅ [OTP] ════════════════════════════════════════════════════════════');
      console.log('✅ [OTP] ⭐ OTP RECEIVED FROM BACKEND ⭐');
      console.log('✅ [OTP] ════════════════════════════════════════════════════════════');
      console.log('✅ [OTP] ⭐ OTP CODE:', otp, '⭐');
      console.log('✅ [OTP] ════════════════════════════════════════════════════════════');
      console.log('✅ [OTP] Use this code to verify your login');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('\n');
    } else {
      console.log('\n');
      console.log('⚠️ [OTP] ════════════════════════════════════════════════════════════');
      console.log('⚠️ [OTP] OTP not found in API response');
      console.log('⚠️ [OTP] ════════════════════════════════════════════════════════════');
      console.log('⚠️ [OTP] Check BACKEND console logs for OTP');
      console.log('⚠️ [OTP] Backend should log OTP when generating it');
      console.log('⚠️ [OTP] Response structure:', JSON.stringify(response.data, null, 2));
      console.log('═══════════════════════════════════════════════════════════');
      console.log('\n');
    }
    
    return response.data;
  },

  
  verifyOtp: async (loginId, otp, password, twoFactorCode = null) => {
    console.log('🔐 [OTP] Verifying OTP:', { 
      loginId, 
      otp: otp ? '***' + otp.slice(-2) : 'N/A',
      has2FA: twoFactorCode ? 'Yes' : 'No'
    });
    const payload = {
      loginId,
      otp,
      password,
    };
    
    
    if (twoFactorCode) {
      payload.twoFactorCode = twoFactorCode;
    }
    
    const response = await api.post('/users/verify-otp', payload);
    
    
    if (response.data?.status === '2fa_required' || response.data?.requires2FA) {
      console.log('🔐 [2FA] Two-factor authentication required');
      return response.data;
    }
    
    console.log('✅ [OTP] Verification response:', response.data?.status || 'success');
    return response.data;
  },

  
  register: async (registerData) => {
    const response = await api.post('/users/signup', registerData);
    return response.data;
  },

  
  emailVerification: async (email) => {
    const response = await api.post('/users/email-verification', { email });
    return response.data;
  },

  
  verifyAccount: async (email, phone, otp) => {
    const response = await api.post('/users/verify-account', {
      email,
      phone,
      otp,
    });
    return response.data;
  },

  
  resendOtp: async (loginId) => {
    const response = await api.post('/users/resend-otp', { loginId });
    return response.data;
  },

  
  logout: async () => {
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Logout request timeout')), 5000);
    });
    
    
    try {
      const response = await Promise.race([
        api.post('/users/logout'),
        timeoutPromise,
      ]);
      return response.data;
    } catch (error) {
      
      
      console.warn('Logout API call failed or timed out, proceeding with local cleanup:', error.message);
      return { status: 'success', message: 'Local logout completed' };
    }
  },

  
  getCurrentUser: async () => {
    try {
      const response = await api.get('/users/me', {
        timeout: 30000, 
      });
      return response.data;
    } catch (error) {
      
      if (error.code === 'ECONNABORTED') {
        console.error('[Auth] ❌ Timeout checking user authentication');
        console.error('[Auth] ❌ Backend is not responding or unreachable');
        console.error('[Auth] 🔧 Check backend connectivity before retrying');
      } else if (error.code === 'ERR_NETWORK' || !error.response) {
        console.error('[Auth] ❌ Network error - cannot reach backend');
        console.error('[Auth] 🔧 Verify backend is running and network is connected');
      }
      throw error; 
    }
  },

  
  sendPasswordResetOtp: async (loginId) => {
    console.log('📧 [OTP] Requesting Password Reset OTP for loginId:', loginId);
    const response = await api.post('/users/forgot-password', { loginId });
    
    
    console.log('📧 [OTP] Complete Password Reset response:', JSON.stringify(response.data, null, 2));
    console.log('📧 [OTP] Response keys:', Object.keys(response.data || {}));
    
    
    const otpLocations = [
      response.data?.otp,
      response.data?.data?.otp,
      response.data?.otpCode,
      response.data?.data?.otpCode,
      response.data?.code,
      response.data?.data?.code,
      response.data?.verificationCode,
      response.data?.data?.verificationCode,
    ];
    
    const foundOtp = otpLocations.find(otp => otp !== undefined && otp !== null);
    
    if (foundOtp) {
      console.log('✅ [OTP] ===========================================');
      console.log('✅ [OTP] PASSWORD RESET OTP FROM BACKEND:', foundOtp);
      console.log('✅ [OTP] ===========================================');
    } else {
      console.log('⚠️ [OTP] OTP not found in response. Check backend logs for OTP.');
      console.log('⚠️ [OTP] Backend should log OTP when generating it.');
    }
    
    return response.data;
  },

  
  verifyPasswordResetOtp: async (loginId, otp) => {
    console.log('🔐 [OTP] Verifying Password Reset OTP:', { loginId, otp: otp ? '***' + otp.slice(-2) : 'N/A' });
    const response = await api.post('/users/verify-reset-otp', {
      loginId,
      otp,
    });
    console.log('✅ [OTP] Password Reset Verification response:', response.data?.status || 'success');
    return response.data;
  },

  
  resetPassword: async (loginId, newPassword, resetToken = null) => {
    const payload = { loginId, newPassword };
    if (resetToken) {
      payload.resetToken = resetToken;
    }
    const response = await api.post('/users/reset-password', payload);
    return response.data;
  },

  
  changePassword: async (passwords) => {
    const response = await api.patch('/users/updatePassword', passwords);
    return response.data;
  },

  
  resetPin: async (pinData) => {
    const response = await api.post('/users/reset-pin', pinData);
    return response.data;
  },

  
  getProfile: async () => {
    const response = await api.get('/users/profile');
    return response.data;
  },

  
  updateProfile: async (profileData) => {
    const response = await api.patch('/users/updateMe', profileData);
    return response.data;
  },

  
  uploadAvatar: async (formData) => {
    const response = await api.patch('/users/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  
  deactivateAccount: async () => {
    const response = await api.delete('/users/deleteMe');
    return response.data;
  },

  
  getActiveDevices: async () => {
    const response = await api.get('/sessions/my-devices');
    return response.data;
  },

  
  logoutDevice: async (deviceId) => {
    const response = await api.delete(`/sessions/logout-device/${deviceId}`);
    return response.data;
  },

  
  logoutAllOtherDevices: async () => {
    const response = await api.delete('/sessions/logout-others');
    return response.data;
  },

  
  
  
  
  enableTwoFactor: async () => {
    try {
      
      const response = await api.post('/users/enable-2fa');
      return response.data;
    } catch (error) {
      
      if (error.response?.status === 404) {
        throw new Error('Two-factor authentication is not yet implemented on the backend. Please contact support.');
      }
      throw error;
    }
  },

  
  
  
  
  disableTwoFactor: async (verificationCode = null) => {
    try {
      const payload = verificationCode ? { code: verificationCode } : {};
      const response = await api.post('/users/disable-2fa', payload);
      return response.data;
    } catch (error) {
      
      if (error.response?.status === 404) {
        throw new Error('Two-factor authentication is not yet implemented on the backend. Please contact support.');
      }
      throw error;
    }
  },

  
  
  
  
  getTwoFactorSetup: async () => {
    try {
      const response = await api.get('/users/2fa/setup');
      return response.data;
    } catch (error) {
      
      if (error.response?.status === 404) {
        throw new Error('Two-factor authentication setup is not yet implemented on the backend.');
      }
      throw error;
    }
  },

  
  
  
  
  verifyTwoFactor: async (code) => {
    try {
      
      const response = await api.post('/users/2fa/verify', { code });
      return response.data;
    } catch (error) {
      
      if (error.response?.status === 404) {
        try {
          const response = await api.post('/users/verify-2fa', { code });
          return response.data;
        } catch (altError) {
          throw new Error('Two-factor authentication verification is not yet implemented on the backend.');
        }
      }
      throw error;
    }
  },
};

export default authApi;
