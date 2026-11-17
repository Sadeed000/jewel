const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    size: { type: String }, // ring size, etc.
    // Snapshot fields so price/name remain stable even if product is later edited
    priceAtAdd: { type: Number, required: true },
    nameAtAdd: { type: String, required: true },
    imageAtAdd: { type: String, required: true },

    /* Personalisation. `engraving` applies to a catalogue product; `ring`
       carries a bespoke configuration whose price was computed by
       customRingService — never supplied by the client. */
    customisation: {
      type: {
        type: String,
        enum: ['engraving', 'custom-ring'],
      },
      engraving: { type: String, trim: true, maxlength: 50 },
      ring: {
        stone: String,
        carat: Number,
        metal: String,
        setting: String,
        size: String,
      },
      /** Rendered summary, e.g. "1.5ct Emerald Halo in 18K Rose Gold". */
      summary: { type: String },
    },
  },
  { _id: true, timestamps: true }
);

const cartSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    items: [cartItemSchema],
    couponCode: { type: String, trim: true, uppercase: true },
    couponDiscount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Virtuals for totals — computed on read so they're always fresh
cartSchema.virtual('subtotal').get(function () {
  return this.items.reduce((sum, it) => sum + it.priceAtAdd * it.quantity, 0);
});

cartSchema.virtual('total').get(function () {
  return Math.max(0, this.subtotal - this.couponDiscount);
});

cartSchema.virtual('itemCount').get(function () {
  return this.items.reduce((sum, it) => sum + it.quantity, 0);
});

module.exports = mongoose.model('Cart', cartSchema);
