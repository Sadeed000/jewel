const userService = require('../services/userService');
const catchAsync = require('../utils/catchAsync');
const { ok, created } = require('../utils/apiResponse');

const getProfile = catchAsync(async (req, res) => {
  const user = await userService.getProfile(req.user._id);
  ok(res, { user });
});

const updateProfile = catchAsync(async (req, res) => {
  const user = await userService.updateProfile(req.user._id, req.body);
  ok(res, { user }, 'Profile updated');
});

const listAddresses = catchAsync(async (req, res) => {
  const user = await userService.getProfile(req.user._id);
  ok(res, { addresses: user.addresses });
});

const addAddress = catchAsync(async (req, res) => {
  const user = await userService.addAddress(req.user._id, req.body);
  created(res, { addresses: user.addresses }, 'Address added');
});

const updateAddress = catchAsync(async (req, res) => {
  const user = await userService.updateAddress(req.user._id, req.params.addressId, req.body);
  ok(res, { addresses: user.addresses }, 'Address updated');
});

const deleteAddress = catchAsync(async (req, res) => {
  const user = await userService.deleteAddress(req.user._id, req.params.addressId);
  ok(res, { addresses: user.addresses }, 'Address removed');
});

module.exports = {
  getProfile,
  updateProfile,
  listAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
};
