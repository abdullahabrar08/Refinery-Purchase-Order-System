const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { v4: uuidv4 } = require("uuid");
const routes = require("./routes");
const { notFound, errorMiddleware } = require("./middlewares/error.middleware");
const { api } = require("../config");
const logger = require("../utils/logger");
const { setupSwaggerDocs } = require("../docs/swagger");

const configureAPI = (app) => {
  app.use(morgan("combined", { stream: logger.stream }));
  if (api.environment === "production") app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.disable("x-powered-by");
  app.use((req, res, next) => {
    req.traceId = uuidv4();
    next();
  });

  setupSwaggerDocs(app);

  app.get("/procurement/healthz", (req, res) => {
    res.status(200).json({
      status: "healthy",
      serviceName: api.serviceName,
      version: api.version,
      environment: api.environment,
    });
  });

  app.use("/procurement", routes);

  app.use(notFound);
  app.use(errorMiddleware);

  logger.info("[PROCUREMENT_SERVICE] REST API configured.");
};

module.exports = configureAPI;
