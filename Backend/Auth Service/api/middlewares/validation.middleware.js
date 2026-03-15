const Joi = require("joi");
const { API_ERROR_RESPONSES } = require("../../errors/error.codes");
const { AppError } = require("../../errors/errors");

/**
 * validationMiddleware
 * @param {Joi.Schema} schema - Joi schema to validate against
 * @param {"body"|"query"|"params"|"headers"} [type="body"] - Request segment to validate
 * @param {Joi.ValidationOptions} [options] - Optional Joi validate options (merged with sane defaults)
 * @returns {import('express').RequestHandler}
 */
function validationMiddleware(schema, type = "body", options = {}) {
  const VALID_SEGMENTS = ["body", "query", "params", "headers"];
  if (!VALID_SEGMENTS.includes(type)) {
    throw new AppError(
      API_ERROR_RESPONSES.INVALID_INPUT,
      `Invalid validation type "${type}". Must be one of: ${VALID_SEGMENTS.join(
        ", "
      )}`,
      { type, allowed: VALID_SEGMENTS }
    );
  }

  const defaultOptions = {
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: false,
  };

  const validateOpts = { ...defaultOptions, ...options };

  return (req, res, next) => {
    const { error, value } = schema.validate(req[type], validateOpts);

    if (error) {
      // Normalize Joi details for your error pipeline
      const details = error.details.map((d) => ({
        field: d.context.key || d.path.join("."),
        message: d.message.replace(/['"]/g, ""),
      }));

      return next(
        new AppError(
          API_ERROR_RESPONSES.VALIDATION_ERROR,
          "Validation Error",
          details
        )
      );
    }

    // assign validated (and possibly coerced/stripped) value back
    req[type] = value;
    return next();
  };
}

module.exports = validationMiddleware;
