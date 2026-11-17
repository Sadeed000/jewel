const mongoose = require('mongoose');

/**
 * Site settings is a singleton — only one document ever exists in this
 * collection. We enforce that by always upserting on a fixed `key: 'main'`.
 *
 * Holds everything the frontend reads as global config: logo, footer text,
 * social links, contact info, etc. Loaded once and cached on the client.
 */
const siteSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'main', unique: true },

    // Brand
    siteName: { type: String, default: 'Aurelia' },
    tagline: { type: String, default: 'Fine Jewellery, Forever' },
    logoUrl: { type: String },
    faviconUrl: { type: String },

    // Contact
    contactEmail: { type: String, default: 'hello@aurelia.example.com' },
    contactPhone: { type: String, default: '1800-266-0123' },
    supportHours: { type: String, default: '9am - 9pm IST' },

    // Social
    social: {
      instagram: { type: String },
      facebook: { type: String },
      youtube: { type: String },
      twitter: { type: String },
      pinterest: { type: String },
    },

    // Footer columns
    footer: {
      about: { type: String, default: 'Aurelia is a celebration of fine jewellery, crafted by master karigars and worn for generations.' },
      shopLinks: [{ label: String, href: String }],
      helpLinks: [{ label: String, href: String }],
      policiesLinks: [{ label: String, href: String }],
      copyright: { type: String, default: '© Aurelia. All rights reserved.' },
    },

    // About page hero copy
    aboutPage: {
      heroTitle: { type: String, default: 'Our Story' },
      heroSubtitle: { type: String, default: 'Since 1994' },
      heroImage: { type: String },
      body: { type: String },
      stats: [{ value: String, label: String }],
    },

    // Trust badges shown across product/cart pages
    trustBadges: [
      {
        icon: String,    // emoji or icon name
        title: String,
        subtitle: String,
      },
    ],

    // Feature toggles
    features: {
      digitalGold: { type: Boolean, default: true },
      virtualTryOn: { type: Boolean, default: true },
      storeLocator: { type: Boolean, default: true },
      blog: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SiteSettings', siteSettingsSchema);
