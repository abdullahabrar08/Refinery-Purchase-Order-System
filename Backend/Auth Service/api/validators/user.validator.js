const joi = require("joi");

const createLoginRequest = joi
  .object({
    email: joi.string().required(),
    password: joi.string().required(),
  })
  .required();

module.exports = {
  createLoginRequest,
};
