const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    image: { type: String, required: true },
    slug: { type: String, required: true },
    size: { type: String },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, required: true, min: 0 },

    /* Snapshot of any personalisation so the workshop knows what to make and
       the customer sees what they ordered, even if the cart is long gone. */
    customisation: {
      type: { type: String, enum: ['engraving', 'custom-ring'] },
      engraving: String,
      ring: {
        stone: String,
        carat: Number,
        metal: String,
        setting: String,
        size: String,
      },
      summary: String,
    },
  },
  { _id: true }
);

const shippingAddressSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String },
    phone: { type: String, required: true },
    line1: { type: String, required: true },
    line2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true, match: /^\d{6}$/ },
    country: { type: String, default: 'India' },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: { type: [orderItemSchema], validate: (v) => v && v.length > 0 },

    shippingAddress: { type: shippingAddressSchema, required: true },

    paymentMethod: {
      type: String,
      enum: ['card', 'upi', 'netbanking', 'cod', 'digital-gold', 'gift-card'],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    transactionId: { type: String },

    // Totals
    subtotal: { type: Number, required: true, min: 0 },
    shippingFee: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    couponCode: { type: String, uppercase: true },
    total: { type: Number, required: true, min: 0 },

    status: {
      type: String,
      enum: ['confirmed', 'processing', 'shipped', 'out-for-delivery', 'delivered', 'cancelled', 'returned'],
      default: 'confirmed',
      index: true,
    },
    statusHistory: [
      {
        status: String,
        at: { type: Date, default: Date.now },
        note: String,
      },
    ],

    estimatedDelivery: { type: Date },
    deliveredAt: { type: Date },
    cancelledAt: { type: Date },
    cancellationReason: { type: String },

    isGift: { type: Boolean, default: false },
    giftNote: { type: String },
  },
  { timestamps: true }
);

/* Generate a readable order number on first save.
   A bare 6-digit random collides with the unique index surprisingly often
   (birthday paradox: ~1% odds by 100 orders, and every collision is a failed
   checkout). Combining a time component with randomness keeps it readable
   while making collisions negligible. */
orderSchema.pre('validate', function (next) {
  if (!this.orderNumber) {
    // Base-36 seconds-since-epoch, uppercased: 6 chars until the year 2059.
    const stamp = Math.floor(Date.now() / 1000).toString(36).toUpperCase();
    const rnd = Math.floor(1000 + Math.random() * 9000);
    this.orderNumber = `AUR-${stamp}-${rnd}`;
  }
  next();
});

// Default delivery estimate: 5 business days
orderSchema.pre('save', function (next) {
  if (!this.estimatedDelivery) {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    this.estimatedDelivery = d;
  }
  if (this.isNew) {
    this.statusHistory.push({ status: this.status, note: 'Order placed' });
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
