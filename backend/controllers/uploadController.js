const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const { created } = require('../utils/apiResponse');
const cloudinary = require('../services/cloudinaryService');


const uploadImages = catchAsync(async (req, res, next) => {
  const files = req.files || [];

  if (files.length === 0) {
    return next(new AppError('No image supplied. Attach at least one file under the "files" field.', 400));
  }

  const uploaded = await cloudinary.uploadBatch(files);

  // `url` mirrors the first upload so single-file callers can ignore the array.
  created(res, { uploaded, url: uploaded[0].url }, `Uploaded ${uploaded.length} media file(s) to Cloudinary`);
});

module.exports = { uploadImages };
