/**
 * Visual search — "Search With a Pic".
 *
 * Matching runs entirely on our own server: every catalogue image is reduced to
 * a compact visual fingerprint (colour, metal tone, silhouette, edge texture)
 * and the shopper's photo is reduced the same way, then ranked by distance.
 * No third-party vision API, so the feature works offline, costs nothing per
 * search and never ships a customer photo to another vendor.
 *
 * The fingerprint deliberately ignores the background: studio jewellery shots
 * are 80% white, so comparing raw pixels would score every piece identically.
 * Border pixels give us the backdrop colour, everything unlike it is treated as
 * the piece itself, and all statistics are gathered over that mask only.
 */

const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');
const Product = require('../models/Product');
const AppError = require('../utils/AppError');
const { UPLOAD_DIR } = require('../middlewares/upload');

/* ───────────── Tunables ───────────── */

const SIZE = 64; // working resolution for the fingerprint
const GRID = 8; // silhouette grid (GRID × GRID cells)
const HUE_BINS = 18; // 20° per bin
const LUM_BINS = 8;
const TONE_KEYS = ['gold', 'rose', 'silver', 'dark', 'warm', 'cool'];

const CACHE_DIR = path.join(__dirname, '..', '.cache');
const CACHE_FILE = path.join(CACHE_DIR, 'image-index.json');
// Bump when the fingerprint layout changes so stale vectors are discarded.
const CACHE_VERSION = 4;

// Below this the pieces share little more than "is jewellery" — not a match.
const MIN_SCORE = 58;

const REMOTE_TIMEOUT_MS = 10000;
const MAX_REMOTE_BYTES = 8 * 1024 * 1024;
const INDEX_CONCURRENCY = 6;

/* ───────────── Colour helpers ───────────── */

const rgbToHsv = (r, g, b) => {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;

  let h = 0;
  if (d !== 0) {
    if (max === rn) h = ((gn - bn) / d) % 6;
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }

  return { h, s: max === 0 ? 0 : d / max, v: max };
};

const toHex = (r, g, b) =>
  `#${[r, g, b].map((c) => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, '0')).join('')}`;

/**
 * Which of the six jewellery-relevant tone buckets a pixel belongs to.
 * These map onto how the catalogue is actually organised (gold vs silver vs
 * coloured stone), which is why they carry real weight in the ranking.
 */
const toneOf = (h, s, v) => {
  if (v < 0.22) return 'dark';
  if (s < 0.14) return 'silver'; // white metals, diamonds, pearls
  if (h >= 25 && h < 62) return 'gold';
  if ((h >= 330 || h < 25) && s < 0.55) return 'rose';
  if (h >= 62 && h < 200) return 'cool'; // emerald, sapphire, tanzanite
  return 'warm'; // ruby, coral, deep pink
};

/* ───────────── Fingerprint ───────────── */

/**
 * Reduce an image buffer to its fingerprint. Throws if sharp cannot decode it,
 * which callers treat as "skip this image".
 */
