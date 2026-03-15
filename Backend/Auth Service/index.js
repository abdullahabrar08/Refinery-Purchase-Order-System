const app = require("./app");
const { closeDatabaseConnection, pool } = require("./data");
const logger = require("./utils/logger");
const { api, db } = require("./config/index");
const { bootstrap } = require("./db/bootstrap");

const gracefulShutdown = async (server) => {
  logger.info("[AUTH_SERVICE] Initiating graceful shutdown...");
  await closeDatabaseConnection();
  server.close(() => {
    logger.info("[AUTH_SERVICE] HTTP server closed.");
    process.exit(0);
  });
};

const startServer = async () => {
  try {
    await pool.query("SELECT 1");
    logger.info(
      `[AUTH_SERVICE] ✅ Connected to PostgreSQL database ${db.database} on host ${db.host}`,
    );
    await bootstrap();
    logger.info("[AUTH_SERVICE] DB schema and seed applied (roles + users).");
    const server = app.listen(api.port, () => {
      logger.info(
        `[AUTH_SERVICE] 🚀 Server running on port ${api.port} in ${api.environment} mode`,
      );
    });

    process.on("SIGINT", () => gracefulShutdown(server));
    process.on("SIGTERM", () => gracefulShutdown(server));

    process.on("uncaughtException", (error) => {
      logger.error("[AUTH_SERVICE] Uncaught Exception:", error);
      gracefulShutdown(server);
    });
    process.on("unhandledRejection", (reason, promise) => {
      logger.error("[AUTH_SERVICE] Unhandled Rejection:", reason);
      gracefulShutdown(server);
    });

    return server;
  } catch (error) {
    logger.error("[AUTH_SERVICE] Failed to start server:", error);
    process.exit(1);
  }
};

// Only start the server if this file is run directly
if (require.main === module) {
  startServer();
} else {
  module.exports = startServer;
}
