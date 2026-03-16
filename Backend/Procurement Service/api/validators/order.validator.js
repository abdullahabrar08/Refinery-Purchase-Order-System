const Joi = require("joi");
const { PO_STATUSES, ORDER_STATUS_ID } = require("../../utils/constants");

const createOrderSchema = Joi.object({
  orderStatusId: Joi.number().integer().valid(ORDER_STATUS_ID.DRAFT).required(),
  supplierId: Joi.number().integer().positive().required(),
  cost_center: Joi.string().allow("").optional(),
  needed_by: Joi.date().iso().allow(null).optional(),
  payment_terms: Joi.string().allow("").optional(),
}).or("cost_center", "needed_by", "payment_terms");

const addOrderItemSchema = Joi.object({
  catalogItemId: Joi.string().required(),
  quantity: Joi.number().integer().min(1).required(),
});

const updateOrderItemSchema = Joi.object({
  quantity: Joi.number().integer().min(1).required(),
});

const statusTransitionSchema = Joi.object({
  status: Joi.string()
    .valid(PO_STATUSES.APPROVED, PO_STATUSES.REJECTED, PO_STATUSES.FULFILLED)
    .required(),
});

const orderIdParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

const orderItemIdParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
  orderItemId: Joi.number().integer().positive().required(),
});

const listOrdersQuerySchema = Joi.object({
  status: Joi.string()
    .valid(PO_STATUSES.DRAFT, PO_STATUSES.SUBMITTED, PO_STATUSES.APPROVED, PO_STATUSES.REJECTED, PO_STATUSES.FULFILLED)
    .optional(),
});

module.exports = {
  createOrderSchema,
  addOrderItemSchema,
  updateOrderItemSchema,
  statusTransitionSchema,
  orderIdParamSchema,
  orderItemIdParamSchema,
  listOrdersQuerySchema,
};
