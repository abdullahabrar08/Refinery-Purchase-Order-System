/**
 * Bootstrap Auth DB: run users schema and seed (roles + default admin/buyer users).
 * Idempotent: safe to run on every startup.
 */
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");
const { pool } = require("../data");

const SCHEMA_PATH = path.join(__dirname, "users-schema.sql");

const runSchema = async () => {
  const sql = fs.readFileSync(SCHEMA_PATH, "utf8");
  await pool.query(sql);
};

const seedRoles = async () => {
  const { rows } = await pool.query("SELECT COUNT(*)::int AS count FROM roles");
  if (rows[0].count > 0) return;

  await pool.query(`
    INSERT INTO roles (id, name) VALUES
    (1, 'Admin'),
    (2, 'Buyer')
  `);
  await pool.query(
    "SELECT setval('roles_id_seq', (SELECT MAX(id) FROM roles))",
  );
};

const seedUsers = async () => {
  const { rows } = await pool.query("SELECT COUNT(*)::int AS count FROM users");
  if (rows[0].count > 0) return;

  const passwordHash = await bcrypt.hash("Password123!", 10);
  await pool.query(
    `INSERT INTO users (username, email, password_hash, role_id) VALUES
     ($1, $2, $3, 1),
     ($4, $5, $6, 2)`,
    [
      "admin",
      "admin@gmail.com",
      passwordHash,
      "buyer",
      "buyer@gmail.com",
      passwordHash,
    ],
  );
};

const bootstrap = async () => {
  await runSchema();
  await seedRoles();
  await seedUsers();
};

module.exports = { bootstrap };
