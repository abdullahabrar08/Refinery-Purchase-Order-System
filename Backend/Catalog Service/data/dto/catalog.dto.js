/**
 * Format catalog item for API response (strip Mongo _id, __v, createdAt, updatedAt).
 */
const toItemDTO = (doc) => {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : doc;
  const { _id, __v, createdAt, updatedAt, ...rest } = obj;
  return rest;
};

/**
 * Format single item (plain object from findOne().lean()).
 */
const toSingleItemDTO = (doc) => (doc ? toItemDTO(doc) : null);

/**
 * Format list response: items array + pagination info.
 */
const toListResponseDTO = (items, page, limit, total) => ({
  items: items.map((doc) => toItemDTO(doc)),
  pagination: {
    page: Number(page),
    limit: Number(limit),
    total,
    totalPages: Math.ceil(total / limit) || 1,
  },
});

module.exports = {
  toItemDTO,
  toSingleItemDTO,
  toListResponseDTO,
};
