'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import Breadcrumb from '@/components/common/Breadcrumb';
import ProductCard from '@/components/product/ProductCard';
import { useProducts } from '@/hooks/useProducts';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { ProductGridSkeleton } from '@/components/common/Loading';
import VoiceSearchButton from '@/components/search/VoiceSearch';

function SearchResults() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  // Debounced so typing doesn't issue a request per keystroke.
  const debouncedQuery = useDebouncedValue(query, 350);

  // A search started elsewhere (header box, voice search) while already on
  // this page changes ?q= without remounting — adopt it. Our own URL updates
  // below always equal debouncedQuery, so they're ignored here.
  useEffect(() => {
    if (initialQuery !== debouncedQuery) setQuery(initialQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  // Keep the URL in sync so results are shareable and the back button works,
  // without pushing a history entry for every character typed.
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedQuery) params.set('q', debouncedQuery);
    router.replace(`/search${params.toString() ? `?${params}` : ''}`, { scroll: false });
  }, [debouncedQuery, router]);

  const { data, isLoading, isError, refetch } = useProducts({
    ...(debouncedQuery ? { q: debouncedQuery } : {}),
    limit: 24,
  });

  const results = data?.items ?? [];
  const total = data?.pagination.total ?? 0;

  return (
    <div>
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Search' }]} />

      <div className="container-custom pb-16">
        <div className="max-w-3xl mx-auto mb-10">
          <div className="relative">
            <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-muted" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for rings, earrings, gemstones..."
              aria-label="Search jewellery"
              className="w-full pl-14 pr-16 py-4 bg-white border border-brand-cream-dark rounded-full text-base outline-none focus:border-brand-gold"
              autoFocus
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
              <VoiceSearchButton onResult={setQuery} className="h-11 w-11 hover:bg-brand-cream" size={20} />
            </div>
          </div>
        </div>

        <h1 className="font-display text-2xl text-brand-ink mb-2">
          {debouncedQuery ? `Results for "${debouncedQuery}"` : 'All Jewellery'}
        </h1>
        <p className="text-sm text-brand-muted mb-6">
          {isLoading ? 'Searching...' : `${total} product${total === 1 ? '' : 's'} found`}
        </p>

        {isLoading ? (
          <ProductGridSkeleton count={12} />
        ) : isError ? (
          <div className="text-center py-20">
            <p className="font-display text-2xl text-brand-ink">Search unavailable</p>
            <p className="text-sm text-brand-muted mt-2">
              We couldn&apos;t reach our catalogue just now.
            </p>
            <button onClick={() => refetch()} className="btn-primary mt-6">
              Try again
            </button>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-display text-2xl text-brand-ink">No results found</p>
            <p className="text-sm text-brand-muted mt-2">
              Try a different search term or browse our categories.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
            {results.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  // useSearchParams requires a Suspense boundary in the app router.
  return (
    <Suspense fallback={<ProductGridSkeleton count={12} />}>
      <SearchResults />
    </Suspense>
  );
}
