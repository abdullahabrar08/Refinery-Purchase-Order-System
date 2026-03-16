const Joi = require("joi");
const { AppError } = require("../../errors/errors");
const { API_ERROR_RESPONSES } = require("../../errors/error.codes");

function validationMiddleware(schema, type = "body") {
  const valid = ["body", "query", "params", "headers"];
  if (!valid.includes(type)) {
    throw new AppError(API_ERROR_RESPONSES.INVALID_INPUT, `Invalid validation type: ${type}`);
  }
  return (req, res, next) => {
    const { error, value } = schema.validate(req[type], {
      abortEarly: false,
      allowUnknown: true,
    });
    if (error) {
      const details = error.details.map((d) => ({
        field: d.path.join("."),
        message: d.message.replace(/['"]/g, ""),
      }));
      return next(new AppError(API_ERROR_RESPONSES.VALIDATION_ERROR, "Validation Error", details));
    }
    req[type] = value;
    next();
  };
}

module.exports = validationMiddleware;
