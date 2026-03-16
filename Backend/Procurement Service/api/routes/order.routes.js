const express = require("express");
const router = express.Router();
const orderController = require("../controllers/order.controller");
const validationMiddleware = require("../middlewares/validation.middleware");
const { authenticate, authorize } = require("../middlewares/auth.middleware");
const {
  createOrderSchema,
  addOrderItemSchema,
  updateOrderItemSchema,
  statusTransitionSchema,
  orderIdParamSchema,
  orderItemIdParamSchema,
  listOrdersQuerySchema,
} = require("../validators/order.validator");

router.use(authenticate);
router.use(authorize);

router.post(
  "/orders",
  validationMiddleware(createOrderSchema, "body"),
  orderController.createOrder
);
router.get(
  "/orders",
  validationMiddleware(listOrdersQuerySchema, "query"),
  orderController.listOrders
);
router.get(
  "/orders/:id",
  validationMiddleware(orderIdParamSchema, "params"),
  orderController.getOrder
);
router.delete(
  "/orders/:id",
  validationMiddleware(orderIdParamSchema, "params"),
  orderController.deleteDraft
);
router.post(
  "/orders/:id/items",
  validationMiddleware(orderIdParamSchema, "params"),
  validationMiddleware(addOrderItemSchema, "body"),
  orderController.addOrderItem
);
router.patch(
  "/orders/:id/items/:orderItemId",
  validationMiddleware(orderItemIdParamSchema, "params"),
  validationMiddleware(updateOrderItemSchema, "body"),
  orderController.updateOrderItem
);
router.delete(
  "/orders/:id/items/:orderItemId",
  validationMiddleware(orderItemIdParamSchema, "params"),
  orderController.removeOrderItem
);
router.post(
  "/orders/:id/submit",
  validationMiddleware(orderIdParamSchema, "params"),
  orderController.submitDraft
);
router.post(
  "/orders/:id/status",
  validationMiddleware(orderIdParamSchema, "params"),
  validationMiddleware(statusTransitionSchema, "body"),
  orderController.transitionStatus
);

module.exports = router;
