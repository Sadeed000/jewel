/**
 * seedCatalog.js — migrates the storefront's hardcoded catalogue into MongoDB.
 *
 * Reads frontend/src/data/products.ts (the single source of truth the UI used
 * to import directly) and inserts every product, collection and category so the
 * site renders identically while being fully database-driven.
 *
 * Idempotent: matches on `slug`, so re-running updates rather than duplicates.
 *
 *   node seeds/seedCatalog.js            # upsert catalogue
 *   node seeds/seedCatalog.js --prune    # also delete products not in the file
 *
 * Superseded seeds/seedProducts.js, which only carried 15 of the 50 products
 * and omitted `coverImages` — a required field, so every insert it attempted
 * failed validation and left the collection empty.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Product = require('../models/Product');
const Category = require('../models/Category');

const SOURCE = path.resolve(__dirname, '../../frontend/src/data/products.ts');

/**
 * Pull a top-level array literal out of the TypeScript source and evaluate it.
 * The file is plain data — object literals plus an `img()` helper — so a scoped
 * eval is sufficient and avoids adding a TS toolchain to the backend.
 */
const extractArray = (source, declaration) => {
  const start = source.indexOf(declaration);
  if (start === -1) throw new Error(`Could not find "${declaration}" in ${SOURCE}`);

  // Anchor past the `=` first: `export const products: Product[] = [...]` has a
  // `[` inside the type annotation that would otherwise be mistaken for the
  // start of the literal (and parse as an empty array).
  const assign = source.indexOf('=', start);
  if (assign === -1) throw new Error(`No assignment for "${declaration}"`);

  const open = source.indexOf('[', assign);
  if (open === -1) throw new Error(`No array literal after "${declaration}"`);

  // Walk the literal counting brackets so nested arrays (images) don't end it early.
  let depth = 0;
  let end = -1;
  for (let i = open; i < source.length; i += 1) {
    const ch = source[i];
    if (ch === '[') depth += 1;
    else if (ch === ']') {
      depth -= 1;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  if (end === -1) throw new Error(`Unterminated array literal for "${declaration}"`);

  const literal = source.slice(open, end + 1);
  const img = (id, w = 800) =>
    `https://images.unsplash.com/${id}?w=${w}&auto=format&fit=crop`;

  // eslint-disable-next-line no-new-func
  return new Function('img', `return ${literal};`)(img);
};

/**
 * Map a frontend Product into the Mongoose schema shape.
 * The UI type has no coverImages/detailedImages, but the model requires at
 * least one cover image — derive them from `images` so validation passes and
 * the product cards keep showing the exact same artwork.
 */
const toProductDoc = (p) => {
  const images = Array.isArray(p.images) && p.images.length ? p.images : [];
  if (!images.length) throw new Error(`Product "${p.slug}" has no images`);

  return {
    name: p.name,
    slug: p.slug,
    // Derive a stable SKU from the source id so re-runs don't churn.
    sku: `AUR-${String(p.id || p.slug).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12)}`,
    category: p.category,
    type: p.type,
    price: p.price,
    ...(p.originalPrice ? { originalPrice: p.originalPrice } : {}),
    images,
    coverImages: [images[0]],
    detailedImages: images.slice(1),
    metal: p.metal,
    purity: p.purity,
    weight: p.weight,
    description: p.description,
    isBestseller: !!p.isBestseller,
    isNew: !!p.isNew,
    isExpertChoice: !!p.isExpertChoice,
    inStock: p.inStock !== false,
    onlyOneLeft: !!p.onlyOneLeft,
    // "Only one left" is a stock signal, so reflect it in the real quantity
    // rather than leaving every product on the schema default of 10.
    stockQty: p.inStock === false ? 0 : p.onlyOneLeft ? 1 : 12,
    ...(p.collection ? { collection: p.collection } : {}),
    ...(p.occasion ? { occasion: p.occasion } : {}),
    ...(p.gemstone ? { gemstone: p.gemstone } : {}),
    gender: p.gender || 'women',
  };
};

const toCategoryDoc = (c, index) => ({
  name: c.name,
  slug: c.slug,
  image: c.image,
  href: `/shop/${c.slug}`,
  sortOrder: index,
  isActive: true,
  showInNav: true,
  showInMegaMenu: true,
});

const run = async () => {
  const prune = process.argv.includes('--prune');

  const source = fs.readFileSync(SOURCE, 'utf8');
  const products = extractArray(source, 'export const products');
  const collections = extractArray(source, 'export const collections');
  const categories = extractArray(source, 'export const categories');

  console.log(
    `Parsed ${products.length} products, ${collections.length} collections, ${categories.length} categories from ${path.relative(process.cwd(), SOURCE)}`
  );

  await connectDB();

  /* ── Products ── */
  const docs = products.map(toProductDoc);
  const productOps = docs.map((doc) => ({
    updateOne: { filter: { slug: doc.slug }, update: { $set: doc }, upsert: true },
  }));
  const productResult = await Product.bulkWrite(productOps, { ordered: false });
  console.log(
    `Products  → ${productResult.upsertedCount} inserted, ${productResult.modifiedCount} updated`
  );

  /* ── Categories (collections are surfaced as categories for the mega menu) ── */
  const categoryDocs = [
    ...categories.map(toCategoryDoc),
    ...collections.map((c, i) => ({
      ...toCategoryDoc(c, categories.length + i),
      // Collections are curated edits, not metal types — keep them out of the
      // primary nav so the existing header layout is untouched.
      showInNav: false,
    })),
  ];
  const categoryOps = categoryDocs.map((doc) => ({
    updateOne: { filter: { slug: doc.slug }, update: { $set: doc }, upsert: true },
  }));
  const categoryResult = await Category.bulkWrite(categoryOps, { ordered: false });
  console.log(
    `Categories → ${categoryResult.upsertedCount} inserted, ${categoryResult.modifiedCount} updated`
  );

  /* ── Prune ── */
  if (prune) {
    const slugs = docs.map((d) => d.slug);
    const { deletedCount } = await Product.deleteMany({ slug: { $nin: slugs } });
    console.log(`Pruned    → ${deletedCount} product(s) not present in the source file`);
  }

  const total = await Product.countDocuments();
  console.log(`\n✓ Catalogue seeded. ${total} products now in the database.`);

  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error('✗ Seed failed:', err.message);
  process.exit(1);
});