const describe = async (buffer) => {
  const pipeline = sharp(buffer, { failOn: 'error', limitInputPixels: 40_000_000 }).rotate();
  const meta = await pipeline.metadata();

  const { data } = await pipeline
    .clone()
    // Transparent PNGs (cut-outs used for try-on) must land on the same white
    // backdrop as a studio photo, or their edges read as pure black.
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    // Keep the whole piece visible and normalise EXIF orientation before ranking.
    .resize(SIZE, SIZE, { fit: 'contain', background: '#ffffff' })
    .toColourspace('srgb')
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const px = SIZE * SIZE;
  const hsv = new Array(px);
  const gray = new Float32Array(px);

  for (let i = 0; i < px; i += 1) {
    const r = data[i * 3];
    const g = data[i * 3 + 1];
    const b = data[i * 3 + 2];
    hsv[i] = rgbToHsv(r, g, b);
    gray[i] = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  }

  /* Backdrop = median of the 2px border ring. Median rather than mean so a
     prop in one corner cannot drag the estimate. */
  const border = [[], [], []];
  for (let y = 0; y < SIZE; y += 1) {
    for (let x = 0; x < SIZE; x += 1) {
      if (x > 1 && x < SIZE - 2 && y > 1 && y < SIZE - 2) continue;
      const i = (y * SIZE + x) * 3;
      border[0].push(data[i]);
      border[1].push(data[i + 1]);
      border[2].push(data[i + 2]);
    }
  }
  const median = (arr) => {
    const sorted = [...arr].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)];
  };
  const bgHsv = rgbToHsv(median(border[0]), median(border[1]), median(border[2]));

  /* How far a pixel sits from the backdrop colour. Compared in HSV rather than
     RGB because a seamless paper backdrop is lit unevenly: the corners of a
     pink sweep are the same pink at a different brightness, so brightness gets
     the smallest say. Hue only counts where both colours are actually
     saturated — the hue of a near-grey pixel is noise. */
  const bgDistance = (h, s, v) => {
    let hueDiff = Math.abs(h - bgHsv.h);
    if (hueDiff > 180) hueDiff = 360 - hueDiff;
    const hueWeight = Math.min(s, bgHsv.s) / 0.35; // 0 when either is grey
    return (
      0.55 * (hueDiff / 180) * Math.min(1, hueWeight) +
      0.6 * Math.abs(s - bgHsv.s) +
      0.35 * Math.abs(v - bgHsv.v)
    );
  };

  /* Background = what the backdrop colour reaches by flooding inward from the
     frame edge. Flooding rather than thresholding every pixel independently is
     what keeps a white pearl in the middle of a white backdrop as foreground.
     A stable threshold keeps recompressed photos comparable. */
  const background = new Uint8Array(px);
  let bgCount = 0;

  // A fixed threshold avoids jumping to a different segmentation when a JPEG
  // re-encode shifts a few border pixels across the old tuning boundary.
  for (const threshold of [0.16]) {
    background.fill(0);
    bgCount = 0;
    const stack = [];

    for (let x = 0; x < SIZE; x += 1) {
      stack.push(x, (SIZE - 1) * SIZE + x);
    }
    for (let y = 0; y < SIZE; y += 1) {
      stack.push(y * SIZE, y * SIZE + SIZE - 1);
    }

    while (stack.length) {
      const i = stack.pop();
      if (background[i]) continue;
      const { h, s, v } = hsv[i];
      if (bgDistance(h, s, v) > threshold) continue;

      background[i] = 1;
      bgCount += 1;

      const x = i % SIZE;
      const y = (i - x) / SIZE;
      if (x > 0) stack.push(i - 1);
      if (x < SIZE - 1) stack.push(i + 1);
      if (y > 0) stack.push(i - SIZE);
      if (y < SIZE - 1) stack.push(i + SIZE);
    }

    // A clean studio shot is mostly backdrop; once we're there, stop loosening.
    if (bgCount / px > 0.35) break;
  }

  const mask = new Uint8Array(px);
  let covered = 0;
  for (let i = 0; i < px; i += 1) {
    if (!background[i]) {
      mask[i] = 1;
      covered += 1;
    }
  }

  /* A lifestyle shot (model wearing the piece, busy room) has no backdrop to
     find, and a macro crop is backdrop-free in the other direction. In both
     cases describe the whole frame rather than a meaningless sliver. */
  const rawCoverage = covered / px;
  if (rawCoverage > 0.9 || rawCoverage < 0.03) {
    mask.fill(1);
    covered = px;
  }

  const hue = new Float64Array(HUE_BINS);
  const lum = new Float64Array(LUM_BINS);
  const tone = Object.fromEntries(TONE_KEYS.map((k) => [k, 0]));
  const silhouette = new Float64Array(GRID * GRID);
  const cellPx = new Float64Array(GRID * GRID);
  const swatch = new Map(); // coarse colour → { count, r, g, b }

  let minX = SIZE;
  let maxX = 0;
  let minY = SIZE;
  let maxY = 0;

  const cellSize = SIZE / GRID;

  for (let y = 0; y < SIZE; y += 1) {
    for (let x = 0; x < SIZE; x += 1) {
      const i = y * SIZE + x;
      const cell = Math.floor(y / cellSize) * GRID + Math.floor(x / cellSize);
      cellPx[cell] += 1;
      if (!mask[i]) continue;

      silhouette[cell] += 1;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;

      const { h, s, v } = hsv[i];

      // Weight hue by how vivid the pixel is: a near-grey pixel's hue is noise.
      if (s > 0.12 && v > 0.12) {
        hue[Math.min(HUE_BINS - 1, Math.floor((h / 360) * HUE_BINS))] += s * v;
      }
      lum[Math.min(LUM_BINS - 1, Math.floor(v * LUM_BINS))] += 1;
      tone[toneOf(h, s, v)] += 1;

      const key = `${Math.round(data[i * 3] / 32)}-${Math.round(data[i * 3 + 1] / 32)}-${Math.round(
        data[i * 3 + 2] / 32
      )}`;
      const entry = swatch.get(key) || { count: 0, r: 0, g: 0, b: 0 };
      entry.count += 1;
      entry.r += data[i * 3];
      entry.g += data[i * 3 + 1];
      entry.b += data[i * 3 + 2];
      swatch.set(key, entry);
    }
  }

  /* Sobel gradients — orientation histogram captures texture/ornateness:
     a filigree bangle and a plain band differ here even at identical colour. */
  const edge = new Float64Array(4);
  let edgeEnergy = 0;
  const at = (x, y) => gray[Math.min(SIZE - 1, Math.max(0, y)) * SIZE + Math.min(SIZE - 1, Math.max(0, x))];

  for (let y = 1; y < SIZE - 1; y += 1) {
    for (let x = 1; x < SIZE - 1; x += 1) {
      if (!mask[y * SIZE + x]) continue;
      const gx =
        at(x + 1, y - 1) + 2 * at(x + 1, y) + at(x + 1, y + 1) -
        (at(x - 1, y - 1) + 2 * at(x - 1, y) + at(x - 1, y + 1));
      const gy =
        at(x - 1, y + 1) + 2 * at(x, y + 1) + at(x + 1, y + 1) -
        (at(x - 1, y - 1) + 2 * at(x, y - 1) + at(x + 1, y - 1));
      const mag = Math.hypot(gx, gy);
      if (mag < 0.08) continue;
      let angle = (Math.atan2(gy, gx) * 180) / Math.PI;
      if (angle < 0) angle += 180;
      edge[Math.min(3, Math.floor(angle / 45))] += mag;
      edgeEnergy += mag;
    }
  }

  const normalise = (arr) => {
    const sum = arr.reduce((a, b) => a + b, 0);
    return sum > 0 ? Array.from(arr, (v) => +(v / sum).toFixed(5)) : Array.from(arr, () => 0);
  };

  const coverage = covered / px;
  const bboxW = maxX >= minX ? (maxX - minX + 1) / SIZE : 1;
  const bboxH = maxY >= minY ? (maxY - minY + 1) / SIZE : 1;

  const palette = [...swatch.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map((c) => ({
      hex: toHex(c.r / c.count, c.g / c.count, c.b / c.count),
      share: +(c.count / Math.max(1, covered)).toFixed(3),
    }));

  // Compare the isolated piece at a consistent scale and position. Keep its
  // aspect ratio: a long chain must not be stretched into a compact ring.
  const side = Math.max(maxX - minX + 1, maxY - minY + 1);
  const signatureSize = 24;
  const appearance = [];
  const outline = [];
  for (let y = 0; y < signatureSize; y++) for (let x = 0; x < signatureSize; x++) {
    const sx = Math.round((minX + maxX) / 2 + ((x + 0.5) / signatureSize - 0.5) * side);
    const sy = Math.round((minY + maxY) / 2 + ((y + 0.5) / signatureSize - 0.5) * side);
    const inside = sx >= 0 && sx < SIZE && sy >= 0 && sy < SIZE;
    const index = sy * SIZE + sx;
    const foreground = inside && mask[index] ? 1 : 0;
    outline.push(foreground);
    for (let channel = 0; channel < 3; channel++) {
      appearance.push(foreground ? +(data[index * 3 + channel] / 255).toFixed(4) : 1);
    }
  }

  return {
    v: CACHE_VERSION,
    imageHash: crypto.createHash('sha256').update(buffer).digest('hex'),
    pixelHash: crypto.createHash('sha256').update(data).digest('hex'),
    scene: Array.from(data, (value) => +(value / 255).toFixed(4)),
    appearance,
    outline,
    hue: normalise(hue),
    lum: normalise(lum),
    tone: normalise(TONE_KEYS.map((k) => tone[k])),
    // Per-cell fill ratio — a coarse silhouette that separates a long chain
    // from a compact stud without any model training.
    shape: Array.from(silhouette, (v, i) => +(v / Math.max(1, cellPx[i])).toFixed(4)),
    edge: normalise(edge),
    // Bounded so a very busy image cannot dominate the distance.
    density: +Math.min(1, edgeEnergy / Math.max(1, covered) / 2).toFixed(4),
    coverage: +coverage.toFixed(4),
    // Preserve the foreground aspect rather than stretching the piece.
    aspect: +Math.min(1, bboxW / Math.max(1 / SIZE, bboxH) / 4).toFixed(4),
    palette,
  };
};

