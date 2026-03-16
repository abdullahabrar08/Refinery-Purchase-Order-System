const express = require("express");
const router = express.Router();
const catalogController = require("../controllers/catalog.controller");
const validationMiddleware = require("../middlewares/validation.middleware");
const { authenticate, authorize } = require("../middlewares/auth.middleware");
const {
  listQuerySchema,
  itemIdParamSchema,
} = require("../validators/catalog.validator");

router.get(
  "/items",
  authenticate,
  authorize,
  validationMiddleware(listQuerySchema, "query"),
  catalogController.listItems,
);

router.get(
  "/items/:id",
  authenticate,
  authorize,
  validationMiddleware(itemIdParamSchema, "params"),
  catalogController.getItemById,
);

module.exports = router;
