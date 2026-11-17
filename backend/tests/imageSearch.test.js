const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const sharp = require('sharp');
const Product = require('../models/Product');
const { describe, compareFingerprints, searchByImage } = require('../services/imageSearchService');

const photo = (shape, colour = '#c99b38', size = 240) => sharp(Buffer.from(
  `<svg width="${size}" height="${size}" viewBox="0 0 240 240"><rect width="240" height="240" fill="white"/><g fill="${colour}">${shape}</g></svg>`
)).png().toBuffer();
const ring = '<path fill-rule="evenodd" d="M120 40a80 80 0 1 0 0 160a80 80 0 1 0 0-160 M120 60a60 60 0 1 1 0 120a60 60 0 1 1 0-120"/>';
const pendant = '<path d="M120 25L200 200H40Z"/>';

test('recognises exact files and resized, recompressed photos ahead of other designs', async () => {
  const original = await photo(ring);
  const query = await describe(original);
  assert.equal(compareFingerprints(query, await describe(original)).kind, 'same-image');
  const compressed = await sharp(original).resize(150, 150).jpeg({ quality: 80 }).toBuffer();
  assert(compareFingerprints(query, await describe(compressed)).score >= 94);
  const different = compareFingerprints(query, await describe(await photo(pendant)));
  assert(different.score < 58, `Different gold designs should not be a strong match: ${different.score}`);
});

test('handles EXIF orientation and grayscale images consistently', async () => {
  const original = await photo(pendant, '#999999');
  const rotated = await sharp(original).jpeg().withMetadata({ orientation: 6 }).toBuffer();
  const upright = await sharp(rotated).rotate().png().toBuffer();
  assert(compareFingerprints(await describe(rotated), await describe(upright)).score >= 94);
  const grayscale = await sharp(original).grayscale().png().toBuffer();
  assert(Number.isFinite(compareFingerprints(await describe(grayscale), await describe(original)).score));
});

test('uses gallery views, keeps exact matches first even out of stock, and honours filters', async (t) => {
  const ringBytes = await photo(ring);
  const pendantBytes = await photo(pendant);
  const files = new Map([['test-ring.png', ringBytes], ['test-pendant.png', pendantBytes]]);
  const products = [
    { _id: 'pendant', type: 'pendants', category: 'gold', coverImages: ['/uploads/test-pendant.png'], inStock: true },
    { _id: 'ring', type: 'rings', category: 'gold', coverImages: ['/uploads/test-pendant.png'], detailedImages: ['/uploads/test-ring.png'], inStock: false },
  ];
  t.mock.method(Product, 'find', (filter) => {
    assert.deepEqual(filter, { hidden: { $ne: true } });
    return { select: () => ({ lean: async () => products }) };
  });
  t.mock.method(fsp, 'readFile', async (file) => {
    const bytes = files.get(path.basename(file));
    if (!bytes) throw new Error('Missing test photo');
    return bytes;
  });
  // Keep tests independent of the real on-disk index and catalogue.
  const readFileSync = fs.readFileSync;
  t.mock.method(fs, 'readFileSync', (file, ...args) => {
    if (String(file).endsWith('image-index.json')) throw new Error('No test cache');
    return readFileSync(file, ...args);
  });
  t.mock.method(fsp, 'mkdir', async () => {});
  t.mock.method(fsp, 'writeFile', async () => {});
  const result = await searchByImage(ringBytes);
  assert.equal(result.items[0]._id, 'ring');
  assert.equal(result.items[0].matchKind, 'same-image');
  assert.equal(result.items[0].matchedImage, '/uploads/test-ring.png');
  assert.equal(result.items.length, 1);
  const filtered = await searchByImage(ringBytes, { type: 'pendants' });
  assert.equal(filtered.items.length, 0);
  assert.equal((await searchByImage(ringBytes, { category: 'silver' })).items.length, 0);
  const blank = await sharp({ create: { width: 100, height: 100, channels: 3, background: 'white' } }).png().toBuffer();
  await assert.rejects(searchByImage(blank), /clear photo/);
  await assert.rejects(searchByImage(Buffer.from('invalid')), /could not be read/);
});
