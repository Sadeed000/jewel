import type { MetadataRoute } from 'next';
import { fetchProducts } from '@/lib/server-api';

/**
 * Generated from the live catalogue so newly added products become
 * discoverable without a redeploy. If the API is unreachable at build time
 * fetchProducts returns [], so the static routes are still emitted rather
 * than failing the build.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://aurelia.example.com';

  const staticUrls = [
    '', '/shop/jewellery', '/shop/gold', '/shop/diamond', '/shop/gemstone',
    '/shop/earrings', '/shop/rings', '/cart', '/wishlist', '/account',
    '/store-locator', '/help', '/about', '/blog', '/digital-gold', '/virtual-try-on',
  ].map((path) => ({ url: `${base}${path}`, lastModified: new Date() }));

  // 100 is the API's hard per-page cap.
  const products = await fetchProducts({ limit: 100 });

  const productUrls = products.map((p) => ({
    url: `${base}/product/${p.slug}`,
    lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date(),
  }));

  return [...staticUrls, ...productUrls];
}
