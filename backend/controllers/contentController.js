const contentService = require('../services/contentService');
const catchAsync = require('../utils/catchAsync');
const { ok, created, noContent } = require('../utils/apiResponse');

/* Banners */
const listBanners = catchAsync(async (req, res) => {
  const banners = await contentService.listBanners(req.query);
  ok(res, { banners });
});
const createBanner = catchAsync(async (req, res) => {
  const banner = await contentService.createBanner(req.body);
  created(res, { banner }, 'Banner created');
});
const updateBanner = catchAsync(async (req, res) => {
  const banner = await contentService.updateBanner(req.params.id, req.body);
  ok(res, { banner }, 'Banner updated');
});
const deleteBanner = catchAsync(async (req, res) => {
  await contentService.deleteBanner(req.params.id);
  noContent(res);
});

/* Testimonials */
const listTestimonials = catchAsync(async (req, res) => {
  const testimonials = await contentService.listTestimonials(req.query);
  ok(res, { testimonials });
});
const createTestimonial = catchAsync(async (req, res) => {
  const t = await contentService.createTestimonial(req.body);
  created(res, { testimonial: t }, 'Testimonial created');
});
const updateTestimonial = catchAsync(async (req, res) => {
  const t = await contentService.updateTestimonial(req.params.id, req.body);
  ok(res, { testimonial: t }, 'Testimonial updated');
});
const deleteTestimonial = catchAsync(async (req, res) => {
  await contentService.deleteTestimonial(req.params.id);
  noContent(res);
});

/* Blog */
const listBlogPosts = catchAsync(async (req, res) => {
  const result = await contentService.listBlogPosts(req.query);
  ok(res, result);
});
const getBlogPostBySlug = catchAsync(async (req, res) => {
  const post = await contentService.getBlogPostBySlug(req.params.slug);
  ok(res, { post });
});
const createBlogPost = catchAsync(async (req, res) => {
  const post = await contentService.createBlogPost(req.body);
  created(res, { post }, 'Post created');
});
const updateBlogPost = catchAsync(async (req, res) => {
  const post = await contentService.updateBlogPost(req.params.id, req.body);
  ok(res, { post }, 'Post updated');
});
const deleteBlogPost = catchAsync(async (req, res) => {
  await contentService.deleteBlogPost(req.params.id);
  noContent(res);
});

/* Site settings */
const getSiteSettings = catchAsync(async (req, res) => {
  const settings = await contentService.getSiteSettings();
  ok(res, { settings });
});
const updateSiteSettings = catchAsync(async (req, res) => {
  const settings = await contentService.updateSiteSettings(req.body);
  ok(res, { settings }, 'Settings updated');
});

/* Categories */
const listCategories = catchAsync(async (req, res) => {
  const categories = await contentService.listCategories(req.query);
  ok(res, { categories });
});
const getCategoryBySlug = catchAsync(async (req, res) => {
  const category = await contentService.getCategoryBySlug(req.params.slug);
  ok(res, { category });
});
const createCategory = catchAsync(async (req, res) => {
  const category = await contentService.createCategory(req.body);
  created(res, { category }, 'Category created');
});
const updateCategory = catchAsync(async (req, res) => {
  const category = await contentService.updateCategory(req.params.id, req.body);
  ok(res, { category }, 'Category updated');
});
const deleteCategory = catchAsync(async (req, res) => {
  await contentService.deleteCategory(req.params.id);
  noContent(res);
});

module.exports = {
  listBanners, createBanner, updateBanner, deleteBanner,
  listTestimonials, createTestimonial, updateTestimonial, deleteTestimonial,
  listBlogPosts, getBlogPostBySlug, createBlogPost, updateBlogPost, deleteBlogPost,
  getSiteSettings, updateSiteSettings,
  listCategories, getCategoryBySlug, createCategory, updateCategory, deleteCategory,
};
