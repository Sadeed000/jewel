/**
 * Pre-generates every responsive size of the storefront's above-the-fold
 * images on Cloudinary, so the first real visitor gets cached CDN copies
 * (~30–150 ms) instead of waiting ~1 s for Cloudinary to create each size.
 *
 *   node scripts/warm-images.mjs                       # against http://localhost:3000
 *   node scripts/warm-images.mjs https://ratnapankh.com
 *
 * Run after each deploy, and after replacing a banner image in Cloudinary.
 * It only reads pages and images — it changes nothing.
 */
const BASE = (process.argv[2] || 'http://localhost:3000').replace(/\/$/, '');
const PAGES = [
  '/', '/rings', '/earrings', '/wedding', '/gifting', '/gemstone', '/daily-wear', '/jewellery',
  '/shop/jewellery', '/shop/gold', '/shop/diamond', '/shop/silver', '/shop/gemstone',
  '/shop/pendants', '/shop/rings', '/shop/earrings', '/about', '/virtual-try-on',
];
// Browsers ask for AVIF or WebP; Cloudinary caches each format separately.
const ACCEPTS = ['image/avif,image/webp,*/*', 'image/webp,*/*'];

const urls = new Set();
for (const page of PAGES) {
  try {
    const html = await (await fetch(BASE + page)).text();
    for (const m of html.matchAll(/(?:srcset|imagesrcset)="([^"]+)"/gi)) {
      for (const part of m[1].replace(/&amp;/g, '&').split(', ')) {
        const url = part.trim().split(' ')[0];
        if (url.startsWith('https://res.cloudinary.com/')) urls.add(url);
      }
    }
  } catch (err) {
    console.log(`skip ${page}: ${err.message}`);
  }
}

console.log(`Warming ${urls.size} image sizes × ${ACCEPTS.length} formats…`);
let done = 0;
let failed = 0;
const queue = [...urls].flatMap((u) => ACCEPTS.map((a) => [u, a]));
async function worker() {
  while (queue.length) {
    const [url, accept] = queue.shift();
    for (let attempt = 1; attempt <= 4; attempt++) {
      const res = await fetch(url, { headers: { Accept: accept } }).catch(() => null);
      if (res?.ok) { await res.arrayBuffer(); done++; break; }
      // 423 = still generating; wait and retry.
      if (attempt === 4) { failed++; console.log(`FAIL ${res?.status} ${url}`); }
      else await new Promise((r) => setTimeout(r, 3000));
    }
  }
}
await Promise.all(Array.from({ length: 6 }, worker));
console.log(`Done: ${done} warmed, ${failed} failed.`);
