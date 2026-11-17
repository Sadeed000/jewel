const mongoose = require('mongoose');
const slugify = require('slugify');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    sku: { type: String, unique: true, sparse: true, uppercase: true },

    category: {
      type: String,
      required: true,
      enum: ['gold', 'diamond', 'gemstone', 'platinum', 'silver'],
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['rings', 'earrings', 'pendants', 'necklaces', 'chains', 'bracelets', 'mangalsutra', 'bangles', 'nose-pin'],
      index: true,
    },

    /* Sizes this particular piece is stocked in, e.g. ['14','15','16'] for a
       ring or ['18','20'] for a chain. Left empty the storefront falls back to
       the standard scale for the product type, which is what every existing
       product relies on — so this only needs filling in when a piece is made
       in a narrower (or wider) range than the default. */
    sizes: { type: [String], default: [] },

    price: { type: Number, required: true, min: 0, index: true },
    originalPrice: { type: Number, min: 0 },

    images: {
      type: [String],
      validate: { validator: (v) => v && v.length > 0, message: 'At least one image is required' },
    },

    coverImages: {
      type: [String],
      validate: { validator: (v) => v && v.length > 0, message: 'At least one cover image is required' },
    },

    detailedImages: {
      type: [String],
      default: [],
    },
    videos: { type: [String], default: [] },

    /* Virtual try-on overlay: a background-free PNG of just the piece.
       Optional — try-on falls back to the cover image and masks it, but a
       real cut-out is what makes the overlay look convincing. */
    tryOnImage: { type: String },
    /* Lets merchandising hide a piece from try-on even though its type is
       supported (e.g. a set photographed on a bust). */
    tryOnEnabled: { type: Boolean, default: true },

    metal: { type: String, required: true },
    purity: { type: String, required: true },
    weight: { type: String, required: true },

    description: { type: String, required: true },

    isBestseller: { type: Boolean, default: false, index: true },
    isNew: { type: Boolean, default: false, index: true },
    isExpertChoice: { type: Boolean, default: false },
    inStock: { type: Boolean, default: true, index: true },
    onlyOneLeft: { type: Boolean, default: false },
    stockQty: { type: Number, default: 10, min: 0 },

    collection: { type: String, index: true },
    occasion: {
      type: String,
      enum: ['wedding', 'daily-wear', 'festive', 'office', 'party', 'gifting'],
      index: true,
    },
    gemstone: {
      type: String,
      enum: ['emerald', 'ruby', 'sapphire', 'tanzanite', 'pearl', 'coral', 'none'],
    },
    gender: { type: String, enum: ['women', 'men', 'kids', 'unisex'], default: 'women' },

    // Pricing breakdown (auto-derived but stored for order snapshots)
    metalCharges: { type: Number },
    makingCharges: { type: Number },
    gst: { type: Number },

    /* ───────────── Gemstone provenance ─────────────
       Coloured stones are bought on trust: origin and treatment move price
       far more than design does, and an undisclosed treatment is the main
       reason buyers hesitate online. All optional — only gemstone pieces
       carry them. */
    gemstoneDetails: {
      // Stone weight, distinct from the piece's gross weight.
      caratWeight: { type: Number, min: 0 },
      // e.g. "Zambian", "Burmese", "Ceylon" — origin materially sets price.
      origin: { type: String, trim: true },
      treatment: {
        type: String,
        enum: ['none', 'heated', 'oiled', 'diffused', 'irradiated', 'undisclosed'],
      },
      clarity: { type: String, trim: true },
      cut: { type: String, trim: true },
      // Count when a piece carries several stones.
      stoneCount: { type: Number, min: 1 },
    },

    /* Independent lab report. `certificateNumber` is what a buyer types into
       the lab's own site, so it is the part that actually builds trust. */
    certification: {
      lab: { type: String, enum: ['IGI', 'GIA', 'GII', 'SGL', 'IIGJ', 'other'] },
      certificateNumber: { type: String, trim: true },
      certificateUrl: { type: String },   // uploaded scan
      verifyUrl: { type: String },        // lab's verification page
    },

    bisHallmark: { type: Boolean, default: true },

    /* Excluded from listings and search. Used by the bespoke configurator's
       base product, which is a pricing anchor rather than something to browse. */
    hidden: { type: Boolean, default: false, index: true },

    /* Ring-specific promises, surfaced on the product page. */
    freeResize: { type: Boolean, default: true },
    engravingAvailable: { type: Boolean, default: false },
    engravingMaxChars: { type: Number, default: 20 },

    /* `rating` previously defaulted to 4.5 on every product, which showed a
       uniform fabricated score across the catalogue. It now stays undefined
       until real reviews exist, so the UI can hide it rather than invent it. */
    rating: { type: Number, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Compound index for category page sorting
productSchema.index({ category: 1, type: 1, price: 1 });
// Full-text search across name + description + collection
productSchema.index({ name: 'text', description: 'text', collection: 'text' });

// Auto-generate slug if missing
productSchema.pre('validate', function (next) {
  if (!this.slug && this.name) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

// Auto-compute pricing breakdown if not provided
productSchema.pre('save', function (next) {
  if (this.isModified('price') || this.isNew) {
    if (this.metalCharges == null) this.metalCharges = Math.round(this.price * 0.78);
    if (this.makingCharges == null) this.makingCharges = Math.round(this.price * 0.15);
    if (this.gst == null) this.gst = Math.round(this.price * 0.03);
  }
  next();
});

// Virtual: discount percent
productSchema.virtual('discountPercent').get(function () {
  if (!this.originalPrice || this.originalPrice <= this.price) return 0;
  return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
});

module.exports = mongoose.model('Product', productSchema);
