/**
 * Client for Catalog Service – get item by id (for supplier check and snapshot on submit).
 */
const axios = require("axios");
const { catalog } = require("../config");

/**
 * Fetch a single catalog item by id.
 * @param {string} itemId - Catalog item id (e.g. VLV-0101)
 * @param {string} bearerToken - JWT for Authorization header
 * @returns {Promise<{ id, name, supplier, priceUsd, leadTimeDays, ... }>}
 * @throws {Error} on non-2xx or missing data
 */
async function getItemById(itemId, bearerToken) {
  const url = `${catalog.baseUrl.replace(/\/$/, "")}/items/${encodeURIComponent(itemId)}`;
  try {
    const { data } = await axios.get(url, {
      headers: {
        Authorization: bearerToken ? `Bearer ${bearerToken}` : undefined,
        "Content-Type": "application/json",
      },
      timeout: 10000,
    });
    if (data && data.data) return data.data;
    throw new Error("Catalog response missing data");
  } catch (err) {
    if (err.response?.status === 404) throw new Error(`Catalog item not found: ${itemId}`);
    if (err.response?.data?.message) throw new Error(err.response.data.message);
    throw err;
  }
}

module.exports = { getItemById };
