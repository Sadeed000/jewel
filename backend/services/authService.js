const User = require('../models/User');
const AppError = require('../utils/AppError');
const { signToken } = require('../utils/jwt');

/**
 * Register a new user and return a fresh JWT.
 */
const register = async (payload) => {
  const existing = await User.findOne({ email: payload.email });
  if (existing) {
    throw new AppError('An account with this email already exists.', 409);
  }

  const user = await User.create(payload);
  const token = signToken({ id: user._id, role: user.role });
  return { user: user.toSafeJSON(), token };
};

/**
 * Authenticate a user and return a fresh JWT.
 * We deliberately use the same generic message for both
 * "user not found" and "wrong password" to avoid email enumeration.
 */
const login = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw new AppError('Invalid email or password.', 401);
  }

  const ok = await user.comparePassword(password);
  if (!ok) {
    throw new AppError('Invalid email or password.', 401);
  }

  if (!user.isActive) {
    throw new AppError('This account has been deactivated.', 403);
  }

  const token = signToken({ id: user._id, role: user.role });
  return { user: user.toSafeJSON(), token };
};

/**
 * Update a logged-in user's password after verifying the current one.
 */
const updatePassword = async (userId, { currentPassword, newPassword }) => {
  const user = await User.findById(userId).select('+password');
  if (!user) throw new AppError('User not found.', 404);

  const ok = await user.comparePassword(currentPassword);
  if (!ok) throw new AppError('Current password is incorrect.', 401);

  user.password = newPassword;
  await user.save();

  const token = signToken({ id: user._id, role: user.role });
  return { user: user.toSafeJSON(), token };
};

module.exports = { register, login, updatePassword };
