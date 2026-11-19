import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/site';

/**
 * Crawl policy. Private and utility areas are disallowed; everything else is
 * crawlable, and duplicate URL variants (filters, sorting, tracking params)
 * are handled with canonical + noindex tags rather than robots rules, so
 * Google can still follow their links to products.
 *
 * The sitemap reference comes from SITE_URL, never from the request host.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/api/',
          '/account',
          '/cart',
          '/checkout',
          '/order-confirmation',
          '/wishlist',
          '/search',
          '/image-search',
        ],
      },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
  };
}
