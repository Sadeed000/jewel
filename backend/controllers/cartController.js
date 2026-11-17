const cartService = require('../services/cartService');
const catchAsync = require('../utils/catchAsync');
const { ok, noContent } = require('../utils/apiResponse');

const getCart = catchAsync(async (req, res) => {
  const cart = await cartService.getCart(req.user._id);
  ok(res, { cart });
});

const addItem = catchAsync(async (req, res) => {
  const cart = await cartService.addItem(req.user._id, req.body);
  ok(res, { cart }, 'Added to cart');
});

const updateItem = catchAsync(async (req, res) => {
  const cart = await cartService.updateItem(req.user._id, req.params.itemId, req.body);
  ok(res, { cart }, 'Cart updated');
});

const removeItem = catchAsync(async (req, res) => {
  const cart = await cartService.removeItem(req.user._id, req.params.itemId);
  ok(res, { cart }, 'Item removed');
});

const clearCart = catchAsync(async (req, res) => {
  await cartService.clearCart(req.user._id);
  noContent(res);
});

const applyCoupon = catchAsync(async (req, res) => {
  const cart = await cartService.applyCoupon(req.user._id, req.body.code);
  ok(res, { cart }, 'Coupon applied');
});

const removeCoupon = catchAsync(async (req, res) => {
  const cart = await cartService.removeCoupon(req.user._id);
  ok(res, { cart }, 'Coupon removed');
});

module.exports = { getCart, addItem, updateItem, removeItem, clearCart, applyCoupon, removeCoupon };
