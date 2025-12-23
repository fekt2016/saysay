/**
 * Centralized Tab Bar Visibility Configuration
 * 
 * This file defines which screens should hide the bottom tab bar.
 * Screens are hidden for:
 * - Authentication & Security flows
 * - Checkout & Payment flows
 * - Order & Transaction flows
 * - Media/Upload/Camera screens
 * - Sensitive account screens
 * - Profile editing screens
 * - System/Utility modal screens
 */

/**
 * List of all route names that should hide the bottom tab bar
 */
export const HIDE_TAB_BAR_ROUTES = [
  // Authentication & Security
  'Login',
  'Register',
  'ForgotPassword',
  'OtpVerification',
  'ResetPassword',
  
  // Checkout & Payments
  'Checkout',
  'OrderSummary',
  'PaymentMethod',
  'WalletTopupWebView',
  'PaystackWebView',
  'StripeWebView',
  'OrderComplete',
  'OrderConfirmation',
  
  // Order & Transaction Flows
  'Tracking',
  'OrderTracking',
  'RefundRequest',
  'CancelOrder',
  'Dispute',
  
  // Media / Upload / Camera
  'ImageUpload',
  'CameraCapture',
  'DocumentUpload',
  
  // Sensitive Account Screens
  'ChangePassword',
  'DeleteAccount',
  'TwoFactorSetup',
  'DeviceManagement',
  'SecuritySettings',
  'ResetPIN',
  
  // Profile Editing
  'EditProfile',
  'EditAddress',
  'AddNewAddress',
  
  // System / Utility
  'FullScreenSearch',
  'FiltersModal',
  'ImagePreview',
  'PdfPreview',
  
  // Additional existing routes
  'ProductDetail',
  'CategoryProducts',
  'Account',
  'Wishlist',
  'Support',
  'HelpCenter',
  'HelpCenterTabs',
  'Orders',
  'OrderDetail',
  'Settings',
  'CreditBalance',
  'AddMoney',
  'NotificationSettings',
  'Permission',
  'Language',
  'Region',
  'AppVersion',
];

/**
 * Check if a route name should hide the tab bar
 * @param {string} routeName - The name of the route
 * @returns {boolean} - True if tab bar should be hidden
 */
export const shouldHideTabBar = (routeName) => {
  return HIDE_TAB_BAR_ROUTES.includes(routeName);
};

/**
 * Get tab bar style based on route visibility
 * @param {object} route - Navigation route object
 * @param {object} defaultTabBarStyle - Default tab bar style
 * @returns {object} - Tab bar style (hidden or default)
 */
export const getTabBarStyle = (route, defaultTabBarStyle) => {
  const routeName = route?.name;
  const focusedRouteName = route?.state?.routes?.[route?.state?.index]?.name;
  const activeRouteName = focusedRouteName || routeName;
  
  if (shouldHideTabBar(activeRouteName)) {
    return { 
      display: 'none',
      height: 0,
      overflow: 'hidden',
      margin: 0,
      padding: 0,
      borderTopWidth: 0,
      elevation: 0,
      shadowOpacity: 0,
      backgroundColor: 'transparent',
      opacity: 0,
    };
  }
  
  return defaultTabBarStyle;
};

/**
 * Navigation options for screens that should hide tabs
 * Use this in Stack.Screen options
 */
export const hideTabBarOptions = {
  tabBarStyle: { 
    display: 'none',
    height: 0,
    overflow: 'hidden',
    margin: 0,
    padding: 0,
    borderTopWidth: 0,
    elevation: 0,
    shadowOpacity: 0,
    backgroundColor: 'transparent',
    opacity: 0,
  },
};

/**
 * Navigation options for modal screens that should hide tabs
 */
export const hideTabBarModalOptions = {
  presentation: 'modal',
  tabBarStyle: { 
    display: 'none',
    height: 0,
    overflow: 'hidden',
    margin: 0,
    padding: 0,
    borderTopWidth: 0,
    elevation: 0,
    shadowOpacity: 0,
    backgroundColor: 'transparent',
    opacity: 0,
  },
};

