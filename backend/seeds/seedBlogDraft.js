/**
 * Adds the sample article as an UNPUBLISHED DRAFT so the admin workflow
 * (edit → preview → publish → unpublish) can be tried end to end.
 *
 *   node seeds/seedBlogDraft.js
 *
 * Safe to re-run: it never overwrites an existing post with the same slug and
 * never publishes anything. Uses MONGO_URI from backend/.env.
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const BlogPost = require('../models/BlogPost');
const { sanitizeArticle } = require('../utils/sanitizeArticle');

const SIZE_ROWS = [
  [8, 14.7, 46.2], [10, 15.3, 48.1], [12, 16.1, 50.6], [14, 16.9, 53.1],
  [16, 17.7, 55.6], [18, 18.5, 58.1], [20, 19.4, 60.9], [22, 20.2, 63.5], [24, 21.0, 66.0],
];

const content = `
<p>Ordering a ring online is easy until you reach the size selector. Most of us have never had our finger measured, and a ring that is even one size off will either spin and slip or refuse to pass the knuckle. The good news: you can find your Indian ring size at home in about five minutes, using things you already have.</p>

<h2>What "Indian ring size" actually means</h2>
<p>Jewellers in India usually quote ring sizes as numbers — size 12, size 16 and so on. Each number corresponds to an inner diameter in millimetres. The size chart on our <a href="/ring-size-finder">Ring Size Finder</a> runs from size 6 (14.0 mm) to size 25 (21.4 mm), with US and UK equivalents for anyone used to those systems.</p>
<p>So whichever method you use below, the goal is the same: find the <strong>inner diameter</strong> (or the circumference) of a ring that fits you, then match it to the chart.</p>

<h2>Method 1: Measure a ring you already wear (most accurate)</h2>
<p>If you own a ring that fits the finger you are buying for, this is the most reliable option.</p>
<ol>
  <li>Place the ring on a flat surface.</li>
  <li>With a ruler that shows millimetres, measure straight across the <strong>inside</strong> of the ring, edge to edge, through the centre. Do not include the metal itself.</li>
  <li>Note the number in millimetres — for example, 16.9 mm.</li>
  <li>Find the nearest diameter in the chart below. 16.9 mm is an Indian size 14.</li>
</ol>
<p>Prefer not to use a ruler? Our <a href="/ring-size-finder">Ring Size Finder</a> lets you place your ring on the screen and match it to a circle, after a quick calibration with a standard card.</p>

<h2>Method 2: The string or paper-strip method</h2>
<p>No ring to measure? A strip of paper or a piece of non-stretchy thread works.</p>
<ol>
  <li>Cut a thin strip of paper about 10 cm long and 5 mm wide.</li>
  <li>Wrap it snugly around the base of your finger. It should feel like a ring would — firm, not tight.</li>
  <li>Mark the point where the paper overlaps with a pen.</li>
  <li>Unwrap it and measure the length up to the mark in millimetres. This is your <strong>circumference</strong>.</li>
  <li>Divide the circumference by 3.14 to get the inner diameter, then match it to the chart.</li>
</ol>
<p>Example: a circumference of 55.6 mm ÷ 3.14 ≈ 17.7 mm, which is an Indian size 16.</p>

<h2>Quick reference: Indian ring size chart</h2>
<table>
  <thead><tr><th scope="col">Indian size</th><th scope="col">Inner diameter (mm)</th><th scope="col">Circumference (mm)</th></tr></thead>
  <tbody>
    ${SIZE_ROWS.map(([s, d, c]) => `<tr><td>${s}</td><td>${d}</td><td>${c}</td></tr>`).join('\n    ')}
  </tbody>
</table>
<p>The complete chart, including every size from 6 to 25 with US and UK equivalents, is on the <a href="/ring-size-finder">Ring Size Finder</a> page.</p>

<h2>Five tips for an accurate result</h2>
<ul>
  <li><strong>Measure at the end of the day.</strong> Fingers are slightly larger in the evening and in warm weather, and smaller on cold mornings.</li>
  <li><strong>Check the knuckle.</strong> If your knuckle is wider than the base of your finger, the ring must pass over it. Measure both and lean towards the larger figure.</li>
  <li><strong>Measure two or three times.</strong> If you get two different results, go with the larger size.</li>
  <li><strong>Use a strip that doesn't stretch.</strong> Thread and wool can stretch and give a size that is too large.</li>
  <li><strong>Consider the band width.</strong> Wide bands fit more snugly than thin ones, so many people go up half a size for a broad band.</li>
</ul>

<h2>Buying a ring as a surprise?</h2>
<p>Borrow a ring they already wear on the same finger for a few minutes and use Method 1. If that's not possible, press the ring into a bar of soap to leave an impression and measure the inside of the impression. Remember that the same person can have different sizes on different hands and fingers.</p>

<h2>Ready to choose?</h2>
<p>Once you know your size, browse our <a href="/rings">ring collection</a> and pick your size on the product page. Every sized product page shows the sizes that design is available in. If you are unsure between two sizes, our team can help — reach us through the <a href="/help">Help &amp; Contact</a> page before you order.</p>
`;

const draft = {
  title: 'How to Measure Your Ring Size at Home in India',
  slug: 'how-to-measure-ring-size-at-home-india',
  excerpt:
    'Find your Indian ring size in five minutes with a ruler, a paper strip or a ring you already own — plus a size chart in millimetres and tips for getting it right.',
  content: sanitizeArticle(content),
  coverImage: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=1600&auto=format&fit=crop',
  coverImageAlt: 'Close-up of rings arranged on a soft fabric background',
  category: 'Ring Guides',
  tags: ['ring size', 'how to', 'india'],
  author: { name: 'Ratnapankh Editorial' },
  isPublished: false,
  publishedAt: null,
  seo: {
    metaTitle: 'How to Measure Ring Size at Home in India (Size Chart in mm)',
    metaDescription:
      'Measure your ring size at home with a ring, ruler or paper strip. Indian ring size chart in millimetres, conversion steps and tips for an accurate fit.',
  },
  targetKeyword: 'how to measure ring size at home in india',
  relatedProducts: [],
  relatedCollections: [
    { label: 'Shop rings', href: '/rings' },
    { label: 'Silver jewellery', href: '/shop/silver' },
    { label: 'Ring Size Finder', href: '/ring-size-finder' },
  ],
};

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const existing = await BlogPost.findOne({ $or: [{ slug: draft.slug }, { previousSlugs: draft.slug }] }).lean();
  if (existing) {
    console.log(`• Skipped — a post already uses "${draft.slug}" (${existing.isPublished ? 'published' : 'draft'}).`);
  } else {
    await BlogPost.create(draft);
    console.log(`✓ Draft saved: "${draft.title}" (not published)`);
  }
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