/* ───────────── Distance ───────────── */

const chiSquare = (a, b) => {
  let d = 0;
  for (let i = 0; i < a.length; i += 1) {
    const sum = a[i] + b[i];
    if (sum > 0) d += ((a[i] - b[i]) ** 2) / sum;
  }
  return Math.min(1, d / 2); // χ²/2 is already bounded by 1 for normalised histograms
};

const meanAbs = (a, b) => {
  let d = 0;
  for (let i = 0; i < a.length; i += 1) d += Math.abs(a[i] - b[i]);
  return Math.min(1, d / a.length);
};

const totalVariation = (a, b) => Math.min(1, a.reduce((sum, value, i) => sum + Math.abs(value - b[i]), 0) / 2);

// Shape and local colour must agree; colour alone cannot identify a design.
const compareFingerprints = (a, b) => {
  if (a.imageHash === b.imageHash || a.pixelHash === b.pixelHash) {
    return { score: 99, kind: 'same-image', distance: 0 };
  }
  let intersection = 0, union = 0, colourError = 0, colourWeight = 0;
  for (let i = 0; i < a.outline.length; i++) {
    intersection += Math.min(a.outline[i], b.outline[i]);
    const weight = Math.max(a.outline[i], b.outline[i]);
    union += weight;
    for (let channel = 0; channel < 3; channel++) colourError += weight * Math.abs(a.appearance[i * 3 + channel] - b.appearance[i * 3 + channel]);
    colourWeight += weight * 3;
  }
  const shape = union ? 1 - intersection / union : 1;
  const colour = colourError / Math.max(1, colourWeight);
  const d = 0.34 * shape + 0.26 * colour +
    0.18 * totalVariation(a.tone, b.tone) + 0.1 * chiSquare(a.hue, b.hue) +
    0.06 * chiSquare(a.edge, b.edge) + 0.03 * chiSquare(a.lum, b.lum) +
    0.03 * Math.min(1, Math.abs(a.aspect - b.aspect));
  const sceneDifference = meanAbs(a.scene, b.scene);
  let squareError = 0, sumA = 0, sumB = 0, squareA = 0, squareB = 0;
  for (let i = 0; i < a.scene.length; i++) {
    squareError += (a.scene[i] - b.scene[i]) ** 2;
    sumA += a.scene[i]; sumB += b.scene[i];
    squareA += a.scene[i] ** 2; squareB += b.scene[i] ** 2;
  }
  const n = a.scene.length;
  const variance = Math.max(0, (squareA / n - (sumA / n) ** 2 + squareB / n - (sumB / n) ** 2) / 2);
  const relativeError = Math.sqrt(squareError / n) / Math.max(0.03, Math.sqrt(variance));
  // Re-encoded catalogue photos retain their identity despite JPEG noise.
  const nearDuplicate = sceneDifference < 0.018 && relativeError < 0.16;
  const score = nearDuplicate ? Math.max(94, Math.round(99 - sceneDifference * 150)) : Math.round(99 * Math.exp(-4.5 * d));
  return { score, kind: 'similar', distance: d };
};

