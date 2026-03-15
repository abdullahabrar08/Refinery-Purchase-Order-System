const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const routes = require("./routes");
const rateLimiter = require("./middlewares/rate.limit");
const { setupSwaggerDocs } = require("../docs/swagger");
const { api } = require("../config");
const { v4: uuidv4 } = require("uuid");
const logger = require("../utils/logger");
const { notFound, errorMiddleware } = require("./middlewares/error.middleware");

const configureAPI = (app) => {
  app.use(
    morgan(
      `[${api.serviceName.toUpperCase()}] :method :url :status [:date[clf]] :response-time ms`,
      { stream: logger.stream },
    ),
  );
  if (api.environment === "production") app.use(helmet());
  app.use(rateLimiter);
  app.use(cors());
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.disable("x-powered-by");
  app.use((req, res, next) => {
    req.traceId = uuidv4();
    next();
  });

  setupSwaggerDocs(app);

  app.get("/users/healthz", (req, res) => {
    res.status(200).json({
      status: "healthy",
      serviceName: api.serviceName,
      version: api.version,
      environment: api.environment,
    });
  });

  app.use("/users", routes);

  app.use(notFound);
  app.use(errorMiddleware);

  logger.info("[AUTH_SERVICE] REST API server configured successfully");
};

module.exports = configureAPI;
