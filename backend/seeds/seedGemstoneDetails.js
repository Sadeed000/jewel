/**
 * seedGemstoneDetails.js — adds provenance, certification and ring options to
 * the existing catalogue, and creates the base product the bespoke ring
 * configurator attaches to.
 *
 * Values are representative placeholders so the trust panels have something
 * real to render. Replace certificate numbers with your actual lab reports
 * before going live — an unverifiable certificate number is worse than none.
 *
 *   node seeds/seedGemstoneDetails.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Product = require('../models/Product');

/** Plausible origin + treatment per stone type. */
const STONE_PROFILE = {
  emerald: { origin: 'Zambian', treatment: 'oiled', clarity: 'VS', cut: 'Emerald Cut', lab: 'IGI' },
  ruby: { origin: 'Burmese', treatment: 'heated', clarity: 'VS', cut: 'Oval', lab: 'GIA' },
  sapphire: { origin: 'Ceylon', treatment: 'none', clarity: 'VVS', cut: 'Cushion', lab: 'GIA' },
  tanzanite: { origin: 'Tanzanian', treatment: 'heated', clarity: 'VS', cut: 'Trillion', lab: 'IGI' },
  pearl: { origin: 'South Sea', treatment: 'none', clarity: 'AAA', cut: 'Round Cabochon', lab: 'SGL' },
  coral: { origin: 'Mediterranean', treatment: 'none', clarity: 'AA', cut: 'Cabochon', lab: 'SGL' },
};

/** Deterministic pseudo-certificate number so re-runs stay stable. */
const certNumber = (lab, slug) => {
  let hash = 0;
  for (let i = 0; i < slug.length; i += 1) hash = (hash * 31 + slug.charCodeAt(i)) >>> 0;
  return `${lab}-${String(hash).slice(0, 8).padStart(8, '0')}`;
};

const VERIFY_URLS = {
  IGI: 'https://www.igi.org/verify-your-report/',
  GIA: 'https://www.gia.edu/report-check-landing',
  GII: 'https://www.giionline.com/verify',
  SGL: 'https://www.sgllabs.com/verify',
};

const run = async () => {
  await connectDB();

  const products = await Product.find({});
  let stoneUpdates = 0;
  let ringUpdates = 0;

  for (const product of products) {
    const update = {};

    // Provenance for stone-set pieces.
    const profile = product.gemstone && product.gemstone !== 'none'
      ? STONE_PROFILE[product.gemstone]
      : null;

    if (profile) {
      // Estimate carat from the piece's price band; replace with real figures.
      const estimatedCarat = Math.max(
        0.5,
        Math.round((product.price / 60000) * 10) / 10
      );

      update.gemstoneDetails = {
        caratWeight: estimatedCarat,
        origin: profile.origin,
        treatment: profile.treatment,
        clarity: profile.clarity,
        cut: profile.cut,
        stoneCount: 1,
      };
      update.certification = {
        lab: profile.lab,
        certificateNumber: certNumber(profile.lab, product.slug),
        verifyUrl: VERIFY_URLS[profile.lab],
      };
      stoneUpdates += 1;
    }

    // Rings get the resize promise and engraving option.
    if (product.type === 'rings') {
      update.freeResize = true;
      update.engravingAvailable = true;
      update.engravingMaxChars = 20;
      ringUpdates += 1;
    }

    // Bands and bangles can be engraved too.
    if (['bracelets', 'bangles'].includes(product.type)) {
      update.engravingAvailable = true;
      update.engravingMaxChars = 20;
    }

    if (Object.keys(update).length) {
      await Product.updateOne({ _id: product._id }, { $set: update });
    }
  }

  console.log(`Gemstone provenance → ${stoneUpdates} product(s)`);
  console.log(`Ring options        → ${ringUpdates} product(s)`);

  /* ── Base product for the bespoke configurator ──
     Every cart line needs a product reference. Bespoke rings attach to this
     one; their real price comes from customRingService, not from here. */
  const BESPOKE_SLUG = 'bespoke-gemstone-ring';
  const bespoke = await Product.findOneAndUpdate(
    { slug: BESPOKE_SLUG },
    {
      $set: {
        name: 'Bespoke Gemstone Ring',
        slug: BESPOKE_SLUG,
        sku: 'AUR-BESPOKE',
        category: 'gemstone',
        type: 'rings',
        // Placeholder — the configurator prices each build individually.
        price: 0,
        images: ['https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&auto=format&fit=crop'],
        coverImages: ['https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&auto=format&fit=crop'],
        detailedImages: [],
        metal: 'Your choice',
        purity: 'Your choice',
        weight: 'Made to order',
        description:
          'A ring made to your specification — choose the stone, carat, metal and setting. Handcrafted and delivered in 3 to 4 weeks.',
        inStock: true,
        // Made to order, so it never runs out of shelf stock.
        stockQty: 999,
        gender: 'unisex',
        engravingAvailable: true,
        freeResize: true,
        bisHallmark: true,
        // Kept out of listings: it is reached through the configurator.
        tryOnEnabled: false,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log(`Bespoke base product → ${bespoke._id} (${bespoke.slug})`);

  const total = await Product.countDocuments();
  console.log(`\n✓ Done. ${total} products in the catalogue.`);

  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error('✗ Seed failed:', err.message);
  process.exit(1);
});
