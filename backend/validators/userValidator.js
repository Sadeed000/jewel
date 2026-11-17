const Joi = require('joi');

const updateProfile = Joi.object({
  firstName: Joi.string().min(1).max(50),
  lastName: Joi.string().max(50).allow('', null),
  phone: Joi.string().pattern(/^[+\d\s-]{7,20}$/).allow('', null),
  ringSize: Joi.string().max(10).allow('', null),
});

const addressBody = Joi.object({
  label: Joi.string().max(20).default('Home'),
  firstName: Joi.string().min(1).max(50).required(),
  lastName: Joi.string().max(50).allow('', null),
  phone: Joi.string().pattern(/^[+\d\s-]{7,20}$/).required(),
  line1: Joi.string().min(3).max(200).required(),
  line2: Joi.string().max(200).allow('', null),
  city: Joi.string().min(2).max(100).required(),
  state: Joi.string().min(2).max(100).required(),
  pincode: Joi.string().pattern(/^\d{6}$/).required(),
  country: Joi.string().default('India'),
  isDefault: Joi.boolean().default(false),
});

module.exports = { updateProfile, addressBody };
