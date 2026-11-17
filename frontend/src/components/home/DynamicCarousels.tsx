'use client';

import ProductCarousel from '@/components/home/ProductCarousel';
import { useBestsellers, useNewArrivals } from '@/hooks/useProducts';

/**
 * Client-side wrapper for the homepage product carousels.
 *
 * Both carousels render live backend data. When a carousel has no products
 * (empty result or an outage) it renders nothing rather than falling back to
 * a hardcoded catalogue, so the homepage never advertises products that
 * aren't really in stock. The visual carousel design is unchanged.
 */
export function BestsellerCarousel() {
  const { data, isLoading } = useBestsellers(8);

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

export function NewArrivalsCarousel() {
  const { data, isLoading } = useNewArrivals(8);

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
