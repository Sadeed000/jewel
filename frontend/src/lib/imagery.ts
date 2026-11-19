/**
 * Editorial imagery — hero banners for every landing / collection page.
 *
 * All files live in the store's own Cloudinary account (folder
 * ratnapankh/heroes), uploaded at 2880px wide. Source: Unsplash, under the
 * Unsplash License (free for commercial use, no attribution required). To
 * replace one, upload a new image with the same public id in Cloudinary —
 * the URL and every page using it update automatically.
 *
 * `hero()` asks Cloudinary for a smart crop (g_auto keeps the jewellery in
 * frame) at banner proportions and full-HD width. next/image then serves
 * AVIF/WebP at the right size for each screen (phone → 4K).
 */

const BASE = 'https://res.cloudinary.com/dnsulnx1r/image/upload';

const SOURCES = {
  ringsBurgundyHalo: 'v1795007332/ratnapankh/heroes/rings-burgundy-halo.jpg',
  ringsHandDiamond: 'v1795007352/ratnapankh/heroes/rings-hand-diamond.jpg',
  diamondPearBlack: 'v1795007334/ratnapankh/heroes/diamond-pear-black.jpg',
  jewelleryRoseEmeraldSet: 'v1795007335/ratnapankh/heroes/jewellery-rose-emerald-set.jpg',
  gemstoneEmeraldNavy: 'v1795007337/ratnapankh/heroes/gemstone-emerald-necklace-navy.jpg',
  gemstoneEmeraldModel: 'v1795007338/ratnapankh/heroes/gemstone-emerald-model.jpg',
  goldModelNecklace: 'v1795007339/ratnapankh/heroes/gold-model-necklace.jpg',
  goldOvalPendant: 'v1795007341/ratnapankh/heroes/gold-oval-pendant.jpg',
  earringsDiamondStuds: 'v1795007343/ratnapankh/heroes/earrings-diamond-studs.jpg',
  earringsSapphireDrops: 'v1795007344/ratnapankh/heroes/earrings-sapphire-drops.jpg',
  dailyWearDaintyRings: 'v1795007346/ratnapankh/heroes/dailywear-dainty-rings.jpg',
  weddingBrideGold: 'v1795007348/ratnapankh/heroes/wedding-bride-gold.jpg',
  weddingBrideRed: 'v1795008035/ratnapankh/heroes/wedding-bride-red.jpg',
  // Generative-fill version of weddingBrideRed, frozen as its own file so it
  // is never regenerated (3.4:1, bride on the right).
  weddingBrideRedWide: 'v1795009704/ratnapankh/heroes/wedding-bride-red-wide.jpg',
  weddingMehendiKundan: 'v1795008055/ratnapankh/heroes/wedding-mehendi-kundan.jpg',
  weddingKundanSet: 'v1795008056/ratnapankh/heroes/wedding-kundan-set.jpg',
  giftingPearlBox: 'v1795007349/ratnapankh/heroes/gifting-pearl-box.jpg',
  silverBandsLeaf: 'v1795007351/ratnapankh/heroes/silver-bands-leaf.jpg',
} as const;

export type ImageKey = keyof typeof SOURCES;

/** Full-width banner: smart-cropped, 2560px wide, high quality. */
export function hero(
  key: ImageKey,
  aspect: '21:9' | '16:9' | '3:1' | '4:5' = '21:9',
  /** Mirror the photo, e.g. to move the subject away from the headline side. */
  opts: { flip?: boolean } = {}
): string {
  return `${BASE}/c_fill,g_auto,ar_${aspect}${opts.flip ? ',a_hflip' : ''}/${SOURCES[key]}`;
}

/**
 * A stored image used as-is (no crop) — e.g. the ultra-wide banners made
 * with Cloudinary's generative fill and then saved as their own files, so
 * they load instantly and are never regenerated. Size and format are still
 * chosen per screen by the image loader.
 */
export function asset(key: ImageKey): string {
  return `${BASE}/${SOURCES[key]}`;
}

/** Tiles and side images: smart-cropped at a sensible width for the slot. */
export function tile(key: ImageKey, aspect: '1:1' | '4:5' | '4:3' | '3:4' = '4:5', width = 1200): string {
  return `${BASE}/c_fill,g_auto,ar_${aspect},w_${width},f_auto,q_auto:good/${SOURCES[key]}`;
}

/** Banner image per collection slug (/shop/[slug]); falls back to the all-jewellery set. */
export const COLLECTION_HERO: Partial<Record<string, ImageKey>> = {
  jewellery: 'jewelleryRoseEmeraldSet',
  all: 'jewelleryRoseEmeraldSet',
  gold: 'goldModelNecklace',
  diamond: 'diamondPearBlack',
  gemstone: 'gemstoneEmeraldNavy',
  silver: 'silverBandsLeaf',
  platinum: 'ringsHandDiamond',
  rings: 'ringsBurgundyHalo',
  earrings: 'earringsDiamondStuds',
  pendants: 'goldOvalPendant',
  necklaces: 'gemstoneEmeraldModel',
  chains: 'goldOvalPendant',
  bracelets: 'goldModelNecklace',
  mangalsutra: 'weddingBrideGold',
  bangles: 'weddingBrideGold',
  'nose-pin': 'weddingBrideGold',
};
