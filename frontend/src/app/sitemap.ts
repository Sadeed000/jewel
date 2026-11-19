import type { MetadataRoute } from 'next';
import { unstable_cache } from 'next/cache';
import { CACHE_TAGS, fetchAllBlogPosts, fetchAllProducts, fetchFacets } from '@/lib/server-api';
import { absoluteUrl } from '@/lib/site';
import { indexableCollectionPaths } from '@/lib/collections';

/**
 * XML sitemap, built from live data and refreshed every 5 minutes — or at
 * once when an article is published/unpublished (the blog fetch is tagged,
 * and /api/revalidate purges that tag).
 *
 * Contains only canonical, indexable URLs that return 200:
 *   - evergreen landing pages
 *   - collections that currently hold at least one product
 *   - every listed product (hidden products are excluded by the API)
 *   - published articles (drafts never reach the public API)
 * Never: admin, cart, checkout, account, wishlist, internal search, or
 * filtered / sorted / paginated variants.
 */
// Rendered per request, but the underlying data is cached (below) for five
// minutes under the 'blog' and 'products' tags. A statically generated
// sitemap ignores on-demand purges in Next 14, which would leave a newly
// published (or unpublished) article out of sync for up to five minutes.
export const dynamic = 'force-dynamic';

const loadSitemapData = unstable_cache(
  async () => {
    const [products, posts, facets] = await Promise.all([fetchAllProducts(), fetchAllBlogPosts(), fetchFacets()]);
    return {
      products: products.map((p) => ({ slug: p.slug, updatedAt: p.updatedAt })),
      posts: posts.map((p) => ({ slug: p.slug, updatedAt: p.updatedAt, publishedAt: p.publishedAt })),
      facets,
    };
  },
  ['sitemap-data'],
  { revalidate: 300, tags: [CACHE_TAGS.blog, CACHE_TAGS.products] }
);

const STATIC_PATHS = [
  '/',
  '/rings',
  '/earrings',
  '/daily-wear',
  '/gemstone',
  '/wedding',
  '/gifting',
  '/ring-size-finder',
  '/blog',
  '/about',
  '/help',
  '/store-locator',
  '/virtual-try-on',
  '/digital-gold',
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { products, posts, facets } = await loadSitemapData();

  const seen = new Set<string>();
  const entries: MetadataRoute.Sitemap = [];
  const add = (path: string, lastModified?: string | Date | null, priority?: number) => {
    // Only internal paths, never query strings, never duplicates.
    if (!path.startsWith('/') || path.includes('?') || path.includes('#') || seen.has(path)) return;
    seen.add(path);
    entries.push({
      url: absoluteUrl(path),
      ...(lastModified ? { lastModified: new Date(lastModified) } : {}),
      ...(priority ? { priority } : {}),
    });
  };

  STATIC_PATHS.forEach((p) => add(p, null, p === '/' ? 1 : 0.7));

  // Collections with stock behind them; empty ones would be thin pages.
  indexableCollectionPaths(facets).forEach((p) => add(p, null, 0.8));

  products.forEach((p) => add(`/product/${p.slug}`, p.updatedAt, 0.9));

  posts.forEach((post) => add(`/blog/${post.slug}`, post.updatedAt || post.publishedAt, 0.6));

  return entries;
}
