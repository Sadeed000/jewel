const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema(
  {
    author: { type: String, required: true, trim: true },
    role: { type: String, trim: true },     // "Bride from Jaipur", "Loyal customer", etc.
    avatar: { type: String },               // optional avatar URL
    rating: { type: Number, min: 1, max: 5, default: 5 },
    quote: { type: String, required: true, trim: true, maxlength: 1000 },
    productRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },

    isFeatured: { type: Boolean, default: false, index: true },
    isActive: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Testimonial', testimonialSchema);
