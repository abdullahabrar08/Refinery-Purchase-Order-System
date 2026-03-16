require("dotenv").config({
  path: `./.env.${process.env.NODE_ENV || "development"}`,
});

const joi = require("joi");

const envSchema = joi
  .object({
    NODE_ENV: joi.string().valid("development", "production", "test", "staging").default("development"),
    PORT: joi.number().default(4003),
    DB_HOST: joi.string().required(),
    DB_USER: joi.string().required(),
    DB_PASSWORD: joi.string().required(),
    DB_PORT: joi.number().default(5432),
    DATABASE: joi.string().required(),
    JWT_SECRET: joi.string().required(),
    CATALOG_SERVICE_URL: joi.string().uri().required(),
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
    serviceName: process.env.npm_package_name || "procurement-service",
    port: envVars.PORT,
    environment: envVars.NODE_ENV,
  },
  db: {
    host: envVars.DB_HOST,
    user: envVars.DB_USER,
    password: envVars.DB_PASSWORD,
    port: envVars.DB_PORT,
    database: envVars.DATABASE,
  },
  secrets: {
    jwtSecret: envVars.JWT_SECRET,
  },
  catalog: {
    baseUrl: envVars.CATALOG_SERVICE_URL,
  },
};

module.exports = config;
