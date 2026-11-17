const express = require('express');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const productController = require('../controllers/productController');
const { protect, restrictTo } = require('../middlewares/auth');
const { uploadToMemory, MAX_FILE_SIZE } = require('../middlewares/upload');
const validate = require('../middlewares/validate');
const AppError = require('../utils/AppError');
const { productCreate, productUpdate, productListQuery } = require('../validators/miscValidators');

const router = express.Router();

/* ───────────── Public ─────────────
   Declared before '/:id' so "custom" isn't captured as a product id. */
router.get('/custom/options', productController.customRingOptions);
router.post('/custom/quote', productController.customRingQuote);

/* ───────────── Visual search ─────────────
   Decoding and scoring an image costs far more than a normal query, so it gets
   a tighter limit than the global one. */
const imageSearchLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 'fail', message: 'Too many image searches. Please wait a moment and try again.' },
});

const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(new AppError(`Image too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.`, 400));
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return next(new AppError('Unexpected field. Send the photo under the "image" field.', 400));
    }
    return next(new AppError(`Upload error: ${err.message}`, 400));
  }
  next(err);
};

router.get('/image-search/status', productController.imageSearchStatus);
router.post(
  '/image-search',
  imageSearchLimiter,
  uploadToMemory.single('image'),
  handleUploadError,
  productController.searchByImage
);

router.get('/', validate(productListQuery, 'query'), productController.listProducts);
router.get('/facets', validate(productListQuery, 'query'), productController.getFacets);
router.get('/slug/:slug', productController.getProductBySlug);
router.get('/slug/:slug/related', productController.getRelated);
router.get('/:id', productController.getProductById);

/* ───────────── Admin ───────────── */
router.post('/', protect, restrictTo('admin'), validate(productCreate), productController.createProduct);
router.patch('/:id', protect, restrictTo('admin'), validate(productUpdate), productController.updateProduct);
router.delete('/:id', protect, restrictTo('admin'), productController.deleteProduct);

module.exports = router;
