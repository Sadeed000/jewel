const Banner = require('../models/Banner');
const Testimonial = require('../models/Testimonial');
const BlogPost = require('../models/BlogPost');
const SiteSettings = require('../models/SiteSettings');
const Category = require('../models/Category');
const AppError = require('../utils/AppError');
const { parsePagination, paginate } = require('../utils/pagination');

/* ───────────── Banners ───────────── */

const listBanners = async (query) => {
  const filter = { isActive: true };
  if (query.placement) filter.placement = query.placement;

  // Optional date-range scheduling — only return banners that are "live now"
  const now = new Date();
  filter.$and = [
    { $or: [{ startsAt: { $exists: false } }, { startsAt: null }, { startsAt: { $lte: now } }] },
    { $or: [{ endsAt: { $exists: false } }, { endsAt: null }, { endsAt: { $gte: now } }] },
  ];

  return Banner.find(filter).sort('sortOrder createdAt').lean();
};

const createBanner = (payload) => Banner.create(payload);

const updateBanner = async (id, payload) => {
  const banner = await Banner.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
  if (!banner) throw new AppError('Banner not found.', 404);
  return banner;
};

const deleteBanner = async (id) => {
  const banner = await Banner.findByIdAndDelete(id);
  if (!banner) throw new AppError('Banner not found.', 404);
  return banner;
};

/* ───────────── Testimonials ───────────── */

const listTestimonials = async (query) => {
  const filter = { isActive: true };
  if (query.featured === 'true' || query.featured === true) filter.isFeatured = true;
  return Testimonial.find(filter).sort('sortOrder -createdAt').lean();
};

const createTestimonial = (payload) => Testimonial.create(payload);

const updateTestimonial = async (id, payload) => {
  const item = await Testimonial.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
  if (!item) throw new AppError('Testimonial not found.', 404);
  return item;
};

const deleteTestimonial = async (id) => {
  const item = await Testimonial.findByIdAndDelete(id);
  if (!item) throw new AppError('Testimonial not found.', 404);
  return item;
};

/* ───────────── Blog ───────────── */

const listBlogPosts = async (query) => {
  const { page, limit, skip, sort } = parsePagination(query, { sort: '-publishedAt' });
  const filter = { isPublished: true };
  if (query.category) filter.category = query.category;
  if (query.tag) filter.tags = query.tag.toLowerCase();
  if (query.q) filter.$text = { $search: query.q };

  const [items, total] = await Promise.all([
    BlogPost.find(filter).select('-content').sort(sort).skip(skip).limit(limit).lean(),
    BlogPost.countDocuments(filter),
  ]);
  return paginate({ items, total, page, limit });
};

const getBlogPostBySlug = async (slug) => {
  // Atomically increment view count and return the updated doc.
  const post = await BlogPost.findOneAndUpdate(
    { slug, isPublished: true },
    { $inc: { viewCount: 1 } },
    { new: true }
  ).lean();
  if (!post) throw new AppError('Post not found.', 404);
  return post;
};

const createBlogPost = (payload) => BlogPost.create(payload);

const updateBlogPost = async (id, payload) => {
  const post = await BlogPost.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
  if (!post) throw new AppError('Post not found.', 404);
  return post;
};

const deleteBlogPost = async (id) => {
  const post = await BlogPost.findByIdAndDelete(id);
  if (!post) throw new AppError('Post not found.', 404);
  return post;
};

/* ───────────── Site settings (singleton) ───────────── */

const getSiteSettings = async () => {
  // Upsert so the frontend never sees a 404 even on a brand-new install.
  return SiteSettings.findOneAndUpdate(
    { key: 'main' },
    { $setOnInsert: { key: 'main' } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();
};

const updateSiteSettings = async (payload) => {
  // Don't allow caller to change the key.
  delete payload.key;
  return SiteSettings.findOneAndUpdate(
    { key: 'main' },
    { $set: payload },
    { upsert: true, new: true, runValidators: true }
  ).lean();
};

/* ───────────── Categories ───────────── */

const listCategories = async (query) => {
  const filter = { isActive: true };
  if (query.nav === 'true') filter.showInNav = true;
  if (query.megaMenu === 'true') filter.showInMegaMenu = true;
  return Category.find(filter).sort('sortOrder createdAt').lean();
};

const getCategoryBySlug = async (slug) => {
  const cat = await Category.findOne({ slug, isActive: true }).lean();
  if (!cat) throw new AppError('Category not found.', 404);
  return cat;
};

const createCategory = (payload) => Category.create(payload);

const updateCategory = async (id, payload) => {
  const cat = await Category.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
  if (!cat) throw new AppError('Category not found.', 404);
  return cat;
};

const deleteCategory = async (id) => {
  const cat = await Category.findByIdAndDelete(id);
  if (!cat) throw new AppError('Category not found.', 404);
  return cat;
};

module.exports = {
  // banners
  listBanners, createBanner, updateBanner, deleteBanner,
  // testimonials
  listTestimonials, createTestimonial, updateTestimonial, deleteTestimonial,
  // blog
  listBlogPosts, getBlogPostBySlug, createBlogPost, updateBlogPost, deleteBlogPost,
  // settings
  getSiteSettings, updateSiteSettings,
  // categories
  listCategories, getCategoryBySlug, createCategory, updateCategory, deleteCategory,
};
