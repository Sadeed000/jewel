require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Category = require('../models/Category');

/**
 * Restore the primary navigation categories.
 *
 * The storefront header, mega menu and homepage tiles read the Category
 * collection, so every nav entry has to exist as a document. seedCatalog.js
 * writes the five metal categories from the product data but no icons and
 * none of the destination categories (Earrings, Rings, Wedding…), which left
 * the nav short whenever it ran after seedContent.js.
 *
 * Unlike seedContent.js this seed **upserts** — it never calls deleteMany, so
 * categories created in the admin dashboard survive it. Safe to re-run.
 */

const img = (id, w = 600) => `https://images.unsplash.com/${id}?w=${w}&auto=format&fit=crop`;

const categories = [
  { name: 'All Jewellery', slug: 'jewellery', icon: '◈', image: img('photo-1611652022419-a9419f74343d'), href: '/jewellery', sortOrder: 1 },
  { name: 'Gold', slug: 'gold', icon: '◉', image: img('photo-1611652022419-a9419f74343d'), href: '/shop/gold', sortOrder: 2 },
  { name: 'Diamond', slug: 'diamond', icon: '◆', image: img('photo-1602173574767-37ac01994b2a'), href: '/shop/diamond', sortOrder: 3 },
  {
    name: 'Earrings', slug: 'earrings', icon: '◐', image: img('photo-1535632787350-4e68ef0ac584'), href: '/earrings', sortOrder: 4,
    subCategories: [
      { name: 'Studs', productType: 'earrings', image: img('photo-1599643478518-a784e5dc4c8f', 400) },
      { name: 'Drops', productType: 'earrings', image: img('photo-1535632066274-36f4c5f29f5f', 400) },
      { name: 'Jhumkas', productType: 'earrings', image: img('photo-1611591437281-460bfbe1220a', 400) },
      { name: 'Hoops', productType: 'earrings', image: img('photo-1611652022419-a9419f74343d', 400) },
    ],
  },
  {
    name: 'Rings', slug: 'rings', icon: '○', image: img('photo-1605100804763-247f67b3557e'), href: '/rings', sortOrder: 5,
    subCategories: [
      { name: 'Engagement', productType: 'rings', image: img('photo-1605100804763-247f67b3557e', 400) },
      { name: 'Cocktail', productType: 'rings', image: img('photo-1602173574767-37ac01994b2a', 400) },
      { name: 'Daily Wear', productType: 'rings', image: img('photo-1611591437281-460bfbe1220a', 400) },
    ],
  },
  { name: 'Daily Wear', slug: 'daily-wear', icon: '✦', image: img('photo-1535632787350-4e68ef0ac584'), href: '/daily-wear', sortOrder: 6 },
  { name: 'Gemstone', slug: 'gemstone', icon: '◇', image: img('photo-1591437694631-c2d04bb8b9c5'), href: '/gemstone', sortOrder: 7 },
  { name: 'Wedding', slug: 'wedding', icon: '❀', image: img('photo-1583292650898-7d22cd27ca6f'), href: '/wedding', sortOrder: 8 },
  { name: 'Gifting', slug: 'gifting', icon: '✿', image: img('photo-1611591437281-460bfbe1220a'), href: '/gifting', sortOrder: 9 },
];

/**
 * Platinum and Silver are real categories but were never in the header, and
 * promoting them now would change the nav as a side effect of this seed.
 * They stay active — tiles and the mega menu still show them — and can be
 * put back in the nav from the admin dashboard at any time.
 */
const demoteFromNav = ['platinum', 'silver'];

const slugify = (name) => name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const run = async () => {
  await connectDB();
  console.log('Seeding navigation categories...');

  const ops = categories.map((c) => ({
    updateOne: {
      filter: { slug: c.slug },
      update: {
        $set: {
          ...c,
          // bulkWrite skips document middleware, so sub-slugs are set here
          // rather than by the model's pre-validate hook.
          ...(c.subCategories && {
            subCategories: c.subCategories.map((s) => ({ ...s, slug: s.slug || slugify(s.name) })),
          }),
          isActive: true,
          showInNav: true,
          showInMegaMenu: true,
        },
      },
      upsert: true,
    },
  }));

  const result = await Category.bulkWrite(ops, { ordered: false });
  const demoted = await Category.updateMany(
    { slug: { $in: demoteFromNav } },
    { $set: { showInNav: false } }
  );

  const total = await Category.countDocuments({ isActive: true, showInNav: true });
  console.log(
    `✓ ${result.upsertedCount} inserted, ${result.modifiedCount} updated, ` +
    `${demoted.modifiedCount} removed from nav — ${total} categories now in the nav`
  );

  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => { console.error(err); process.exit(1); });
