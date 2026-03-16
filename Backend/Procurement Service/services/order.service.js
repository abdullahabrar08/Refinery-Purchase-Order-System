const { pool, runInTransaction } = require("../data");
const OrderQueries = require("../data/queries/order.queries");
const OrderDTO = require("../data/dto/order.dto");
const { getItemById } = require("../network/catalog.client");
const { AppError } = require("../errors/errors");
const { API_ERROR_RESPONSES } = require("../errors/error.codes");
const {
  PO_STATUSES,
  ORDER_STATUS_ID,
  USER_ROLES,
  ALLOWED_STATUS_TRANSITIONS,
  TRANSITION_TARGET_STATUSES,
} = require("../utils/constants");
const logger = require("../utils/logger");

function getBearerToken(req) {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader?.startsWith("Bearer ")) {
    return null;
  }

  return authorizationHeader.slice(7);
}

async function fetchOrderRowById(orderId) {
  const query = OrderQueries.getOrderById(orderId);
  const { rows } = await pool.query(query.text, query.values);

  return rows[0] || null;
}

async function fetchOrderItems(orderId) {
  const query = OrderQueries.getOrderItems(orderId);
  const { rows } = await pool.query(query.text, query.values);

  return rows;
}

async function fetchOrderTimeline(orderId) {
  const query = OrderQueries.getTimeline(orderId);
  const { rows } = await pool.query(query.text, query.values);

  return rows;
}

async function fetchSupplierByName(supplierName) {
  const query = OrderQueries.getSupplierByName(supplierName);
  const { rows } = await pool.query(query.text, query.values);

  return rows[0] || null;
}

async function fetchSupplierById(supplierId) {
  const query = OrderQueries.getSupplierById(supplierId);
  const { rows } = await pool.query(query.text, query.values);

  return rows[0] || null;
}

async function fetchOpenDraftByUser(userId) {
  const query = OrderQueries.getOpenDraftByUser(userId);
  const { rows } = await pool.query(query.text, query.values);

  return rows[0] || null;
}

async function fetchStatusByName(statusName) {
  const query = OrderQueries.getStatusByName(statusName);
  const { rows } = await pool.query(query.text, query.values);

  return rows[0] || null;
}

async function getRequiredOrder(orderId, options = {}) {
  const { requireDraft = false, requireOwnedByUserId = null } = options;
  const order = await fetchOrderRowById(orderId);

  if (!order) {
    throw new AppError(
      API_ERROR_RESPONSES.RESOURCE_NOT_FOUND,
      "Order not found",
    );
  }

  if (
    requireOwnedByUserId != null &&
    order.created_by !== requireOwnedByUserId
  ) {
    throw new AppError(API_ERROR_RESPONSES.FORBIDDEN, "Access denied");
  }

  if (requireDraft && order.status_code !== PO_STATUSES.DRAFT) {
    throw new AppError(
      API_ERROR_RESPONSES.CONFLICT,
      "Only draft can be modified",
    );
  }

  return order;
}

async function getSupplierIdByName(supplierName) {
  const supplier = await fetchSupplierByName(supplierName);

  if (!supplier) {
    throw new AppError(
      API_ERROR_RESPONSES.RESOURCE_NOT_FOUND,
      `Supplier not found: ${supplierName}`,
    );
  }

  return supplier.supplier_id;
}

async function getRequiredStatusId(statusName) {
  const status = await fetchStatusByName(statusName);

  if (!status) {
    throw new AppError(
      API_ERROR_RESPONSES.INVALID_INPUT,
      `Invalid status: ${statusName}`,
    );
  }

  return status.order_status_id;
}

async function getOrderDetails(orderId) {
  const order = await fetchOrderRowById(orderId);

  if (!order) {
    throw new AppError(
      API_ERROR_RESPONSES.RESOURCE_NOT_FOUND,
      "Order not found",
    );
  }

  const orderItems = await fetchOrderItems(orderId);
  const orderTimeline = await fetchOrderTimeline(orderId);

  return OrderDTO.toOrderDetailDTO(order, orderItems, orderTimeline);
}

async function fetchCatalogItem(catalogItemId, bearerToken) {
  try {
    return await getItemById(catalogItemId, bearerToken);
  } catch (error) {
    if (error.message?.includes("not found")) {
      throw new AppError(API_ERROR_RESPONSES.RESOURCE_NOT_FOUND, error.message);
    }

    throw error;
  }
}

