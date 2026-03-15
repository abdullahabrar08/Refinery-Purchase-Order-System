const { normalizeError, AppError } = require("../../errors/errors");
const { v4: uuidv4 } = require("uuid");
const { API_ERROR_RESPONSES } = require("../../errors/error.codes");
const logger = require("../../utils/logger");
const { api } = require("../../config");

const notFound = (req, res, next) => {
  next(
    new AppError(
      API_ERROR_RESPONSES.RESOURCE_NOT_FOUND,
      `Resource not found: ${req.originalUrl}`,
      { path: req.originalUrl },
    ),
  );
};

const errorMiddleware = (err, req, res, next) => {
  const e = normalizeError(err);

  const httpStatus =
    e.statusCode || API_ERROR_RESPONSES.INTERNAL_ERROR.statusCode;
  const responseCode =
    e.responseCode || API_ERROR_RESPONSES.INTERNAL_ERROR.responseCode;

  const traceId =
    req.traceId || req.id || req.headers["x-request-id"] || uuidv4();

  const response = {
    code: e.code || API_ERROR_RESPONSES.UNKNOWN_ERROR.code,
    responseCode: responseCode,
    traceId,
    timestamp: new Date().toISOString(),
    message: e.message || API_ERROR_RESPONSES.INTERNAL_ERROR.defaultMessage,
    details: e.details || undefined,
  };

  // add stack only in development
  if (api.environment === "development" && err?.stack) {
    response.stack = err.stack;
  }

  logger.error({
    message: err?.message || response.message,
    code: response.code,
    httpStatus,
    responseCode,
    traceId,
    path: req.originalUrl,
    method: req.method,
    timestamp: response.timestamp,
    stack: api.environment === "production" ? undefined : err?.stack,
  });

  res.status(httpStatus).json(response);
};

module.exports = {
  errorMiddleware,
  notFound,
};
