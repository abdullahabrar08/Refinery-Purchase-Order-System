const jwt = require("jsonwebtoken");
const path = require("path");
const { newEnforcer } = require("casbin");
const { secrets } = require("../../config");
const { ROLE_NAMES } = require("../../utils/constants");
const { AppError } = require("../../errors/errors");
const { API_ERROR_RESPONSES } = require("../../errors/error.codes");

const modelPath = path.resolve(__dirname, "../../utils/rbac/model.conf");
const policyPath = path.resolve(__dirname, "../../utils/rbac/policy.csv");
let enforcerPromise;

function getBearerToken(req) {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader?.startsWith("Bearer ")) {
    return null;
  }

  return authorizationHeader.split(" ")[1];
}

function getEnforcer() {
  if (!enforcerPromise) {
    enforcerPromise = newEnforcer(modelPath, policyPath);
  }

  return enforcerPromise;
}

const authenticate = async (req, res, next) => {
  const token = getBearerToken(req);

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
    if (err instanceof AppError) {
      return next(err);
    }

    if (err.name === "TokenExpiredError") {
      return next(new AppError(API_ERROR_RESPONSES.TOKEN_EXPIRED, "Token expired"));
    }

    if (err.name === "JsonWebTokenError") {
      return next(new AppError(API_ERROR_RESPONSES.TOKEN_INVALID, "Invalid token"));
    }

    next(err);
  }
};

const authorize = async (req, res, next) => {
  try {
    const enforcer = await getEnforcer();
    const userRole = ROLE_NAMES[req.user.roleId] || req.user.role || null;
    const resource = req.originalUrl.split("?")[0];
    const action = req.method;
    const allowed = await enforcer.enforce(userRole, resource, action);

    if (!allowed) {
      return next(new AppError(API_ERROR_RESPONSES.FORBIDDEN, "Access denied."));
    }

    next();
  } catch (err) {
    if (err instanceof AppError) {
      return next(err);
    }

    next(err);
  }
};

module.exports = { authenticate, authorize };
