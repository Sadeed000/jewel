import type { ProductFacets } from './server-api';
import { FILTER_GROUPS } from './filters';

/**
 * Collection pages (/shop/[slug]) — search copy and indexing policy.
 *
 * Copy describes the collection only in terms the catalogue can back up:
 * metal, type and stone come from each product's own record. Nothing here
 * claims a purity, certification, origin or delivery time; those belong on
 * the product page, where they come from the product data.
 */

export const METAL_SLUGS = ['gold', 'diamond', 'gemstone', 'platinum', 'silver'] as const;
export const TYPE_SLUGS = [
  'rings', 'earrings', 'pendants', 'necklaces', 'chains',
  'bracelets', 'mangalsutra', 'bangles', 'nose-pin',
] as const;

export interface CollectionCopy {
  /** <title> (brand suffix added by the layout template). */
  title: string;
  h1: string;
  description: string;
  /** Short, useful intro under the H1. */
  intro: string;
}

const COPY: Record<string, CollectionCopy> = {
  silver: {
    title: 'Silver Jewellery Online in India – Rings, Earrings & Pendants',
    h1: 'Silver Jewellery',
    description:
      'Shop silver jewellery online in India — rings, earrings and pendants with prices in INR. Check metal, size and stock on each piece before you order.',
    intro:
      'Everyday silver rings, earrings and pendants. Each product page lists the exact metal, finish, weight and available sizes, so you know precisely what you are buying.',
  },
  gold: {
    title: 'Gold & Gold-Tone Jewellery Online in India',
    h1: 'Gold Jewellery',
    description:
      'Browse gold and gold-finish jewellery online with prices in INR. Metal, purity and plating are listed on every product page.',
    intro:
      'Gold and gold-finish pieces for daily wear and gifting. Look for the metal and purity details on each product — they tell you whether a piece is solid gold or gold-plated.',
  },
  gemstone: {
    title: 'Gemstone Jewellery Online – Opal, Coloured Stone Earrings & Rings',
    h1: 'Gemstone Jewellery',
    description:
      'Shop gemstone jewellery online in India: coloured-stone earrings, rings and pendants priced in INR. Stone and metal details on every piece.',
    intro:
      'Colour-led earrings, rings and pendants. Stone, shape and metal details are on each product page, along with any certification the piece carries.',
  },
  diamond: {
    title: 'Diamond & Solitaire-Style Rings and Earrings',
    h1: 'Diamond Jewellery',
    description:
      'Explore diamond and solitaire-style rings and earrings with prices in INR. Stone, metal and certification details are listed per product.',
    intro:
      'Solitaire-style rings and sparkling earrings. Each product page states the stone, metal and any certificate number, so you can verify before you buy.',
  },
  platinum: {
    title: 'Platinum Jewellery Online in India',
    h1: 'Platinum Jewellery',
    description: 'Browse platinum rings and jewellery online with prices in INR and full metal details on every product page.',
    intro: 'Platinum pieces, with metal, purity and weight listed on each product page.',
  },
  rings: {
    title: 'Rings for Women & Men – Shop Rings Online in India',
    h1: 'Rings',
    description:
      'Shop rings online in India with Indian ring sizes, prices in INR and size guidance. Find your size at home with our Ring Size Finder.',
    intro:
      'Rings in Indian sizes. Not sure of your size? Use the Ring Size Finder before you order — every ring page shows the sizes that design comes in.',
  },
  earrings: {
    title: 'Earrings for Women – Drop, Stud & Gemstone Earrings Online',
    h1: 'Earrings',
    description:
      'Shop earrings online in India — drops, studs and gemstone earrings with prices in INR. Metal and stone details on every pair.',
    intro: 'Drop, stud and gemstone earrings. Each pair lists its metal, finish and stone so you can compare at a glance.',
  },
  pendants: {
    title: 'Pendants & Pendant Necklaces Online in India',
    h1: 'Pendants',
    description: 'Shop pendants and pendant necklaces online with prices in INR. Metal, finish and chain details on every product page.',
    intro: 'Pendants for everyday wear and gifting, with metal and finish listed on each piece.',
  },
  bracelets: {
    title: 'Bracelets for Women Online in India',
    h1: 'Bracelets',
    description: 'Shop bracelets online in India with prices in INR. Metal, finish and size details on each product page.',
    intro: 'Bracelets for stacking and gifting, with metal and finish details on every piece.',
  },
  jewellery: {
    title: 'Shop All Jewellery Online in India',
    h1: 'All Jewellery',
    description: 'Browse every piece in the store — rings, earrings, pendants and more, with prices in INR and secure checkout.',
    intro: 'The full catalogue. Use the filters to narrow by metal, type, stone or price.',
  },
};

