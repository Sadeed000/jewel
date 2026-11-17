const AppError = require('../utils/AppError');

/**
 * Translate well-known errors into clean AppErrors with friendly messages,
 * then send a final JSON response. Order matters: handle each Mongoose /
 * JWT error type before the generic fallback.
 */
const handleCastError = (err) =>
  new AppError(`Invalid ${err.path}: ${err.value}`, 400);

const handleDuplicateKey = (err) => {
  const field = Object.keys(err.keyValue || {})[0];
  const value = err.keyValue?.[field];
  return new AppError(`Duplicate value: ${field} "${value}" already exists.`, 409);
};

const handleValidationError = (err) => {
  const details = Object.values(err.errors).map((e) => ({
    field: e.path,
    message: e.message,
  }));
  return new AppError('Validation failed', 400, details);
};

const sendDev = (err, res) =>
  res.status(err.statusCode || 500).json({
    status: err.status || 'error',
    message: err.message,
    details: err.details,
    stack: err.stack,
    error: err,
  });

const sendProd = (err, res) => {
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      ...(err.details && { details: err.details }),
    });
  }
  // Unknown / programming error — don't leak internals
  console.error('💥 Unexpected error:', err);
  return res.status(500).json({
    status: 'error',
    message: 'Something went wrong on our end. Please try again later.',
  });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  let normalised = err;
  if (err.name === 'CastError') normalised = handleCastError(err);
  else if (err.code === 11000) normalised = handleDuplicateKey(err);
  else if (err.name === 'ValidationError') normalised = handleValidationError(err);
  else if (err.name === 'JsonWebTokenError') normalised = new AppError('Invalid token. Please log in again.', 401);
  else if (err.name === 'TokenExpiredError') normalised = new AppError('Session expired. Please log in again.', 401);

  if (process.env.NODE_ENV === 'production') {
    return sendProd(normalised, res);
  }
  return sendDev(normalised, res);
};
