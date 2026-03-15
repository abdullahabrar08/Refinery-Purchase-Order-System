/**
 * Auth helpers: JWT generation and password comparison.
 */
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { secrets } = require("../config");

/**
 * Generate a JWT for the given payload.
 * @param {object} payload - Claims (e.g. userId, email, role, roleId)
 * @param {string} [expiresIn] - Optional expiry (default from env JWT_EXPIRE or "24h")
 * @returns {string} Signed token
 */
const generateToken = (payload, expiresIn = process.env.JWT_EXPIRE || "24h") => {
  return jwt.sign(payload, secrets.jwtSecret, { expiresIn });
};

/**
 * Compare plain password with hashed password.
 * @param {string} plainPassword - User input
 * @param {string} hashedPassword - Stored hash
 * @returns {Promise<boolean>}
 */
const comparePassword = (plainPassword, hashedPassword) => {
  return bcrypt.compare(plainPassword, hashedPassword);
};

module.exports = {
  generateToken,
  comparePassword,
};
