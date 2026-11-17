const miscService = require('../services/miscService');
const catchAsync = require('../utils/catchAsync');
const { ok, created } = require('../utils/apiResponse');

/* ───────────── Stores ───────────── */
const listStores = catchAsync(async (req, res) => {
  const result = await miscService.listStores(req.query);
  ok(res, result);
});

const getStoreBySlug = catchAsync(async (req, res) => {
  const store = await miscService.getStoreBySlug(req.params.slug);
  ok(res, { store });
});

/* ───────────── Newsletter ───────────── */
const subscribe = catchAsync(async (req, res) => {
  const subscription = await miscService.subscribeNewsletter(req.body);
  created(res, { subscription }, 'Subscribed successfully');
});

const unsubscribe = catchAsync(async (req, res) => {
  const subscription = await miscService.unsubscribeNewsletter(req.body.email);
  ok(res, { subscription }, 'Unsubscribed');
});

/* ───────────── Contact ───────────── */
const submitContact = catchAsync(async (req, res) => {
  const submission = await miscService.submitContact(req.body);
  created(res, { submission }, 'Message received. We will get back to you shortly.');
});

/* ───────────── Gold rate ───────────── */
const getGoldRate = catchAsync(async (req, res) => {
  const rate = await miscService.getGoldRate();
  ok(res, rate);
});

/* ───────────── Digital Gold ───────────── */
const calculate = catchAsync(async (req, res) => {
  const monthlyAmount = parseInt(req.query.monthlyAmount, 10);
  const tenureMonths = parseInt(req.query.tenureMonths, 10);
  const result = miscService.calculateGoldenHarvest({ monthlyAmount, tenureMonths });
  ok(res, result);
});

const enrol = catchAsync(async (req, res) => {
  const plan = await miscService.enrolGoldenHarvest(req.user._id, req.body);
  created(res, { plan }, 'Enrolled in Golden Harvest');
});

const listMyPlans = catchAsync(async (req, res) => {
  const plans = await miscService.listMyPlans(req.user._id);
  ok(res, { plans });
});

const getMyPlan = catchAsync(async (req, res) => {
  const plan = await miscService.getMyPlan(req.user._id, req.params.id);
  ok(res, { plan });
});

const payInstallment = catchAsync(async (req, res) => {
  const plan = await miscService.payInstallment(
    req.user._id,
    req.params.id,
    parseInt(req.params.month, 10)
  );
  ok(res, { plan }, 'Installment paid');
});

module.exports = {
  listStores,
  getStoreBySlug,
  subscribe,
  unsubscribe,
  submitContact,
  getGoldRate,
  calculate,
  enrol,
  listMyPlans,
  getMyPlan,
  payInstallment,
};
