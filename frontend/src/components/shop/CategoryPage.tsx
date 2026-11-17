'use client';

import { useState } from 'react';
import Breadcrumb from '@/components/common/Breadcrumb';
import PageHeroBanner from '@/components/shop/PageHeroBanner';
import QuickFilters from '@/components/shop/QuickFilters';
import ProductCard from '@/components/product/ProductCard';
import ShopByOccasion from '@/components/shop/ShopByOccasion';
import { useProducts } from '@/hooks/useProducts';
import { ProductGridSkeleton, EmptyState } from '@/components/common/Loading';
import Link from 'next/link';

interface CategoryPageProps {
  title: string;
  breadcrumbs: Array<{ label: string; href?: string }>;
  heroBanner: {
    image: string;
    eyebrow: string;
    title: string;
    highlight: string;
    subtitle: string;
    align?: 'left' | 'center' | 'right';
  };
  filters: Array<{ label: string; value: string }>;
  getApiFilters: (value: string) => Record<string, any>;
  quickFilters?: Array<{ label: string; value: string }>;
  occasions?: any[];
}

export default function CategoryPage({
  title,
  breadcrumbs,
  heroBanner,
  filters,
  getApiFilters,
  quickFilters,
  occasions,
}: CategoryPageProps) {
  const [filter, setFilter] = useState(filters[0]?.value || 'all');

  const { data, isLoading, isError, refetch } = useProducts(getApiFilters(filter));
  const items = data?.items ?? [];

  return (
    <div>
      <PageHeroBanner {...heroBanner} />
      <Breadcrumb items={breadcrumbs} />

      {quickFilters && (
        <QuickFilters filters={quickFilters} onChange={(val) => setFilter(val)} defaultActive={filter} />
      )}

      <div className="container-custom py-16">
        {isLoading && !items.length ? (
          <ProductGridSkeleton count={24} />
        ) : isError ? (
          <EmptyState
            title="Couldn't load products"
            description="Something went wrong reaching our catalogue. Please try again."
            action={
              <button onClick={() => refetch()} className="btn-primary">
                Retry
              </button>
            }
          />
        ) : items.length === 0 ? (
          <EmptyState
            title="No products found"
            description="Try adjusting your filters or browse our other collections."
            action={<Link href="/jewellery" className="btn-primary">Browse all jewellery</Link>}
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
            {items.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        )}
      </div>

      {occasions && <ShopByOccasion occasions={occasions} />}
    </div>
  );
}
