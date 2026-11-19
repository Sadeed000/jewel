const mongoose = require('mongoose');
const slugify = require('slugify');

/**
 * Journal article, written and published from the admin panel.
 *
 * Visibility rule (enforced in contentService): a post is public only when
 * `isPublished` is true AND `publishedAt` is in the past. Everything else —
 * drafts, unpublished posts — is invisible to the public API, the blog pages
 * and the sitemap, and readable only through the admin endpoints.
 */
const blogPostSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    /* Slugs this post used before. Requests for them 308-redirect to the
       current slug, so renaming a published article never breaks its URL. */
    previousSlugs: { type: [String], default: [], index: true },

    excerpt: { type: String, required: true, trim: true, maxlength: 500 },
    /* Sanitised HTML from the admin editor (see utils/sanitizeArticle.js). */
    content: { type: String, required: true },

    coverImage: { type: String, trim: true },
    coverImageAlt: { type: String, trim: true, maxlength: 200 },

    category: { type: String, trim: true, index: true }, // "Ring Guides", "Care", ...
    tags: [{ type: String, trim: true, lowercase: true }],

    author: {
      name: { type: String, trim: true, default: 'Ratnapankh Editorial' },
      avatar: { type: String },
    },

    readTime: { type: String }, // "5 min read" — derived from the body

    // New posts start as drafts. Publishing is an explicit admin action.
    isPublished: { type: Boolean, default: false, index: true },
    // Set the first time the post is published; kept on unpublish so a
    // re-publish doesn't pretend the article is brand new.
    publishedAt: { type: Date, default: null },

    seo: {
      metaTitle: { type: String, trim: true, maxlength: 200 },
      metaDescription: { type: String, trim: true, maxlength: 500 },
    },
    // Editorial planning only — never rendered on the page.
    targetKeyword: { type: String, trim: true, maxlength: 120 },

    // Product slugs shown as "Shop this story" cards under the article.
    relatedProducts: { type: [String], default: [] },
    // Collection links, e.g. { label: 'Silver rings', href: '/shop/silver' }.
    relatedCollections: {
      type: [{ label: { type: String, trim: true }, href: { type: String, trim: true }, _id: false }],
      default: [],
    },

    viewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

blogPostSchema.index({ title: 'text', excerpt: 'text', content: 'text' });
blogPostSchema.index({ isPublished: 1, publishedAt: -1 });

const toSlug = (value) => slugify(String(value || ''), { lower: true, strict: true, trim: true });

blogPostSchema.pre('validate', function (next) {
  this.slug = toSlug(this.slug || this.title);
  if (this.isModified('content') || !this.readTime) {
    const words = String(this.content || '')
      .replace(/<[^>]+>/g, ' ')
      .split(/\s+/)
      .filter(Boolean).length;
    this.readTime = `${Math.max(1, Math.ceil(words / 200))} min read`;
  }
  if (this.isPublished && !this.publishedAt) this.publishedAt = new Date();
  next();
});

blogPostSchema.statics.toSlug = toSlug;

module.exports = mongoose.model('BlogPost', blogPostSchema);
