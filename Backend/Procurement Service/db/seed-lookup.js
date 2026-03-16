/**
 * Seed order_statuses and suppliers (idempotent).
 * Called from bootstrap after schema apply.
 */
const { pool } = require("../data");
const { ORDER_STATUS_ID } = require("../utils/constants");

const ORDER_STATUS_ROWS = [
  [ORDER_STATUS_ID.DRAFT, "Draft"],
  [ORDER_STATUS_ID.SUBMITTED, "Submitted"],
  [ORDER_STATUS_ID.APPROVED, "Approved"],
  [ORDER_STATUS_ID.REJECTED, "Rejected"],
  [ORDER_STATUS_ID.FULFILLED, "Fulfilled"],
];

const SUPPLIER_NAMES = ["Flexitallic", "Flowserve", "Emerson", "Alfa Laval", "DeWalt"];

async function seedOrderStatuses() {
  for (const [orderStatusId, orderStatusName] of ORDER_STATUS_ROWS) {
    await pool.query(
      `INSERT INTO order_statuses (order_status_id, order_status_name) VALUES ($1, $2)
       ON CONFLICT (order_status_id) DO UPDATE SET order_status_name = EXCLUDED.order_status_name`,
      [orderStatusId, orderStatusName]
    );
  }
  await pool.query("SELECT setval('order_statuses_order_status_id_seq', (SELECT MAX(order_status_id) FROM order_statuses))");
}

async function seedSuppliers() {
  for (const supplierName of SUPPLIER_NAMES) {
    await pool.query(
      `INSERT INTO suppliers (supplier_name) VALUES ($1) ON CONFLICT (supplier_name) DO NOTHING`,
      [supplierName]
    );
  }
}

async function run() {
  await seedOrderStatuses();
  await seedSuppliers();
}

module.exports = { run: run };
