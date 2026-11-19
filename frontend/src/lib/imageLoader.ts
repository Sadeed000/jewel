/**
 * next/image loader (wired in next.config.js → images.loaderFile).
 *
 * Cloudinary images go straight to Cloudinary's CDN, resized there:
 *   …/upload/<existing transformations>/f_auto,q_auto,c_limit,w_<width>/v123/…
 *   - f_auto  → AVIF / WebP / JPEG, whichever the browser supports
 *   - q_auto  → Cloudinary picks the lightest quality that still looks right
 *   - w_      → exactly the width next/image asks for (one per srcset step)
 * The browser downloads from the nearest CDN edge — no round trip through
 * our server, and no slow on-server AVIF encoding (which was what made hero
 * banners take seconds on first view).
 *
 * Everything else (API-uploaded product images, etc.) still goes through
 * Next's built-in optimizer exactly as before.
 */
export default function imageLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  if (src.startsWith('https://res.cloudinary.com/')) {
    const marker = '/upload/';
    const at = src.indexOf(marker);
    if (at !== -1) {
      const head = src.slice(0, at + marker.length);
      const rest = src.slice(at + marker.length);
      // Insert our delivery step right before the version segment (v123/…),
      // after any crop the URL already carries (g_auto banners etc.).
      const version = rest.search(/(^|\/)v\d+\//);
      // Banners ask for quality 85+ → keep fine jewellery detail.
      const q = quality && quality >= 85 ? 'q_auto:best' : 'q_auto:good';
      const step = `f_auto,${q},c_limit,w_${width}`;
      if (version === -1) return `${head}${step}/${rest}`;
      const cut = version === 0 ? 0 : version + 1;
      return `${head}${rest.slice(0, cut)}${step}/${rest.slice(cut)}`;
    }
  }

  // Not Cloudinary: Next's default optimizer.
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality || 75}`;
}
