'use client';

import ProductCarousel from '@/components/home/ProductCarousel';
import { useBestsellers, useNewArrivals } from '@/hooks/useProducts';
import type { Paginated, Product } from '@/lib/types';

/**
 * Client-side wrapper for the homepage product carousels.
 *
 * The homepage server component fetches the first page and passes it as
 * `initial`, so products are in the initial HTML; React Query then owns the
 * data (and refreshes it) exactly as before.
 *
 * When a carousel has no products (empty result or an outage) it renders
 * nothing rather than falling back to a hardcoded catalogue, so the homepage
 * never advertises products that aren't really in stock.
 */
export function BestsellerCarousel({ initial }: { initial?: Paginated<Product> }) {
  const { data } = useBestsellers(8, initial);
  const items = data?.items ?? [];
  if (items.length === 0) return null;

  return (
    <ProductCarousel
      title="Pick up where you left"
      subtitle="Our products tend to sell out quickly, so don't delay in completing your purchase."
      products={items}
    />
  );
}

export function NewArrivalsCarousel({ initial }: { initial?: Paginated<Product> }) {
  const { data } = useNewArrivals(8, initial);
  const items = data?.items ?? [];
  if (items.length === 0) return null;

  return (
    <ProductCarousel
      title="New Arrivals"
      subtitle="Explore the latest launches now"
      products={items}
    />
  );
}
