require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Product = require('../models/Product');

const img = (id, w = 800) => `https://images.unsplash.com/${id}?w=${w}&auto=format&fit=crop`;

const sample = [
  {
    name: 'Leaf Motif Gold Drop Earrings',
    slug: 'leaf-motif-gold-drop-earrings',
    category: 'gold', type: 'earrings',
    price: 68361, images: [img('photo-1535632787350-4e68ef0ac584'), img('photo-1611652022419-a9419f74343d')],
    metal: '22K Yellow Gold', purity: '22K', weight: '8.45 g',
    description: 'Inspired by the gentle curvature of leaves.',
    isBestseller: true, occasion: 'daily-wear', collection: 'Daily Wear', onlyOneLeft: true,
  },
  {
    name: 'Enchanted Grid Gold Stud Earrings',
    slug: 'enchanted-grid-gold-stud-earrings',
    category: 'gold', type: 'earrings',
    price: 48311, originalPrice: 49576,
    images: [img('photo-1599643478518-a784e5dc4c8f')],
    metal: '22K Yellow Gold', purity: '22K', weight: '6.20 g',
    description: 'A modern lattice silhouette in lustrous gold.',
    occasion: 'office',
  },
  {
    name: 'Gilded Wave Gold Drop Earrings',
    slug: 'gilded-wave-gold-drop-earrings',
    category: 'gold', type: 'earrings',
    price: 85442, originalPrice: 87525,
    images: [img('photo-1535632066274-36f4c5f29f5f')],
    metal: '22K Yellow Gold', purity: '22K', weight: '10.10 g',
    description: 'Cascading waves of gold catch the light.',
    isNew: true, occasion: 'party', onlyOneLeft: true,
  },
  {
    name: 'Swirl Pattern Diamond Stud Earrings',
    slug: 'swirl-pattern-diamond-stud-earrings',
    category: 'diamond', type: 'earrings',
    price: 47072, images: [img('photo-1535556261860-bf6cae87c0a7')],
    metal: '18K Yellow Gold', purity: '18K', weight: '3.80 g',
    description: 'A swirling dance of diamonds set in 18K gold.',
    occasion: 'festive',
  },
  {
    name: 'Glorious 22 Karat Yellow Gold Floral Ring',
    slug: 'glorious-22-karat-yellow-gold-floral-ring',
    category: 'gold', type: 'rings',
    price: 31024, images: [img('photo-1605100804763-247f67b3557e')],
    metal: '22K Yellow Gold', purity: '22K', weight: '1.79 g',
    description: 'A blooming floral motif in 22K gold.',
    isExpertChoice: true, occasion: 'daily-wear',
  },
  {
    name: 'Verdant Bloom Gold Ring',
    slug: 'verdant-bloom-gold-ring',
    category: 'gemstone', type: 'rings',
    price: 65627, images: [img('photo-1602173574767-37ac01994b2a')],
    metal: '18K Rose Gold', purity: '18K', weight: '3.90 g',
    description: 'A jadeite stone in soft rose gold.',
    gemstone: 'emerald', onlyOneLeft: true,
  },
  {
    name: 'Bloom Symphony Gold Necklace',
    slug: 'bloom-symphony-gold-necklace',
    category: 'gemstone', type: 'necklaces',
    price: 425000, images: [img('photo-1611591437281-460bfbe1220a')],
    metal: '22K Yellow Gold', purity: '22K', weight: '38.40 g',
    description: 'A symphony of emeralds and rubies in bloom.',
    isExpertChoice: true, gemstone: 'emerald', occasion: 'wedding',
  },
  {
    name: 'Tanzanite Radiance Pendant',
    slug: 'tanzanite-radiance-pendant',
    category: 'gemstone', type: 'pendants',
    price: 87600, images: [img('photo-1591437694631-c2d04bb8b9c5')],
    metal: '18K White Gold', purity: '18K', weight: '4.80 g',
    description: 'A radiant tanzanite, ethereally blue.',
    isNew: true, gemstone: 'tanzanite',
  },
  {
    name: 'Heritage Watti Gold Mangalsutra',
    slug: 'heritage-watti-gold-mangalsutra',
    category: 'gold', type: 'mangalsutra',
    price: 173146, images: [img('photo-1602751584552-8ba73aad10e1')],
    metal: '22K Yellow Gold', purity: '22K', weight: '24.50 g',
    description: 'Heritage-inspired with traditional black beads.',
    collection: 'Wedding', occasion: 'wedding', onlyOneLeft: true,
  },
  {
    name: 'Dazzling Diamond Mangalsutra',
    slug: 'dazzling-diamond-mangalsutra',
    category: 'diamond', type: 'mangalsutra',
    price: 98528, images: [img('photo-1611591437281-460bfbe1220a')],
    metal: '18K White Gold', purity: '18K', weight: '6.80 g',
    description: 'Diamonds dazzle on this contemporary mangalsutra.',
    isBestseller: true, occasion: 'wedding', onlyOneLeft: true,
  },
  {
    name: 'Celestial Disc Gold Bracelet',
    slug: 'celestial-disc-gold-bracelet',
    category: 'gold', type: 'bracelets',
    price: 57106, images: [img('photo-1611591437281-460bfbe1220a')],
    metal: '18K Yellow Gold', purity: '18K', weight: '6.80 g',
    description: 'A celestial disc on a delicate chain.',
    onlyOneLeft: true,
  },
  {
    name: 'Slender Gold Chain',
    slug: 'slender-gold-chain',
    category: 'gold', type: 'chains',
    price: 41679, images: [img('photo-1611652022419-a9419f74343d')],
    metal: '22K Yellow Gold', purity: '22K', weight: '4.50 g',
    description: 'A slender daily-wear chain.',
    isBestseller: true, gender: 'unisex',
  },
  {
    name: 'Ruby Rosette Earrings',
    slug: 'ruby-rosette-earrings',
    category: 'gemstone', type: 'earrings',
    price: 98750, images: [img('photo-1611591437281-460bfbe1220a')],
    metal: '18K Yellow Gold', purity: '18K', weight: '4.60 g',
    description: 'Rubies arranged like rose petals.',
    isBestseller: true, gemstone: 'ruby', occasion: 'festive',
  },
  {
    name: 'Pearl Cabochon Stud Earrings',
    slug: 'pearl-cabochon-stud-earrings',
    category: 'gemstone', type: 'earrings',
    price: 38900, images: [img('photo-1535632066274-36f4c5f29f5f')],
    metal: '18K Yellow Gold', purity: '18K', weight: '3.10 g',
    description: 'Lustrous pearls in classic cabochon setting.',
    gemstone: 'pearl',
  },
  {
    name: 'Emerald Eternity Band',
    slug: 'emerald-eternity-band',
    category: 'gemstone', type: 'rings',
    price: 156400, images: [img('photo-1605100804763-247f67b3557e')],
    metal: '18K Yellow Gold', purity: '18K', weight: '4.20 g',
    description: 'An eternity of emerald brilliance.',
    gemstone: 'emerald', occasion: 'wedding',
  },
];

const run = async () => {
  await connectDB();

  console.log(`Seeding ${sample.length} products...`);
  await Product.deleteMany({});
  await Product.insertMany(sample);
  console.log(`✓ Inserted ${sample.length} products`);

  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
