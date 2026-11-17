/**
 * Wraps an async route handler so any thrown error / rejected promise
 * is forwarded to Express's error-handling middleware.
 *
 * Usage:
 *   router.get('/', catchAsync(async (req, res) => { ... }));
 */
module.exports = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
