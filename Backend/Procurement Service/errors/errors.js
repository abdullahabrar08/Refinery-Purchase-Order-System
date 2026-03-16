const { ValidationError } = require("joi");
const { API_ERROR_RESPONSES } = require("./error.codes");

const fromCatalog = (def, message, details) => ({
  statusCode: def.statusCode,
  responseCode: def.responseCode,
  code: def.code,
  message: message || def.defaultMessage,
  details: details || undefined,
});

class AppError extends Error {
  constructor(errorDef, message, details = null) {
    super(message || errorDef.defaultMessage);
    this.code = errorDef.code;
    this.statusCode = errorDef.statusCode;
    this.responseCode = errorDef.responseCode;
    this.details = details || undefined;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

function normalizeError(err) {
  if (err instanceof AppError) {
    return { statusCode: err.statusCode, responseCode: err.responseCode, code: err.code, message: err.message, details: err.details };
  }
  if (err instanceof ValidationError) {
    return fromCatalog(API_ERROR_RESPONSES.VALIDATION_ERROR, "Validation Error", err.details);
  }
  return fromCatalog(API_ERROR_RESPONSES.INTERNAL_ERROR, err?.message);
}

module.exports = { AppError, normalizeError };
