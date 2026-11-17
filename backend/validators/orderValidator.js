const Joi = require('joi');

const shippingAddress = Joi.object({
  firstName: Joi.string().min(1).max(50).required(),
  lastName: Joi.string().max(50).allow('', null),
  phone: Joi.string().pattern(/^[+\d\s-]{7,20}$/).required(),
  line1: Joi.string().min(3).max(200).required(),
  line2: Joi.string().max(200).allow('', null),
  city: Joi.string().min(2).max(100).required(),
  state: Joi.string().min(2).max(100).required(),
  pincode: Joi.string().pattern(/^\d{6}$/).required(),
  country: Joi.string().default('India'),
});

const createOrder = Joi.object({
  shippingAddress: shippingAddress.required(),
  paymentMethod: Joi.string()
    .valid('card', 'upi', 'netbanking', 'cod', 'digital-gold', 'gift-card')
    .required(),
  isGift: Joi.boolean().default(false),
  giftNote: Joi.string().max(500).allow('', null),
  // Optional: place an order directly without depending on the cart.
  items: Joi.array()
    .items(
      Joi.object({
        productId: Joi.string().hex().length(24).required(),
        quantity: Joi.number().integer().min(1).max(20).default(1),
        size: Joi.string().max(10).allow('', null),
      })
    )
    .optional(),
});

const cancelOrder = Joi.object({
  reason: Joi.string().min(3).max(300).required(),
});

/* ───────────── Payments ───────────── */

const createPaymentSession = Joi.object({
  orderId: Joi.string().hex().length(24).required(),
});

const verifyPayment = Joi.object({
  orderId: Joi.string().hex().length(24).required(),
  razorpayOrderId: Joi.string().max(100).required(),
  razorpayPaymentId: Joi.string().max(100).required(),
  signature: Joi.string().max(200).required(),
});

const failPayment = Joi.object({
  orderId: Joi.string().hex().length(24).required(),
  reason: Joi.string().max(300).allow('', null),
});

module.exports = {
  createOrder,
  cancelOrder,
  createPaymentSession,
  verifyPayment,
  failPayment,
};
