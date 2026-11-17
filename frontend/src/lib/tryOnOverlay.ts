/** Remove a uniform studio backdrop; reject lifestyle shots instead of pasting them on skin. */
export function isolateJewellery(data: Uint8ClampedArray, width: number, height: number) {
  const samples: number[][] = [];
  const step = Math.max(1, Math.floor(Math.min(width, height) / 40));
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      if (x > width * 0.06 && x < width * 0.94 && y > height * 0.06 && y < height * 0.94) continue;
      const i = (y * width + x) * 4;
      if (data[i + 3] > 240) samples.push([data[i], data[i + 1], data[i + 2]]);
    }
  }
  const transparent = data.filter((_, i) => i % 4 === 3 && data[i] < 16).length;
  if (transparent > width * height * 0.12) return; // Preserve an existing cutout.
  if (!samples.length) throw new Error('No usable jewellery image.');
  const median = (channel: number) => samples.map((p) => p[channel]).sort((a, b) => a - b)[Math.floor(samples.length / 2)];
  const bg = [median(0), median(1), median(2)];
  const darkNeutralBackdrop = Math.max(...bg) < 70 && Math.max(...bg) - Math.min(...bg) < 25;
  const distance = (r: number, g: number, b: number) => Math.hypot(r - bg[0], g - bg[1], b - bg[2]);
  const consistency = samples.filter((p) => distance(p[0], p[1], p[2]) < 48).length / samples.length;
  if (consistency < 0.82) throw new Error('This photo needs a dedicated transparent try-on image.');
  let visible = 0;
  for (let i = 0; i < data.length; i += 4) {
    const d = distance(data[i], data[i + 1], data[i + 2]);
    // A short alpha ramp keeps thin metal edges antialiased, including internal holes.
    let alpha = Math.max(0, Math.min(1, (d - 30) / 28));
    if (darkNeutralBackdrop) {
      // Black display fabric contains folds much brighter than its median.
      // Suppress neutral dark cloth while preserving warm metal and gemstones.
      const high = Math.max(data[i], data[i + 1], data[i + 2]);
      const low = Math.min(data[i], data[i + 1], data[i + 2]);
      if (high - low < 26) alpha *= Math.max(0, Math.min(1, (high - 88) / 40));
    }
    data[i + 3] = Math.round(data[i + 3] * alpha);
    if (data[i + 3] > 100) visible++;
  }
  const coverage = visible / (width * height);
  if (coverage < 0.008 || coverage > 0.65) throw new Error('This photo needs a dedicated transparent try-on image.');
  // Remaining objects on the frame edges indicate scenery or a display stand.
  let edgePixels = 0;
  for (let x = 0; x < width; x++) {
    if (data[x * 4 + 3] > 100) edgePixels++;
    if (data[((height - 1) * width + x) * 4 + 3] > 100) edgePixels++;
  }
  for (let y = 0; y < height; y++) {
    if (data[(y * width) * 4 + 3] > 100) edgePixels++;
    if (data[(y * width + width - 1) * 4 + 3] > 100) edgePixels++;
  }
  if (edgePixels > (width + height) * 0.08) throw new Error('Use a closely cropped transparent jewellery image.');
}

export function jewelleryBounds(data: Uint8ClampedArray, width: number, height: number, singleEarring: boolean) {
  const columns = new Uint32Array(width);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    if (data[(y * width + x) * 4 + 3] > 100) columns[x]++;
  }
  const peak = Math.max(...columns);
  if (!peak) throw new Error('No jewellery outline was found.');
  const significant = Math.max(1, peak * 0.05);
  let x0 = columns.findIndex((count) => count >= significant);
  let x1 = width - 1;
  while (x1 > x0 && columns[x1] < significant) x1--;
  if (singleEarring) {
    const span = x1 - x0 + 1;
    let bestStart = -1, bestLength = 0, gapStart = -1;
    for (let x = x0 + Math.floor(span * 0.28); x < x0 + span * 0.72; x++) {
      if (columns[x] < Math.max(2, peak * 0.08)) {
        if (gapStart < 0) gapStart = x;
        if (x - gapStart + 1 > bestLength) { bestStart = gapStart; bestLength = x - gapStart + 1; }
      } else gapStart = -1;
    }
    if (bestLength > span * 0.035) {
      const split = bestStart + Math.floor(bestLength / 2);
      let left = 0, right = 0;
      for (let x = x0; x <= x1; x++) x < split ? left += columns[x] : right += columns[x];
      if (left > right * 0.25 && right > left * 0.25) x1 = bestStart - 1;
    }
  }
  const rows = new Uint32Array(height);
  for (let y = 0; y < height; y++) for (let x = x0; x <= x1; x++) {
    if (data[(y * width + x) * 4 + 3] > 100) rows[y]++;
  }
  const rowThreshold = Math.max(1, Math.max(...rows) * 0.06);
  let y0 = rows.findIndex((count) => count >= rowThreshold), y1 = height - 1;
  while (y1 > y0 && rows[y1] < rowThreshold) y1--;
  return { x: x0, y: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 };
}

export async function prepareTryOnOverlay(url: string, singleEarring: boolean): Promise<HTMLCanvasElement> {
  const image = new Image();
  image.crossOrigin = 'anonymous';
  image.src = url;
  await image.decode();
  const ratio = Math.min(1, 1024 / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio));
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Image preparation is unavailable.');
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
  isolateJewellery(pixels.data, canvas.width, canvas.height);
  const bounds = jewelleryBounds(pixels.data, canvas.width, canvas.height, singleEarring);
  ctx.putImageData(pixels, 0, 0);
  const cropped = document.createElement('canvas');
  cropped.width = bounds.width; cropped.height = bounds.height;
  cropped.getContext('2d')!.drawImage(canvas, bounds.x, bounds.y, bounds.width, bounds.height, 0, 0, bounds.width, bounds.height);
  return cropped;
}
