const express = require('express');
const multer = require('multer');
const { protect, restrictTo } = require('../middlewares/auth');
const { upload, uploadVideos, MAX_FILE_SIZE, MAX_VIDEO_FILE_SIZE } = require('../middlewares/upload');
const { getConfig } = require('../services/cloudinaryService');
const uploadController = require('../controllers/uploadController');
const AppError = require('../utils/AppError');

const router = express.Router();

router.use(protect, restrictTo('admin'));
router.use((req, res, next) => { try { getConfig(); next(); } catch (error) { next(error); } });

/**
 * Translate multer's own errors into the standard AppError envelope; without
 * this a too-large file surfaces as an opaque 500.
 */
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      const limit = req.path === '/videos' ? MAX_VIDEO_FILE_SIZE : MAX_FILE_SIZE;
      return next(new AppError(`File too large. Maximum size is ${limit / 1024 / 1024}MB.`, 400));
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return next(new AppError('Unexpected field. Send files under the "files" field.', 400));
    }
    return next(new AppError(`Upload error: ${err.message}`, 400));
  }
  next(err);
};

router.post('/', upload.array('files', 10), handleMulterError, uploadController.uploadImages);
router.post('/videos', uploadVideos.array('files', 3), handleMulterError, uploadController.uploadImages);

module.exports = router;
