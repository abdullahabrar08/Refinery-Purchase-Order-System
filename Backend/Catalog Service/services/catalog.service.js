const { findItems, findItemById } = require("../data/queries/catalog.queries");
const { toListResponseDTO, toSingleItemDTO } = require("../data/dto/catalog.dto");
const { AppError } = require("../errors/errors");
const { API_ERROR_RESPONSES } = require("../errors/error.codes");

const listItems = async (query) => {
  const { items, total, page, limit } = await findItems(query);
  return toListResponseDTO(items, page, limit, total);
};

const getItemById = async (id) => {
  const item = await findItemById(id);
  if (!item) {
    throw new AppError(API_ERROR_RESPONSES.RESOURCE_NOT_FOUND, `Catalog item not found: ${id}`);
  }
  return toSingleItemDTO(item);
};

module.exports = { listItems, getItemById };
