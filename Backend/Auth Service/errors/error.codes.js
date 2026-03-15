// errors/errorCatalog.js
const { api } = require("../config");
const IS_PROD = api.environment === "production";

const SQLSTATE_RE = /^[0-9A-Z]{5}$/;

const API_SUCESS_RESPONSES = {
  // General Success (1xxx)
  OK: {
    code: "OK",
    statusCode: 200,
    responseCode: 1000,
    defaultMessage: "Request processed successfully",
  },
  CREATED: {
    code: "CREATED",
    statusCode: 201,
    responseCode: 1001,
    defaultMessage: "Resource created successfully",
  },
  ACCEPTED: {
    code: "ACCEPTED",
    statusCode: 202,
    responseCode: 1002,
    defaultMessage: "Request accepted for processing",
  },
  NO_CONTENT: {
    code: "NO_CONTENT",
    statusCode: 204,
    responseCode: 1003,
    defaultMessage: "Request successful, no content",
  },
  PARTIAL_CONTENT: {
    code: "PARTIAL_CONTENT",
    statusCode: 206,
    responseCode: 1004,
    defaultMessage: "Partial content delivered",
  },

  // Auth Success (2xxx)
  LOGIN_SUCCESS: {
    code: "LOGIN_SUCCESS",
    statusCode: 200,
    responseCode: 2000,
    defaultMessage: "User authenticated successfully",
  },
  LOGOUT_SUCCESS: {
    code: "LOGOUT_SUCCESS",
    statusCode: 200,
    responseCode: 2001,
    defaultMessage: "User logged out successfully",
  },
  TOKEN_REFRESHED: {
    code: "TOKEN_REFRESHED",
    statusCode: 200,
    responseCode: 2002,
    defaultMessage: "Token refreshed successfully",
  },
  SESSION_ACTIVE: {
    code: "SESSION_ACTIVE",
    statusCode: 200,
    responseCode: 2003,
    defaultMessage: "Session is valid and active",
  },
};

