import type { Banner, BlogPost, Paginated, Product } from './types';

/**
 * Server-side data access for React Server Components.
 *
 * The client uses lib/api.ts (React Query, localStorage token). Server
 * components can't use either, so they call the API directly through `fetch`
 * with Next's data cache — which means these pages render on the server with
 * no client-side request and no loading spinner.
 *
 * Every helper fails soft: a catalogue outage degrades a section to empty
 * rather than throwing and blanking the whole route.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050/api/v1';

/** Seconds before cached catalogue data is refetched. */
const REVALIDATE = 300;

/**
 * Navigation is edited far more often than the catalogue, and an admin who
 * adds a category expects to see it on the storefront within a page refresh
 * or two — five minutes of staleness reads as "it didn't save". The nav
 * payload is a handful of documents, so refetching it often is cheap.
 */
const NAV_REVALIDATE = 30;

type Query = Record<string, string | number | boolean | undefined | null>;

/**
 * Cache tags. The admin panel calls /api/revalidate after publishing,
 * unpublishing or editing an article, which purges everything tagged 'blog'
 * (the listing, the article and the sitemap) at once.
 */
export const CACHE_TAGS = { blog: 'blog', products: 'products' } as const;

/**
 * GET with status. `status` is the HTTP status, or 0 when the API could not
 * be reached — which lets a page tell "this product does not exist" (404 →
 * notFound) apart from "the API is down" (render the client fallback).
 */
async function serverGetWithStatus<T>(
  path: string,
  query: Query = {},
  revalidate: number = REVALIDATE,
  tags: string[] = []
): Promise<{ data: T | null; status: number }> {
  const url = new URL(`${API_URL}${path}`);
  Object.entries(query).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.append(k, String(v));
  });

  // Every catalogue read is purgeable with one tag after an admin edit.
  const allTags = Array.from(new Set(path.startsWith('/products') ? [...tags, CACHE_TAGS.products] : tags));

  try {
    const res = await fetch(url.toString(), {
      next: { revalidate, tags: allTags },
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      if (res.status !== 404) console.error(`[server-api] ${path} responded ${res.status}`);
      return { data: null, status: res.status };
    }
    const payload = await res.json();
    return { data: payload.data as T, status: res.status };
  } catch (err) {
    // Backend unreachable during build or at request time.
    console.error(`[server-api] ${path} failed:`, (err as Error).message);
    return { data: null, status: 0 };
  }
}

async function serverGet<T>(
  path: string,
  query: Query = {},
  revalidate: number = REVALIDATE,
  tags: string[] = []
): Promise<T | null> {
  return (await serverGetWithStatus<T>(path, query, revalidate, tags)).data;
}

export interface ServerProductQuery extends Query {
  category?: string;
  type?: string;
  occasion?: string;
  gemstone?: string;
  gender?: string;
  collection?: string;
  isBestseller?: boolean;
  isNew?: boolean;
  minPrice?: number;
  maxPrice?: number;
  q?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

/** Fetch a product list. Returns [] on failure so callers can render an empty state. */
export async function fetchProducts(query: ServerProductQuery = {}): Promise<Product[]> {
  const data = await serverGet<Paginated<Product>>('/products', query);
  return data?.items ?? [];
}

/** Fetch a product list along with its pagination envelope. */
export async function fetchProductPage(
  query: ServerProductQuery = {}
): Promise<Paginated<Product>> {
  const data = await serverGet<Paginated<Product>>('/products', query);
  return (
    data ?? {
      items: [],
      pagination: { total: 0, page: 1, limit: 0, pages: 1, hasNext: false, hasPrev: false },
    }
  );
}

/**
 * Like fetchProductPage, but returns null on failure instead of an empty page,
 * so a client component seeded with it can still fetch for itself.
 */
export async function fetchProductPageOrNull(
  query: ServerProductQuery = {}
): Promise<Paginated<Product> | null> {
  return serverGet<Paginated<Product>>('/products', query);
}

/** Fetch a single product by slug. Returns null when absent (drives notFound()). */
export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  return (await fetchProductResult(slug)).product;
}

/**
 * Product plus lookup outcome: `missing` only when the API positively said
 * 404. A product reached through an old slug comes back with its current
 * slug, which the page turns into a permanent redirect.
 */
