const Product = require('../models/Product');
const AppError = require('../utils/AppError');
const { parsePagination, paginate } = require('../utils/pagination');

/**
 * Translate frontend query params into a Mongo filter object.
 * Kept separate so it can be reused by list, count, search, etc.
 */
const buildFilter = (query) => {
  const filter = {};

  // Hidden products (e.g. the bespoke configurator's base) never appear in
  // listings, search, facets or the sitemap. Fetching one by slug or id still
  // works, since those paths don't go through this filter.
  filter.hidden = { $ne: true };

  // `?ids=a,b,c` — batch fetch by id. Lets the guest wishlist (which stores
  // only product ids in localStorage) hydrate in one request instead of N.
  if (query.ids) {
    const ids = String(query.ids)
      .split(',')
      .map((id) => id.trim())
      .filter((id) => /^[a-f\d]{24}$/i.test(id))
      .slice(0, 100); // bounded so a crafted query can't build a huge $in
    // An all-invalid list must match nothing rather than everything.
    filter._id = { $in: ids };
  }

  if (query.category) filter.category = query.category;
  if (query.type) filter.type = query.type;
  if (query.occasion) filter.occasion = query.occasion;
  if (query.gemstone) filter.gemstone = query.gemstone;
  if (query.gender) filter.gender = query.gender;
  if (query.collection) filter.collection = query.collection;

  if (query.isBestseller !== undefined) filter.isBestseller = query.isBestseller;
  if (query.isNew !== undefined) filter.isNew = query.isNew;
  if (query.inStock !== undefined) filter.inStock = query.inStock;

  if (query.minPrice != null || query.maxPrice != null) {
    filter.price = {};
    if (query.minPrice != null) filter.price.$gte = Number(query.minPrice);
    if (query.maxPrice != null) filter.price.$lte = Number(query.maxPrice);
  }

  if (query.q) {
    // The $text index only matches whole (stemmed) words, so a shopper typing
    // "dia" would get nothing for "Diamond". Use an anchored-substring regex
    // across the customer-visible fields instead, which is what the search box
    // implies. Input is escaped so regex metacharacters can't be injected.
    const term = String(query.q).trim().slice(0, 80).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (term) {
      const rx = { $regex: term, $options: 'i' };
      filter.$or = [
        { name: rx },
        { description: rx },
        { collection: rx },
        { category: rx },
        { type: rx },
        { metal: rx },
      ];
    }
  }

  return filter;
};

const listProducts = async (query) => {
  const { page, limit, skip, sort } = parsePagination(query);
  const filter = buildFilter(query);

  const [items, total] = await Promise.all([
    Product.find(filter).sort(sort).skip(skip).limit(limit).lean({ virtuals: true }),
    Product.countDocuments(filter),
  ]);

  return paginate({ items, total, page, limit });
};

/**
 * Looks up the current slug first, then any slug the product used before.
 * A match on an old slug returns the product with its *current* slug, which
 * the storefront compares against the requested one to issue a 308 redirect.
 */
const getProductBySlug = async (slug) => {
  const product =
    (await Product.findOne({ slug }).lean({ virtuals: true })) ||
    (await Product.findOne({ previousSlugs: slug }).lean({ virtuals: true }));
  if (!product) throw new AppError('Product not found.', 404);
  return product;
};

const getProductById = async (id) => {
  const product = await Product.findById(id).lean({ virtuals: true });
  if (!product) throw new AppError('Product not found.', 404);
  return product;
};

/**
 * Related products: same type, exclude the source, limit 8.
 */
const getRelated = async (slug, limit = 8) => {
  const source = await Product.findOne({ slug });
  if (!source) throw new AppError('Product not found.', 404);

  return Product.find({
    _id: { $ne: source._id },
    type: source.type,
    inStock: true,
  })
    .limit(limit)
    .lean({ virtuals: true });
};

const createProduct = async (payload) => Product.create(payload);

const updateProduct = async (id, payload) => {
  // Remember the outgoing slug so its URL keeps working as a redirect.
  if (payload.slug) {
    const current = await Product.findById(id).select('slug').lean();
    if (!current) throw new AppError('Product not found.', 404);
    if (current.slug !== payload.slug) {
      const clash = await Product.exists({ _id: { $ne: id }, slug: payload.slug });
      if (clash) throw new AppError('Another product already uses this slug.', 409);
      payload = { ...payload, $addToSet: { previousSlugs: current.slug } };
      // A slug that is current again must not also redirect to itself.
      await Product.updateOne({ _id: id }, { $pull: { previousSlugs: payload.slug } });
    }
  }
  const product = await Product.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
  if (!product) throw new AppError('Product not found.', 404);
  return product;
};

const deleteProduct = async (id) => {
  const product = await Product.findByIdAndDelete(id);
  if (!product) throw new AppError('Product not found.', 404);
  return product;
};

/**
 * Aggregated facet counts for the filter sidebar — so the UI can show
 * "Diamond (124), Gold (89)…" without firing N queries.
 */
const getFacets = async (baseQuery = {}) => {
  const baseFilter = buildFilter(baseQuery);

  const [byCategory, byType, byOccasion, byGemstone, priceRange] = await Promise.all([
    Product.aggregate([{ $match: baseFilter }, { $group: { _id: '$category', count: { $sum: 1 } } }]),
    Product.aggregate([{ $match: baseFilter }, { $group: { _id: '$type', count: { $sum: 1 } } }]),
    Product.aggregate([{ $match: baseFilter }, { $group: { _id: '$occasion', count: { $sum: 1 } } }]),
    Product.aggregate([{ $match: baseFilter }, { $group: { _id: '$gemstone', count: { $sum: 1 } } }]),
    Product.aggregate([
      { $match: baseFilter },
      { $group: { _id: null, min: { $min: '$price' }, max: { $max: '$price' } } },
    ]),
  ]);

  return {
    category: byCategory,
    type: byType,
    occasion: byOccasion,
    gemstone: byGemstone,
    price: priceRange[0] || { min: 0, max: 0 },
  };
};

module.exports = {
  listProducts,
  getProductBySlug,
  getProductById,
  getRelated,
  createProduct,
  updateProduct,
  deleteProduct,
  getFacets,
};
