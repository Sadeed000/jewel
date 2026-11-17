const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, trim: true },
    eyebrow: { type: String, trim: true },
    highlight: { type: String, trim: true },
    image: { type: String, required: true },
    mobileImage: { type: String },

    ctaLabel: { type: String, trim: true },
    ctaHref: { type: String, trim: true, default: '#' },

    /**
     * Where on the site this banner appears. The frontend filters by this
     * key when fetching: `/banners?placement=home-hero`
     */
    placement: {
      type: String,
      required: true,
      enum: ['home-hero', 'home-collections', 'home-trending', 'category-hero', 'promo-strip'],
      index: true,
    },
    align: { type: String, enum: ['left', 'center', 'right'], default: 'right' },

    sortOrder: { type: Number, default: 0, index: true },
    isActive: { type: Boolean, default: true, index: true },

    // Optional scheduling
    startsAt: { type: Date },
    endsAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Banner', bannerSchema);
