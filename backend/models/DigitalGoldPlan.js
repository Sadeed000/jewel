const mongoose = require('mongoose');

const installmentSchema = new mongoose.Schema(
  {
    monthNumber: { type: Number, required: true },
    amount: { type: Number, required: true, min: 0 },
    paidAt: { type: Date },
    status: { type: String, enum: ['pending', 'paid', 'missed'], default: 'pending' },
    transactionId: { type: String },
  },
  { _id: true }
);

const digitalGoldPlanSchema = new mongoose.Schema(
  {
    planNumber: { type: String, required: true, unique: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    monthlyAmount: { type: Number, required: true, min: 500 },
    tenureMonths: { type: Number, required: true, min: 6, max: 11 },
    bonusPercent: { type: Number, default: 7.5 },

    totalCommitted: { type: Number, required: true }, // monthlyAmount * tenureMonths
    bonusAmount: { type: Number, required: true },    // computed at enrolment
    totalValue: { type: Number, required: true },     // committed + bonus

    installments: [installmentSchema],
    

    status: {
      type: String,
      enum: ['active', 'completed', 'matured', 'cancelled'],
      default: 'active',
      index: true,
    },

    startDate: { type: Date, default: Date.now },
    maturityDate: { type: Date },
    redeemedAt: { type: Date },
  },
  { timestamps: true }
);

// Generate readable plan number + maturity date + installments schedule on first save
digitalGoldPlanSchema.pre('validate', function (next) {
  if (!this.planNumber) {
    const rnd = Math.floor(10000 + Math.random() * 90000);
    this.planNumber = `GH-${rnd}`;
  }
  if (!this.maturityDate) {
    const d = new Date(this.startDate || Date.now());
    d.setMonth(d.getMonth() + this.tenureMonths);
    this.maturityDate = d;
  }
  if (this.isNew && (!this.installments || this.installments.length === 0)) {
    this.installments = Array.from({ length: this.tenureMonths }, (_, i) => ({
      monthNumber: i + 1,
      amount: this.monthlyAmount,
      status: i === 0 ? 'paid' : 'pending', // first instalment paid at enrolment
      paidAt: i === 0 ? new Date() : undefined,
    }));
  }
  next();
});

module.exports = mongoose.model('DigitalGoldPlan', digitalGoldPlanSchema);
