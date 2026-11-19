const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const AppError = require('../utils/AppError');
const { parsePagination, paginate } = require('../utils/pagination');
const { computeCouponDiscount } = require('./cartService');

const SHIPPING_FREE_THRESHOLD = 1000; // free shipping above this amount
const SHIPPING_FEE = 99;
const TAX_RATE = 0.03;

/**
 * Build the orderItem array from a list of {productId, quantity, size} entries.
 * Fetches current product data so price/name/image are accurate snapshots.
 */
const buildOrderItems = async (rawItems) => {
  if (!rawItems || rawItems.length === 0) {
    throw new AppError('Order must contain at least one item.', 400);
  }

  const ids = rawItems.map((it) => it.productId);
  const products = await Product.find({ _id: { $in: ids } });
  const byId = new Map(products.map((p) => [p._id.toString(), p]));

  const items = rawItems.map((raw) => {
    const product = byId.get(raw.productId);
    if (!product) {
      throw new AppError(`Product ${raw.productId} not found.`, 404);
    }
    if (!product.inStock) {
      throw new AppError(`"${product.name}" is out of stock.`, 400);
    }
    if (product.stockQty < raw.quantity) {
      throw new AppError(`Only ${product.stockQty} units of "${product.name}" available.`, 400);
    }
    // Bespoke lines were priced by customRingService when they were added to
    // the cart; catalogue lines always re-read the current product price.
    const unitPrice =
      typeof raw.unitPriceOverride === 'number' ? raw.unitPriceOverride : product.price;

    return {
      product: product._id,
      name: raw.nameOverride || product.name,
      image: product.images[0],
      slug: product.slug,
      size: raw.size,
      quantity: raw.quantity,
      unitPrice,
      subtotal: unitPrice * raw.quantity,
      ...(raw.customisation ? { customisation: raw.customisation } : {}),
    };
  });

  return { items, products };
};

/**
 * Return reserved units to the catalogue.
 *
 * Used both to roll back a partially-reserved checkout and to restock a
 * cancelled order. `inStock` is re-enabled because any positive quantity
 * means the product is buyable again.
 */
const releaseStock = async (items = []) => {
  if (!items.length) return;
  await Promise.all(
    items.map((it) =>
      Product.updateOne(
        { _id: it.product },
        { $inc: { stockQty: it.quantity }, $set: { inStock: true } }
      ).catch((err) => {
        // A failed release must not mask the original error that triggered it.
        console.error(`[orderService] failed to release stock for ${it.product}:`, err.message);
      })
    )
  );
};

/**
 * Create an order. Two modes:
 *   1. `items` supplied in payload  → place order directly from those items
 *   2. `items` omitted              → use the user's saved cart
 *
 * Stock is decremented atomically per product. Cart is cleared on success.
 */
