const productService = require('../services/productService');
const customRingService = require('../services/customRingService');
const imageSearchService = require('../services/imageSearchService');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const { ok, created, noContent } = require('../utils/apiResponse');

const listProducts = catchAsync(async (req, res) => {
  const result = await productService.listProducts(req.query);
  ok(res, result);
});

const getProductBySlug = catchAsync(async (req, res) => {
  const product = await productService.getProductBySlug(req.params.slug);
  ok(res, { product });
});

const getProductById = catchAsync(async (req, res) => {
  const product = await productService.getProductById(req.params.id);
  ok(res, { product });
});

const getRelated = catchAsync(async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 8;
  const items = await productService.getRelated(req.params.slug, limit);
  ok(res, { items });
});

const getFacets = catchAsync(async (req, res) => {
  const facets = await productService.getFacets(req.query);
  ok(res, { facets });
});

const createProduct = catchAsync(async (req, res) => {
  const product = await productService.createProduct(req.body);
  created(res, { product }, 'Product created');
});

const updateProduct = catchAsync(async (req, res) => {
  const product = await productService.updateProduct(req.params.id, req.body);
  ok(res, { product }, 'Product updated');
});

const deleteProduct = catchAsync(async (req, res) => {
  await productService.deleteProduct(req.params.id);
  noContent(res);
});

/* ───────────── Bespoke ring configurator ───────────── */

// Rate card + option lists for the builder UI.
const customRingOptions = (req, res) => {
  ok(res, customRingService.getOptions());
};

// Prices a configuration. Pricing lives on the server so a tampered payload
// can never set its own total.
const customRingQuote = catchAsync(async (req, res) => {
  ok(res, { quote: customRingService.quote(req.body) });
});

/* ───────────── Visual search ───────────── */

// POST /products/image-search — multipart, single file under "image".
const searchByImage = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('No image supplied. Attach a photo under the "image" field.', 400));
  }

  const result = await imageSearchService.searchByImage(req.file.buffer, {
    limit: req.query.limit,
    category: req.query.category,
    type: req.query.type,
  });

  ok(res, result);
});

// Lets the storefront show "ready / still indexing" instead of a blank wait.
const imageSearchStatus = (req, res) => {
  ok(res, imageSearchService.indexStatus());
};

module.exports = {
  customRingOptions,
  customRingQuote,
  searchByImage,
  imageSearchStatus,
  listProducts,
  getProductBySlug,
  getProductById,
  getRelated,
  getFacets,
  createProduct,
  updateProduct,
  deleteProduct,
};
