import type { Paginated, Product } from './types';

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

async function serverGet<T>(
  path: string,
  query: Query = {},
  revalidate: number = REVALIDATE
): Promise<T | null> {
  const url = new URL(`${API_URL}${path}`);
  Object.entries(query).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.append(k, String(v));
  });

  try {
    const res = await fetch(url.toString(), {
      next: { revalidate },
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      console.error(`[server-api] ${path} responded ${res.status}`);
      return null;
    }
    const payload = await res.json();
    return payload.data as T;
  } catch (err) {
    // Backend unreachable during build or at request time.
    console.error(`[server-api] ${path} failed:`, (err as Error).message);
    return null;
  }
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

/** Fetch a single product by slug. Returns null when absent (drives notFound()). */
export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  const data = await serverGet<{ product: Product }>(`/products/slug/${slug}`);
  return data?.product ?? null;
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
