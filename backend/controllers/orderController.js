const orderService = require('../services/orderService');
const paymentService = require('../services/paymentService');
const catchAsync = require('../utils/catchAsync');
const { ok, created } = require('../utils/apiResponse');

const createOrder = catchAsync(async (req, res) => {
  const order = await orderService.createOrder(req.user._id, req.body);
  created(res, { order }, 'Order placed successfully');
});

const listMyOrders = catchAsync(async (req, res) => {
  const result = await orderService.listMyOrders(req.user._id, req.query);
  ok(res, result);
});

const getMyOrderById = catchAsync(async (req, res) => {
  const order = await orderService.getMyOrderById(req.user._id, req.params.id);
  ok(res, { order });
});

const cancelOrder = catchAsync(async (req, res) => {
  const order = await orderService.cancelOrder(req.user._id, req.params.id, req.body.reason);
  ok(res, { order }, 'Order cancelled');
});

/* ───────────── Payments ───────────── */

/**
 * Lets the checkout UI decide which payment methods to offer before the
 * customer commits to one — no auth needed, and it exposes no secrets.
 */
const paymentConfig = (req, res) => {
  ok(res, {
    razorpayEnabled: paymentService.isConfigured(),
    codEnabled: true,
  });
};

const createPaymentSession = catchAsync(async (req, res) => {
  const session = await paymentService.createPaymentSession(req.user._id, req.body.orderId);
  ok(res, { session }, 'Payment session created');
});

const verifyPayment = catchAsync(async (req, res) => {
  const order = await paymentService.verifyAndCapture(req.user._id, req.body);
  ok(res, { order }, 'Payment verified');
});

const failPayment = catchAsync(async (req, res) => {
  const order = await paymentService.markPaymentFailed(
    req.user._id,
    req.body.orderId,
    req.body.reason
  );
  ok(res, { order }, 'Payment marked as failed');
});

/**
 * Razorpay server-to-server webhook. Mounted with a raw body parser so the
 * signature is computed over the exact bytes Razorpay signed.
 */
const razorpayWebhook = catchAsync(async (req, res) => {
  // The global JSON parser runs first and stores the untouched bytes on
  // req.rawBody; fall back to a Buffer body if this route is ever mounted raw.
  const raw = req.rawBody || (Buffer.isBuffer(req.body) ? req.body : Buffer.from(''));
  const result = await paymentService.handleWebhook(raw, req.get('x-razorpay-signature'));
  ok(res, result);
});

// Admin
const updateStatus = catchAsync(async (req, res) => {
  // Body validated by orderValidator.updateStatus.
  const order = await orderService.updateOrderStatus(req.params.id, req.body.status, req.body.note);
  ok(res, { order }, 'Order status updated');
});

module.exports = {
  createOrder,
  listMyOrders,
  getMyOrderById,
  cancelOrder,
  updateStatus,
  paymentConfig,
  createPaymentSession,
  verifyPayment,
  failPayment,
  razorpayWebhook,
};