const loadBytes = async (url) => {
  if (/^https?:\/\//i.test(url)) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REMOTE_TIMEOUT_MS);
    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length > MAX_REMOTE_BYTES) throw new Error('remote image too large');
      return buf;
    } finally {
      clearTimeout(timer);
    }
  }

  // Anything else is a locally served upload; only its basename is trusted so
  // a crafted product record cannot walk out of the uploads directory.
  const file = path.join(UPLOAD_DIR, path.basename(url));
  return fsp.readFile(file);
};

/* ───────────── Index ───────────── */

const cache = new Map(); // image url → fingerprint
let diskLoaded = false;
let building = null;
let lastBuiltAt = 0;

const loadDiskCache = () => {
  if (diskLoaded) return;
  diskLoaded = true;
  try {
    const raw = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    if (raw.version !== CACHE_VERSION) return;
    Object.entries(raw.entries || {}).forEach(([url, d]) => cache.set(url, d));
    console.log(`✓ Visual search: restored ${cache.size} fingerprints from cache`);
  } catch {
    // No cache yet (or an unreadable one) — it will be rebuilt and rewritten.
  }
};

const saveDiskCache = async () => {
  try {
    await fsp.mkdir(CACHE_DIR, { recursive: true });
    await fsp.writeFile(
      CACHE_FILE,
      JSON.stringify({ version: CACHE_VERSION, entries: Object.fromEntries(cache) })
    );
  } catch (err) {
    console.warn('Visual search: could not persist fingerprint cache —', err.message);
  }
};

