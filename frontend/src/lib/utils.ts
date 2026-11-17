import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price);
}

export function calculateDiscount(original: number, current: number): number {
  return Math.round(((original - current) / original) * 100);
}

const API_ORIGIN =
  process.env.NEXT_PUBLIC_API_ORIGIN ||
  (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/api\/v\d+\/?$/, '') ||
  'http://localhost:5050';

/**
 * Uploads are stored as API-relative paths ("/uploads/x.png") so the database
 * stays portable across hosts. Resolve to an absolute URL for rendering.
 */
export function resolveImageUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
  if (url.startsWith('/uploads/')) return `${API_ORIGIN}${url}`;
  return url;
}

/**
 * Inline SVG placeholder used when a product has no usable image. Kept as a
 * data URI so it never triggers a network request and works offline — and so
 * `next/image` never receives an empty `src`, which throws at render time.
 */
export const IMAGE_PLACEHOLDER =
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="#f5f0e8"/><text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-family="serif" font-size="20" fill="#b9a88f">Aurelia</text></svg>`
  );

/**
 * Resolve the display image for a product from either payload shape
 * (static `images` or API `coverImages`), falling back to the placeholder.
 */
export function productImageUrl(product: {
  coverImages?: string[];
  images?: string[];
}): string {
  const raw = product.coverImages?.[0] || product.images?.[0] || '';
  return raw ? resolveImageUrl(raw) : IMAGE_PLACEHOLDER;
}
