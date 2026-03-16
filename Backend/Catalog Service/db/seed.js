/**
 * Standalone seed: load JSON and replace all catalog data.
 * Run: npm run seed (from Catalog Service directory)
 */
require("dotenv").config({ path: `.env.${process.env.NODE_ENV || "development"}` });
const mongoose = require("mongoose");
const { runFullSeed } = require("./bootstrap");

async function seed() {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/catalog_dev";
  await mongoose.connect(uri);
  const count = await runFullSeed();
  console.log(`[SEED] Inserted ${count} catalog items.`);
  await mongoose.connection.close();
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
