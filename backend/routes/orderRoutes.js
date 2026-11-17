const express = require('express');
const orderController = require('../controllers/orderController');
const { protect, restrictTo } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const {
  createOrder,
  cancelOrder,
  createPaymentSession,
  verifyPayment,
  failPayment,
} = require('../validators/orderValidator');

const router = express.Router();

/* ───────────── Unauthenticated ─────────────
   Declared before `protect` so they stay reachable. */

// Lets the checkout page know which payment methods to offer.
router.get('/payment/config', orderController.paymentConfig);

/* Razorpay webhook. `express.raw` is required: the signature is computed over
   the exact request bytes, so the global JSON parser would invalidate it.
   Razorpay authenticates with that signature rather than a user session, so
   this route must sit outside `protect`. */
router.post(
  '/payment/webhook',
  express.raw({ type: 'application/json' }),
  orderController.razorpayWebhook
);

/* ───────────── Authenticated ───────────── */
router.use(protect);

router.post('/', validate(createOrder), orderController.createOrder);
router.get('/my', orderController.listMyOrders);
router.get('/my/:id', orderController.getMyOrderById);
router.post('/my/:id/cancel', validate(cancelOrder), orderController.cancelOrder);

router.post(
  '/payment/session',
  validate(createPaymentSession),
  orderController.createPaymentSession
);
router.post('/payment/verify', validate(verifyPayment), orderController.verifyPayment);
router.post('/payment/failed', validate(failPayment), orderController.failPayment);

// Admin
router.patch('/:id/status', restrictTo('admin'), orderController.updateStatus);

module.exports = router;
