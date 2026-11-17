const Store = require('../models/Store');
const Newsletter = require('../models/Newsletter');
const Contact = require('../models/Contact');
const DigitalGoldPlan = require('../models/DigitalGoldPlan');
const AppError = require('../utils/AppError');
const { parsePagination, paginate } = require('../utils/pagination');

/* ───────────── Stores ───────────── */

const listStores = async (query) => {
  const { page, limit, skip } = parsePagination(query, { limit: 50 });
  const filter = { isActive: true };

  if (query.city) filter.city = new RegExp(`^${query.city}$`, 'i');
  if (query.q) {
    filter.$or = [
      { name: new RegExp(query.q, 'i') },
      { city: new RegExp(query.q, 'i') },
      { address: new RegExp(query.q, 'i') },
      { pincode: new RegExp(query.q, 'i') },
    ];
  }

  // Geo-search: ?lng=...&lat=...&radius=meters
  if (query.lng != null && query.lat != null) {
    const radius = Number(query.radius) || 50000;
    filter.location = {
      $near: {
        $geometry: { type: 'Point', coordinates: [Number(query.lng), Number(query.lat)] },
        $maxDistance: radius,
      },
    };
  }

  const [items, total] = await Promise.all([
    Store.find(filter).skip(skip).limit(limit).lean(),
    Store.countDocuments(filter),
  ]);

  return paginate({ items, total, page, limit });
};

const getStoreBySlug = async (slug) => {
  const store = await Store.findOne({ slug, isActive: true }).lean();
  if (!store) throw new AppError('Store not found.', 404);
  return store;
};

/* ───────────── Newsletter ───────────── */

/**
 * Subscribe — idempotent: if the email is already subscribed but inactive,
 * reactivate it; if it's already active, just return the existing record.
 */
const subscribeNewsletter = async ({ email, source }) => {
  const existing = await Newsletter.findOne({ email });
  if (existing) {
    if (!existing.isActive) {
      existing.isActive = true;
      existing.unsubscribedAt = undefined;
      await existing.save();
    }
    return existing;
  }
  return Newsletter.create({ email, source });
};

const unsubscribeNewsletter = async (email) => {
  const sub = await Newsletter.findOne({ email });
  if (!sub) throw new AppError('Email not found in our newsletter list.', 404);
  sub.isActive = false;
  sub.unsubscribedAt = new Date();
  await sub.save();
  return sub;
};

/* ───────────── Contact ───────────── */

const submitContact = async (payload) => Contact.create(payload);

/* ───────────── Gold Rate ───────────── */

/**
 * Stub gold-rate endpoint. In production this would call an external API
 * (MMTC, IBJA, etc.); cached for 15 minutes to avoid rate-limit issues.
 */
let cachedRate = null;
let cachedAt = 0;
const CACHE_TTL = 15 * 60 * 1000;

const getGoldRate = async () => {
  const now = Date.now();
  if (cachedRate && now - cachedAt < CACHE_TTL) return cachedRate;

  // Replace with real API call when GOLD_RATE_API_URL is configured
  cachedRate = {
    rates: [
      { karat: '24K', price: 7820, unit: 'per gram', change: 0.4 },
      { karat: '22K', price: 7170, unit: 'per gram', change: 0.4 },
      { karat: '18K', price: 5865, unit: 'per gram', change: 0.3 },
      { karat: 'Silver', price: 94, unit: 'per gram', change: 1.1 },
    ],
    currency: 'INR',
    updatedAt: new Date().toISOString(),
    source: 'Aurelia internal',
  };
  cachedAt = now;
  return cachedRate;
};

/* ───────────── Digital Gold (Golden Harvest) ───────────── */

const calculateGoldenHarvest = ({ monthlyAmount, tenureMonths, bonusPercent = 7.5 }) => {
  const totalCommitted = monthlyAmount * tenureMonths;
  const bonusAmount = Math.round((totalCommitted * bonusPercent) / 100);
  const totalValue = totalCommitted + bonusAmount;
  return { monthlyAmount, tenureMonths, bonusPercent, totalCommitted, bonusAmount, totalValue };
};

const enrolGoldenHarvest = async (userId, { monthlyAmount, tenureMonths }) => {
  const calc = calculateGoldenHarvest({ monthlyAmount, tenureMonths });

  const plan = await DigitalGoldPlan.create({
    user: userId,
    monthlyAmount: calc.monthlyAmount,
    tenureMonths: calc.tenureMonths,
    bonusPercent: calc.bonusPercent,
    totalCommitted: calc.totalCommitted,
    bonusAmount: calc.bonusAmount,
    totalValue: calc.totalValue,
  });
  return plan;
};

const listMyPlans = async (userId) =>
  DigitalGoldPlan.find({ user: userId }).sort('-createdAt').lean();

const getMyPlan = async (userId, planId) => {
  const plan = await DigitalGoldPlan.findOne({ _id: planId, user: userId }).lean();
  if (!plan) throw new AppError('Plan not found.', 404);
  return plan;
};

const payInstallment = async (userId, planId, monthNumber) => {
  const plan = await DigitalGoldPlan.findOne({ _id: planId, user: userId });
  if (!plan) throw new AppError('Plan not found.', 404);
  if (plan.status !== 'active') throw new AppError('This plan is no longer active.', 400);

  const inst = plan.installments.find((i) => i.monthNumber === monthNumber);
  if (!inst) throw new AppError('Installment not found.', 404);
  if (inst.status === 'paid') throw new AppError('Installment already paid.', 400);

  inst.status = 'paid';
  inst.paidAt = new Date();
  inst.transactionId = `TXN-${Date.now()}`;

  // Mark plan completed when every instalment is paid
  if (plan.installments.every((i) => i.status === 'paid')) {
    plan.status = 'completed';
  }

  await plan.save();
  return plan;
};

module.exports = {
  // stores
  listStores,
  getStoreBySlug,
  // newsletter
  subscribeNewsletter,
  unsubscribeNewsletter,
  // contact
  submitContact,
  // gold rate
  getGoldRate,
  // digital gold
  calculateGoldenHarvest,
  enrolGoldenHarvest,
  listMyPlans,
  getMyPlan,
  payInstallment,
};
