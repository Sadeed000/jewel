const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const addressSchema = new mongoose.Schema(
  {
    label: { type: String, default: 'Home' },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, trim: true },
    phone: { type: String, required: true, trim: true },
    line1: { type: String, required: true, trim: true },
    line2: { type: String, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true, match: /^\d{6}$/ },
    country: { type: String, default: 'India' },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true, timestamps: true }
);

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[\w.+-]+@[\w-]+\.[a-z]{2,}$/i,
    },
    phone: { type: String, trim: true },
    password: {
      type: String,
      required: true,
      minlength: 4,
      select: false, // never returned by default
    },
    role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
    addresses: [addressSchema],
    ringSize: { type: String },
    encirclePoints: { type: Number, default: 0, min: 0 },
    digitalGoldGrams: { type: Number, default: 0, min: 0 },
    giftCardBalance: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
    passwordChangedAt: { type: Date },
  },
  { timestamps: true }
);

// Hash password whenever it's set/changed
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  if (!this.isNew) this.passwordChangedAt = new Date();
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
