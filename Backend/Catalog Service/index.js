const app = require("./app");
const { closeConnection } = require("./data");
const logger = require("./utils/logger");
const { api, mongodb } = require("./config");

const gracefulShutdown = async (server) => {
  logger.info("[CATALOG_SERVICE] Shutting down...");
  await closeConnection();
  server.close(() => {
    logger.info("[CATALOG_SERVICE] Server closed.");
    process.exit(0);
  });
};

const startServer = async () => {
  try {
    const { connect } = require("./data");
    await connect();
    const { seedIfEmpty } = require("./db/bootstrap");
    await seedIfEmpty(logger);
    const server = app.listen(api.port, () => {
      logger.info(`[CATALOG_SERVICE] Server running on port ${api.port} (${api.environment}).`);
    });
    process.on("SIGINT", () => gracefulShutdown(server));
    process.on("SIGTERM", () => gracefulShutdown(server));
    return server;
  } catch (err) {
    logger.error("[CATALOG_SERVICE] Failed to start:", err);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
} else {
  module.exports = startServer;
}
