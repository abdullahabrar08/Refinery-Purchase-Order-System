require("dotenv").config({
  path: `./.env.${process.env.NODE_ENV || "development"}`,
});

const joi = require("joi");

const envSchema = joi
  .object({
    NODE_ENV: joi.string().valid("development", "production", "test", "staging").default("development"),
    PORT: joi.number().default(4002),
    MONGODB_URI: joi.string().required(),
    JWT_SECRET: joi.string().required(),
  })
  .unknown()
  .required();

const { error, value: envVars } = envSchema.validate(process.env);
if (error) {
  console.error(`Environment variable validation error: ${error.message}`);
  process.exit(1);
}

const config = {
  api: {
    version: process.env.npm_package_version || "1.0.0",
    serviceName: process.env.npm_package_name || "catalog-service",
    port: envVars.PORT,
    environment: envVars.NODE_ENV,
  },
  mongodb: {
    uri: envVars.MONGODB_URI,
  },
  secrets: {
    jwtSecret: envVars.JWT_SECRET,
  },
  auth: {
    allowedRoles: ["Admin", "Buyer"],
  },
};

module.exports = config;
