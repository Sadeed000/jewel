const Cart = require('../models/Cart');
const Product = require('../models/Product');
const AppError = require('../utils/AppError');
const customRingService = require('./customRingService');

/**
 * Get or create the user's cart. We lazily create it on first access so
 * a brand-new user always sees a valid cart shape rather than a 404.
 */
const POPULATE_FIELDS = 'slug name images inStock stockQty';

/**
 * Coupon engine — the single source of truth for discount maths, shared with
 * orderService so the amount charged is always recomputed from the final
 * subtotal. Returns null when the code is unknown or not applicable.
 *   WELCOME10 = 10% off (max ₹2,000), FLAT500 = ₹500 off (min order ₹5,000).
 */
const computeCouponDiscount = (code, subtotal) => {
  const normalised = String(code || '').toUpperCase().trim();
  if (normalised === 'WELCOME10') return Math.min(2000, Math.round(subtotal * 0.1));
  if (normalised === 'FLAT500' && subtotal >= 5000) return 500;
  return null;
};

/** Re-derive the stored discount after the cart contents change. */
const refreshCoupon = (cart) => {
  if (!cart.couponCode) return;
  const discount = computeCouponDiscount(cart.couponCode, cart.subtotal);
  if (discount === null) {
    cart.couponCode = undefined;
    cart.couponDiscount = 0;
  } else {
    cart.couponDiscount = discount;
  }
};

const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId }).populate('items.product', POPULATE_FIELDS);
  if (!cart) {
    return Cart.create({ user: userId, items: [] });
  }
  /* A product deleted from the catalogue populates as null; such a line can't
     be bought and would crash anything that reads item.product. Drop it. */
  const live = cart.items.filter((it) => it.product);
  if (live.length !== cart.items.length) {
    cart.items = live;
    refreshCoupon(cart);
    await cart.save();
  }
  return cart;
};

const getCart = async (userId) => getOrCreateCart(userId);

const addItem = async (userId, { productId, quantity = 1, size, customisation }) => {
  const product = await Product.findById(productId);
  if (!product) throw new AppError('Product not found.', 404);
  if (!product.inStock) throw new AppError('This product is currently out of stock.', 400);
  if (product.stockQty < quantity) {
    throw new AppError(`Only ${product.stockQty} units available.`, 400);
  }

  const cart = await getOrCreateCart(userId);

  /* ── Resolve personalisation and price ──
     A bespoke ring is priced from its configuration by customRingService, so
     the amount charged is derived on the server and a tampered payload can't
     set its own total. */
  let priceAtAdd = product.price;
  let nameAtAdd = product.name;
  let storedCustomisation;

  if (customisation?.type === 'custom-ring') {
    const quoted = customRingService.quote(customisation.ring || {});
    priceAtAdd = quoted.total;
    nameAtAdd = quoted.description;
    storedCustomisation = {
      type: 'custom-ring',
      ring: quoted.config,
      engraving: quoted.config.engraving,
      summary: quoted.description,
    };
    // Made to order, so it isn't drawn from shelf stock.
    size = quoted.config.size;
  } else if (customisation?.type === 'engraving') {
    const text = String(customisation.engraving || '').trim();
    if (!text) throw new AppError('Engraving text is required.', 400);
    if (!product.engravingAvailable) {
      throw new AppError('This piece cannot be engraved.', 400);
    }
    const limit = product.engravingMaxChars || 20;
    if (text.length > limit) {
      throw new AppError(`Engraving is limited to ${limit} characters.`, 400);
    }
    priceAtAdd = product.price + customRingService.ENGRAVING_FEE;
    storedCustomisation = {
      type: 'engraving',
      engraving: text,
      summary: `Engraved “${text}”`,
    };
  }

  /* Personalised lines are never merged: two rings engraved differently are
     different items even though they share a product and size. */
  const existing = storedCustomisation
    ? null
    : cart.items.find(
        (it) =>
          it.product._id.toString() === productId &&
          it.size === size &&
          !it.customisation?.type
      );

  if (existing) {
    const merged = Math.min(20, existing.quantity + quantity);
    if (merged > product.stockQty) {
      throw new AppError(`Only ${product.stockQty} units available.`, 400);
    }
    existing.quantity = merged;
  } else {
    cart.items.push({
      product: productId,
      quantity,
      size,
      priceAtAdd,
      nameAtAdd,
      imageAtAdd: product.images[0],
      ...(storedCustomisation ? { customisation: storedCustomisation } : {}),
    });
  }

  refreshCoupon(cart);
  await cart.save();
  return cart.populate('items.product', POPULATE_FIELDS);
};

const updateItem = async (userId, itemId, { quantity }) => {
  const cart = await getOrCreateCart(userId);
  const item = cart.items.id(itemId);
  if (!item) throw new AppError('Cart item not found.', 404);

  // Made-to-order rings aren't drawn from shelf stock.
  if (!item.customisation?.type && item.product?.stockQty != null && quantity > item.product.stockQty) {
    throw new AppError(`Only ${item.product.stockQty} units available.`, 400);
  }

  item.quantity = quantity;
  refreshCoupon(cart);
  await cart.save();
  return cart.populate('items.product', POPULATE_FIELDS);
};

const removeItem = async (userId, itemId) => {
  const cart = await getOrCreateCart(userId);
  const item = cart.items.id(itemId);
  if (!item) throw new AppError('Cart item not found.', 404);

  item.deleteOne();
  refreshCoupon(cart);
  await cart.save();
  return cart.populate('items.product', POPULATE_FIELDS);
};

const clearCart = async (userId) => {
  const cart = await getOrCreateCart(userId);
  cart.items = [];
  cart.couponCode = undefined;
  cart.couponDiscount = 0;
  await cart.save();
  return cart;
};

const applyCoupon = async (userId, code) => {
  const cart = await getOrCreateCart(userId);
  const normalised = code.toUpperCase().trim();

  const discount = computeCouponDiscount(normalised, cart.subtotal);
  if (discount === null) {
    throw new AppError('Invalid or inapplicable coupon code.', 400);
  }

  cart.couponCode = normalised;
  cart.couponDiscount = discount;
  await cart.save();
  return cart.populate('items.product', POPULATE_FIELDS);
};

const removeCoupon = async (userId) => {
  const cart = await getOrCreateCart(userId);
  cart.couponCode = undefined;
  cart.couponDiscount = 0;
  await cart.save();
  return cart;
};

module.exports = {
  computeCouponDiscount,
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearCart,
  applyCoupon,
  removeCoupon,
};