async function createOrder(req) {
  const userId = req.user?.userId;
  const {
    orderStatusId,
    supplierId,
    cost_center: costCenter,
    needed_by: neededBy,
    payment_terms: paymentTerms,
  } = req.body;
  const supplier = await fetchSupplierById(supplierId);
  const existingDraftOrder = await fetchOpenDraftByUser(userId);

  // Supplier must be selected up front when the order is created.
  if (!supplier) {
    throw new AppError(
      API_ERROR_RESPONSES.RESOURCE_NOT_FOUND,
      `Supplier not found: ${supplierId}`,
    );
  }

  if (existingDraftOrder) {
    throw new AppError(
      API_ERROR_RESPONSES.CONFLICT,
      "You already have an open draft order",
    );
  }

  const createOrderQuery = OrderQueries.createOrder(
    userId,
    orderStatusId,
    supplierId,
    costCenter,
    neededBy,
    paymentTerms,
  );
  const { rows } = await pool.query(
    createOrderQuery.text,
    createOrderQuery.values,
  );
  const createdOrder = rows[0];

  if (!createdOrder) {
    throw new AppError(
      API_ERROR_RESPONSES.INTERNAL_ERROR,
      "Failed to create order",
    );
  }

  const order = await fetchOrderRowById(createdOrder.purchase_order_id);

  if (!order) {
    throw new AppError(
      API_ERROR_RESPONSES.RESOURCE_NOT_FOUND,
      "Order not found",
    );
  }

  return OrderDTO.toOrderDTO(order);
}

async function getOrderById(req) {
  const orderId = req.params.id;
  const userId = req.user?.userId;
  const requireOwnedByUserId =
    req.user?.roleId === USER_ROLES.ADMIN ? null : userId;

  await getRequiredOrder(orderId, { requireOwnedByUserId });

  return getOrderDetails(orderId);
}

async function listOrdersByUser(req) {
  const userId = req.user?.userId;
  const statusCode = req.query.status;
  const excludeStatus = req.query.excludeStatus;
  
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  const isAdmin = req.user?.roleId === USER_ROLES.ADMIN;

  const listOrdersQuery = isAdmin
    ? OrderQueries.getAllOrders(statusCode, excludeStatus, limit, offset)
    : OrderQueries.getOrdersByUser(userId, statusCode, excludeStatus, limit, offset);
  
  const countQuery = isAdmin
    ? OrderQueries.getAllOrdersCount(statusCode, excludeStatus)
    : OrderQueries.getOrdersByUserCount(userId, statusCode, excludeStatus);

  const [ordersResult, countResult] = await Promise.all([
    pool.query(listOrdersQuery.text, listOrdersQuery.values),
    pool.query(countQuery.text, countQuery.values)
  ]);

  const total = countResult.rows[0]?.total || 0;
  const totalPages = Math.ceil(total / limit);

  return {
    data: ordersResult.rows.map(OrderDTO.toOrderDTO),
    pagination: {
      total,
      page,
      limit,
      totalPages
    }
  };
}

async function deleteDraftOrder(req) {
  const orderId = req.params.id;
  const userId = req.user?.userId;

  await getRequiredOrder(orderId, {
    requireDraft: true,
    requireOwnedByUserId: userId,
  });

  const deleteDraftQuery = OrderQueries.deleteDraft(orderId);
  await pool.query(deleteDraftQuery.text, deleteDraftQuery.values);

  return { deleted: true };
}

async function addOrderItem(req) {
  const orderId = req.params.id;
  const userId = req.user?.userId;
  const body = req.body;
  const bearerToken = getBearerToken(req);
  const order = await getRequiredOrder(orderId, {
    requireDraft: true,
    requireOwnedByUserId: userId,
  });

  const { catalogItemId, quantity } = body;
  const catalogItem = await fetchCatalogItem(catalogItemId, bearerToken);
  const supplierId = await getSupplierIdByName(catalogItem.supplier);

  // Once selected on create, the order supplier is locked for all items.
  if (order.supplier_id !== supplierId) {
    throw new AppError(
      API_ERROR_RESPONSES.SUPPLIER_MISMATCH,
      "All items must be from the same supplier",
    );
  }

  const addOrderItemQuery = OrderQueries.addOrderItem(
    orderId,
    catalogItemId,
    quantity,
    catalogItem.name,
    catalogItem.priceUsd,
    catalogItem.leadTimeDays,
  );
  const { rows } = await pool.query(
    addOrderItemQuery.text,
    addOrderItemQuery.values,
  );
  const orderItem = rows[0];

  if (!orderItem) {
    throw new AppError(
      API_ERROR_RESPONSES.INTERNAL_ERROR,
      "Failed to add order item",
    );
  }

  return OrderDTO.toOrderItemDTO(orderItem);
}

async function updateOrderItem(req) {
  const orderId = req.params.id;
  const orderItemId = req.params.orderItemId;
  const userId = req.user?.userId;
  const body = req.body;

  await getRequiredOrder(orderId, {
    requireDraft: true,
    requireOwnedByUserId: userId,
  });

  const updateOrderItemQuery = OrderQueries.updateOrderItemQuantity(
    orderItemId,
    orderId,
    body.quantity,
  );
  const { rows } = await pool.query(
    updateOrderItemQuery.text,
    updateOrderItemQuery.values,
  );
  const orderItem = rows[0];

  if (!orderItem) {
    throw new AppError(
      API_ERROR_RESPONSES.RESOURCE_NOT_FOUND,
      "Order item not found",
    );
  }

  return OrderDTO.toOrderItemDTO(orderItem);
}