/**
 * Images to try for a product, best first. Part of the seeded catalogue points
 * at Unsplash URLs that now 404, so a product whose cover is dead still gets
 * indexed off one of its gallery shots instead of dropping out of results.
 */
const candidateImages = (product) =>
  [...new Set([...(product.coverImages || []), ...(product.images || []), ...(product.detailedImages || []), product.tryOnImage].filter(Boolean))].slice(0, 8);

/** The image a product was actually fingerprinted from, if any. */
const indexedImage = (product) => candidateImages(product).find((url) => cache.get(url)) || null;

const PRODUCT_FIELDS =
  'name slug sku price originalPrice images coverImages detailedImages tryOnImage category type metal purity weight collection ' +
  'gemstone occasion gender isBestseller isNew inStock onlyOneLeft rating reviewCount';

/**
 * Fingerprint every catalogue image that isn't cached yet. Runs at most once
 * concurrently; parallel searches await the same promise.
 */
const buildIndex = async ({ force = false } = {}) => {
  loadDiskCache();
  if (building) return building;

  building = (async () => {
    const products = await Product.find({ hidden: { $ne: true } })
      .select(PRODUCT_FIELDS)
      .lean({ virtuals: true });

    // Index each distinct view once, even when several products reuse a photo.
    const pending = [...new Set(products.flatMap(candidateImages))]
      .filter((url) => force || !cache.has(url));
    let added = 0;
    let failed = 0;
    for (let i = 0; i < pending.length; i += INDEX_CONCURRENCY) {
      await Promise.all(pending.slice(i, i + INDEX_CONCURRENCY).map(async (url) => {
        try {
          cache.set(url, await describe(await loadBytes(url)));
          added++;
        } catch (err) {
          failed++;
          cache.set(url, null);
          if (process.env.NODE_ENV === 'development') console.warn(`Visual search: skipped ${url} ? ${err.message}`);
        }
      }));
    }

    if (added || failed) await saveDiskCache();
    lastBuiltAt = Date.now();

    const usable = products.filter((p) => indexedImage(p));
    if (added) {
      console.log(`✓ Visual search: indexed ${added} image(s), ${failed} unreadable, ${usable.length} searchable`);
    }
    return products;
  })();

  try {
    return await building;
  } finally {
    building = null;
  }
};

/** Fire-and-forget warm-up so the first shopper doesn't pay for the indexing. */
const warmIndex = () => {
  buildIndex().catch((err) => console.warn('Visual search warm-up failed —', err.message));
};

/* ───────────── Attribute inference ───────────── */

const HUE_TO_GEMSTONE = [
  { gemstone: 'emerald', min: 80, max: 165 },
  { gemstone: 'sapphire', min: 190, max: 260 },
  { gemstone: 'tanzanite', min: 260, max: 300 },
  { gemstone: 'ruby', min: 330, max: 360 },
  { gemstone: 'ruby', min: 0, max: 12 },
  { gemstone: 'coral', min: 12, max: 25 },
];

