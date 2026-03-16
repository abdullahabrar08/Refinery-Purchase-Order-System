const app = require("./app");
const { closeConnection } = require("./data");
const logger = require("./utils/logger");
const { api, db } = require("./config");
const { bootstrap } = require("./db/bootstrap");

const gracefulShutdown = async (server) => {
  logger.info("[PROCUREMENT_SERVICE] Shutting down...");
  await closeConnection();
  server.close(() => {
    logger.info("[PROCUREMENT_SERVICE] Server closed.");
    process.exit(0);
  });
};

const startServer = async () => {
  try {
    const { pool } = require("./data");
    await pool.query("SELECT 1");
    logger.info(`[PROCUREMENT_SERVICE] PostgreSQL connected (${db.database}).`);
    await bootstrap();
    const server = app.listen(api.port, () => {
      logger.info(`[PROCUREMENT_SERVICE] Server running on port ${api.port} (${api.environment}).`);
    });
    process.on("SIGINT", () => gracefulShutdown(server));
    process.on("SIGTERM", () => gracefulShutdown(server));
    return server;
  } catch (err) {
    logger.error("[PROCUREMENT_SERVICE] Failed to start:", err);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
} else {
  module.exports = startServer;
}
