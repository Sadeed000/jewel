const Banner = require('../models/Banner');
const Testimonial = require('../models/Testimonial');
const BlogPost = require('../models/BlogPost');
const SiteSettings = require('../models/SiteSettings');
const Category = require('../models/Category');
const AppError = require('../utils/AppError');
const { sanitizeArticle, stripTags } = require('../utils/sanitizeArticle');
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

/** The one definition of "publicly visible". Drafts never match it. */
const publicBlogFilter = () => ({ isPublished: true, publishedAt: { $ne: null, $lte: new Date() } });

/** Fields the editor may never set directly. */
const BLOG_READONLY = ['_id', 'viewCount', 'previousSlugs', 'createdAt', 'updatedAt', 'readTime'];

const cleanBlogPayload = (payload) => {
  const data = { ...payload };
  BLOG_READONLY.forEach((k) => delete data[k]);
  ['title', 'excerpt', 'category', 'coverImageAlt', 'targetKeyword'].forEach((k) => {
    if (data[k] !== undefined) data[k] = stripTags(data[k]);
  });
  if (data.seo) {
    data.seo = { metaTitle: stripTags(data.seo.metaTitle), metaDescription: stripTags(data.seo.metaDescription) };
  }
  if (data.content !== undefined) data.content = sanitizeArticle(data.content);
  if (data.slug !== undefined) data.slug = BlogPost.toSlug(data.slug);
  if (Array.isArray(data.relatedProducts)) {
    data.relatedProducts = [...new Set(data.relatedProducts.map((s) => BlogPost.toSlug(s)).filter(Boolean))];
  }
  if (Array.isArray(data.relatedCollections)) {
    // Internal paths only, so they follow the storefront to any domain.
    data.relatedCollections = data.relatedCollections
      .filter((c) => c && c.label && typeof c.href === 'string' && c.href.startsWith('/') && !c.href.startsWith('//'))
      .map((c) => ({ label: stripTags(c.label), href: c.href.trim() }));
  }
  return data;
};

/** A slug may belong to only one post — current or previous. */
const assertSlugFree = async (slug, exceptId) => {
  const clash = await BlogPost.exists({
    _id: { $ne: exceptId },
    $or: [{ slug }, { previousSlugs: slug }],
  });
  if (clash) throw new AppError(`The URL slug "${slug}" is already used by another article.`, 409);
};

const listBlogPosts = async (query) => {
  const { page, limit, skip, sort } = parsePagination(query, { sort: '-publishedAt' });
  const filter = publicBlogFilter();
  if (query.category) filter.category = query.category;
  if (query.tag) filter.tags = String(query.tag).toLowerCase();
  if (query.q) filter.$text = { $search: String(query.q) };

  const [items, total] = await Promise.all([
    BlogPost.find(filter)
      .select('-content -targetKeyword -viewCount')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    BlogPost.countDocuments(filter),
  ]);
  return paginate({ items, total, page, limit });
};

/**
 * Public read. A request for a slug the post used before resolves to the post
 * with its current slug; the storefront turns that mismatch into a redirect.
 */
const getBlogPostBySlug = async (slug) => {
  const select = '-targetKeyword -viewCount';
  const post =
    (await BlogPost.findOne({ ...publicBlogFilter(), slug }).select(select).lean()) ||
    (await BlogPost.findOne({ ...publicBlogFilter(), previousSlugs: slug }).select(select).lean());
  if (!post) throw new AppError('Post not found.', 404);
  return post;
};

/**
 * Where an old URL slug should permanently redirect to, or null.
 * Used by the storefront middleware. A slug that is some item's *current*
 * slug never redirects; unpublished posts never redirect (they 404).
 */
const resolveSlugRedirect = async (type, slug) => {
  const clean = String(slug || '').toLowerCase().slice(0, 220);
  if (!clean) return null;
  if (type === 'product') {
    const Product = require('../models/Product');
    if (await Product.exists({ slug: clean })) return null;
    const p = await Product.findOne({ previousSlugs: clean }).select('slug').lean();
    return p?.slug ?? null;
  }
  if (type === 'blog') {
    if (await BlogPost.exists({ slug: clean })) return null;
    const post = await BlogPost.findOne({ ...publicBlogFilter(), previousSlugs: clean }).select('slug').lean();
    return post?.slug ?? null;
  }
  return null;
};

/* Admin — sees drafts. */

const adminListBlogPosts = async (query) => {
  const { page, limit, skip } = parsePagination(query, { sort: '-updatedAt' });
  const filter = {};
  if (query.status === 'published') filter.isPublished = true;
  if (query.status === 'draft') filter.isPublished = false;
  if (query.q) {
    const term = String(query.q).trim().slice(0, 80).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (term) filter.$or = [{ title: { $regex: term, $options: 'i' } }, { slug: { $regex: term, $options: 'i' } }];
  }
  const [items, total] = await Promise.all([
    BlogPost.find(filter).select('-content').sort('-updatedAt').skip(skip).limit(limit).lean(),
    BlogPost.countDocuments(filter),
  ]);
  return paginate({ items, total, page, limit });
};

const adminGetBlogPost = async (id) => {
  const post = await BlogPost.findById(id).lean();
  if (!post) throw new AppError('Post not found.', 404);
  return post;
};

const createBlogPost = async (payload) => {
  const data = cleanBlogPayload(payload);
  data.slug = BlogPost.toSlug(data.slug || data.title);
  if (!data.slug) throw new AppError('Please give the article a title or slug.', 400);
  await assertSlugFree(data.slug);
  return BlogPost.create(data);
};

const updateBlogPost = async (id, payload) => {
  const post = await BlogPost.findById(id);
  if (!post) throw new AppError('Post not found.', 404);
  const data = cleanBlogPayload(payload);

  if (data.slug !== undefined) {
    if (!data.slug) throw new AppError('The URL slug cannot be empty.', 400);
    if (data.slug !== post.slug) {
      await assertSlugFree(data.slug, post._id);
      // Only a URL that was ever public needs to keep working.
      if (post.publishedAt) post.previousSlugs.addToSet(post.slug);
      post.previousSlugs.pull(data.slug);
    }
  }

  post.set(data);
  await post.save();
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
  adminListBlogPosts, adminGetBlogPost, resolveSlugRedirect,
  // settings
  getSiteSettings, updateSiteSettings,
  // categories
  listCategories, getCategoryBySlug, createCategory, updateCategory, deleteCategory,
};