export async function fetchProductResult(
  slug: string
): Promise<{ product: Product | null; missing: boolean }> {
  const { data, status } = await serverGetWithStatus<{ product: Product }>(
    `/products/slug/${encodeURIComponent(slug)}`,
    {},
    REVALIDATE,
    [CACHE_TAGS.products]
  );
  return { product: data?.product ?? null, missing: status === 404 };
}

export interface ProductFacets {
  category: { _id: string | null; count: number }[];
  type: { _id: string | null; count: number }[];
}

/** Product counts by metal category and type — decides which collections are worth indexing. */
export async function fetchFacets(): Promise<ProductFacets | null> {
  const data = await serverGet<{ facets: ProductFacets }>('/products/facets');
  return data?.facets ?? null;
}

/** Every listed product, following pagination (100 is the API's per-page cap). */
export async function fetchAllProducts(maxPages = 50): Promise<Product[]> {
  const all: Product[] = [];
  for (let page = 1; page <= maxPages; page += 1) {
    const data = await serverGet<Paginated<Product>>('/products', { limit: 100, page, sort: '-updatedAt' });
    if (!data) break;
    all.push(...data.items);
    if (!data.pagination.hasNext) break;
  }
  return all;
}

/* ───────────── Blog ───────────── */

/** Published articles only — the public API never returns drafts. */
export async function fetchBlogPosts(
  query: { page?: number; limit?: number; category?: string } = {}
): Promise<Paginated<BlogPost> | null> {
  return serverGet<Paginated<BlogPost>>('/content/blog', query, REVALIDATE, [CACHE_TAGS.blog]);
}

export async function fetchAllBlogPosts(): Promise<BlogPost[]> {
  const all: BlogPost[] = [];
  for (let page = 1; page <= 50; page += 1) {
    const data = await fetchBlogPosts({ page, limit: 100 });
    if (!data) break;
    all.push(...data.items);
    if (!data.pagination.hasNext) break;
  }
  return all;
}

export async function fetchBlogPostResult(
  slug: string
): Promise<{ post: BlogPost | null; missing: boolean }> {
  const { data, status } = await serverGetWithStatus<{ post: BlogPost }>(
    `/content/blog/${encodeURIComponent(slug)}`,
    {},
    REVALIDATE,
    [CACHE_TAGS.blog]
  );
  return { post: data?.post ?? null, missing: status === 404 };
}

/** Related products for a product page; null on failure. */
export async function fetchRelatedProducts(slug: string, limit = 8): Promise<Product[] | null> {
  const data = await serverGet<{ items: Product[] }>(
    `/products/slug/${encodeURIComponent(slug)}/related`,
    { limit }
  );
  return data?.items ?? null;
}

/** Active banners for a placement; null on failure. */
export async function fetchBanners(placement: Banner['placement']): Promise<Banner[] | null> {
  // Banners are scheduled (startsAt/endsAt) so keep them reasonably fresh.
  const data = await serverGet<{ banners: Banner[] }>('/content/banners', { placement }, 60);
  return data?.banners ?? null;
}

export interface ServerSubCategory {
  _id: string;
  name: string;
  slug: string;
  image?: string;
  /** Maps onto Product.type, so the menu link can filter the catalogue. */
  productType?: string;
}

export interface ServerCategory {
  _id: string;
  name: string;
  slug: string;
  icon?: string;
  image: string;
  description?: string;
  href?: string;
  subCategories?: ServerSubCategory[];
  sortOrder?: number;
  showInNav?: boolean;
  showInMegaMenu?: boolean;
}

/**
 * Fetch categories, optionally narrowed to the ones flagged for a surface.
 * The API already filters on `isActive` and sorts by `sortOrder`, so the
 * order admins set in the dashboard is the order the storefront renders.
 */
export async function fetchCategories(
  opts: { nav?: boolean; megaMenu?: boolean } = {}
): Promise<ServerCategory[]> {
  const data = await serverGet<{ categories: ServerCategory[] }>(
    '/content/categories',
    { nav: opts.nav ? 'true' : undefined, megaMenu: opts.megaMenu ? 'true' : undefined },
    NAV_REVALIDATE
  );
  return data?.categories ?? [];
}
