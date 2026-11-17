const mongoose = require('mongoose');
const slugify = require('slugify');

/**
 * Category model — drives the top navigation, mega menu, and homepage tiles.
 * Each category may have subcategories nested as an embedded array (limited
 * depth keeps the menu manageable and queries simple).
 */
const subCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, lowercase: true },
    image: { type: String },
    productType: { type: String }, // maps to Product.type for filtering
  },
  { _id: true }
);

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    icon: { type: String },                     // emoji/symbol used in nav
    image: { type: String, required: true },    // tile image
    description: { type: String },
    href: { type: String },                     // override route, defaults to /shop/<slug>
    subCategories: [subCategorySchema],
    sortOrder: { type: Number, default: 0, index: true },
    isActive: { type: Boolean, default: true, index: true },
    showInNav: { type: Boolean, default: true },
    showInMegaMenu: { type: Boolean, default: true },
  },
  { timestamps: true }
);

categorySchema.pre('validate', function (next) {
  if (!this.slug && this.name) this.slug = slugify(this.name, { lower: true, strict: true });
  this.subCategories?.forEach((sub) => {
    if (!sub.slug && sub.name) sub.slug = slugify(sub.name, { lower: true, strict: true });
  });
  next();
});

module.exports = mongoose.model('Category', categorySchema);
