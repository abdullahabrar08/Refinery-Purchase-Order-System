const mongoose = require("mongoose");
const { mongodb } = require("../config");
const logger = require("../utils/logger");

const connect = async () => {
  await mongoose.connect(mongodb.uri);
};

mongoose.connection.on("connected", () => {
  logger.info("[CATALOG_SERVICE] MongoDB connected");
});

mongoose.connection.on("error", (err) => {
  logger.error("[CATALOG_SERVICE] MongoDB error:", err);
});

const closeConnection = async () => {
  await mongoose.connection.close();
  logger.info("[CATALOG_SERVICE] MongoDB connection closed.");
};

module.exports = { mongoose, connect, closeConnection };
