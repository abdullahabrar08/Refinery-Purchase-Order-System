const { AppError } = require("../../errors/errors");
const { API_ERROR_RESPONSES } = require("../../errors/error.codes");
const { HTTP_REQUEST_ATTRIBUTES } = require("../../utils/constants");

const VALID_REQUEST_ATTRIBUTES = Object.values(HTTP_REQUEST_ATTRIBUTES);

function validationMiddleware(schema, requestAttribute = HTTP_REQUEST_ATTRIBUTES.BODY) {
  if (!VALID_REQUEST_ATTRIBUTES.includes(requestAttribute)) {
    throw new AppError(
      API_ERROR_RESPONSES.INVALID_INPUT,
      `Invalid validation type: ${requestAttribute}`
    );
  }

  return (req, res, next) => {
    const { error, value } = schema.validate(req[requestAttribute], {
      abortEarly: false,
      allowUnknown: true,
    });

    if (error) {
      const details = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message.replace(/['"]/g, ""),
      }));

      return next(new AppError(API_ERROR_RESPONSES.VALIDATION_ERROR, "Validation Error", details));
    }

    req[requestAttribute] = value;
    next();
  };
}

module.exports = validationMiddleware;
