const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');
const AppError = require('../utils/AppError');

const getOrCreate = async (userId) => {
  let wishlist = await Wishlist.findOne({ user: userId }).populate('products', 'slug name images price originalPrice inStock isBestseller isNew');
  if (!wishlist) {
    wishlist = await Wishlist.create({ user: userId, products: [] });
  }
  return wishlist;
};

const getWishlist = (userId) => getOrCreate(userId);

/**
 * Toggle product in wishlist — adds if absent, removes if present.
 * Single endpoint matches the frontend's heart-icon UX cleanly.
 */
const toggle = async (userId, productId) => {
  const product = await Product.findById(productId);
  if (!product) throw new AppError('Product not found.', 404);

  const wishlist = await getOrCreate(userId);
  const index = wishlist.products.findIndex((p) => p._id.toString() === productId);

  let added;
  if (index === -1) {
    wishlist.products.push(productId);
    added = true;
  } else {
    wishlist.products.splice(index, 1);
    added = false;
  }

  await wishlist.save();
  await wishlist.populate('products', 'slug name images price originalPrice inStock isBestseller isNew');
  return { wishlist, added };
};

const remove = async (userId, productId) => {
  const wishlist = await getOrCreate(userId);
  wishlist.products = wishlist.products.filter((p) => p._id.toString() !== productId);
  await wishlist.save();
  await wishlist.populate('products', 'slug name images price originalPrice inStock isBestseller isNew');
  return wishlist;
};

const clear = async (userId) => {
  const wishlist = await getOrCreate(userId);
  wishlist.products = [];
  await wishlist.save();
  return wishlist;
};

module.exports = { getWishlist, toggle, remove, clear };
