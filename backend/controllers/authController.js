const authService = require('../services/authService');
const catchAsync = require('../utils/catchAsync');
const { ok, created } = require('../utils/apiResponse');
const { cookieOptions } = require('../utils/jwt');

/**
 * Send token both as httpOnly cookie (for browser flows) and in the
 * response body (so the Next.js client can also stash it if needed).
 */
const sendAuthResponse = (res, { user, token }, statusCode = 200, message) => {
  res.cookie('jwt', token, cookieOptions());
  return res.status(statusCode).json({
    status: 'success',
    ...(message && { message }),
    data: { user, token },
  });
};

const register = catchAsync(async (req, res) => {
  const result = await authService.register(req.body);
  sendAuthResponse(res, result, 201, 'Account created successfully');
});

const login = catchAsync(async (req, res) => {
  const result = await authService.login(req.body);
  sendAuthResponse(res, result, 200, 'Logged in successfully');
});

const logout = catchAsync(async (req, res) => {
  res.cookie('jwt', 'logged-out', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  ok(res, null, 'Logged out successfully');
});

const me = catchAsync(async (req, res) => {
  ok(res, { user: req.user.toSafeJSON() });
});

const updatePassword = catchAsync(async (req, res) => {
  const result = await authService.updatePassword(req.user._id, req.body);
  sendAuthResponse(res, result, 200, 'Password updated');
});

module.exports = { register, login, logout, me, updatePassword };
