const { ValidationError } = require("joi");
const {
  API_ERROR_RESPONSES,
  SQLSTATE_RE,
  PG_ERROR_SQLSTATE_MAP,
  PG_CLASS_FALLBACKS,
  safeDetails,
} = require("./error.codes");

const fromCatalog = (def, message, details) => ({
  statusCode: def.statusCode,
  responseCode: def.responseCode,
  code: def.code,
  message: message || def.defaultMessage,
  details: details || undefined,
});

/**
 * @param {object} errorDef - One of API_ERROR_RESPONSES entries (e.g., API_ERROR_RESPONSES.NOT_FOUND)
 * @param {string} [message] - Optional custom message
 * @param {object|null} [details] - Optional extra context
 */
class AppError extends Error {
  constructor(errorDef, message, details = null) {
    super(message || errorDef.defaultMessage);

    this.code = errorDef.code;
    this.httpStatus = errorDef.statusCode;
    this.responseCode = errorDef.responseCode;
    this.details = details || undefined;
    this.statusCode = errorDef.statusCode;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

function normalizeError(err) {
  if (err instanceof AppError) {
    return {
      statusCode: err.statusCode,
      responseCode: err.responseCode,
      code: err.code,
      message: err.message,
      details: err.details,
    };
  }

  if (err instanceof ValidationError) {
    return fromCatalog(
      API_ERROR_RESPONSES.VALIDATION_ERROR,
      "Validation Error",
      err.details
    );
  }

  if (typeof err?.code === "string" && SQLSTATE_RE.test(err.code)) {
    const def =
      PG_ERROR_SQLSTATE_MAP[err.code] ||
      PG_CLASS_FALLBACKS.find(([re]) => re.test(err.code))?.[1] ||
      API_ERROR_RESPONSES.UNKNOWN_DATABASE_ERROR;

    return {
      statusCode: def.statusCode,
      responseCode: def.responseCode,
      code: def.code,
      message: def.defaultMessage,
      details: safeDetails(err),
    };
  }

  if (err && err.code && err.statusCode && err.responseCode) {
    return {
      statusCode: Number(err.statusCode),
      responseCode: Number(err.responseCode),
      code: String(err.code),
      message: err.message || API_ERROR_RESPONSES.INTERNAL_ERROR.defaultMessage,
      details: err.details,
    };
  }

  return fromCatalog(API_ERROR_RESPONSES.INTERNAL_ERROR, err?.message);
}

module.exports = {
  AppError,
  normalizeError,
};
