const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const AppError = require('../utils/AppError');
const { parsePagination, paginate } = require('../utils/pagination');

const listOrders = async (query) => {
  const { page, limit, skip, sort } = parsePagination(query, { sort: '-createdAt' });
  const filter = {};

  if (query.status) filter.status = query.status;
  if (query.orderNumber) filter.orderNumber = query.orderNumber;

  if (query.userEmail) {
    const user = await User.findOne({ email: query.userEmail.toLowerCase().trim() }).select('_id');
    if (!user) {
      return paginate({ items: [], total: 0, page, limit });
    }
    filter.user = user._id;
  }

  const [items, total] = await Promise.all([
    Order.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Order.countDocuments(filter),
  ]);

  return paginate({ items, total, page, limit });
};

const getOrderById = async (orderId) => {
  const query = orderId.match(/^[0-9a-fA-F]{24}$/)
    ? { _id: orderId }
    : { orderNumber: orderId };

  const order = await Order.findOne(query).lean();
  if (!order) throw new AppError('Order not found.', 404);
  return order;
};

const listCustomers = async (query) => {
  const { page, limit, skip, sort } = parsePagination(query, { sort: '-createdAt' });
  const filter = {};

  if (query.role) filter.role = query.role;
  else filter.role = 'customer';

  if (query.email) filter.email = query.email.toLowerCase().trim();
  if (query.isActive !== undefined) filter.isActive = query.isActive;

  const [items, total] = await Promise.all([
    User.find(filter).sort(sort).lean(),
    User.countDocuments(filter),
  ]);

  return paginate({ items, total, page, limit });
};

const getCustomerById = async (id) => {
  const user = await User.findById(id).lean();
  if (!user) throw new AppError('User not found.', 404);
  return user;
};

const updateCustomer = async (id, payload) => {
  const user = await User.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
  if (!user) throw new AppError('User not found.', 404);
  return user.toSafeJSON();
};

const getDashboardSummary = async () => {
  const [totalOrders, totalCustomers, totalProducts, revenueResult, statusCounts] = await Promise.all([
    Order.countDocuments(),
    User.countDocuments({ role: 'customer' }),
    Product.countDocuments(),
    Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, totalRevenue: { $sum: '$total' } } },
    ]),
    Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
  ]);

  return {
    totalOrders,
    totalCustomers,
    totalProducts,
    totalRevenue: revenueResult[0]?.totalRevenue || 0,
    statusCounts: statusCounts.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {}),
  };
};

module.exports = {
  listOrders,
  getOrderById,
  listCustomers,
  getCustomerById,
  updateCustomer,
  getDashboardSummary,
};