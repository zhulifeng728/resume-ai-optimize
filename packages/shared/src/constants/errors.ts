export const ERROR_CODES = {
  VALIDATION_ERROR: 1001,
  UNAUTHORIZED: 1002,
  FORBIDDEN: 1003,
  NOT_FOUND: 1004,
  DUPLICATE: 1005,
  AI_ERROR: 2001,
  AI_KEY_INVALID: 2002,
  AI_RATE_LIMITED: 2003,
  PARSE_ERROR: 3001,
  FILE_TOO_LARGE: 3002,
  UNSUPPORTED_FORMAT: 3003,
} as const;

export const ERROR_MESSAGES: Record<number, string> = {
  [ERROR_CODES.VALIDATION_ERROR]: 'Validation failed',
  [ERROR_CODES.UNAUTHORIZED]: 'Authentication required',
  [ERROR_CODES.FORBIDDEN]: 'Access denied',
  [ERROR_CODES.NOT_FOUND]: 'Resource not found',
  [ERROR_CODES.DUPLICATE]: 'Resource already exists',
  [ERROR_CODES.AI_ERROR]: 'AI service error',
  [ERROR_CODES.AI_KEY_INVALID]: 'Invalid API key',
  [ERROR_CODES.AI_RATE_LIMITED]: 'Rate limit exceeded',
  [ERROR_CODES.PARSE_ERROR]: 'File parsing failed',
  [ERROR_CODES.FILE_TOO_LARGE]: 'File too large',
  [ERROR_CODES.UNSUPPORTED_FORMAT]: 'Unsupported file format',
};
