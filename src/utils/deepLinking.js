export const parseDeepLink = (url) => {
  console.log('[DeepLinking] Parsing URL:', url);

  try {
    let parsedUrl;

    if (url.startsWith('saysay:
      const urlWithoutScheme = url.replace('saysay:
      parsedUrl = new URL(`https:
    } else {

      parsedUrl = new URL(url);
    }

    const path = parsedUrl.pathname.toLowerCase();
    const params = new URLSearchParams(parsedUrl.search);

    if (path.includes('reset-password') || path.includes('resetpassword')) {
      const token = params.get('token') || params.get('resetToken');
      return {
        type: 'password-reset',
        screen: 'ResetPassword',
        params: {
          token,
        },
      };
    }

    if (path.includes('verify-otp') || path.includes('verifyotp')) {
      const loginId = params.get('loginId') || params.get('email') || params.get('phone');
      const otp = params.get('otp') || params.get('code');
      return {
        type: 'otp-verification',
        screen: 'OtpVerification',
        params: {
          loginId,
          otp,
        },
      };
    }

    if (path.includes('verify-email') || path.includes('verifyemail')) {
      const token = params.get('token') || params.get('verificationToken');
      const email = params.get('email');
      return {
        type: 'email-verification',
        screen: 'OtpVerification', 
        params: {
          token,
          email,
          isEmailVerification: true,
        },
      };
    }

    if (path.includes('enable-2fa') || path.includes('enable2fa')) {
      const token = params.get('token');
      return {
        type: '2fa-enable',
        screen: 'TwoFactorSetup',
        params: {
          token,
        },
      };
    }

    if (path.includes('disable-2fa') || path.includes('disable2fa')) {
      const token = params.get('token');
      return {
        type: '2fa-disable',
        screen: 'DisableTwoFactor',
        params: {
          token,
        },
      };
    }

    return null;
  } catch (error) {
    console.error('[DeepLinking] Error parsing URL:', error);
    return null;
  }
};


