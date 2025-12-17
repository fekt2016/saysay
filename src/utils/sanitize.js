export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;

  return input.replace(/<[^>]*>/g, '')
              .replace(/javascript:/gi, '')
              .replace(/on\w+\s*=/gi, '')
              .trim();
};

export const sanitizeCouponCode = (code) => {
  if (typeof code !== 'string') return '';

  return code.trim()
             .toUpperCase()
             .replace(/[^A-Z0-9]/g, '')
             .substring(0, 50);
};

export const sanitizeText = (text, maxLength = 1000) => {
  if (typeof text !== 'string') return '';

  return text.replace(/<[^>]*>/g, '')
             .replace(/javascript:/gi, '')
             .replace(/on\w+\s*=/gi, '')
             .trim()
             .substring(0, maxLength);
};

export const sanitizePhone = (phone) => {
  if (typeof phone !== 'string') return '';

  return phone.replace(/\D/g, '')
              .substring(0, 15);
};

export const sanitizeAddress = (address) => {
  if (typeof address !== 'string') return '';

  return address.replace(/<[^>]*>/g, '')
                .replace(/javascript:/gi, '')
                .replace(/on\w+\s*=/gi, '')
                .trim()
                .substring(0, 500); 
};

export const sanitizeDigitalAddress = (address) => {
  if (typeof address !== 'string') return '';

  return address.replace(/[^A-Z0-9]/g, '').toUpperCase().substring(0, 9);
};

export const validateQuantity = (value, maxStock = 999) => {
  const num = parseInt(value, 10);
  if (isNaN(num)) return 1;

  return Math.max(1, Math.min(maxStock, num));
};


