"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ERROR_MESSAGES = exports.ERROR_CODES = void 0;
exports.ERROR_CODES = {
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
};
exports.ERROR_MESSAGES = {
    [exports.ERROR_CODES.VALIDATION_ERROR]: 'Validation failed',
    [exports.ERROR_CODES.UNAUTHORIZED]: 'Authentication required',
    [exports.ERROR_CODES.FORBIDDEN]: 'Access denied',
    [exports.ERROR_CODES.NOT_FOUND]: 'Resource not found',
    [exports.ERROR_CODES.DUPLICATE]: 'Resource already exists',
    [exports.ERROR_CODES.AI_ERROR]: 'AI service error',
    [exports.ERROR_CODES.AI_KEY_INVALID]: 'Invalid API key',
    [exports.ERROR_CODES.AI_RATE_LIMITED]: 'Rate limit exceeded',
    [exports.ERROR_CODES.PARSE_ERROR]: 'File parsing failed',
    [exports.ERROR_CODES.FILE_TOO_LARGE]: 'File too large',
    [exports.ERROR_CODES.UNSUPPORTED_FORMAT]: 'Unsupported file format',
};
//# sourceMappingURL=errors.js.map