import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchProductResult, fetchRelatedProducts } from '@/lib/server-api';
import { productImageUrl, resolveImageUrl } from '@/lib/utils';
import { getSizeOptions } from '@/lib/tryOn';
import { SITE_NAME, absoluteUrl } from '@/lib/site';
import { JsonLd, breadcrumbLd, clip, pageMetadata } from '@/lib/seo';
import type { Product } from '@/lib/types';
import ProductDetailClient from './ProductDetailClient';

/**
 * Product detail — server shell.
 *
 * The product and its related items are fetched here (cached for 5 minutes)
 * and handed to the interactive client component, so the page arrives with
 * the product — title, H1, price, specs, images — already in the HTML.
 *
 * Status codes:
 *   - unknown slug          → 404 (was a 200 "not found" page)
 *   - a product's old slug  → 308 to the current slug (src/middleware.ts)
 *   - API unreachable       → client fallback fetches for itself, as before
 */
export const revalidate = 300;

// No product is pre-built at deploy time, but returning a list (even empty)
// opts the route into ISR: each product page is rendered on its first visit,
// cached, and refreshed in the background every `revalidate` seconds.
export function generateStaticParams() {
  return [];
}

type Props = { params: { slug: string } };

const typeLabel = (type: string) => type.replace(/-/g, ' ').replace(/s$/, '');

/** Absolute image URLs (CDN URLs pass through; API-relative uploads resolve to the API origin). */
const productImages = (product: Product) =>
  Array.from(
    new Set([...(product.coverImages ?? []), ...(product.detailedImages ?? []), ...(product.images ?? [])].map(resolveImageUrl))
  ).filter((u) => /^https?:\/\//.test(u));

const isAvailable = (p: Product) => p.inStock !== false && (p.stockQty ?? 1) > 0;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { product, missing } = await fetchProductResult(params.slug);
  // Real HTTP 404. Note: never add a loading.tsx above this route — a
  // Suspense boundary there makes Next send 200 before notFound() runs.
  if (missing) notFound();
  if (!product) return { title: 'Product', robots: { index: false } };

  const specs = [product.metal, product.purity].filter(Boolean).join(', ');
  const description = clip(
    `${product.name}${specs ? ` in ${specs}` : ''}. ₹${product.price.toLocaleString('en-IN')}. ${product.description}`
  );
  const image = resolveImageUrl(productImageUrl(product));

  return pageMetadata({
    title: product.name,
    description,
    path: `/product/${product.slug}`,
    image,
    imageAlt: product.name,
    // The bespoke configurator's base product is reachable but not for search.
    noindex: !!(product as Product & { hidden?: boolean }).hidden,
  });
}

function productJsonLd(product: Product) {
  const url = absoluteUrl(`/product/${product.slug}`);
  const sizes = getSizeOptions(product.type, product.sizes);
  const properties = [
    { name: 'Metal', value: product.metal },
    { name: 'Purity', value: product.purity },
    { name: 'Weight', value: product.weight },
    ...(sizes ? [{ name: `Available ${sizes.label.toLowerCase()}s`, value: sizes.values.join(', ') }] : []),
  ].filter((p) => p.value);

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${url}#product`,
    name: product.name,
    description: clip(product.description, 5000),
    url,
    image: productImages(product),
    ...(product.sku ? { sku: product.sku } : {}),
    brand: { '@type': 'Brand', name: SITE_NAME },
    category: typeLabel(product.type),
    material: product.metal,
    additionalProperty: properties.map((p) => ({ '@type': 'PropertyValue', name: p.name, value: p.value })),
    // Same price, currency and stock state the page shows. Ratings are
    // deliberately omitted: no review list is displayed on the page.
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'INR',
      price: product.price,
      availability: isAvailable(product) ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@type': 'Organization', name: SITE_NAME },
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  // Same cached requests as generateMetadata — Next dedupes them.
  const [{ product, missing }, related] = await Promise.all([
    fetchProductResult(params.slug),
    fetchRelatedProducts(params.slug, 8),
  ]);

  if (missing) notFound();
  // An old slug is 308-redirected by middleware.ts before reaching here. If
  // one slips through (redirect lookup still cached as "none"), the page
  // renders normally with its canonical pointing at the current slug.

  return (
    <>
      {product && (
        <JsonLd
          data={[
            productJsonLd(product),
            breadcrumbLd([
              { name: 'Home', path: '/' },
              { name: product.category.replace(/\b\w/g, (c) => c.toUpperCase()), path: `/shop/${product.category}` },
              { name: product.name, path: `/product/${product.slug}` },
            ]),
          ]}
        />
      )}
      <ProductDetailClient
        slug={params.slug}
        initialProduct={product ?? undefined}
        initialRelated={product ? related ?? undefined : undefined}
      />
    </>
  );
}