const titleCase = (slug: string) => slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export function isKnownCollection(slug: string): boolean {
  return slug === 'jewellery' || slug === 'all' || (METAL_SLUGS as readonly string[]).includes(slug) || (TYPE_SLUGS as readonly string[]).includes(slug);
}

export function collectionCopy(slug: string): CollectionCopy {
  const key = slug === 'all' ? 'jewellery' : slug;
  if (COPY[key]) return COPY[key];
  const name = titleCase(key);
  return {
    title: `${name} Online in India`,
    h1: name,
    description: `Shop ${name.toLowerCase()} online in India with prices in INR. Full metal and stone details on every product page.`,
    intro: `${name}, with metal, finish and size details on every product page.`,
  };
}

/**
 * Which listing URL is canonical for a collection.
 *
 * /shop/rings and /shop/earrings duplicate the curated /rings and /earrings
 * landing pages (the ones the navigation links to), so page 1 of those points
 * at the landing page. /shop/all duplicates /shop/jewellery.
 */
const CANONICAL_ALIAS: Record<string, string> = {
  rings: '/rings',
  earrings: '/earrings',
  all: '/shop/jewellery',
};

/** Params that only reorder, filter or track — they never create a new indexable page. */
const VARIANT_PARAMS = new Set([
  'sort', 'style', 'q',
  ...FILTER_GROUPS.map((g) => g.param),
]);

/**
 * Pagination, filter and parameter policy for /shop/[slug]:
 *
 *  - Page 1, no params            → indexable, self-canonical (or its alias).
 *  - ?page=N (N > 1), no filters  → indexable, self-canonical incl. ?page=N, so
 *                                   products deep in a collection stay discoverable.
 *  - Any filter or sort param     → noindex, follow; canonical = the clean
 *                                   collection URL. Combinations never compete
 *                                   with the collection page in search.
 *  - Tracking params (utm_*, gclid, fbclid…) → ignored for the canonical.
 *  - Unknown collection slug      → 404.
 */
export function collectionIndexing(slug: string, params: Record<string, string | undefined>) {
  const page = Math.max(1, Number(params.page) || 1);
  const filtered = Object.entries(params).some(([k, v]) => v && VARIANT_PARAMS.has(k));
  const base = CANONICAL_ALIAS[slug] && page === 1 ? CANONICAL_ALIAS[slug] : `/shop/${slug === 'all' ? 'jewellery' : slug}`;

  if (filtered) return { canonical: CANONICAL_ALIAS[slug] ?? base, noindex: true, page };
  return { canonical: page > 1 ? `${base}?page=${page}` : base, noindex: false, page };
}

/** Collection URLs worth listing in the sitemap: those with at least one product. */
export function indexableCollectionPaths(facets: ProductFacets | null): string[] {
  const paths = ['/shop/jewellery'];
  if (!facets?.category || !facets?.type) return paths;
  facets.category.forEach((f) => {
    if (f._id && f.count > 0 && (METAL_SLUGS as readonly string[]).includes(f._id)) paths.push(`/shop/${f._id}`);
  });
  facets.type.forEach((f) => {
    if (!f._id || f.count <= 0 || CANONICAL_ALIAS[f._id]) return; // /rings, /earrings are listed directly
    if ((TYPE_SLUGS as readonly string[]).includes(f._id)) paths.push(`/shop/${f._id}`);
  });
  return paths;
}
