/**
 * Bootstrap: auto-import catalog data from JSON on startup if collection is empty.
 */
const path = require("path");
const fs = require("fs");
const CatalogItem = require("../data/models/CatalogItem");

const JSON_PATH = path.join(__dirname, "../../../refinery_items_50_5suppliers_strict.json");

function loadItemsFromJson() {
  const raw = fs.readFileSync(JSON_PATH, "utf8");
  const items = JSON.parse(raw);
  return items.map((item) => ({
    id: item.id,
    name: item.name,
    category: item.category,
    supplier: item.supplier,
    manufacturer: item.manufacturer,
    model: item.model,
    description: item.description || "",
    priceUsd: item.priceUsd,
    leadTimeDays: item.leadTimeDays,
    inStock: item.inStock ?? false,
    specs: item.specs || {},
    compatibleWith: item.compatibleWith || [],
  }));
}

async function seedIfEmpty(logger) {
  const count = await CatalogItem.countDocuments();
  if (count > 0) {
    if (logger) logger.info("[CATALOG_SERVICE] Catalog already has data, skipping seed.");
    return;
  }
  const docs = loadItemsFromJson();
  await CatalogItem.insertMany(docs);
  if (logger) logger.info(`[CATALOG_SERVICE] Auto-imported ${docs.length} catalog items from JSON.`);
}

async function runFullSeed() {
  const docs = loadItemsFromJson();
  await CatalogItem.deleteMany({});
  await CatalogItem.insertMany(docs);
  return docs.length;
}

module.exports = { seedIfEmpty, runFullSeed, loadItemsFromJson };
