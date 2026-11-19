const Joi = require('joi');

const adminOrderQuery = Joi.object({
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
  sort: Joi.string().allow('', null),
  status: Joi.string().valid('confirmed', 'processing', 'shipped', 'out-for-delivery', 'delivered', 'cancelled', 'returned'),
  orderNumber: Joi.string().trim().allow('', null),
  userEmail: Joi.string().email().lowercase().trim().allow('', null),
});

const adminCustomerQuery = Joi.object({
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
  sort: Joi.string().allow('', null),
  role: Joi.string().valid('customer', 'admin'),
  // Partial input from the admin search box ("priya", "@gmail"), not a full address.
  email: Joi.string().lowercase().trim().max(100).allow('', null),
  isActive: Joi.boolean().truthy('true').falsy('false'),
});

const updateCustomer = Joi.object({
  firstName: Joi.string().min(1).max(50),
  lastName: Joi.string().max(50).allow('', null),
  phone: Joi.string().pattern(/^[+\d\s-]{7,20}$/).allow('', null),
  role: Joi.string().valid('customer', 'admin'),
  isActive: Joi.boolean(),
});

module.exports = { adminOrderQuery, adminCustomerQuery, updateCustomer };