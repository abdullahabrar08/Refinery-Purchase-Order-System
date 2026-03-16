const fs = require("fs");
const path = require("path");
const { pool } = require("../data");
const logger = require("../utils/logger");
const { run: seedLookup } = require("./seed-lookup");

const SCHEMA_PATH = path.join(__dirname, "procurement-schema.sql");

async function bootstrap() {
  const sql = fs.readFileSync(SCHEMA_PATH, "utf8");
  await pool.query(sql);
  await seedLookup();
  logger.info("[PROCUREMENT_SERVICE] DB schema and lookup data applied.");
}

module.exports = { bootstrap };
