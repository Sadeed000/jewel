const Cart = require('../models/Cart');
const Product = require('../models/Product');
const AppError = require('../utils/AppError');
const customRingService = require('./customRingService');

/**
 * Get or create the user's cart. We lazily create it on first access so
 * a brand-new user always sees a valid cart shape rather than a 404.
 */
const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId }).populate('items.product', 'slug name images inStock stockQty');
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
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
    existing.quantity = Math.min(20, existing.quantity + quantity);
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

  await cart.save();
  return cart.populate('items.product', 'slug name images inStock stockQty');
};

const updateItem = async (userId, itemId, { quantity }) => {
  const cart = await getOrCreateCart(userId);
  const item = cart.items.id(itemId);
  if (!item) throw new AppError('Cart item not found.', 404);

  item.quantity = quantity;
  await cart.save();
  return cart.populate('items.product', 'slug name images inStock stockQty');
};

const removeItem = async (userId, itemId) => {
  const cart = await getOrCreateCart(userId);
  const item = cart.items.id(itemId);
  if (!item) throw new AppError('Cart item not found.', 404);

  item.deleteOne();
  await cart.save();
  return cart.populate('items.product', 'slug name images inStock stockQty');
};

const clearCart = async (userId) => {
  const cart = await getOrCreateCart(userId);
  cart.items = [];
  cart.couponCode = undefined;
  cart.couponDiscount = 0;
  await cart.save();
  return cart;
};

/**
 * Stub coupon engine — replace with real coupon model later.
 * For now: WELCOME10 = 10% off (max ₹2,000), FLAT500 = ₹500 off (min order ₹5,000).
 */
const applyCoupon = async (userId, code) => {
  const cart = await getOrCreateCart(userId);
  const normalised = code.toUpperCase().trim();

  let discount = 0;
  if (normalised === 'WELCOME10') {
    discount = Math.min(2000, Math.round(cart.subtotal * 0.1));
  } else if (normalised === 'FLAT500' && cart.subtotal >= 5000) {
    discount = 500;
  } else {
    throw new AppError('Invalid or inapplicable coupon code.', 400);
  }

  cart.couponCode = normalised;
  cart.couponDiscount = discount;
  await cart.save();
  return cart.populate('items.product', 'slug name images inStock stockQty');
};

const removeCoupon = async (userId) => {
  const cart = await getOrCreateCart(userId);
  cart.couponCode = undefined;
  cart.couponDiscount = 0;
  await cart.save();
  return cart;
};

module.exports = {
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearCart,
  applyCoupon,
  removeCoupon,
};
