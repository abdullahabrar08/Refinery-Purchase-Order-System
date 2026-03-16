/** Role ids and names for Casbin (Auth JWT payload) */
const USER_ROLES = Object.freeze({ ADMIN: 1, BUYER: 2 });
const ROLE_NAMES = Object.freeze({ [USER_ROLES.ADMIN]: "Admin", [USER_ROLES.BUYER]: "Buyer" });

const HTTP_REQUEST_ATTRIBUTES = Object.freeze({
  HEADERS: "headers",
  BODY: "body",
  QUERY: "query",
  PARAMS: "params",
});

/** Order status codes (for API and validation) */
const PO_STATUSES = Object.freeze({
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  FULFILLED: "Fulfilled",
});

/** Order status PKs in order_statuses table (must match seed) */
const ORDER_STATUS_ID = Object.freeze({
  DRAFT: 1,
  SUBMITTED: 2,
  APPROVED: 3,
  REJECTED: 4,
  FULFILLED: 5,
});

/** Allowed status transitions: from status -> [to status codes] */
const ALLOWED_STATUS_TRANSITIONS = Object.freeze({
  [PO_STATUSES.SUBMITTED]: [PO_STATUSES.APPROVED, PO_STATUSES.REJECTED],
  [PO_STATUSES.APPROVED]: [PO_STATUSES.FULFILLED],
  [PO_STATUSES.REJECTED]: [],
  [PO_STATUSES.FULFILLED]: [],
});

/** Valid target statuses for POST /orders/:id/status */
const TRANSITION_TARGET_STATUSES = Object.freeze([
  PO_STATUSES.APPROVED,
  PO_STATUSES.REJECTED,
  PO_STATUSES.FULFILLED,
]);

module.exports = {
  USER_ROLES,
  ROLE_NAMES,
  HTTP_REQUEST_ATTRIBUTES,
  PO_STATUSES,
  ORDER_STATUS_ID,
  ALLOWED_STATUS_TRANSITIONS,
  TRANSITION_TARGET_STATUSES,
};
