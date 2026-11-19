/**
 * Migration: blog workflow + slug redirects (November 2026).
 *
 *   node migrations/2026-11-blog-seo.js            # dry run — reports only
 *   node migrations/2026-11-blog-seo.js --apply    # writes the changes
 *
 * Idempotent: safe to run more than once.
 *
 * 1. Blog posts created before this change relied on `isPublished` defaulting
 *    to true. The default is now false (drafts), so any legacy document
 *    without an explicit value is pinned to its old behaviour (published),
 *    and published posts missing `publishedAt` get their creation date.
 * 2. Adds empty `previousSlugs` arrays to products and posts that lack one,
 *    and builds the new indexes (previousSlugs, isPublished+publishedAt).
 *
 * Uses MONGO_URI from backend/.env — point it at the right database first.
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const BlogPost = require('../models/BlogPost');
const Product = require('../models/Product');

const APPLY = process.argv.includes('--apply');

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  console.log(`Database: ${db.databaseName}  (${APPLY ? 'APPLY' : 'dry run'})`);

  const posts = db.collection('blogposts');
  const products = db.collection('products');

  const steps = [
    ['posts without isPublished → true', posts, { isPublished: { $exists: false } }, { $set: { isPublished: true } }],
    ['published posts without publishedAt', posts, { isPublished: true, $or: [{ publishedAt: null }, { publishedAt: { $exists: false } }] }, [{ $set: { publishedAt: '$createdAt' } }]],
    ['posts without previousSlugs', posts, { previousSlugs: { $exists: false } }, { $set: { previousSlugs: [] } }],
    ['products without previousSlugs', products, { previousSlugs: { $exists: false } }, { $set: { previousSlugs: [] } }],
  ];

  for (const [label, coll, filter, update] of steps) {
    const n = await coll.countDocuments(filter);
    if (APPLY && n) await coll.updateMany(filter, update);
    console.log(`  ${APPLY ? 'updated' : 'would update'} ${n} — ${label}`);
  }

  if (APPLY) {
    await Promise.all([BlogPost.syncIndexes(), Product.createIndexes()]);
    console.log('  indexes synced');
  }

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
