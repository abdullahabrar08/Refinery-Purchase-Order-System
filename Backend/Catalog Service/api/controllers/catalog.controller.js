const CatalogService = require("../../services/catalog.service");
const { API_SUCCESS_RESPONSES } = require("../../errors/error.codes");

const listItems = async (req, res, next) => {
  try {
    const result = await CatalogService.listItems(req.query);
    return res.status(200).json({
      responseCode: API_SUCCESS_RESPONSES.LIST_ITEMS.responseCode,
      message: API_SUCCESS_RESPONSES.LIST_ITEMS.defaultMessage,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

const getItemById = async (req, res, next) => {
  try {
    const item = await CatalogService.getItemById(req.params.id);
    return res.status(200).json({
      responseCode: API_SUCCESS_RESPONSES.GET_ITEM.responseCode,
      message: API_SUCCESS_RESPONSES.GET_ITEM.defaultMessage,
      data: item,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { listItems, getItemById };
