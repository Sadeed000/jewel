const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    address: { type: String, required: true },
    city: { type: String, required: true, index: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true, match: /^\d{6}$/ },
    country: { type: String, default: 'India' },
    phone: { type: String, required: true },
    email: { type: String, lowercase: true, trim: true },
    hours: { type: String, default: '10:00 AM - 9:00 PM' },

    // GeoJSON point for $near queries
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true }, // [lng, lat]
    },

    features: [{ type: String }], // e.g. "Bridal Stylist", "Try at Home"
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

storeSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Store', storeSchema);
