/**
 * Procurement order and order item queries.
 * Uses order_statuses and suppliers lookups; all status/supplier references by ID.
 */

const { ORDER_STATUS_ID } = require("../../utils/constants");

const PO_SELECT = `
  po.purchase_order_id,
  po.po_number,
  po.cost_center,
  po.needed_by,
  po.payment_terms,
  po.supplier_id, s.supplier_name,
  po.status_id, os.order_status_name AS status_code,
  po.submitted_at,
  po.created_at,
  po.updated_at,
  po.created_by
`;

const PO_JOIN = `
  FROM purchase_orders po
  LEFT JOIN suppliers s ON s.supplier_id = po.supplier_id
  LEFT JOIN order_statuses os ON os.order_status_id = po.status_id
`;

const createOrder = (
  userId,
  orderStatusId,
  supplierId,
  costCenter,
  neededBy,
  paymentTerms
) => ({
  text: `
    INSERT INTO purchase_orders (
      status_id,
      created_by,
      supplier_id,
      cost_center,
      needed_by,
      payment_terms
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING
      purchase_order_id,
      po_number,
      cost_center,
      needed_by,
      payment_terms,
      supplier_id,
      status_id,
      created_at,
      created_by
  `,
  values: [
    orderStatusId,
    userId ?? null,
    supplierId,
    costCenter ?? null,
    neededBy ?? null,
    paymentTerms ?? null,
  ],
});

const getOrderById = (orderId) => ({
  text: `SELECT ${PO_SELECT} ${PO_JOIN} WHERE po.purchase_order_id = $1`,
  values: [orderId],
});

const deleteDraft = (orderId) => ({
  text: `
    DELETE FROM purchase_orders
    WHERE purchase_order_id = $1
      AND status_id = $2
  `,
  values: [orderId, ORDER_STATUS_ID.DRAFT],
});

const getOrdersByUser = (userId, statusCode, excludeStatus, limit, offset) => {
  let text = `
    SELECT ${PO_SELECT}
    ${PO_JOIN}
    WHERE po.created_by = $1
  `;
  const values = [userId];
  let paramIndex = 2;

  if (statusCode) {
    text += ` AND os.order_status_name = $${paramIndex}`;
    values.push(statusCode);
    paramIndex++;
  }

  if (excludeStatus) {
    text += ` AND os.order_status_name != $${paramIndex}`;
    values.push(excludeStatus);
    paramIndex++;
  }

  text += ` ORDER BY po.created_at DESC`;

  if (limit !== undefined && offset !== undefined) {
    text += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    values.push(limit, offset);
  }

  return { text, values };
};

const getOrdersByUserCount = (userId, statusCode, excludeStatus) => {
  let text = `
    SELECT COUNT(*)::int AS total
    FROM purchase_orders po
    LEFT JOIN order_statuses os ON os.order_status_id = po.status_id
    WHERE po.created_by = $1
  `;
  const values = [userId];
  let paramIndex = 2;

  if (statusCode) {
    text += ` AND os.order_status_name = $${paramIndex}`;
    values.push(statusCode);
    paramIndex++;
  }

  if (excludeStatus) {
    text += ` AND os.order_status_name != $${paramIndex}`;
    values.push(excludeStatus);
    paramIndex++;
  }

  return { text, values };
};

const getAllOrders = (statusCode, excludeStatus, limit, offset) => {
  let text = `
    SELECT ${PO_SELECT}
    ${PO_JOIN}
    WHERE 1=1
  `;
  const values = [];
  let paramIndex = 1;

  if (statusCode) {
    text += ` AND os.order_status_name = $${paramIndex}`;
    values.push(statusCode);
    paramIndex++;
  }

  if (excludeStatus) {
    text += ` AND os.order_status_name != $${paramIndex}`;
    values.push(excludeStatus);
    paramIndex++;
  }

  text += ` ORDER BY po.created_at DESC`;

  if (limit !== undefined && offset !== undefined) {
    text += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    values.push(limit, offset);
  }

  return { text, values };
};

const getAllOrdersCount = (statusCode, excludeStatus) => {
  let text = `
    SELECT COUNT(*)::int AS total
    FROM purchase_orders po
    LEFT JOIN order_statuses os ON os.order_status_id = po.status_id
    WHERE 1=1
  `;
  const values = [];
  let paramIndex = 1;

  if (statusCode) {
    text += ` AND os.order_status_name = $${paramIndex}`;
    values.push(statusCode);
    paramIndex++;
  }

  if (excludeStatus) {
    text += ` AND os.order_status_name != $${paramIndex}`;
    values.push(excludeStatus);
    paramIndex++;
  }

  return { text, values };
};

const getOpenDraftByUser = (userId) => ({
  text: `
    SELECT purchase_order_id
    FROM purchase_orders
    WHERE created_by = $1
      AND status_id = $2
    ORDER BY created_at DESC
    LIMIT 1
  `,
  values: [userId, ORDER_STATUS_ID.DRAFT],
});

const getNextOrderNumber = () => ({
  text: `SELECT 'PO-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('po_number_seq')::text, 5, '0') AS po_number`,
});

