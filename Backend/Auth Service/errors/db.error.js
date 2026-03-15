// errors/pgHandler.js
const {
  PG_ERROR_SQLSTATE_MAP,
  PG_CLASS_FALLBACKS,
  safeDetails,
  API_ERROR_RESPONSES,
} = require("./error.codes");

function handlePostgreSQLError(err) {
  if (!err?.code) return null;

  // 1) Exact SQLSTATE
  const def = PG_ERROR_SQLSTATE_MAP[err.code];
  if (def) {
    return {
      statusCode: def.statusCode,
      responseCode: def.responseCode,
      code: def.code,
      message: def.defaultMessage,
      details: safeDetails(err),
    };
  }

  // 2) Class fallback
  const fb = PG_CLASS_FALLBACKS.find(([re]) => re.test(err.code));
  if (fb) {
    const fallbackDef = fb[1];
    return {
      statusCode: fallbackDef.statusCode,
      responseCode: fallbackDef.responseCode,
      code: fallbackDef.code,
      message: fallbackDef.defaultMessage,
      details: safeDetails(err), // 👈 HERE
    };
  }

  // 3) Unknown
  return {
    statusCode: API_ERROR_RESPONSES.UNKNOWN_DATABASE_ERROR.statusCode,
    responseCode: API_ERROR_RESPONSES.UNKNOWN_DATABASE_ERROR.responseCode,
    code: API_ERROR_RESPONSES.UNKNOWN_DATABASE_ERROR.code,
    message: API_ERROR_RESPONSES.UNKNOWN_DATABASE_ERROR.defaultMessage,
    details: safeDetails(err), // 👈 HERE
  };
}

module.exports = handlePostgreSQLError;
