const mongoose = require('mongoose');

const newsletterSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[\w.+-]+@[\w-]+\.[a-z]{2,}$/i,
    },
    isActive: { type: Boolean, default: true },
    unsubscribedAt: { type: Date },
    source: { type: String, default: 'website' }, // website / footer / popup
  },
  { timestamps: true }
);

module.exports = mongoose.model('Newsletter', newsletterSchema);
