const adminService = require('../services/adminService');
const catchAsync = require('../utils/catchAsync');
const { ok, created } = require('../utils/apiResponse');

const getDashboard = catchAsync(async (req, res) => {
  const summary = await adminService.getDashboardSummary();
  ok(res, { summary });
});

const listOrders = catchAsync(async (req, res) => {
  const result = await adminService.listOrders(req.query);
  ok(res, result);
});

const getOrderById = catchAsync(async (req, res) => {
  const order = await adminService.getOrderById(req.params.id);
  ok(res, { order });
});

const listCustomers = catchAsync(async (req, res) => {
  const result = await adminService.listCustomers(req.query);
  ok(res, result);
});

const getCustomerById = catchAsync(async (req, res) => {
  const customer = await adminService.getCustomerById(req.params.id);
  ok(res, { customer });
});

const updateCustomer = catchAsync(async (req, res) => {
  const customer = await adminService.updateCustomer(req.params.id, req.body);
  ok(res, { customer }, 'Customer updated');
});

module.exports = {
  getDashboard,
  listOrders,
  getOrderById,
  listCustomers,
  getCustomerById,
  updateCustomer,
};