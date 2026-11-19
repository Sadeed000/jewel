'use client';

import { useState } from 'react';
import { useProducts } from '@/hooks/useProducts';
import ProductGrid from '@/components/product/ProductGrid';
import { ProductGridSkeleton, EmptyState } from '@/components/common/Loading';

export function AllJewelleryProducts() {
  const [filter, setFilter] = useState<'all' | 'new' | 'best' | 'u25' | 'u50' | 'u100' | 'a100'>('all');

  // Map filter buttons to API query params
  const getFilters = () => {
    const base = { limit: 24 };
    switch (filter) {
      case 'new':
        return { ...base, isNew: true };
      case 'best':
        return { ...base, isBestseller: true };
      case 'u25':
        return { ...base, maxPrice: 25000 };
      case 'u50':
        return { ...base, minPrice: 25000, maxPrice: 50000 };
      case 'u100':
        return { ...base, minPrice: 50000, maxPrice: 100000 };
      case 'a100':
        return { ...base, minPrice: 100000 };
      default:
        return base;
    }
  };

  const { data, isLoading, isError, refetch } = useProducts(getFilters() as any);
  const items = data?.items ?? [];

  if (isLoading && !items.length) {
    return <ProductGridSkeleton count={24} />;
  }

  if (isError) {
    return (
      <EmptyState
        title="Couldn't load products"
        description="Something went wrong reaching our catalogue. Please try again."
        action={
          <button onClick={() => refetch()} className="btn-primary">
            Retry
          </button>
        }
      />
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="No products match this filter"
        description="Try a different price range or browse everything."
        action={
          <button onClick={() => setFilter('all')} className="btn-primary">
            Show all
          </button>
        }
      />
    );
  }

  return (
    <ProductGrid products={items} animationKey={filter} />
  );
}
