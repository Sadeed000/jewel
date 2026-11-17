const Joi = require('joi');

const productCreate = Joi.object({
  name: Joi.string().min(2).max(200).required(),
  slug: Joi.string().lowercase().max(220),
  sku: Joi.string().max(50),
  category: Joi.string().valid('gold', 'diamond', 'gemstone', 'platinum', 'silver').required(),
  type: Joi.string()
    .valid('rings', 'earrings', 'pendants', 'necklaces', 'chains', 'bracelets', 'mangalsutra', 'bangles', 'nose-pin')
    .required(),
  // Empty means "use the standard scale for this product type".
  sizes: Joi.array().items(Joi.string().trim().max(20)).default([]),
  price: Joi.number().min(0).required(),
  originalPrice: Joi.number().min(0),
  // Backward compatibility: images array
  images: Joi.array().items(Joi.string().uri({ allowRelative: true })).min(1),
  // New: separate cover and detailed images
  coverImages: Joi.array().items(Joi.string().uri({ allowRelative: true })).min(1),
  detailedImages: Joi.array().items(Joi.string().uri({ allowRelative: true })).default([]),
  videos: Joi.array().items(Joi.string().uri({ scheme: ['https'] })).max(3),
  // Virtual try-on: transparent cut-out PNG, plus an opt-out switch.
  tryOnImage: Joi.string().uri({ allowRelative: true }).allow('', null),
  tryOnEnabled: Joi.boolean(),
  metal: Joi.string().required(),
  purity: Joi.string().required(),
  weight: Joi.string().required(),
  description: Joi.string().required(),
  isBestseller: Joi.boolean(),
  isNew: Joi.boolean(),
  isExpertChoice: Joi.boolean(),
  inStock: Joi.boolean(),
  onlyOneLeft: Joi.boolean(),
  stockQty: Joi.number().integer().min(0),
  collection: Joi.string().max(100),
  occasion: Joi.string().valid('wedding', 'daily-wear', 'festive', 'office', 'party', 'gifting'),
  gemstone: Joi.string().valid('emerald', 'ruby', 'sapphire', 'tanzanite', 'pearl', 'coral', 'none'),
  gender: Joi.string().valid('women', 'men', 'kids', 'unisex'),

  // Gemstone provenance — optional, and only meaningful on stone-set pieces.
  gemstoneDetails: Joi.object({
    caratWeight: Joi.number().min(0).allow(null),
    origin: Joi.string().max(60).allow('', null),
    treatment: Joi.string()
      .valid('none', 'heated', 'oiled', 'diffused', 'irradiated', 'undisclosed')
      .allow('', null),
    clarity: Joi.string().max(40).allow('', null),
    cut: Joi.string().max(40).allow('', null),
    stoneCount: Joi.number().integer().min(1).allow(null),
  }),

  certification: Joi.object({
    lab: Joi.string().valid('IGI', 'GIA', 'GII', 'SGL', 'IIGJ', 'other').allow('', null),
    certificateNumber: Joi.string().max(60).allow('', null),
    certificateUrl: Joi.string().uri({ allowRelative: true }).allow('', null),
    verifyUrl: Joi.string().uri({ allowRelative: true }).allow('', null),
  }),

  bisHallmark: Joi.boolean(),
  hidden: Joi.boolean(),
  freeResize: Joi.boolean(),
  engravingAvailable: Joi.boolean(),
  engravingMaxChars: Joi.number().integer().min(1).max(50),
  rating: Joi.number().min(0).max(5).allow(null),
});

const productUpdate = productCreate.fork(Object.keys(productCreate.describe().keys), (s) => s.optional());

const productListQuery = Joi.object({
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
  sort: Joi.string().max(50),
  category: Joi.string().valid('gold', 'diamond', 'gemstone', 'platinum', 'silver'),
  type: Joi.string().valid('rings', 'earrings', 'pendants', 'necklaces', 'chains', 'bracelets', 'mangalsutra', 'bangles', 'nose-pin'),
  occasion: Joi.string().valid('wedding', 'daily-wear', 'festive', 'office', 'party', 'gifting'),
  gemstone: Joi.string().valid('emerald', 'ruby', 'sapphire', 'tanzanite', 'pearl', 'coral', 'none'),
  gender: Joi.string().valid('women', 'men', 'kids', 'unisex'),
  minPrice: Joi.number().min(0),
  maxPrice: Joi.number().min(0),
  isBestseller: Joi.boolean(),
  isNew: Joi.boolean(),
  inStock: Joi.boolean(),
  collection: Joi.string().max(100),
  q: Joi.string().max(100),
  // Comma-separated product ids for batch hydration (guest wishlist).
  // Length caps 100 ids of 24 hex chars plus separators.
  ids: Joi.string().max(2600),
});

const newsletter = Joi.object({
  email: Joi.string().email().required(),
  source: Joi.string().max(40),
});

const contact = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^[+\d\s-]{7,20}$/).allow('', null),
  subject: Joi.string().max(150).allow('', null),
  message: Joi.string().min(5).max(2000).required(),
});

const storeQuery = Joi.object({
  city: Joi.string().max(100),
  q: Joi.string().max(100),
  lng: Joi.number().min(-180).max(180),
  lat: Joi.number().min(-90).max(90),
  radius: Joi.number().min(100).max(500000), // metres
});

const digitalGoldEnrol = Joi.object({
  monthlyAmount: Joi.number().min(500).max(50000).required(),
  tenureMonths: Joi.number().integer().min(6).max(11).required(),
});

module.exports = {
  productCreate,
  productUpdate,
  productListQuery,
  newsletter,
  contact,
  storeQuery,
  digitalGoldEnrol,
};
