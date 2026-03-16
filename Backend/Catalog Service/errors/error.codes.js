const API_SUCCESS_RESPONSES = {
  OK: {
    responseCode: 2000,
    defaultMessage: "Request processed successfully",
  },
  LIST_ITEMS: {
    responseCode: 2000,
    defaultMessage: "Catalog items retrieved successfully",
  },
  GET_ITEM: {
    responseCode: 2000,
    defaultMessage: "Catalog item retrieved successfully",
  },
};

const API_ERROR_RESPONSES = {
  INVALID_INPUT: {
    code: "INVALID_INPUT",
    statusCode: 400,
    responseCode: 3002,
    defaultMessage: "Invalid input",
  },
  VALIDATION_ERROR: {
    code: "VALIDATION_ERROR",
    statusCode: 422,
    responseCode: 3001,
    defaultMessage: "Validation failed",
  },
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
  RESOURCE_NOT_FOUND: {
    code: "RESOURCE_NOT_FOUND",
    statusCode: 404,
    responseCode: 5002,
    defaultMessage: "Resource not found",
  },
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

module.exports = { API_SUCCESS_RESPONSES, API_ERROR_RESPONSES };
