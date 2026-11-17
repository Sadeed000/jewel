/**
 * Standardised API response shape. Keep all endpoints consistent so the
 * frontend can rely on { status, data, message? } across the board.
 */
const ok = (res, data, message, statusCode = 200) =>
  res.status(statusCode).json({
    status: 'success',
    ...(message && { message }),
    data,
  });

const created = (res, data, message = 'Created') => ok(res, data, message, 201);

const noContent = (res) => res.status(204).send();

module.exports = { ok, created, noContent };
