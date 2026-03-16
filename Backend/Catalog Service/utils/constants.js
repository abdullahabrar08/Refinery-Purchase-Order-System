const USER_ROLES = Object.freeze({
  ADMIN: 1,
  BUYER: 2,
});

const ROLE_NAMES = {
  [USER_ROLES.ADMIN]: "Admin",
  [USER_ROLES.BUYER]: "Buyer",
};

const HTTP_REQUEST_ATTRIBUTES = {
  HEADERS: "headers",
  BODY: "body",
  QUERY: "query",
  PARAMS: "params",
};

module.exports = {
  HTTP_REQUEST_ATTRIBUTES,
  ROLE_NAMES,
  USER_ROLES,
};
