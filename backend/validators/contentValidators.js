const Joi = require('joi');

const banner = Joi.object({
  title: Joi.string().min(1).max(200).required(),
  subtitle: Joi.string().max(500).allow('', null),
  eyebrow: Joi.string().max(100).allow('', null),
  highlight: Joi.string().max(100).allow('', null),
  image: Joi.string().uri({ allowRelative: true }).required(),
  mobileImage: Joi.string().uri().allow('', null),
  ctaLabel: Joi.string().max(50).allow('', null),
  ctaHref: Joi.string().max(500).allow('', null),
  placement: Joi.string().valid('home-hero', 'home-collections', 'home-trending', 'category-hero', 'promo-strip').required(),
  align: Joi.string().valid('left', 'center', 'right'),
  sortOrder: Joi.number().integer(),
  isActive: Joi.boolean(),
  startsAt: Joi.date().allow(null),
  endsAt: Joi.date().allow(null),
});

const testimonial = Joi.object({
  author: Joi.string().min(1).max(100).required(),
  role: Joi.string().max(100).allow('', null),
  avatar: Joi.string().uri().allow('', null),
  rating: Joi.number().integer().min(1).max(5),
  quote: Joi.string().min(5).max(1000).required(),
  productRef: Joi.string().hex().length(24).allow(null),
  isFeatured: Joi.boolean(),
  isActive: Joi.boolean(),
  sortOrder: Joi.number().integer(),
});

// Image URLs may be absolute (CDN / Cloudinary) or API-relative ("/uploads/…").
const imageUrl = Joi.string().uri({ allowRelative: true }).max(1000);

const blogPost = Joi.object({
  title: Joi.string().trim().min(2).max(200).required(),
  slug: Joi.string().trim().lowercase().max(220).allow(''),
  excerpt: Joi.string().trim().min(10).max(500).required(),
  content: Joi.string().min(20).required(),
  coverImage: imageUrl.allow('', null),
  coverImageAlt: Joi.string().trim().max(200).allow('', null),
  category: Joi.string().trim().max(100).allow('', null),
  tags: Joi.array().items(Joi.string().max(40)).max(20),
  author: Joi.object({ name: Joi.string().trim().max(100).allow(''), avatar: imageUrl.allow('', null) }),
  isPublished: Joi.boolean(),
  publishedAt: Joi.date().allow(null),
  seo: Joi.object({
    metaTitle: Joi.string().trim().max(200).allow('', null),
    metaDescription: Joi.string().trim().max(500).allow('', null),
  }),
  targetKeyword: Joi.string().trim().max(120).allow('', null),
  relatedProducts: Joi.array().items(Joi.string().trim().max(220)).max(12),
  relatedCollections: Joi.array()
    .items(Joi.object({
      label: Joi.string().trim().max(80).required(),
      // Internal paths only, e.g. /shop/silver — never a full URL.
      href: Joi.string().trim().pattern(/^\/(?!\/)[^\s]*$/).max(300).required()
        .messages({ 'string.pattern.base': 'Collection links must be site paths like /shop/silver' }),
    }))
    .max(6),
});

// Updates may send any subset (e.g. just { isPublished: false }).
const blogPostUpdate = blogPost.fork(['title', 'excerpt', 'content'], (s) => s.optional());

const siteSettings = Joi.object({
  siteName: Joi.string().max(100),
  tagline: Joi.string().max(200),
  logoUrl: Joi.string().uri().allow('', null),
  faviconUrl: Joi.string().uri().allow('', null),
  contactEmail: Joi.string().email(),
  contactPhone: Joi.string().max(40),
  supportHours: Joi.string().max(100),
  social: Joi.object({
    instagram: Joi.string().uri().allow('', null),
    facebook: Joi.string().uri().allow('', null),
    youtube: Joi.string().uri().allow('', null),
    twitter: Joi.string().uri().allow('', null),
    pinterest: Joi.string().uri().allow('', null),
  }),
  footer: Joi.object({
    about: Joi.string().max(1000),
    shopLinks: Joi.array().items(Joi.object({ label: Joi.string(), href: Joi.string() })),
    helpLinks: Joi.array().items(Joi.object({ label: Joi.string(), href: Joi.string() })),
    policiesLinks: Joi.array().items(Joi.object({ label: Joi.string(), href: Joi.string() })),
    copyright: Joi.string().max(200),
  }),
  aboutPage: Joi.object({
    heroTitle: Joi.string().max(200),
    heroSubtitle: Joi.string().max(200),
    heroImage: Joi.string().uri().allow('', null),
    body: Joi.string().max(5000),
    stats: Joi.array().items(Joi.object({ value: Joi.string(), label: Joi.string() })),
  }),
  trustBadges: Joi.array().items(Joi.object({ icon: Joi.string(), title: Joi.string(), subtitle: Joi.string() })),
  features: Joi.object({
    digitalGold: Joi.boolean(),
    virtualTryOn: Joi.boolean(),
    storeLocator: Joi.boolean(),
    blog: Joi.boolean(),
  }),
});

const category = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  slug: Joi.string().lowercase().max(100),
  icon: Joi.string().max(10).allow('', null),
  image: Joi.string().uri({ allowRelative: true }).required(),
  description: Joi.string().max(500).allow('', null),
  href: Joi.string().max(200).allow('', null),
  subCategories: Joi.array().items(Joi.object({
    name: Joi.string().required(),
    slug: Joi.string().lowercase(),
    image: Joi.string().uri({ allowRelative: true }).allow('', null),
    productType: Joi.string().allow('', null),
  })),
  sortOrder: Joi.number().integer(),
  isActive: Joi.boolean(),
  showInNav: Joi.boolean(),
  showInMegaMenu: Joi.boolean(),
});

module.exports = { banner, testimonial, blogPost, blogPostUpdate, siteSettings, category };
