const jwt = require("jsonwebtoken");
const path = require("path");
const { newEnforcer } = require("casbin");
const { secrets } = require("../../config");
const { ROLE_NAMES } = require("../../utils/constants");
const { AppError } = require("../../errors/errors");
const { API_ERROR_RESPONSES } = require("../../errors/error.codes");

const modelPath = path.resolve(__dirname, "../../utils/rbac/model.conf");
const policyPath = path.resolve(__dirname, "../../utils/rbac/policy.csv");

/**
 * Authenticate: verify Bearer JWT and attach decoded payload to req.user.
 */
const authenticate = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (!token) {
    return next(new AppError(API_ERROR_RESPONSES.UNAUTHORIZED, "No token provided."));
  }
  try {
    const decoded = jwt.verify(token, secrets.jwtSecret);
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      roleId: decoded.roleId,
    };
    next();
  } catch (err) {
    if (err instanceof AppError) return next(err);
    if (err.name === "TokenExpiredError") {
      return next(new AppError(API_ERROR_RESPONSES.TOKEN_EXPIRED, "Token expired"));
    }
    if (err.name === "JsonWebTokenError") {
      return next(new AppError(API_ERROR_RESPONSES.TOKEN_INVALID, "Invalid token"));
    }
    next(err);
  }
};

/**
 * Authorize: use Casbin enforcer with role, path, method (same pattern as Auth service).
 */
const authorize = async (req, res, next) => {
  try {
    const enforcer = await newEnforcer(modelPath, policyPath);
    const userRole = ROLE_NAMES[req.user.roleId] || req.user.role || null;
    const obj = req.originalUrl.split("?")[0];
    const act = req.method;

    const allowed = await enforcer.enforce(userRole, obj, act);

    if (!allowed) {
      return next(new AppError(API_ERROR_RESPONSES.FORBIDDEN, "Access denied."));
    }
    next();
  } catch (err) {
    if (err instanceof AppError) return next(err);
    next(err);
  }
};

module.exports = { authenticate, authorize };
