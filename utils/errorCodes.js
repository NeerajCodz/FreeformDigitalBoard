/**
 * Centralized Error Codes for the Application
 */

const ErrorCodes = {
  // Authentication Errors (1000-1099)
  NO_TOKEN: { code: 'NO_TOKEN', status: 401 },
  INVALID_TOKEN: { code: 'INVALID_TOKEN', status: 401 },
  TOKEN_EXPIRED: { code: 'TOKEN_EXPIRED', status: 401 },
  INVALID_CREDENTIALS: { code: 'INVALID_CREDENTIALS', status: 401 },
  USER_NOT_FOUND: { code: 'USER_NOT_FOUND', status: 404 },
  AUTH_ERROR: { code: 'AUTH_ERROR', status: 500 },

  // Validation Errors (2000-2099)
  VALIDATION_ERROR: { code: 'VALIDATION_ERROR', status: 400 },
  MISSING_FIELD: { code: 'MISSING_FIELD', status: 400 },
  INVALID_FORMAT: { code: 'INVALID_FORMAT', status: 400 },
  INVALID_UUID: { code: 'INVALID_UUID', status: 400 },

  // User Errors (3000-3099)
  USER_EXISTS: { code: 'USER_EXISTS', status: 409 },
  USERNAME_TAKEN: { code: 'USERNAME_TAKEN', status: 409 },
  EMAIL_TAKEN: { code: 'EMAIL_TAKEN', status: 409 },
  USER_NOT_FOUND_ERROR: { code: 'USER_NOT_FOUND', status: 404 },
  MISSING_QUERY: { code: 'MISSING_QUERY', status: 400 },

  // Message Errors (4000-4099)
  MESSAGE_NOT_FOUND: { code: 'MESSAGE_NOT_FOUND', status: 404 },
  MESSAGE_DELETED: { code: 'MESSAGE_DELETED', status: 410 },
  CANNOT_EDIT_MESSAGE: { code: 'CANNOT_EDIT_MESSAGE', status: 403 },
  CANNOT_DELETE_MESSAGE: { code: 'CANNOT_DELETE_MESSAGE', status: 403 },
  MESSAGE_TOO_LONG: { code: 'MESSAGE_TOO_LONG', status: 400 },
  INVALID_RECEIVER: { code: 'INVALID_RECEIVER', status: 400 },

  // Group Errors (5000-5099)
  GROUP_NOT_FOUND: { code: 'GROUP_NOT_FOUND', status: 404 },
  NOT_GROUP_MEMBER: { code: 'NOT_GROUP_MEMBER', status: 403 },
  ALREADY_GROUP_MEMBER: { code: 'ALREADY_GROUP_MEMBER', status: 409 },
  CANNOT_LEAVE_GROUP: { code: 'CANNOT_LEAVE_GROUP', status: 403 },
  GROUP_NAME_TAKEN: { code: 'GROUP_NAME_TAKEN', status: 409 },

  // Permission Errors (6000-6099)
  FORBIDDEN: { code: 'FORBIDDEN', status: 403 },
  UNAUTHORIZED: { code: 'UNAUTHORIZED', status: 401 },
  INSUFFICIENT_PERMISSIONS: { code: 'INSUFFICIENT_PERMISSIONS', status: 403 },

  // Rate Limit Errors (7000-7099)
  RATE_LIMIT_EXCEEDED: { code: 'RATE_LIMIT_EXCEEDED', status: 429 },
  AUTH_RATE_LIMIT_EXCEEDED: { code: 'AUTH_RATE_LIMIT_EXCEEDED', status: 429 },
  MESSAGE_RATE_LIMIT_EXCEEDED: { code: 'MESSAGE_RATE_LIMIT_EXCEEDED', status: 429 },

  // Server Errors (9000-9099)
  INTERNAL_ERROR: { code: 'INTERNAL_ERROR', status: 500 },
  DATABASE_ERROR: { code: 'DATABASE_ERROR', status: 500 },
  SERVICE_UNAVAILABLE: { code: 'SERVICE_UNAVAILABLE', status: 503 },
  ROUTE_NOT_FOUND: { code: 'ROUTE_NOT_FOUND', status: 404 },
};

module.exports = ErrorCodes;
