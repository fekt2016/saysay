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
];

export const sanitize = (obj, maxDepth = 5, seen = new WeakSet()) => {
  if (maxDepth <= 0) {
    return '[Max Depth Reached]';
  }

  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj !== 'object') {
    return obj;
  }

  // Handle circular references
  if (seen.has(obj)) {
    return '[Circular Reference]';
  }

  // Add object to seen set (only for non-primitive objects)
  try {
    seen.add(obj);
  } catch (e) {
    // WeakSet can't hold primitives, but we already checked for that above
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitize(item, maxDepth - 1, seen));
  }

  if (obj instanceof Date) {
    return obj.toISOString();
  }

  if (obj instanceof Error) {
    return {
      name: obj.name,
      message: obj.message,
      stack: typeof __DEV__ !== 'undefined' && __DEV__ ? obj.stack : '[Stack hidden in production]',
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
      sanitized[key] = sanitize(value, maxDepth - 1, seen);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};

class Logger {
  debug(...args) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      const sanitized = args.map(arg => 
        typeof arg === 'object' && arg !== null ? sanitize(arg) : arg
      );
      console.log('[DEBUG]', ...sanitized);
    }
  }

  info(...args) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      const sanitized = args.map(arg => 
        typeof arg === 'object' && arg !== null ? sanitize(arg) : arg
      );
      console.info('[INFO]', ...sanitized);
    }
  }

  warn(...args) {
    const sanitized = args.map(arg => 
      typeof arg === 'object' && arg !== null ? sanitize(arg) : arg
    );
    console.warn('[WARN]', ...sanitized);
  }

  error(...args) {
    const sanitized = args.map(arg => 
      typeof arg === 'object' && arg !== null ? sanitize(arg) : arg
    );

    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.error('[ERROR]', ...sanitized);
    } else {
      // In production, only log the first error message to reduce noise
      console.error('[ERROR]', sanitized[0] || 'An error occurred');
    }
  }
}

const logger = new Logger();
export default logger;

