/**
 * Parse pagination & sorting params from a query string.
 *
 *   ?page=2&limit=24&sort=-createdAt
 *
 * Returns { page, limit, skip, sort } with safe defaults & caps so that
 * a malicious or naive client can't ask for `limit=1000000`.
 */
const parsePagination = (query, defaults = {}) => {
  const page = Math.max(1, parseInt(query.page, 10) || defaults.page || 1);
  const limit = Math.min(
    100, // hard cap
    Math.max(1, parseInt(query.limit, 10) || defaults.limit || 20)
  );
  const skip = (page - 1) * limit;
  const sort = query.sort || defaults.sort || '-createdAt';
  return { page, limit, skip, sort };
};

/**
 * Build a paginated response envelope.
 */
const paginate = ({ items, total, page, limit }) => ({
  items,
  pagination: {
    total,
    page,
    limit,
    pages: Math.ceil(total / limit) || 1,
    hasNext: page * limit < total,
    hasPrev: page > 1,
  },
});

module.exports = { parsePagination, paginate };