const API_ERROR_RESPONSES = {
  // Validation & Request (3xxx)
  VALIDATION_ERROR: {
    code: "VALIDATION_ERROR",
    statusCode: 422,
    responseCode: 3001,
    defaultMessage: "Validation failed",
  },
  INVALID_INPUT: {
    code: "INVALID_INPUT",
    statusCode: 400,
    responseCode: 3002,
    defaultMessage: "Invalid input",
  },
  MALFORMED_JSON: {
    code: "MALFORMED_JSON",
    statusCode: 400,
    responseCode: 3003,
    defaultMessage: "Malformed JSON",
  },
  UNSUPPORTED_MEDIA_TYPE: {
    code: "UNSUPPORTED_MEDIA_TYPE",
    statusCode: 415,
    responseCode: 3004,
    defaultMessage: "Unsupported media type",
  },
  REQUEST_TOO_LARGE: {
    code: "REQUEST_TOO_LARGE",
    statusCode: 413,
    responseCode: 3005,
    defaultMessage: "Payload too large",
  },

  // Auth / Access & Throttling (4xxx)
  UNAUTHORIZED: {
    code: "UNAUTHORIZED",
    statusCode: 401,
    responseCode: 4001,
    defaultMessage: "Authentication required",
  },
  FORBIDDEN: {
    code: "FORBIDDEN",
    statusCode: 403,
    responseCode: 4002,
    defaultMessage: "Not allowed",
  },
  TOKEN_EXPIRED: {
    code: "TOKEN_EXPIRED",
    statusCode: 401,
    responseCode: 4003,
    defaultMessage: "Token expired",
  },
  TOKEN_INVALID: {
    code: "TOKEN_INVALID",
    statusCode: 401,
    responseCode: 4004,
    defaultMessage: "Invalid token",
  },
  SESSION_EXPIRED: {
    code: "SESSION_EXPIRED",
    statusCode: 401,
    responseCode: 4005,
    defaultMessage: "Session expired",
  },
  RATE_LIMITED: {
    code: "RATE_LIMITED",
    statusCode: 429,
    responseCode: 4006,
    defaultMessage: "Too many requests",
  },
  QUOTA_EXCEEDED: {
    code: "QUOTA_EXCEEDED",
    statusCode: 429,
    responseCode: 4007,
    defaultMessage: "Quota exceeded",
  },

  // Resource / Existence (5xxx)
  RECORD_NOT_FOUND: {
    code: "RECORD_NOT_FOUND",
    statusCode: 404,
    responseCode: 5001,
    defaultMessage: "Record not found",
  },

  RESOURCE_NOT_FOUND: {
    code: "RESOURCE_NOT_FOUND",
    statusCode: 404,
    responseCode: 5002,
    defaultMessage: "Resource not found",
  },
  RESOURCE_GONE: {
    code: "RESOURCE_GONE",
    statusCode: 410,
    responseCode: 5003,
    defaultMessage: "Resource gone",
  },

  // Conflict / State (6xxx)
  DUPLICATE_ERROR: {
    code: "DUPLICATE_ERROR",
    statusCode: 409,
    responseCode: 6001,
    defaultMessage: "Duplicate resource",
  },
  CONFLICT: {
    code: "CONFLICT",
    statusCode: 409,
    responseCode: 6002,
    defaultMessage: "Request conflicts with current state",
  },
  PRECONDITION_FAILED: {
    code: "PRECONDITION_FAILED",
    statusCode: 412,
    responseCode: 6003,
    defaultMessage: "Precondition failed",
  },
  TRANSACTION_CONFLICT: {
    code: "TRANSACTION_CONFLICT",
    statusCode: 409,
    responseCode: 6004,
    defaultMessage: "Transaction conflict",
  },
  DEADLOCK_DETECTED: {
    code: "DEADLOCK_DETECTED",
    statusCode: 409,
    responseCode: 6005,
    defaultMessage: "Deadlock detected",
  },

  // External & Dependency (7xxx)
  DEPENDENCY_FAILED: {
    code: "DEPENDENCY_FAILED",
    statusCode: 502,
    responseCode: 7001,
    defaultMessage: "Dependency failed",
  },
  SERVICE_UNAVAILABLE: {
    code: "SERVICE_UNAVAILABLE",
    statusCode: 503,
    responseCode: 7002,
    defaultMessage: "Service unavailable",
  },
  TIMEOUT: {
    code: "TIMEOUT",
    statusCode: 504,
    responseCode: 7003,
    defaultMessage: "Upstream timeout",
  },
  THIRD_PARTY_ERROR: {
    code: "THIRD_PARTY_ERROR",
    statusCode: 502,
    responseCode: 7004,
    defaultMessage: "Third-party error",
  },
  PAYMENT_FAILED: {
    code: "PAYMENT_FAILED",
    statusCode: 402,
    responseCode: 7005,
    defaultMessage: "Payment required/failed",
  },
  WEBHOOK_SIGNATURE_ERROR: {
    code: "WEBHOOK_SIGNATURE_ERROR",
    statusCode: 400,
    responseCode: 7006,
    defaultMessage: "Invalid webhook signature",
  },

  // Files / Uploads (still part of 7xxx per catalog)
  FILE_TOO_LARGE: {
    code: "FILE_TOO_LARGE",
    statusCode: 413,
    responseCode: 7011,
    defaultMessage: "File too large",
  },
  FILE_TYPE_NOT_ALLOWED: {
    code: "FILE_TYPE_NOT_ALLOWED",
    statusCode: 415,
    responseCode: 7012,
    defaultMessage: "File type not allowed",
  },

  // Database / Storage (8xxx)
  DB_CONNECTION_ERROR: {
    code: "DB_CONNECTION_ERROR",
    statusCode: 500,
    responseCode: 8001,
    defaultMessage: "Database connection error",
  },
  CONSTRAINT_VIOLATION: {
    code: "CONSTRAINT_VIOLATION",
    statusCode: 400,
    responseCode: 8002,
    defaultMessage: "Constraint violation",
  },
  FOREIGN_KEY_CONSTRAINT: {
    code: "FOREIGN_KEY_CONSTRAINT",
    statusCode: 409,
    responseCode: 8003,
    defaultMessage: "Foreign key constraint",
  },
  NOT_NULL_VIOLATION: {
    code: "NOT_NULL_VIOLATION",
    statusCode: 400,
    responseCode: 8004,
    defaultMessage: "Not null violation",
  },
  UNIQUE_VIOLATION: {
    code: "UNIQUE_VIOLATION",
    statusCode: 409,
    responseCode: 8005,
    defaultMessage: "Duplicate entry violates unique constraint",
  },
  DATA_TRUNCATION: {
    code: "DATA_TRUNCATION",
    statusCode: 400,
    responseCode: 8006,
    defaultMessage: "Data too long for field",
  },
  DATABASE_PERMISSION_DENIED: {
    code: "DATABASE_PERMISSION_DENIED",
    statusCode: 403,
    responseCode: 8007,
    defaultMessage: "Database operation not permitted",
  },
  DATA_INTEGRITY_ERROR: {
    code: "DATA_INTEGRITY_ERROR",
    statusCode: 400,
    responseCode: 8008,
    defaultMessage: "Data integrity violation",
  },
  UNKNOWN_DATABASE_ERROR: {
    code: "UNKNOWN_DATABASE_ERROR",
    statusCode: 500,
    responseCode: 8009,
    defaultMessage: "Unexpected database error",
  },

  // Internal / Unknown (9xxx)
  INTERNAL_ERROR: {
    code: "INTERNAL_ERROR",
    statusCode: 500,
    responseCode: 9001,
    defaultMessage: "Internal server error",
  },
  UNKNOWN_ERROR: {
    code: "UNKNOWN_ERROR",
    statusCode: 500,
    responseCode: 9002,
    defaultMessage: "Unknown error",
  },
};