/**
 * What the photo appears to be, in the catalogue's own vocabulary. Reported to
 * the shopper as a starting point they can override — never as a hard filter,
 * because a confident wrong guess is worse than an honest "similar pieces".
 */
const inferAttributes = (d) => {
  const tone = Object.fromEntries(TONE_KEYS.map((k, i) => [k, d.tone[i]]));
  const [dominantTone] = Object.entries(tone).sort((a, b) => b[1] - a[1])[0];

  let category = null;
  if (dominantTone === 'gold' && tone.gold > 0.3) category = 'gold';
  else if (dominantTone === 'silver' && tone.silver > 0.45) category = 'silver';

  // Peak hue, but only trusted when a coloured stone really dominates.
  let gemstone = null;
  const peak = d.hue.reduce((best, v, i) => (v > d.hue[best] ? i : best), 0);
  const colourShare = tone.cool + tone.warm;
  if (colourShare > 0.22 && d.hue[peak] > 0.14) {
    const deg = (peak + 0.5) * (360 / HUE_BINS);
    gemstone = HUE_TO_GEMSTONE.find((r) => deg >= r.min && deg < r.max)?.gemstone || null;
    if (gemstone) category = 'gemstone';
  }

  const toneLabel = {
    gold: 'Yellow gold tones',
    rose: 'Rose gold tones',
    silver: 'White metal / diamond tones',
    dark: 'Dark, high-contrast image',
    warm: 'Warm coloured stones',
    cool: 'Cool coloured stones',
  }[dominantTone];

  return {
    tone: dominantTone,
    toneLabel,
    category,
    gemstone,
    palette: d.palette,
  };
};

/* ───────────── Search ───────────── */

/**
 * Rank the catalogue against an uploaded photo.
 *
 * @param {Buffer} buffer   the shopper's image
 * @param {object} opts     { limit, category, type }
 */
const searchByImage = async (buffer, opts = {}) => {
  let query;
  try {
    query = await describe(buffer);
  } catch (err) {
    throw new AppError('That image could not be read. Try a JPG, PNG or WebP photo.', 400);
  }

  if (query.density < 0.003) {
    throw new AppError('Please upload a clear photo showing a jewellery piece, rather than a blank image.', 400);
  }
  const products = await buildIndex();
  const detected = inferAttributes(query);
  const limit = Math.min(48, Math.max(1, parseInt(opts.limit, 10) || 24));
  const scored = [];
  for (const product of products) {
    if (opts.category && product.category !== opts.category) continue;
    if (opts.type && product.type !== opts.type) continue;
    let best = null;
    for (const image of candidateImages(product)) {
      const fingerprint = cache.get(image);
      if (!fingerprint) continue;
      const comparison = compareFingerprints(query, fingerprint);
      if (!best || comparison.score > best.score ||
        (comparison.score === best.score && comparison.distance < best.distance)) best = { ...comparison, image };
    }
    if (best) scored.push({ product, ...best });
  }
  scored.sort((a, b) => b.score - a.score || a.distance - b.distance || Number(b.product.inStock) - Number(a.product.inStock));
  const threshold = scored[0]?.score >= 94 ? Math.max(MIN_SCORE, scored[0].score - 14) : MIN_SCORE;
  const items = scored.filter((candidate) => candidate.score >= threshold).slice(0, limit)
    .map(({ product, score, kind, image }) => ({
      ...product,
      matchScore: score,
      matchKind: kind,
      matchedImage: image,
    }));

  return {
    items,
    detected,
    indexed: scored.length,
    catalogue: products.length,
    // Chips the UI offers as one-tap refinements.
    suggested: {
      category: detected.category,
      gemstone: detected.gemstone,
      types: [...new Set(items.slice(0, 12).map((i) => i.type))].slice(0, 4),
    },
  };
};

/** Counts are per distinct image URL — the catalogue reuses photos across products. */
const indexStatus = () => ({
  fingerprints: [...cache.values()].filter(Boolean).length,
  unreadableImages: [...cache.values()].filter((v) => !v).length,
  entries: cache.size,
  lastBuiltAt: lastBuiltAt || null,
  building: Boolean(building),
});

module.exports = { searchByImage, buildIndex, warmIndex, indexStatus, describe, compareFingerprints };
