/**
 * Catalog query helpers – build filter and sort for Mongoose.
 */

const CatalogItem = require("../models/CatalogItem");

const SORT_MAP = {
  price_asc: { priceUsd: 1 },
  price_desc: { priceUsd: -1 },
  leadTime_asc: { leadTimeDays: 1 },
  leadTime_desc: { leadTimeDays: -1 },
  supplier_asc: { supplier: 1 },
};

const buildFilter = (query) => {
  const { search, category, inStock } = query;
  const filter = {};

  if (category) filter.category = category;
  if (typeof inStock === "boolean") filter.inStock = inStock;
  if (typeof inStock === "string") {
    if (inStock.toLowerCase() === "true") filter.inStock = true;
    else if (inStock.toLowerCase() === "false") filter.inStock = false;
  }

  if (search && search.trim()) {
    const term = search.trim();
    const isId = /^[A-Z0-9]+-[0-9]+$/i.test(term);
    if (isId) {
      filter.id = new RegExp(term, "i");
    } else {
      filter.$or = [
        { name: new RegExp(term, "i") },
        { supplier: new RegExp(term, "i") },
        { manufacturer: new RegExp(term, "i") },
        { model: new RegExp(term, "i") },
      ];
    }
  }

  return filter;
};

const buildSort = (sortKey) => {
  return SORT_MAP[sortKey] || { id: 1 };
};

const findItems = async (query) => {
  const { search, category, inStock, sort = "id", page = 1, limit = 20 } = query;
  const filter = buildFilter({ search, category, inStock });
  const sortObj = buildSort(sort);
  const skip = (Math.max(1, Number(page)) - 1) * Math.max(1, Math.min(100, Number(limit)));
  const limitNum = Math.max(1, Math.min(100, Number(limit)));

  const [items, total] = await Promise.all([
    CatalogItem.find(filter).sort(sortObj).skip(skip).limit(limitNum).lean(),
    CatalogItem.countDocuments(filter),
  ]);

  return { items, total, page: Math.max(1, Number(page)), limit: limitNum };
};

const findItemById = async (id) => {
  return CatalogItem.findOne({ id }).lean();
};

module.exports = {
  buildFilter,
  buildSort,
  findItems,
  findItemById,
};
