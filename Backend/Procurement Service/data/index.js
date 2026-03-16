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

const runInTransaction = async (callback, label = "DB Transaction") => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    logger.error(`[${label}] Rollback:`, err.message);
    throw err;
  } finally {
    client.release();
  }
};

const closeConnection = async () => {
  await pool.end();
  logger.info("[PROCUREMENT_SERVICE] DB connection closed.");
};

pool.on("error", (err) => {
  logger.error("[PROCUREMENT_SERVICE] Unexpected pool error", err);
});

module.exports = { pool, runInTransaction, closeConnection };