// ------- PostgreSQL SQLSTATE → catalog constants (string keys) -------
const PG_ERROR_SQLSTATE_MAP = {
  23505: API_ERROR_RESPONSES.UNIQUE_VIOLATION, // unique_violation
  23503: API_ERROR_RESPONSES.FOREIGN_KEY_CONSTRAINT, // foreign_key_violation
  23502: API_ERROR_RESPONSES.NOT_NULL_VIOLATION, // not_null_violation
  23514: API_ERROR_RESPONSES.CONSTRAINT_VIOLATION, // check_violation
  22001: API_ERROR_RESPONSES.DATA_TRUNCATION, // string_data_right_truncation
  "22P02": API_ERROR_RESPONSES.INVALID_INPUT, // invalid_text_representation
  42501: API_ERROR_RESPONSES.DATABASE_PERMISSION_DENIED, // insufficient_privilege
  40001: API_ERROR_RESPONSES.TRANSACTION_CONFLICT, // serialization_failure
  "40P01": API_ERROR_RESPONSES.DEADLOCK_DETECTED, // deadlock_detected
  "08006": API_ERROR_RESPONSES.DB_CONNECTION_ERROR, // connection_failure
  "08003": API_ERROR_RESPONSES.DB_CONNECTION_ERROR, // connection_does_not_exist
  "08000": API_ERROR_RESPONSES.DB_CONNECTION_ERROR, // connection_exception
};

// ------- Class fallbacks (regex → catalog constant) -------
const PG_CLASS_FALLBACKS = [
  [/^23...$/, API_ERROR_RESPONSES.CONSTRAINT_VIOLATION], // integrity constraint
  [/^28...$/, API_ERROR_RESPONSES.DATABASE_PERMISSION_DENIED], // invalid auth spec
  [/^40...$/, API_ERROR_RESPONSES.TRANSACTION_CONFLICT], // tx rollback class
  [/^53...$/, API_ERROR_RESPONSES.SERVICE_UNAVAILABLE], // insufficient resources
  [/^58...$/, API_ERROR_RESPONSES.DEPENDENCY_FAILED], // system error
];

// ------- Safe DB details helper -------
function safeDetails(err) {
  const d = {};
  if (err?.schema) d.schema = err.schema;
  if (err?.table) d.table = err.table;
  if (err?.column) d.column = err.column;
  if (err?.constraint) d.constraint = err.constraint;
  if (err?.hint) d.hint = err.hint;
  if (err?.routine) d.routine = err.routine;
  if (!IS_PROD && err?.message) d.databaseMessage = err.message; // hide raw DB message in prod
  return Object.keys(d).length ? d : undefined;
}

module.exports = {
  IS_PROD,
  SQLSTATE_RE,
  API_SUCESS_RESPONSES,
  API_ERROR_RESPONSES,
  PG_ERROR_SQLSTATE_MAP,
  PG_CLASS_FALLBACKS,
  safeDetails,
};
