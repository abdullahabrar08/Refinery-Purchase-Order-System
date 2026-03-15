const { Pool } = require("pg");
const { db, api } = require("../config");
const logger = require("../utils/logger");

const pool = new Pool({
  user: db.user,
  host: db.host,
  database: db.database,
  password: db.password,
  port: db.port,
  ssl: api.environment === "production" ? { rejectUnauthorized: false } : false,
});

/**
 * Runs a callback inside a PostgreSQL transaction.
 *
 * @param {Function} callback - Async function to run in transaction. Receives a `client`.
 * @param {String} label - Optional label for logging/debugging.
 * @returns {Promise<any>} The result of the callback function.
 */
const runInTransaction = async (callback, label = "DB Transaction") => {
  const client = await pool.connect();

  try {
    logger.debug(`[${label}] BEGIN`);
    await client.query("BEGIN");

    const result = await callback(client);

    await client.query("COMMIT");
    logger.debug(`[${label}] COMMIT`);
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    logger.error(`[${label}] ROLLBACK due to error:`, error);
    throw error;
  } finally {
    client.release();
  }
};


pool.on("error", (err) => {
  logger.error("[POSTGRES] Unexpected error on idle client", err);
  process.exit(-1);
});

const closeDatabaseConnection = async () => {
  try {
    await pool.end();
    logger.info("[POSTGRES] Database connection pool closed.");
  } catch (error) {
    logger.error("[POSTGRES] Error during database shutdown:", error);
  }
};

module.exports = { pool, closeDatabaseConnection, runInTransaction };