const submitOrderDraft = (orderId, poNumber) => ({
  text: `
    UPDATE purchase_orders
    SET
      po_number = $2,
      status_id = $3,
      submitted_at = NOW(),
      updated_at = NOW()
    WHERE purchase_order_id = $1
      AND status_id = $4
    RETURNING purchase_order_id
  `,
  values: [orderId, poNumber, ORDER_STATUS_ID.SUBMITTED, ORDER_STATUS_ID.DRAFT],
});

const updateOrderStatus = (orderId, statusId) => ({
  text: `
    UPDATE purchase_orders
    SET status_id = $2, updated_at = NOW()
    WHERE purchase_order_id = $1
    RETURNING purchase_order_id, po_number, status_id
  `,
  values: [orderId, statusId],
});

const getSupplierByName = (supplierName) => ({
  text: `SELECT supplier_id, supplier_name FROM suppliers WHERE supplier_name = $1`,
  values: [supplierName],
});

const getSupplierById = (supplierId) => ({
  text: `SELECT supplier_id, supplier_name FROM suppliers WHERE supplier_id = $1`,
  values: [supplierId],
});

const getStatusByName = (statusName) => ({
  text: `SELECT order_status_id, order_status_name FROM order_statuses WHERE order_status_name = $1`,
  values: [statusName],
});

const getOrderItems = (orderId) => ({
  text: `
    SELECT
      purchase_order_item_id,
      purchase_order_id,
      catalog_item_id,
      quantity,
      item_name,
      item_price_usd,
      item_lead_time_days,
      created_at
    FROM purchase_order_items
    WHERE purchase_order_id = $1
    ORDER BY created_at
  `,
  values: [orderId],
});

const addOrderItem = (
  orderId,
  catalogItemId,
  quantity,
  itemName,
  itemPriceUsd,
  itemLeadTimeDays
) => ({
  text: `
    INSERT INTO purchase_order_items (
      purchase_order_id,
      catalog_item_id,
      quantity,
      item_name,
      item_price_usd,
      item_lead_time_days
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (purchase_order_id, catalog_item_id)
    DO UPDATE SET quantity = purchase_order_items.quantity + $3
    RETURNING
      purchase_order_item_id,
      purchase_order_id,
      catalog_item_id,
      quantity,
      item_name,
      item_price_usd,
      item_lead_time_days,
      created_at
  `,
  values: [
    orderId,
    catalogItemId,
    quantity,
    itemName ?? null,
    itemPriceUsd ?? null,
    itemLeadTimeDays ?? null,
  ],
});

const updateOrderItemQuantity = (orderItemId, orderId, quantity) => ({
  text: `
    UPDATE purchase_order_items
    SET quantity = $3
    WHERE purchase_order_item_id = $1
      AND purchase_order_id = $2
    RETURNING
      purchase_order_item_id,
      purchase_order_id,
      catalog_item_id,
      quantity,
      item_name,
      item_price_usd,
      item_lead_time_days
  `,
  values: [orderItemId, orderId, quantity],
});

const removeOrderItem = (orderItemId, orderId) => ({
  text: `
    DELETE FROM purchase_order_items
    WHERE purchase_order_item_id = $1
      AND purchase_order_id = $2
  `,
  values: [orderItemId, orderId],
});

const updateOrderItemSnapshot = (
  orderId,
  catalogItemId,
  itemName,
  itemPriceUsd,
  itemLeadTimeDays
) => ({
  text: `
    UPDATE purchase_order_items
    SET
      item_name = $3,
      item_price_usd = $4,
      item_lead_time_days = $5
    WHERE purchase_order_id = $1
      AND catalog_item_id = $2
  `,
  values: [orderId, catalogItemId, itemName, itemPriceUsd, itemLeadTimeDays],
});

const addTimelineEntry = (orderId, statusId, userId) => ({
  text: `
    INSERT INTO purchase_order_status_timeline (
      purchase_order_id,
      status_id,
      created_by
    )
    VALUES ($1, $2, $3)
    RETURNING
      purchase_order_status_timeline_id,
      purchase_order_id,
      status_id,
      created_at,
      created_by
  `,
  values: [orderId, statusId, userId ?? null],
});

const getTimeline = (orderId) => ({
  text: `
    SELECT
      t.purchase_order_status_timeline_id,
      t.purchase_order_id,
      t.status_id,
      os.order_status_name AS status_code,
      t.created_at,
      t.created_by
    FROM purchase_order_status_timeline t
    JOIN order_statuses os ON os.order_status_id = t.status_id
    WHERE t.purchase_order_id = $1
    ORDER BY t.created_at
  `,
  values: [orderId],
});

module.exports = {
  createOrder,
  getOrderById,
  deleteDraft,
  getOrdersByUser,
  getOrdersByUserCount,
  getAllOrders,
  getAllOrdersCount,
  getOpenDraftByUser,
  getNextOrderNumber,
  submitOrderDraft,
  updateOrderStatus,
  getSupplierByName,
  getSupplierById,
  getStatusByName,
  getOrderItems,
  addOrderItem,
  updateOrderItemQuantity,
  removeOrderItem,
  updateOrderItemSnapshot,
  addTimelineEntry,
  getTimeline,
};
