const mongoose = require("mongoose");

const catalogItemSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    supplier: { type: String, required: true },
    manufacturer: { type: String, required: true },
    model: { type: String, required: true },
    description: { type: String, default: "" },
    priceUsd: { type: Number, required: true },
    leadTimeDays: { type: Number, required: true },
    inStock: { type: Boolean, default: false },
    specs: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

// id already has unique: true in schema (creates index). No duplicate index.
catalogItemSchema.index({ category: 1 });
catalogItemSchema.index({ supplier: 1 });
catalogItemSchema.index({ inStock: 1 });
catalogItemSchema.index({ priceUsd: 1 });
catalogItemSchema.index({ leadTimeDays: 1 });
catalogItemSchema.index({ name: 1, supplier: 1, manufacturer: 1, model: 1 });

const CatalogItem = mongoose.model("CatalogItem", catalogItemSchema);

module.exports = CatalogItem;
