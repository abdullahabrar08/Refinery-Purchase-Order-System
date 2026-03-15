/**
 * User/auth queries – plain SQL for use with pool.query(text, values).
 */

const getUserByEmail = (email) => ({
  text: `SELECT u.id, u.username, u.email, u.password_hash, u.role_id, r.name AS role_name
          FROM users u
          JOIN roles r ON r.id = u.role_id
          WHERE u.email = $1`,
  values: [email],
});

module.exports = {
  getUserByEmail,
};
