const OrderService = require("../../services/order.service");
const { API_SUCCESS_RESPONSES } = require("../../errors/error.codes");

const createOrder = async (req, res, next) => {
  try {
    const data = await OrderService.createOrder(req);

    return res.status(201).send({
      responseCode: API_SUCCESS_RESPONSES.ORDER_CREATED.responseCode,
      message: API_SUCCESS_RESPONSES.ORDER_CREATED.defaultMessage,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getOrder = async (req, res, next) => {
  try {
    const data = await OrderService.getOrderById(req);

    return res.status(200).send({
      responseCode: API_SUCCESS_RESPONSES.GET_ORDER.responseCode,
      message: API_SUCCESS_RESPONSES.GET_ORDER.defaultMessage,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const listOrders = async (req, res, next) => {
  try {
    const data = await OrderService.listOrdersByUser(req);

    return res.status(200).send({
      responseCode: API_SUCCESS_RESPONSES.LIST_ORDERS.responseCode,
      message: API_SUCCESS_RESPONSES.LIST_ORDERS.defaultMessage,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const deleteDraft = async (req, res, next) => {
  try {
    const data = await OrderService.deleteDraftOrder(req);

    return res.status(200).send({
      responseCode: API_SUCCESS_RESPONSES.DRAFT_DELETED.responseCode,
      message: API_SUCCESS_RESPONSES.DRAFT_DELETED.defaultMessage,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const addOrderItem = async (req, res, next) => {
  try {
    const data = await OrderService.addOrderItem(req);

    return res.status(201).send({
      responseCode: API_SUCCESS_RESPONSES.ORDER_ITEM_ADDED.responseCode,
      message: API_SUCCESS_RESPONSES.ORDER_ITEM_ADDED.defaultMessage,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const updateOrderItem = async (req, res, next) => {
  try {
    const data = await OrderService.updateOrderItem(req);

    return res.status(200).send({
      responseCode: API_SUCCESS_RESPONSES.ORDER_ITEM_UPDATED.responseCode,
      message: API_SUCCESS_RESPONSES.ORDER_ITEM_UPDATED.defaultMessage,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const removeOrderItem = async (req, res, next) => {
  try {
    const data = await OrderService.removeOrderItem(req);

    return res.status(200).send({
      responseCode: API_SUCCESS_RESPONSES.ORDER_ITEM_REMOVED.responseCode,
      message: API_SUCCESS_RESPONSES.ORDER_ITEM_REMOVED.defaultMessage,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const submitDraft = async (req, res, next) => {
  try {
    const data = await OrderService.submitDraft(req);

    return res.status(200).send({
      responseCode: API_SUCCESS_RESPONSES.PO_SUBMITTED.responseCode,
      message: API_SUCCESS_RESPONSES.PO_SUBMITTED.defaultMessage,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const transitionStatus = async (req, res, next) => {
  try {
    const data = await OrderService.transitionStatus(req);

    return res.status(200).send({
      responseCode: API_SUCCESS_RESPONSES.STATUS_UPDATED.responseCode,
      message: API_SUCCESS_RESPONSES.STATUS_UPDATED.defaultMessage,
      data,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getOrder,
  listOrders,
  deleteDraft,
  addOrderItem,
  updateOrderItem,
  removeOrderItem,
  submitDraft,
  transitionStatus,
};
