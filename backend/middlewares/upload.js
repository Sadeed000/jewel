const path = require('path');
const fs = require('fs');
const multer = require('multer');
const AppError = require('../utils/AppError');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

// Multer will not create the destination itself.
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']);
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const MAX_VIDEO_FILE_SIZE = 50 * 1024 * 1024;

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_MIME.has(file.mimetype)) {
    return cb(new AppError(`Unsupported file type: ${file.mimetype}. Use JPEG, PNG, WebP, GIF or AVIF.`, 400));
  }
  cb(null, true);
};

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE, files: 10 },
});

/**
 * For images we only need to look at, never keep — visual search reads the
 * shopper's photo, scores it and discards it. Buffering in memory means no
 * customer photo ever lands on disk and nothing has to be cleaned up later.
 */
const uploadToMemory = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
});

const uploadVideos = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (!['video/mp4', 'video/webm', 'video/quicktime'].includes(file.mimetype)) {
      return cb(new AppError('Unsupported video type. Use MP4, WebM or MOV.', 400));
    }
    cb(null, true);
  },
  limits: { fileSize: MAX_VIDEO_FILE_SIZE, files: 3 },
});

module.exports = { upload, uploadVideos, uploadToMemory, UPLOAD_DIR, MAX_FILE_SIZE, MAX_VIDEO_FILE_SIZE };
