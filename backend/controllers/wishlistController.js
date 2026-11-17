const wishlistService = require('../services/wishlistService');
const catchAsync = require('../utils/catchAsync');
const { ok, noContent } = require('../utils/apiResponse');

const getWishlist = catchAsync(async (req, res) => {
  const wishlist = await wishlistService.getWishlist(req.user._id);
  ok(res, { wishlist });
});

const toggle = catchAsync(async (req, res) => {
  const { wishlist, added } = await wishlistService.toggle(req.user._id, req.params.productId);
  ok(res, { wishlist, added }, added ? 'Added to wishlist' : 'Removed from wishlist');
});

const remove = catchAsync(async (req, res) => {
  const wishlist = await wishlistService.remove(req.user._id, req.params.productId);
  ok(res, { wishlist }, 'Removed from wishlist');
});

const clear = catchAsync(async (req, res) => {
  await wishlistService.clear(req.user._id);
  noContent(res);
});

module.exports = { getWishlist, toggle, remove, clear };
