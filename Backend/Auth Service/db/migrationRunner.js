import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { pool } from "./config/database.js";
import logger from "../../utils/logger.js";

// ⬇️ Handle __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIGRATIONS_DIR = path.join(__dirname, "migrations");

const ensureMigrationsTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
};

const getAppliedMigrations = async () => {
  const { rows } = await pool.query("SELECT name FROM migrations");
  return rows.map((row) => row.name);
};

const applyMigration = async (migrationName, migrationSQL) => {
  try {
    await pool.query("BEGIN");
    await pool.query(migrationSQL);
    await pool.query("INSERT INTO migrations (name) VALUES ($1)", [
      migrationName,
    ]);
    await pool.query("COMMIT");
    logger.info(`Migration applied: ${migrationName}`);
  } catch (error) {
    await pool.query("ROLLBACK");
    logger.error(`Failed to apply migration ${migrationName}:`, error);
    throw error;
  }
};

const runMigrations = async () => {
  try {
    await ensureMigrationsTable();
    const appliedMigrations = await getAppliedMigrations();
    const migrationFiles = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((file) => file.endsWith(".sql"));

    for (const file of migrationFiles) {
      if (!appliedMigrations.includes(file)) {
        const migrationSQL = fs.readFileSync(
          path.join(MIGRATIONS_DIR, file),
          "utf8"
        );
        await applyMigration(file, migrationSQL);
      } else {
        logger.info(`Skipping already applied migration: ${file}`);
      }
    }

    logger.info("All migrations are up-to-date.");
  } catch (error) {
    logger.error("Migration process failed:", error);
    process.exit(1);
  }
};

// ✅ Export for ESM
export default runMigrations;
