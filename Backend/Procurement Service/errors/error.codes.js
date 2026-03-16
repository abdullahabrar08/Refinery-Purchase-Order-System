const API_SUCCESS_RESPONSES = {
  OK: { responseCode: 1000, defaultMessage: "Request processed successfully" },
  ORDER_CREATED: { responseCode: 2001, defaultMessage: "Order created successfully" },
  DRAFT_DELETED: { responseCode: 2003, defaultMessage: "Draft deleted successfully" },
  ORDER_ITEM_ADDED: { responseCode: 2004, defaultMessage: "Order item added successfully" },
  ORDER_ITEM_UPDATED: { responseCode: 2005, defaultMessage: "Order item updated successfully" },
  ORDER_ITEM_REMOVED: { responseCode: 2006, defaultMessage: "Order item removed successfully" },
  PO_SUBMITTED: { responseCode: 2007, defaultMessage: "Purchase order submitted successfully" },
  STATUS_UPDATED: { responseCode: 2008, defaultMessage: "Status updated successfully" },
  LIST_ORDERS: { responseCode: 2009, defaultMessage: "Orders retrieved successfully" },
  GET_ORDER: { responseCode: 2010, defaultMessage: "Order retrieved successfully" },
};

const API_ERROR_RESPONSES = {
  VALIDATION_ERROR: { code: "VALIDATION_ERROR", statusCode: 422, responseCode: 3001, defaultMessage: "Validation failed" },
  INVALID_INPUT: { code: "INVALID_INPUT", statusCode: 400, responseCode: 3002, defaultMessage: "Invalid input" },
  UNAUTHORIZED: { code: "UNAUTHORIZED", statusCode: 401, responseCode: 4001, defaultMessage: "Authentication required" },
  FORBIDDEN: { code: "FORBIDDEN", statusCode: 403, responseCode: 4002, defaultMessage: "Access denied" },
  TOKEN_EXPIRED: { code: "TOKEN_EXPIRED", statusCode: 401, responseCode: 4003, defaultMessage: "Token expired" },
  TOKEN_INVALID: { code: "TOKEN_INVALID", statusCode: 401, responseCode: 4004, defaultMessage: "Invalid token" },
  CONFLICT: { code: "CONFLICT", statusCode: 409, responseCode: 6001, defaultMessage: "Conflict" },
  SUPPLIER_MISMATCH: { code: "SUPPLIER_MISMATCH", statusCode: 409, responseCode: 6002, defaultMessage: "All items must be from the same supplier" },
  RESOURCE_NOT_FOUND: { code: "RESOURCE_NOT_FOUND", statusCode: 404, responseCode: 5002, defaultMessage: "Resource not found" },
  INTERNAL_ERROR: { code: "INTERNAL_ERROR", statusCode: 500, responseCode: 9001, defaultMessage: "Internal server error" },
  UNKNOWN_ERROR: { code: "UNKNOWN_ERROR", statusCode: 500, responseCode: 9002, defaultMessage: "Unknown error" },
};

module.exports = { API_SUCCESS_RESPONSES, API_ERROR_RESPONSES };
