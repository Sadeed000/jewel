const Joi = require('joi');

const register = Joi.object({
  firstName: Joi.string().min(1).max(50).required(),
  lastName: Joi.string().max(50).allow('', null),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^[+\d\s-]{7,20}$/).allow('', null),
  password: Joi.string().min(8).max(128).required(),
});

const login = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const updatePassword = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(8).max(128).required(),
});

module.exports = { register, login, updatePassword };