const createOrder = async (userId, payload) => {
  let rawItems = payload.items;
  let cart = null;
  let couponCode;
  let couponDiscount = 0;

  if (!rawItems || rawItems.length === 0) {
    cart = await Cart.findOne({ user: userId });
    if (!cart || cart.items.length === 0) {
      throw new AppError('Your cart is empty.', 400);
    }
    rawItems = cart.items.map((it) => ({
      productId: it.product.toString(),
      quantity: it.quantity,
      size: it.size,
      // Carry the personalisation and the price the server already computed
      // for it, so a bespoke ring isn't re-priced at the base product's rate.
      customisation: it.customisation?.type ? it.customisation.toObject?.() ?? it.customisation : undefined,
      unitPriceOverride: it.customisation?.type ? it.priceAtAdd : undefined,
      nameOverride: it.customisation?.type ? it.nameAtAdd : undefined,
    }));
    couponCode = cart.couponCode;
    couponDiscount = cart.couponDiscount || 0;
  }

  const { items } = await buildOrderItems(rawItems);

  /* ── Reserve stock atomically, before the order document exists ──
     buildOrderItems only *checks* availability; between that check and the
     write, a concurrent checkout could take the last unit. Each update below
     is a single conditional document operation ($gte guard + $inc), so the
     database — not application code — arbitrates who gets the last piece.
     Anything already reserved is released if a later item fails. */
  const reserved = [];
  try {
    for (const item of items) {
      const updated = await Product.findOneAndUpdate(
        { _id: item.product, inStock: true, stockQty: { $gte: item.quantity } },
        { $inc: { stockQty: -item.quantity } },
        { new: true }
      );

      if (!updated) {
        throw new AppError(
          `"${item.name}" is no longer available in the requested quantity.`,
          409
        );
      }

      reserved.push(item);

      // Keep the derived availability flags in step with the new count.
      const flags = {};
      if (updated.stockQty === 0) flags.inStock = false;
      if (updated.stockQty === 1) flags.onlyOneLeft = true;
      if (updated.stockQty > 1 && updated.onlyOneLeft) flags.onlyOneLeft = false;
      if (Object.keys(flags).length) {
        await Product.updateOne({ _id: item.product }, { $set: flags });
      }
    }
  } catch (err) {
    await releaseStock(reserved);
    throw err;
  }

  const subtotal = items.reduce((sum, it) => sum + it.subtotal, 0);
  // Recompute against the final subtotal: the stored figure was calculated
  // when the coupon was applied and may be stale (prices or quantities moved).
  const recomputed = couponCode ? computeCouponDiscount(couponCode, subtotal) : null;
  if (recomputed === null) couponCode = undefined;
  const discount = recomputed ?? 0;
  const afterDiscount = Math.max(0, subtotal - discount);
  const shippingFee = afterDiscount >= SHIPPING_FREE_THRESHOLD ? 0 : SHIPPING_FEE;
  const tax = Math.round(afterDiscount * TAX_RATE);
  const total = afterDiscount + shippingFee + tax;

  let order;
  try {
    order = await Order.create({
      user: userId,
      items,
      shippingAddress: payload.shippingAddress,
      paymentMethod: payload.paymentMethod,
      /* Payment is only ever marked paid by the gateway verification step
         (see paymentService.verifyAndCapture). Creating an order never
         asserts money was received — COD is collected on delivery and every
         online method starts pending until the signature checks out. */
      paymentStatus: 'pending',
      subtotal,
      shippingFee,
      tax,
      discount,
      couponCode,
      total,
      isGift: payload.isGift,
      giftNote: payload.giftNote,
    });
  } catch (err) {
    // Never leave stock reserved against an order that doesn't exist.
    await releaseStock(items);
    throw err;
  }

  // Clear cart if order originated from it
  if (cart) {
    cart.items = [];
    cart.couponCode = undefined;
    cart.couponDiscount = 0;
    await cart.save();
  }

  return order;
};

const listMyOrders = async (userId, query) => {
  const { page, limit, skip, sort } = parsePagination(query, { sort: '-createdAt' });

  const filter = { user: userId };
  if (query.status) filter.status = query.status;

  const [items, total] = await Promise.all([
    Order.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Order.countDocuments(filter),
  ]);

  return paginate({ items, total, page, limit });
};

const getMyOrderById = async (userId, orderId) => {
  // Accept either Mongo _id or orderNumber so the frontend can use a readable id in URLs
  const query = orderId.match(/^[0-9a-fA-F]{24}$/)
    ? { _id: orderId, user: userId }
    : { orderNumber: orderId, user: userId };

  const order = await Order.findOne(query).lean();
  if (!order) throw new AppError('Order not found.', 404);
  return order;
};

const cancelOrder = async (userId, orderId, reason) => {
  const order = await Order.findOne({ _id: orderId, user: userId });
  if (!order) throw new AppError('Order not found.', 404);

  if (['shipped', 'out-for-delivery', 'delivered', 'cancelled', 'returned'].includes(order.status)) {
    throw new AppError(`This order cannot be cancelled (current status: ${order.status}).`, 400);
  }

  order.status = 'cancelled';
  order.cancelledAt = new Date();
  order.cancellationReason = reason;
  order.statusHistory.push({ status: 'cancelled', note: reason });
  await order.save();

  await releaseStock(order.items);

  return order;
};

/**
 * Admin: update order status. Used by an internal dashboard.
 */
const updateOrderStatus = async (orderId, status, note) => {
  const order = await Order.findById(orderId);
  if (!order) throw new AppError('Order not found.', 404);

  order.status = status;
  order.statusHistory.push({ status, note });
  if (status === 'delivered') order.deliveredAt = new Date();

  await order.save();
  return order;
};

module.exports = {
  createOrder,
  listMyOrders,
  getMyOrderById,
  cancelOrder,
  updateOrderStatus,
};
