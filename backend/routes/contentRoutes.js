const express = require('express');
const c = require('../controllers/contentController');
const { protect, restrictTo } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const v = require('../validators/contentValidators');

const router = express.Router();

/* ───────────── Banners ───────────── */
router.get('/banners', c.listBanners);
router.post('/banners', protect, restrictTo('admin'), validate(v.banner), c.createBanner);
router.patch('/banners/:id', protect, restrictTo('admin'), validate(v.banner), c.updateBanner);
router.delete('/banners/:id', protect, restrictTo('admin'), c.deleteBanner);

/* ───────────── Testimonials ───────────── */
router.get('/testimonials', c.listTestimonials);
router.post('/testimonials', protect, restrictTo('admin'), validate(v.testimonial), c.createTestimonial);
router.patch('/testimonials/:id', protect, restrictTo('admin'), validate(v.testimonial), c.updateTestimonial);
router.delete('/testimonials/:id', protect, restrictTo('admin'), c.deleteTestimonial);

/* ───────────── Slug redirects (storefront middleware) ─────────────
   GET /content/redirect?type=product|blog&slug=old-slug → { to: 'new-slug' | null } */
router.get('/redirect', c.resolveSlugRedirect);

/* ───────────── Blog ───────────── */
// Admin routes are declared first so "admin" is never read as a post slug.
// They are the only way to read a draft.
router.get('/blog/admin/posts', protect, restrictTo('admin'), c.adminListBlogPosts);
router.get('/blog/admin/posts/:id', protect, restrictTo('admin'), c.adminGetBlogPost);
router.get('/blog', c.listBlogPosts);
router.get('/blog/:slug', c.getBlogPostBySlug);
router.post('/blog', protect, restrictTo('admin'), validate(v.blogPost), c.createBlogPost);
router.patch('/blog/:id', protect, restrictTo('admin'), validate(v.blogPostUpdate), c.updateBlogPost);
router.delete('/blog/:id', protect, restrictTo('admin'), c.deleteBlogPost);

/* ───────────── Site settings (singleton) ───────────── */
router.get('/settings', c.getSiteSettings);
router.patch('/settings', protect, restrictTo('admin'), validate(v.siteSettings), c.updateSiteSettings);

/* ───────────── Categories ───────────── */
router.get('/categories', c.listCategories);
router.get('/categories/:slug', c.getCategoryBySlug);
router.post('/categories', protect, restrictTo('admin'), validate(v.category), c.createCategory);
router.patch('/categories/:id', protect, restrictTo('admin'), validate(v.category), c.updateCategory);
router.delete('/categories/:id', protect, restrictTo('admin'), c.deleteCategory);

module.exports = router;
