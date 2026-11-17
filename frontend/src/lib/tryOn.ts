/**
 * Virtual try-on configuration.
 *
 * Maps a product type onto the body landmark it should be anchored to, and
 * how big it should be drawn relative to that landmark. Kept free of
 * 'use client' and of any MediaPipe import so server components can read it
 * (e.g. to decide whether to show a "Try It On" button) without pulling the
 * vision runtime into the bundle.
 */

import type { Product } from './types';

/** Which tracker a piece needs, and where on the body it sits. */
export type TryOnMode = 'ring' | 'ears' | 'neck' | 'wrist' | 'nose';

/** Which MediaPipe model a mode requires. */
export type TryOnTracker = 'hand' | 'face';

export interface TryOnConfig {
  mode: TryOnMode;
  tracker: TryOnTracker;
  label: string;
  /** Guidance shown while the camera warms up. */
  hint: string;
  /**
   * Overlay width as a multiple of the reference span for that mode
   * (finger width, face width, wrist width). Tuned by eye against the
   * landmark distances used in VirtualTryOn.
   */
  scale: number;
}

const CONFIGS: Record<Product['type'], TryOnConfig> = {
  rings: {
    mode: 'ring',
    tracker: 'hand',
    label: 'Ring',
    hint: 'Show the back of your hand with your fingers slightly apart.',
    scale: 1.5,
  },
  earrings: {
    mode: 'ears',
    tracker: 'face',
    label: 'Earrings',
    hint: 'Face the camera and keep your ears visible — tie hair back if needed.',
    scale: 0.14,
  },
  pendants: {
    mode: 'neck',
    tracker: 'face',
    label: 'Pendant',
    hint: 'Face the camera and step back a little so your neckline is visible.',
    scale: 0.3,
  },
  necklaces: {
    mode: 'neck',
    tracker: 'face',
    label: 'Necklace',
    hint: 'Face the camera and step back a little so your neckline is visible.',
    scale: 0.62,
  },
  chains: {
    mode: 'neck',
    tracker: 'face',
    label: 'Chain',
    hint: 'Face the camera and step back a little so your neckline is visible.',
    scale: 0.5,
  },
  mangalsutra: {
    mode: 'neck',
    tracker: 'face',
    label: 'Mangalsutra',
    hint: 'Face the camera and step back a little so your neckline is visible.',
    scale: 0.66,
  },
  bracelets: {
    mode: 'wrist',
    tracker: 'hand',
    label: 'Bracelet',
    hint: 'Show the camera the back of your hand with your wrist in frame.',
    scale: 1.1,
  },
  bangles: {
    mode: 'wrist',
    tracker: 'hand',
    label: 'Bangle',
    hint: 'Show the camera the back of your hand with your wrist in frame.',
    scale: 1.2,
  },
  'nose-pin': {
    mode: 'nose',
    tracker: 'face',
    label: 'Nose Pin',
    hint: 'Face the camera straight on, in good light.',
    scale: 0.06,
  },
};

/**
 * Size options per product type.
 *
 * Only some pieces are sized, and they don't share a scale — a pendant has no
 * size at all, while a chain is measured in inches. Returning null means the
 * product page shows no selector and sends no `size` with the order, instead
 * of defaulting every item to ring size 16.
 */
export interface SizeOptions {
  label: string;
  /** Short note rendered next to the label, e.g. a sizing-guide hint. */
  help?: string;
  values: string[];
  /** Suffix shown inside each button. */
  unit?: string;
}

const SIZE_OPTIONS: Partial<Record<Product['type'], SizeOptions>> = {
  rings: {
    label: 'Ring Size',
    help: 'Indian standard',
    values: ['14', '15', '16', '17', '18', '19', '20', '21'],
  },
  bangles: {
    label: 'Bangle Size',
    help: 'Inner diameter',
    values: ['2.2', '2.4', '2.6', '2.8'],
    unit: '"',
  },
  bracelets: {
    label: 'Bracelet Length',
    values: ['6.5', '7', '7.5', '8'],
    unit: '"',
  },
  chains: {
    label: 'Chain Length',
    values: ['16', '18', '20', '22', '24'],
    unit: '"',
  },
  necklaces: {
    label: 'Necklace Length',
    values: ['16', '18', '20'],
    unit: '"',
  },
  mangalsutra: {
    label: 'Length',
    values: ['18', '20', '24'],
    unit: '"',
  },
};

/**
 * Resolve the size selector for a product.
 *
 * `SIZE_OPTIONS` above is the standard scale for each type — a fallback, not
 * the source of truth. When a product carries its own `sizes` those win, so
 * a ring stocked only in 16–18 no longer offers 14–21. The label, help text
 * and unit still come from the type, because those describe the scale itself
 * (ring numbers vs. inches) rather than what's in stock.
 */
export function getSizeOptions(
  type: string | undefined,
  sizes?: string[]
): SizeOptions | null {
  const preset = type ? SIZE_OPTIONS[type as Product['type']] ?? null : null;
  const custom = sizes?.map((s) => s.trim()).filter(Boolean);

  if (custom?.length) {
    // A type with no standard scale (a pendant, say) is normally unsized, but
    // explicit sizes mean this particular piece is sized after all.
    return preset ? { ...preset, values: custom } : { label: 'Size', values: custom };
  }
  return preset;
}

/** Every product type is try-on capable, but guard for unknown values. */
export function getTryOnConfig(type: string | undefined): TryOnConfig | null {
  if (!type) return null;
  return CONFIGS[type as Product['type']] ?? null;
}

export function isTryOnSupported(type: string | undefined): boolean {
  return getTryOnConfig(type) !== null;
}

/**
 * Which image to overlay.
 *
 * Try-on looks right only with a background-free cut-out, so an explicit
 * `tryOnImage` (a transparent PNG uploaded in admin) is preferred. Falling
 * back to a studio photo attempts background extraction. Lifestyle images
 * that cannot be isolated cleanly are not drawn over the camera.
 */
export function getTryOnImage(product: {
  tryOnImage?: string;
  coverImages?: string[];
  images?: string[];
}): { url: string; isCutout: boolean } {
  if (product.tryOnImage) return { url: product.tryOnImage, isCutout: true };
  return {
    url: product.coverImages?.[0] || product.images?.[0] || '',
    isCutout: false,
  };
}
