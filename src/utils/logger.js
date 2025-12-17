const SENSITIVE_FIELDS = [
  'token',
  'password',
  'otp',
  'pin',
  'authorization',
  'auth',
  'secret',
  'apiKey',
  'api_key',
  'accessToken',
  'access_token',
  'refreshToken',
  'refresh_token',
  'sessionId',
  'session_id',
  'reference', 
  'trxref',
  'paystack_reference',
];export const sanitize = (obj, maxDepth = 5) => {
  if (maxDepth <= 0) {
    return '[Max Depth Reached]';
  }

  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitize(item, maxDepth - 1));
  }

  if (obj instanceof Date) {
    return obj.toISOString();
  }

  if (obj instanceof Error) {
    return {
      name: obj.name,
      message: obj.message,
      stack: __DEV__ ? obj.stack : '[Stack hidden in production]',
    };
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();

    const isSensitive = SENSITIVE_FIELDS.some(field => 
      lowerKey.includes(field.toLowerCase())
    );

    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitize(value, maxDepth - 1);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};class Logger {debug(...args) {
    if (__DEV__) {
      const sanitized = args.map(arg => 
        typeof arg === 'object' ? sanitize(arg) : arg
      );
      console.log('[DEBUG]', ...sanitized);
    }
  }info(...args) {
    if (__DEV__) {
      const sanitized = args.map(arg => 
        typeof arg === 'object' ? sanitize(arg) : arg
      );
      console.info('[INFO]', ...sanitized);
    }
  }warn(...args) {
    const sanitized = args.map(arg => 
      typeof arg === 'object' ? sanitize(arg) : arg
    );
    if (__DEV__) {
      console.warn('[WARN]', ...sanitized);
    } else {

      console.warn('[WARN]', ...sanitized);
    }
  }error(...args) {
    const sanitized = args.map(arg => 
      typeof arg === 'object' ? sanitize(arg) : arg
    );

    if (__DEV__) {
      console.error('[ERROR]', ...sanitized);
    } else {

      console.error('[ERROR]', sanitized[0] || 'An error occurred');
    }
  }
}

const logger = new Logger();
export default logger;


