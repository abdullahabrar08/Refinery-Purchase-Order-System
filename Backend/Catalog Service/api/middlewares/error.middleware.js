const { normalizeError } = require("../../errors/errors");
const { API_ERROR_RESPONSES } = require("../../errors/error.codes");
const { v4: uuidv4 } = require("uuid");
const logger = require("../../utils/logger");
const { api } = require("../../config");

const { AppError } = require("../../errors/errors");

const notFound = (req, res, next) => {
  next(
    new AppError(
      API_ERROR_RESPONSES.RESOURCE_NOT_FOUND,
      `Resource not found: ${req.originalUrl}`,
      { path: req.originalUrl }
    )
  );
};

const errorMiddleware = (err, req, res, next) => {
  const e = normalizeError(err);
  const httpStatus = e.statusCode || 500;
  const traceId = req.traceId || req.headers["x-request-id"] || uuidv4();
  const response = {
    code: e.code || "UNKNOWN_ERROR",
    responseCode: e.responseCode || 9002,
    traceId,
    timestamp: new Date().toISOString(),
    message: e.message || "Internal server error",
    details: e.details,
  };
  if (api.environment === "development" && err?.stack) response.stack = err.stack;
  logger.error({ message: err?.message, code: response.code, httpStatus, traceId, path: req.originalUrl });
  res.status(httpStatus).json(response);
};

module.exports = { notFound, errorMiddleware };
