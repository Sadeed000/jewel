'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import VirtualTryOn, { type TryOnProduct } from '@/components/tryon/VirtualTryOn';
import { getTryOnConfig } from '@/lib/tryOn';
import { ProductGridSkeleton, EmptyState } from '@/components/common/Loading';
import { formatPrice, productImageUrl, cn } from '@/lib/utils';

/**
 * Try-on picker: choose a category, pick a piece, open the camera.
 *
 * Products come from the live catalogue, so anything merchandising adds is
 * immediately try-on-able without a code change.
 */

const CATEGORIES = [
  { label: 'Rings', type: 'rings' },
  { label: 'Earrings', type: 'earrings' },
  { label: 'Pendants', type: 'pendants' },
  { label: 'Necklaces', type: 'necklaces' },
  { label: 'Mangalsutra', type: 'mangalsutra' },
  { label: 'Chains', type: 'chains' },
  { label: 'Bracelets', type: 'bracelets' },
  { label: 'Bangles', type: 'bangles' },
];

export default function TryOnGallery() {
  const [type, setType] = useState('rings');
  const [active, setActive] = useState<TryOnProduct | null>(null);

  const { data, isLoading, isError, refetch } = useProducts({ type, limit: 12, inStock: true });
  const items = data?.items ?? [];

  const config = useMemo(() => getTryOnConfig(type), [type]);

  return (
    <div className="container-custom py-14">
      <div className="text-center mb-8">
        <h2 className="font-display text-3xl text-brand-ink">Pick a piece to try</h2>
        {config && <p className="text-sm text-brand-muted mt-2">{config.hint}</p>}
      </div>

      {/* Category pills — same treatment as QuickFilters elsewhere. */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-8 justify-start md:justify-center">
        {CATEGORIES.map((c) => (
          <button
            key={c.type}
            onClick={() => setType(c.type)}
            className={cn(
              'flex-none px-5 py-2 rounded-full text-xs font-medium tracking-wide transition-all border',
              type === c.type
                ? 'bg-brand-maroon text-white border-brand-maroon shadow-sm'
                : 'bg-white text-brand-ink border-brand-cream-dark hover:border-brand-maroon hover:text-brand-maroon'
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <ProductGridSkeleton count={8} />
      ) : isError ? (
        <EmptyState
          title="Couldn't load pieces"
          description="Something went wrong reaching our catalogue."
          action={
            <button onClick={() => refetch()} className="btn-primary">
              Retry
            </button>
          }
        />
      ) : items.length === 0 ? (
        <EmptyState
          title="Nothing to try on here yet"
          description="We don't have any in-stock pieces in this category right now."
          action={
            <Link href="/jewellery" className="btn-primary">
              Browse all jewellery
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
          {items.map((p) => (
            <div key={p._id} className="group">
              <button
                onClick={() => setActive(p)}
                className="w-full text-left"
                aria-label={`Try on ${p.name}`}
              >
                <div className="relative aspect-square bg-brand-cream rounded-lg overflow-hidden">
                  <Image
                    src={productImageUrl(p)}
                    alt={p.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-brand-ink/0 group-hover:bg-brand-ink/30 transition-colors grid place-items-center">
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-white text-brand-maroon text-xs font-semibold px-4 py-2 rounded-full inline-flex items-center gap-1.5">
                      <Sparkles size={13} /> Try It On
                    </span>
                  </div>
                </div>
                <h3 className="text-sm text-brand-ink line-clamp-1 mt-3">{p.name}</h3>
                <p className="text-sm font-medium text-brand-ink mt-1">{formatPrice(p.price)}</p>
              </button>
              <Link
                href={`/product/${p.slug}`}
                className="text-xs text-brand-muted hover:text-brand-maroon mt-1 inline-block"
              >
                View details →
              </Link>
            </div>
          ))}
        </div>
      )}

      {active && <VirtualTryOn product={active} onClose={() => setActive(null)} />}
    </div>
  );
}
