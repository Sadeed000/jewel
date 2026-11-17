const AppError = require('../utils/AppError');

/**
 * 404 handler — mounted after all routes so any unmatched URL falls through here.
 */
module.exports = (req, res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};
