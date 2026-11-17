const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

const compiled = ts.transpileModule(
  fs.readFileSync(path.join(__dirname, '../src/lib/tryOnOverlay.ts'), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }
).outputText;
const subject = new Module('try-on-overlay');
subject._compile(compiled, 'try-on-overlay.js');
const { isolateJewellery, jewelleryBounds } = subject.exports;

function image(background, alpha = 255) {
  const data = new Uint8ClampedArray(100 * 100 * 4);
  for (let i = 0; i < data.length; i += 4) data.set([...background, alpha], i);
  return data;
}
function rect(data, x0, y0, x1, y1, color) {
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) data.set(color, (y * 100 + x) * 4);
}
for (const background of [[12, 12, 12], [250, 248, 245]]) {
  test(`isolates metal and internal holes on ${background[0] < 50 ? 'dark' : 'light'} backgrounds`, () => {
    const pixels = image(background);
    rect(pixels, 20, 20, 35, 75, [210, 160, 50, 255]);
    rect(pixels, 65, 20, 80, 75, [210, 160, 50, 255]);
    rect(pixels, 24, 30, 30, 60, [...background, 255]);
    isolateJewellery(pixels, 100, 100);
    assert.equal(pixels[3], 0);
    assert.equal(pixels[(25 * 100 + 21) * 4 + 3], 255);
    assert.equal(pixels[(40 * 100 + 26) * 4 + 3], 0);
    const bounds = jewelleryBounds(pixels, 100, 100, true);
    assert(bounds.width < 30, 'must select one earring, not the pair');
    assert.equal(bounds.height, 55);
  });
}
test('preserves transparent assets and semitransparent edges', () => {
  const pixels = image([0, 0, 0], 0);
  rect(pixels, 40, 20, 60, 80, [200, 150, 60, 255]);
  rect(pixels, 39, 20, 40, 80, [200, 150, 60, 128]);
  const before = new Uint8ClampedArray(pixels);
  isolateJewellery(pixels, 100, 100);
  assert.deepEqual(pixels, before);
});
test('suppresses highlights on dark display fabric', () => {
  const pixels = image([12, 12, 12]);
  rect(pixels, 10, 10, 90, 15, [72, 72, 72, 255]);
  rect(pixels, 40, 25, 60, 80, [210, 160, 50, 255]);
  isolateJewellery(pixels, 100, 100);
  assert.equal(pixels[(12 * 100 + 50) * 4 + 3], 0);
  assert.equal(pixels[(40 * 100 + 50) * 4 + 3], 255);
});
test('rejects busy scenery instead of drawing a photographic patch', () => {
  const pixels = image([0, 0, 0]);
  for (let y = 0; y < 100; y++) for (let x = 0; x < 100; x++) {
    const n = (Math.floor(x / 13) + Math.floor(y / 13)) % 2 ? 240 : 15;
    pixels.set([n, n, n, 255], (y * 100 + x) * 4);
  }
  assert.throws(() => isolateJewellery(pixels, 100, 100));
});
