'use client';

import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from '@/components/product/ProductCard';
import type { Product } from '@/lib/types';

export default function ProductCarousel({ title, subtitle, products }: { title: string; subtitle?: string; products: Product[] }) {
  const ref = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    if (!ref.current) return;
    const w = ref.current.clientWidth;
    ref.current.scrollBy({ left: dir === 'left' ? -w : w, behavior: 'smooth' });
  };

  return (
    <section className="container-custom py-12">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h2 className="font-display text-3xl md:text-4xl text-brand-ink">{title}</h2>
          {subtitle && <p className="text-sm text-brand-muted mt-1">{subtitle}</p>}
        </div>
        <div className="hidden md:flex gap-2">
          <button
            onClick={() => scroll('left')}
            className="w-10 h-10 rounded-full border border-brand-cream-dark grid place-items-center hover:bg-brand-maroon hover:text-white hover:border-brand-maroon transition-colors"
            aria-label="Scroll left"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => scroll('right')}
            className="w-10 h-10 rounded-full border border-brand-cream-dark grid place-items-center hover:bg-brand-maroon hover:text-white hover:border-brand-maroon transition-colors"
            aria-label="Scroll right"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div
        ref={ref}
        className="flex gap-4 md:gap-5 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-2"
      >
        {products.map((p) => (
          <div key={p._id} className="flex-none w-[60%] sm:w-[40%] md:w-[28%] lg:w-[22%] snap-start">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  );
}
