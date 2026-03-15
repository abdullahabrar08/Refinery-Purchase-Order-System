const { pool } = require("../data");
const { getUserByEmail } = require("../data/queries/user.queries");
const { toLoginResponseDTO } = require("../data/dto/user.dto");
const { generateToken, comparePassword } = require("../utils/helpers");
const { AppError } = require("../errors/errors");
const { API_ERROR_RESPONSES } = require("../errors/error.codes");

/**
 * Login: find user by email, verify password, return JWT and user info.
 * Uses data/queries for DB, utils/helpers for JWT and password, data/dto for response.
 */
const login = async (req) => {
  const { email, password } = req.body;

  const query = getUserByEmail(email);
  const { rows } = await pool.query(query.text, query.values);

  if (rows.length === 0) {
    throw new AppError(API_ERROR_RESPONSES.UNAUTHORIZED, "Invalid email or password");
  }

  const user = rows[0];
  const valid = await comparePassword(password, user.password_hash);
  if (!valid) {
    throw new AppError(API_ERROR_RESPONSES.UNAUTHORIZED, "Invalid email or password");
  }

  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role_name,
    roleId: user.role_id,
  };
  const token = generateToken(payload);

  return toLoginResponseDTO(token, user);
};

module.exports = { UserService: { login } };
