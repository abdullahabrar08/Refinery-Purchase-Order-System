/**
 * Map DB rows to API response shape.
 * Order rows may come from joins (supplier_name, status_code) or raw (supplier, status).
 */

function toOrderDTO(row) {
  if (!row) return null;

  return {
    id: row.purchase_order_id ?? row.id,
    poNumber: row.po_number,
    costCenter: row.cost_center,
    neededBy: row.needed_by,
    paymentTerms: row.payment_terms,
    supplier: row.supplier_name ?? row.supplier ?? null,
    status: row.status_code ?? row.status ?? null,
    submittedAt: row.submitted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
  };
}

function toOrderItemDTO(row) {
  if (!row) return null;

  return {
    id: row.purchase_order_item_id ?? row.id,
    poId: row.purchase_order_id ?? row.po_id,
    catalogItemId: row.catalog_item_id,
    quantity: row.quantity,
    itemName: row.item_name,
    itemPriceUsd: row.item_price_usd != null ? Number(row.item_price_usd) : null,
    itemLeadTimeDays: row.item_lead_time_days,
    createdAt: row.created_at,
  };
}

function toTimelineDTO(row) {
  if (!row) return null;

  return {
    id: row.purchase_order_status_timeline_id ?? row.id,
    poId: row.purchase_order_id ?? row.po_id,
    status: row.status_code ?? row.status ?? null,
    createdAt: row.created_at,
    createdBy: row.created_by,
  };
}

function toOrderDetailDTO(orderRow, orderItemRows, timelineRows) {
  const order = toOrderDTO(orderRow);

  if (!order) return null;

  order.items = (orderItemRows || []).map(toOrderItemDTO);
  order.timeline = (timelineRows || []).map(toTimelineDTO);

  return order;
}

module.exports = {
  toOrderDTO,
  toOrderItemDTO,
  toTimelineDTO,
  toOrderDetailDTO,
};
