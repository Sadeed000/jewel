const Joi = require('joi');

const addToCart = Joi.object({
  productId: Joi.string().hex().length(24).required(),
  quantity: Joi.number().integer().min(1).max(20).default(1),
  size: Joi.string().max(10).allow('', null),

  /* Personalisation. Note there is no `price` here by design — the server
     prices bespoke configurations itself (see cartService.addItem). */
  customisation: Joi.object({
    type: Joi.string().valid('engraving', 'custom-ring').required(),
    engraving: Joi.string().max(50).allow('', null),
    ring: Joi.object({
      stone: Joi.string().max(30),
      carat: Joi.number().min(0),
      metal: Joi.string().max(30),
      setting: Joi.string().max(30),
      size: Joi.string().max(10).allow('', null),
      engraving: Joi.string().max(50).allow('', null),
    }),
  }),
});

const updateCartItem = Joi.object({
  quantity: Joi.number().integer().min(1).max(20).required(),
});

const applyCoupon = Joi.object({
  code: Joi.string().min(2).max(30).required(),
});

module.exports = { addToCart, updateCartItem, applyCoupon };
