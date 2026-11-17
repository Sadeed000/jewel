const crypto = require('crypto');
const Order = require('../models/Order');
const AppError = require('../utils/AppError');

/**
 * Razorpay integration.
 *
 * Talks to the Razorpay REST API directly with `fetch` and verifies webhooks
 * and client callbacks with node's `crypto`, rather than pulling in the SDK —
 * the SDK is a thin wrapper over exactly these two things.
 *
 * Configure via backend/.env:
 *   RAZORPAY_KEY_ID=rzp_test_xxxxxxxx
 *   RAZORPAY_KEY_SECRET=xxxxxxxx
 *   RAZORPAY_WEBHOOK_SECRET=xxxxxxxx   (optional, for the webhook route)
 *
 * With no keys configured the gateway reports itself unavailable and the
 * storefront falls back to Cash on Delivery, so local development and COD
 * orders keep working without an account.
 */

const RAZORPAY_API = 'https://api.razorpay.com/v1';

const keyId = () => process.env.RAZORPAY_KEY_ID;
const keySecret = () => process.env.RAZORPAY_KEY_SECRET;

/** Whether online payment can be offered at all. */
const isConfigured = () => Boolean(keyId() && keySecret());

const authHeader = () =>
  `Basic ${Buffer.from(`${keyId()}:${keySecret()}`).toString('base64')}`;

/**
 * Create a Razorpay order for an existing Aurelia order.
 * Amounts are sent in paise, so we convert from rupees and round defensively.
 */
const createPaymentSession = async (userId, orderId) => {
  if (!isConfigured()) {
    throw new AppError(
      'Online payment is not available right now. Please choose Cash on Delivery.',
      503
    );
  }

  const order = await Order.findOne({ _id: orderId, user: userId });
  if (!order) throw new AppError('Order not found.', 404);
  if (order.paymentStatus === 'paid') {
    throw new AppError('This order has already been paid for.', 400);
  }
  if (order.status === 'cancelled') {
    throw new AppError('This order has been cancelled.', 400);
  }

  const amountInPaise = Math.round(order.total * 100);

  let response;
  try {
    response = await fetch(`${RAZORPAY_API}/orders`, {
      method: 'POST',
      headers: {
        Authorization: authHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: 'INR',
        // Lets us reconcile a Razorpay order back to ours from their dashboard.
        receipt: order.orderNumber,
        notes: {
          orderNumber: order.orderNumber,
          aureliaOrderId: order._id.toString(),
        },
      }),
    });
  } catch (err) {
    throw new AppError(`Could not reach the payment gateway: ${err.message}`, 502);
  }

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const reason = payload?.error?.description || `gateway responded ${response.status}`;
    throw new AppError(`Payment could not be initiated (${reason}).`, 502);
  }

  // Record the gateway order id so the verification step can cross-check it.
  order.transactionId = payload.id;
  await order.save();

  return {
    gateway: 'razorpay',
    // The publishable key — safe to expose to the browser.
    keyId: keyId(),
    razorpayOrderId: payload.id,
    amount: payload.amount,
    currency: payload.currency,
    orderNumber: order.orderNumber,
    orderId: order._id.toString(),
  };
};

/**
 * Verify the checkout callback and mark the order paid.
 *
 * Razorpay signs `${razorpay_order_id}|${razorpay_payment_id}` with the key
 * secret. Verifying it server-side is what makes the callback trustworthy —
 * without this check a client could simply claim payment succeeded.
 */
const verifyAndCapture = async (userId, payload) => {
  if (!isConfigured()) throw new AppError('Payment gateway is not configured.', 503);

  const { razorpayOrderId, razorpayPaymentId, signature, orderId } = payload;

  const order = await Order.findOne({ _id: orderId, user: userId });
  if (!order) throw new AppError('Order not found.', 404);

  // Idempotent: a duplicate callback (double-click, retry) is not an error.
  if (order.paymentStatus === 'paid') return order;

  // The session step stored the gateway order id; a mismatch means the
  // callback belongs to a different order.
  if (order.transactionId && order.transactionId !== razorpayOrderId) {
    throw new AppError('Payment does not match this order.', 400);
  }

  const expected = crypto
    .createHmac('sha256', keySecret())
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  // Constant-time compare so a signature can't be brute-forced by timing.
  const provided = Buffer.from(String(signature || ''), 'utf8');
  const expectedBuf = Buffer.from(expected, 'utf8');
  const valid =
    provided.length === expectedBuf.length &&
    crypto.timingSafeEqual(provided, expectedBuf);

  if (!valid) {
    order.paymentStatus = 'failed';
    order.statusHistory.push({
      status: order.status,
      note: 'Payment signature verification failed',
    });
    await order.save();
    throw new AppError('Payment verification failed.', 400);
  }

  order.paymentStatus = 'paid';
  order.transactionId = razorpayPaymentId;
  order.statusHistory.push({ status: order.status, note: 'Payment received' });
  await order.save();

  return order;
};

/**
 * Mark an order's payment as failed — called when the customer dismisses the
 * gateway or it reports an error. The order itself is left intact so the
 * customer can retry from their order history.
 */
const markPaymentFailed = async (userId, orderId, reason) => {
  const order = await Order.findOne({ _id: orderId, user: userId });
  if (!order) throw new AppError('Order not found.', 404);
  if (order.paymentStatus === 'paid') return order;

  order.paymentStatus = 'failed';
  order.statusHistory.push({
    status: order.status,
    note: reason ? `Payment failed: ${reason}` : 'Payment failed',
  });
  await order.save();
  return order;
};

/**
 * Webhook handler — the authoritative payment signal.
 *
 * The browser callback can be lost (tab closed, network drop) after money has
 * actually moved, so Razorpay also posts server-to-server. This uses the
 * separate webhook secret and the raw request body, which must not be
 * re-serialised before hashing.
 */
const handleWebhook = async (rawBody, signature) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) throw new AppError('Webhook secret is not configured.', 503);

  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const provided = Buffer.from(String(signature || ''), 'utf8');
  const expectedBuf = Buffer.from(expected, 'utf8');

  if (provided.length !== expectedBuf.length || !crypto.timingSafeEqual(provided, expectedBuf)) {
    throw new AppError('Invalid webhook signature.', 400);
  }

  const event = JSON.parse(rawBody.toString('utf8'));
  const entity = event?.payload?.payment?.entity;
  if (!entity) return { handled: false };

  // `notes` was populated when the session was created.
  const aureliaOrderId = entity.notes?.aureliaOrderId;
  if (!aureliaOrderId) return { handled: false };

  const order = await Order.findById(aureliaOrderId);
  if (!order) return { handled: false };

  if (event.event === 'payment.captured' && order.paymentStatus !== 'paid') {
    order.paymentStatus = 'paid';
    order.transactionId = entity.id;
    order.statusHistory.push({ status: order.status, note: 'Payment confirmed via webhook' });
    await order.save();
  } else if (event.event === 'payment.failed' && order.paymentStatus === 'pending') {
    order.paymentStatus = 'failed';
    order.statusHistory.push({ status: order.status, note: 'Payment failed (webhook)' });
    await order.save();
  }

  return { handled: true };
};

module.exports = {
  isConfigured,
  createPaymentSession,
  verifyAndCapture,
  markPaymentFailed,
  handleWebhook,
};
