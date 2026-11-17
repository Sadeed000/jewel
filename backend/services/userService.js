const User = require('../models/User');
const AppError = require('../utils/AppError');

const getProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found.', 404);
  return user.toSafeJSON();
};

const updateProfile = async (userId, payload) => {
  const user = await User.findByIdAndUpdate(userId, payload, {
    new: true,
    runValidators: true,
  });
  if (!user) throw new AppError('User not found.', 404);
  return user.toSafeJSON();
};

/**
 * Add a new address. If the address is marked default — or the user has no
 * addresses yet — clear any existing default first so only one stays current.
 */
const addAddress = async (userId, address) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found.', 404);

  const shouldBeDefault = address.isDefault || user.addresses.length === 0;
  if (shouldBeDefault) {
    user.addresses.forEach((a) => { a.isDefault = false; });
    address.isDefault = true;
  }

  user.addresses.push(address);
  await user.save();
  return user.toSafeJSON();
};

const updateAddress = async (userId, addressId, payload) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found.', 404);

  const address = user.addresses.id(addressId);
  if (!address) throw new AppError('Address not found.', 404);

  if (payload.isDefault) {
    user.addresses.forEach((a) => { a.isDefault = false; });
  }
  Object.assign(address, payload);

  await user.save();
  return user.toSafeJSON();
};

const deleteAddress = async (userId, addressId) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found.', 404);

  const address = user.addresses.id(addressId);
  if (!address) throw new AppError('Address not found.', 404);

  const wasDefault = address.isDefault;
  address.deleteOne();

  // Promote the first remaining address to default
  if (wasDefault && user.addresses.length > 0) {
    user.addresses[0].isDefault = true;
  }

  await user.save();
  return user.toSafeJSON();
};

module.exports = { getProfile, updateProfile, addAddress, updateAddress, deleteAddress };
