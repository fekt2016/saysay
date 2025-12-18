/**
 * Contact Information Configuration
 * 
 * Centralized contact information for EazShop/EazMainApp
 * Update these values to change contact info across the entire app
 */

export const contactInfo = {
  // Support Email
  email: {
    support: 'support@saysay.com',
    legal: 'legal@saysay.com',
    returns: 'returns@saysay.com',
  },

  // Phone Numbers (Ghana format: +233)
  phone: {
    primary: '+233241234567', // Saysay support phone number
    // Add additional phone numbers as needed
    // whatsapp: '+233 XX XXX XXXX',
    // sales: '+233 XX XXX XXXX',
  },

  // Physical Address
  address: {
    street: 'Accra, Ghana',
    // Add full address details if available
    // full: '123 Commerce Street, Accra, Ghana',
  },

  // Business Hours (optional)
  hours: {
    weekdays: 'Monday - Friday, 9 AM - 6 PM GMT',
    weekends: 'Saturday, 9 AM - 5 PM GMT',
  },

  // Social Media (optional - add if needed)
  // social: {
  //   facebook: 'https://facebook.com/eazshop',
  //   twitter: 'https://twitter.com/eazshop',
  //   instagram: 'https://instagram.com/eazshop',
  // },
};

export const formatPhone = (phone) => {
  return phone || contactInfo.phone.primary;
};

export const getContactEmail = (type = 'support') => {
  return contactInfo.email[type] || contactInfo.email.support;
};

export default contactInfo;
