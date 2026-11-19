require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Banner = require('../models/Banner');
const Testimonial = require('../models/Testimonial');
const BlogPost = require('../models/BlogPost');
const SiteSettings = require('../models/SiteSettings');
const Category = require('../models/Category');

const img = (id, w = 1800) => `https://images.unsplash.com/${id}?w=${w}&auto=format&fit=crop`;

const banners = [
  {
    placement: 'home-hero', sortOrder: 1,
    eyebrow: 'New Collection', title: 'Heirlooms in the Making', highlight: 'Rivaah Bridal',
    subtitle: 'Crafted to be passed on, generation after generation.',
    image: img('photo-1583292650898-7d22cd27ca6f'),
    ctaLabel: 'Shop Bridal', ctaHref: '/wedding', align: 'left',
  },
  {
    placement: 'home-hero', sortOrder: 2,
    eyebrow: 'Festive Edit', title: 'A Celebration in Gold', highlight: 'Up to 15% off',
    subtitle: 'on making charges. Festive jewellery for every occasion.',
    image: img('photo-1611652022419-a9419f74343d'),
    ctaLabel: 'Explore Festive', ctaHref: '/jewellery', align: 'right',
  },
  {
    placement: 'home-hero', sortOrder: 3,
    eyebrow: 'Gemstone Stories', title: 'A World of Colour', highlight: 'Tanzanite & Beyond',
    subtitle: 'Natural gemstones, mined for their colour, cut for their light.',
    image: img('photo-1611591437281-460bfbe1220a'),
    ctaLabel: 'Explore Gemstone', ctaHref: '/gemstone', align: 'center',
  },
];

const testimonials = [
  { author: 'Priya M.', role: 'Bride from Jaipur', rating: 5, quote: 'Aurelia stylists guided me through every piece. The mangalsutra is everything I dreamt of.', isFeatured: true, sortOrder: 1 },
  { author: 'Anita K.', role: 'Loyal customer', rating: 5, quote: 'I have been buying from Aurelia for 12 years. The craftsmanship and trust are unmatched.', isFeatured: true, sortOrder: 2 },
  { author: 'Riya S.', role: 'New mother', rating: 5, quote: 'Bought my daughter her first gold chain here. Lovely experience from start to finish.', isFeatured: true, sortOrder: 3 },
  { author: 'Meera D.', role: 'Wedding gift', rating: 5, quote: 'The gift concierge made finding the perfect piece for my friend so effortless.', sortOrder: 4 },
];

const blogPosts = [
  {
    title: 'A Modern Guide to Choosing Bridal Jewellery',
    excerpt: 'From the mangalsutra to the maang tikka — how to build a bridal set that feels timelessly you.',
    coverImage: img('photo-1583292650898-7d22cd27ca6f', 900),
    category: 'Wedding', tags: ['bridal', 'wedding', 'guide'],
    content: 'Choosing bridal jewellery is one of the most important decisions of your wedding journey. Start with what you love. Consider your wedding outfit and the dominant colours. Plan for layering — necklaces, mangalsutras, and chokers can work together if proportions are right. Always try pieces on with your actual outfit before deciding.',
  },
  {
    title: 'Gold Purity Explained: 14K, 18K, 22K & 24K',
    excerpt: 'A simple guide to understanding karat, purity, and what to look for at the counter.',
    coverImage: img('photo-1611652022419-a9419f74343d', 900),
    category: 'Jewellery Guides', tags: ['gold', 'purity', 'education'],
    content: 'Gold purity is measured in karats. 24K is 99.9% pure gold but too soft for jewellery. 22K (91.6% gold) is the traditional Indian preference for daily-wear jewellery — durable enough for everyday use while still rich in colour. 18K (75% gold) is preferred for diamond and gemstone settings because it holds stones more securely. Always look for BIS hallmark.',
  },
  {
    title: 'Festive Styling: Layering Necklaces with Saris',
    excerpt: 'Five styling rules our editors swear by for festive evenings.',
    coverImage: img('photo-1611591437281-460bfbe1220a', 900),
    category: 'Festive Styling', tags: ['styling', 'festive', 'sari'],
    content: 'Layering necklaces requires balance. Start with a choker close to the neck, then add a mid-length chain, and finish with a longer pendant or rani-haar. Mix textures but keep the metal tone consistent. Let one piece be the hero — usually the longest — and the others support it.',
  },
  {
    title: 'How to Care for Your Gemstone Jewellery',
    excerpt: 'Soft cloths, gentle soaps, and what to avoid — keep your stones glowing for decades.',
    coverImage: img('photo-1591437694631-c2d04bb8b9c5', 900),
    category: 'Care', tags: ['care', 'maintenance', 'gemstone'],
    content: 'Gemstones are softer than diamonds and need gentle handling. Wipe with a soft cloth after every wear. Avoid contact with perfumes, hair sprays, and chlorinated water. Store pieces separately in soft pouches to prevent scratching. Bring your pieces in for professional cleaning every 12 months.',
  },
];