async function removeOrderItem(req) {
  const orderId = req.params.id;
  const orderItemId = req.params.orderItemId;
  const userId = req.user?.userId;

  await getRequiredOrder(orderId, {
    requireDraft: true,
    requireOwnedByUserId: userId,
  });

  const removeOrderItemQuery = OrderQueries.removeOrderItem(
    orderItemId,
    orderId,
  );
  const result = await pool.query(
    removeOrderItemQuery.text,
    removeOrderItemQuery.values,
  );

  if (result.rowCount === 0) {
    throw new AppError(
      API_ERROR_RESPONSES.RESOURCE_NOT_FOUND,
      "Order item not found",
    );
  }

  return { removed: true };
}

async function submitDraft(req) {
  const orderId = req.params.id;
  const userId = req.user?.userId;
  const bearerToken = getBearerToken(req);

  await getRequiredOrder(orderId, {
    requireDraft: true,
    requireOwnedByUserId: userId,
  });

  const orderItems = await fetchOrderItems(orderId);

  if (!orderItems.length) {
    throw new AppError(
      API_ERROR_RESPONSES.VALIDATION_ERROR,
      "Draft must have at least one order item",
    );
  }

  await runInTransaction(async (client) => {
    // Snapshot catalog values at submission so later catalog changes do not
    // change the historical purchase order data.
    for (const orderItem of orderItems) {
      const catalogItem = await fetchCatalogItem(
        orderItem.catalog_item_id,
        bearerToken,
      );
      const updateOrderItemSnapshotQuery = OrderQueries.updateOrderItemSnapshot(
        orderId,
        orderItem.catalog_item_id,
        catalogItem.name,
        catalogItem.priceUsd,
        catalogItem.leadTimeDays,
      );

      await client.query(
        updateOrderItemSnapshotQuery.text,
        updateOrderItemSnapshotQuery.values,
      );
    }

    // PO number is assigned only when the draft is submitted.
    const nextPoNumberQuery = OrderQueries.getNextOrderNumber();
    const { rows: poNumberRows } = await client.query(nextPoNumberQuery.text);
    const purchaseOrderNumber = poNumberRows[0]?.po_number;
    const submitOrderQuery = OrderQueries.submitOrderDraft(
      orderId,
      purchaseOrderNumber,
    );
    const addTimelineEntryQuery = OrderQueries.addTimelineEntry(
      orderId,
      ORDER_STATUS_ID.SUBMITTED,
      userId,
    );

    await client.query(submitOrderQuery.text, submitOrderQuery.values);
    await client.query(
      addTimelineEntryQuery.text,
      addTimelineEntryQuery.values,
    );
  }, "submitDraft");

  logger.info(
    `[PROCUREMENT_SERVICE] PO submitted: orderId=${orderId}, userId=${userId}`,
  );

  return getOrderDetails(orderId);
}

async function transitionStatus(req) {
  const orderId = req.params.id;
  const userId = req.user?.userId;
  const body = req.body;
  const { status: statusCode } = body;
  const requireOwnedByUserId =
    req.user?.roleId === USER_ROLES.ADMIN ? null : userId;

  if (!TRANSITION_TARGET_STATUSES.includes(statusCode)) {
    throw new AppError(API_ERROR_RESPONSES.VALIDATION_ERROR, "Invalid status");
  }

  const order = await getRequiredOrder(orderId, {
    requireOwnedByUserId,
  });
  const allowedTransitions = ALLOWED_STATUS_TRANSITIONS[order.status_code];

  if (!allowedTransitions?.includes(statusCode)) {
    throw new AppError(
      API_ERROR_RESPONSES.CONFLICT,
      "Invalid status transition",
    );
  }

  const statusId = await getRequiredStatusId(statusCode);
  const updateOrderStatusQuery = OrderQueries.updateOrderStatus(
    orderId,
    statusId,
  );
  const addTimelineEntryQuery = OrderQueries.addTimelineEntry(
    orderId,
    statusId,
    userId,
  );

  await pool.query(updateOrderStatusQuery.text, updateOrderStatusQuery.values);
  await pool.query(addTimelineEntryQuery.text, addTimelineEntryQuery.values);

  const updatedOrder = await fetchOrderRowById(orderId);

  if (!updatedOrder) {
    throw new AppError(
      API_ERROR_RESPONSES.RESOURCE_NOT_FOUND,
      "Order not found",
    );
  }

  return OrderDTO.toOrderDTO(updatedOrder);
}

module.exports = {
  createOrder,
  getOrderById,
  listOrdersByUser,
  deleteDraftOrder,
  addOrderItem,
  updateOrderItem,
  removeOrderItem,
  submitDraft,
  transitionStatus,
};
