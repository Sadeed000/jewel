const User = require('../models/User');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { verifyToken } = require('../utils/jwt');

/**
 * Authenticate: require a valid JWT.
 * Token sources (in priority order):
 *   1. Authorization: Bearer <token>
 *   2. Cookie: jwt
 */
const protect = catchAsync(async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(new AppError('You are not logged in. Please log in to continue.', 401));
  }

  let decoded;
  try {
    decoded = await verifyToken(token);
  } catch (err) {
    const message = err.name === 'TokenExpiredError' ? 'Session expired. Please log in again.' : 'Invalid authentication token.';
    return next(new AppError(message, 401));
  }

  const user = await User.findById(decoded.id);
  if (!user || !user.isActive) {
    return next(new AppError('The user belonging to this token no longer exists.', 401));
  }

  // If user changed password after the token was issued, force re-login
  if (user.passwordChangedAt && decoded.iat * 1000 < user.passwordChangedAt.getTime()) {
    return next(new AppError('Password recently changed. Please log in again.', 401));
  }

  req.user = user;
  next();
});

/**
 * Optional auth — attaches req.user if a valid token is present, but
 * does not block the request if it isn't. Useful for endpoints that
 * behave differently for guests vs. logged-in users (e.g., cart).
 */
const optionalAuth = catchAsync(async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.jwt) {
    token = req.cookies.jwt;
  }
  if (!token) return next();

  try {
    const decoded = await verifyToken(token);
    const user = await User.findById(decoded.id);
    if (user && user.isActive) req.user = user;
  } catch {
    // ignore — treat as guest
  }
  next();
});

/**
 * Role-based gate. Use after `protect`:
 *   router.delete('/:id', protect, restrictTo('admin'), handler);
 */
const restrictTo = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new AppError('You do not have permission to perform this action.', 403));
  }
  next();
};

module.exports = { protect, optionalAuth, restrictTo };