const categories = [
  { name: 'All Jewellery', slug: 'jewellery', icon: '◈', image: img('photo-1611652022419-a9419f74343d', 600), href: '/jewellery', sortOrder: 1 },
  { name: 'Gold', slug: 'gold', icon: '◉', image: img('photo-1611652022419-a9419f74343d', 600), href: '/shop/gold', sortOrder: 2 },
  { name: 'Diamond', slug: 'diamond', icon: '◆', image: img('photo-1602173574767-37ac01994b2a', 600), href: '/shop/diamond', sortOrder: 3 },
  { name: 'Earrings', slug: 'earrings', icon: '◐', image: img('photo-1535632787350-4e68ef0ac584', 600), href: '/earrings', sortOrder: 4,
    subCategories: [
      { name: 'Studs', productType: 'earrings', image: img('photo-1599643478518-a784e5dc4c8f', 400) },
      { name: 'Drops', productType: 'earrings', image: img('photo-1535632066274-36f4c5f29f5f', 400) },
      { name: 'Jhumkas', productType: 'earrings', image: img('photo-1611591437281-460bfbe1220a', 400) },
      { name: 'Hoops', productType: 'earrings', image: img('photo-1611652022419-a9419f74343d', 400) },
    ],
  },
  { name: 'Rings', slug: 'rings', icon: '○', image: img('photo-1605100804763-247f67b3557e', 600), href: '/rings', sortOrder: 5,
    subCategories: [
      { name: 'Engagement', productType: 'rings', image: img('photo-1605100804763-247f67b3557e', 400) },
      { name: 'Cocktail', productType: 'rings', image: img('photo-1602173574767-37ac01994b2a', 400) },
      { name: 'Daily Wear', productType: 'rings', image: img('photo-1611591437281-460bfbe1220a', 400) },
    ],
  },
  { name: 'Daily Wear', slug: 'daily-wear', icon: '✦', image: img('photo-1535632787350-4e68ef0ac584', 600), href: '/daily-wear', sortOrder: 6 },
  { name: 'Gemstone', slug: 'gemstone', icon: '◇', image: img('photo-1591437694631-c2d04bb8b9c5', 600), href: '/gemstone', sortOrder: 7 },
  { name: 'Wedding', slug: 'wedding', icon: '❀', image: img('photo-1583292650898-7d22cd27ca6f', 600), href: '/wedding', sortOrder: 8 },
  { name: 'Gifting', slug: 'gifting', icon: '✿', image: img('photo-1611591437281-460bfbe1220a', 600), href: '/gifting', sortOrder: 9 },
];

const settings = {
  key: 'main',
  siteName: 'Aurelia',
  tagline: 'Fine Jewellery, Forever',
  contactEmail: 'hello@aurelia.example.com',
  contactPhone: '1800-266-0123',
  social: {
    instagram: 'https://instagram.com/aurelia',
    facebook: 'https://facebook.com/aurelia',
    youtube: 'https://youtube.com/aurelia',
    pinterest: 'https://pinterest.com/aurelia',
  },
  footer: {
    about: 'Aurelia is a celebration of fine jewellery, crafted by master karigars and worn for generations.',
    shopLinks: [
      { label: 'All Jewellery', href: '/jewellery' },
      { label: 'Earrings', href: '/earrings' },
      { label: 'Rings', href: '/rings' },
      { label: 'Gemstone', href: '/gemstone' },
      { label: 'Wedding', href: '/wedding' },
    ],
    helpLinks: [
      { label: 'Contact Us', href: '/help' },
      { label: 'FAQ', href: '/help' },
      { label: 'Store Locator', href: '/store-locator' },
      { label: 'Order Tracking', href: '/account' },
    ],
    policiesLinks: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Returns & Exchanges', href: '/returns' },
      { label: 'Shipping Policy', href: '/shipping' },
    ],
    copyright: '© Aurelia. All rights reserved.',
  },
  aboutPage: {
    heroTitle: 'Our Story',
    heroSubtitle: 'Since 1994',
    heroImage: img('photo-1605100804763-247f67b3557e'),
    body: 'Aurelia was born from a simple belief: jewellery should be more than ornament — it should hold memory, mark moments, and outlive the moments it celebrates.',
    stats: [
      { value: '400+', label: 'Boutiques' },
      { value: '2.8M+', label: 'Families served' },
      { value: '30 yrs', label: 'Of trust' },
    ],
  },
  trustBadges: [
    { icon: '⊛', title: 'Aurelia Exchange', subtitle: 'Best value for your old gold' },
    { icon: '◈', title: 'Purity Guarantee', subtitle: 'BIS hallmarked & certified' },
    { icon: '⌬', title: 'Easy Replacements', subtitle: 'Swap with peace of mind' },
    { icon: '✦', title: 'Lifetime Maintenance', subtitle: 'Polish, plating & cleaning' },
  ],
};

const run = async () => {
  await connectDB();
  console.log('Seeding content...');

  await Promise.all([
    Banner.deleteMany({}).then(() => Banner.insertMany(banners)),
    Testimonial.deleteMany({}).then(() => Testimonial.insertMany(testimonials)),
    // Articles are now written in the admin panel, so never wipe them: the
    // demo posts are only inserted into an empty collection, and as drafts.
    BlogPost.estimatedDocumentCount().then((n) =>
      n ? null : BlogPost.insertMany(blogPosts.map((p) => ({ ...p, isPublished: false, publishedAt: null })))
    ),
    Category.deleteMany({}).then(() => Category.insertMany(categories)),
    SiteSettings.findOneAndUpdate({ key: 'main' }, settings, { upsert: true, new: true }),
  ]);

  console.log(`✓ Seeded ${banners.length} banners, ${testimonials.length} testimonials, ${blogPosts.length} blog posts, ${categories.length} categories, site settings`);
  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => { console.error(err); process.exit(1); });
