const mongoose = require('mongoose');
const slugify = require('slugify');

const blogPostSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    excerpt: { type: String, required: true, trim: true, maxlength: 500 },
    content: { type: String, required: true },
    coverImage: { type: String, required: true },

    category: { type: String, trim: true, index: true }, // "Wedding", "Care", "Festive Styling", etc.
    tags: [{ type: String, trim: true, lowercase: true }],

    author: {
      name: { type: String, default: 'Aurelia Editorial' },
      avatar: { type: String },
    },

    readTime: { type: String }, // "5 min read"
    isPublished: { type: Boolean, default: true, index: true },
    publishedAt: { type: Date, default: Date.now },

    seo: {
      metaTitle: String,
      metaDescription: String,
    },

    viewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

blogPostSchema.index({ title: 'text', excerpt: 'text', content: 'text' });

blogPostSchema.pre('validate', function (next) {
  if (!this.slug && this.title) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
  if (!this.readTime && this.content) {
    const words = this.content.split(/\s+/).length;
    this.readTime = `${Math.max(1, Math.ceil(words / 200))} min read`;
  }
  next();
});

module.exports = mongoose.model('BlogPost', blogPostSchema);
