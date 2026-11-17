/** Add five sample products with Cloudinary media; never replace existing records. */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const fs = require('fs/promises');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const { getConfig, uploadAsset, deleteAsset } = require('../services/cloudinaryService');

const samples = [
  { slug: 'sample-opal-style-drop-earrings', name: 'Opal-style Drop Earrings (Sample)', category: 'silver', type: 'earrings', price: 1899, metal: 'Silver-tone', file: '../uploads/1794908654133-ff5a837439fb67fd.png' },
  { slug: 'sample-halo-solitaire-ring', name: 'Halo Solitaire Ring (Sample)', category: 'diamond', type: 'rings', price: 2499, metal: 'White metal with rose-tone detail', file: 'product-media/photo-1605100804763-247f67b3557e.jpg' },
  { slug: 'sample-colourful-drop-earrings', name: 'Colourful Drop Earrings (Sample)', category: 'gemstone', type: 'earrings', price: 1599, metal: 'Silver-tone', file: 'product-media/photo-1535632787350-4e68ef0ac584.jpg' },
  { slug: 'sample-heart-pendant-necklace', name: 'Heart Pendant Necklace (Sample)', category: 'silver', type: 'pendants', price: 1799, metal: 'Silver-tone', file: 'product-media/photo-1611652022419-a9419f74343d.jpg' },
  { slug: 'sample-ornate-bracelet', name: 'Ornate Bracelet (Sample)', category: 'gold', type: 'bracelets', price: 2999, metal: 'Gold-tone', file: 'product-media/photo-1611591437281-460bfbe1220a.jpg' },
];

const run = async () => {
  getConfig();
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
  const results = [];
  try {
    // Preflight every source before making any external upload.
    const sources = await Promise.all(samples.map((sample) => fs.readFile(path.join(__dirname, sample.file))));
    for (let i = 0; i < samples.length; i++) {
      const sample = samples[i];
      const existing = await Product.findOne({ slug: sample.slug }).lean();
      if (existing) { results.push({ slug: sample.slug, status: 'already exists', id: existing._id }); continue; }
      const asset = await uploadAsset({ buffer: sources[i], originalname: path.basename(sample.file), mimetype: sample.file.endsWith('.png') ? 'image/png' : 'image/jpeg' });
      try {
        const { file, ...fields } = sample;
        const product = await Product.create({
          ...fields, sku: `AUR-SAMPLE-${String(i + 1).padStart(3, '0')}`,
          images: [asset.url], coverImages: [asset.url], detailedImages: [], videos: [],
          description: 'Sample catalogue record with illustrative photography and a sample price. Confirm actual materials, dimensions, price and stock before offering this item for sale.',
          purity: 'Sample — not certified', weight: 'To be confirmed', collection: 'Sample Catalogue',
          inStock: false, stockQty: 0, bisHallmark: false, freeResize: false, tryOnEnabled: false,
        });
        results.push({ slug: product.slug, status: 'created', id: product._id, image: asset.url });
      } catch (error) {
        await deleteAsset(asset).catch(() => {});
        throw error;
      }
    }
    console.log(JSON.stringify({ products: results }, null, 2));
  } finally { await mongoose.disconnect(); }
};

if (require.main === module) run().catch((error) => { console.error(error.message); process.exitCode = 1; });
module.exports = { samples, run };
