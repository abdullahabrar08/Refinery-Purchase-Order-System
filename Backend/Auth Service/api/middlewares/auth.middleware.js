const jwt = require("jsonwebtoken");
const { pool } = require("../../data/index");
const { ROLE_NAMES } = require("../../utils/constants");
const { newEnforcer } = require("casbin");
const Queries = require("../../data/queries/user.queries");
const path = require("path");
const modelPath = path.resolve(__dirname, "../../utils/rbac/model.conf");
const policyPath = path.resolve(__dirname, "../../utils/rbac/policy.csv");
const { AppError } = require("../../errors/errors");
const { API_ERROR_RESPONSES } = require("../../errors/error.codes");
const validationMiddleware = require("../middlewares/validation.middleware");

exports.authenticate = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    const err = new AppError(
      API_ERROR_RESPONSES.UNAUTHORIZED,
      "No token provided.",
    );
    return next(err);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    let { rows } = await pool.query(Queries.getUserById(decoded.userId));
    if (rows.length === 0) {
      throw new AppError(API_ERROR_RESPONSES.UNAUTHORIZED, "User not found");
    }

    req.user = { ...rows[0] };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    // Handle JWT errors
    if (error.name === "TokenExpiredError") {
      return next(
        new AppError(API_ERROR_RESPONSES.TOKEN_EXPIRED, "Token expired"),
      );
    }
    if (error.name === "JsonWebTokenError") {
      return next(
        new AppError(API_ERROR_RESPONSES.TOKEN_INVALID, "Invalid token"),
      );
    }
    // Generic error
    next(error);
  }
};

exports.authorize = async (req, res, next) => {
  try {
    const enforcer = await newEnforcer(modelPath, policyPath);

    const userRole = ROLE_NAMES[req.user.role_id] || null;
    const path = req.originalUrl.split("?")[0];
    const method = req.method;
    console.log("----------------------");
    console.log("Authorize :", userRole, path, method);
    console.log("----------------------");
    const allowed = await enforcer.enforce(userRole, path, method);

    if (!allowed) {
      const err = new AppError(API_ERROR_RESPONSES.FORBIDDEN, "Access Denied");
      throw err;
    }

    next();
  } catch (error) {
    next(error);
  }
};
