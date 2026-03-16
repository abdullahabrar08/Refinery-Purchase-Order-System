const Joi = require("joi");

const sortValues = ["price_asc", "price_desc", "leadTime_asc", "leadTime_desc", "supplier_asc", "id"];

const listQuerySchema = Joi.object({
  search: Joi.string().allow("").optional(),
  category: Joi.string().optional(),
  inStock: Joi.valid("true", "false", true, false).optional(),
  sort: Joi.string()
    .valid(...sortValues)
    .default("id"),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

const itemIdParamSchema = Joi.object({
  id: Joi.string().required(),
});

module.exports = {
  listQuerySchema,
  itemIdParamSchema,
};
