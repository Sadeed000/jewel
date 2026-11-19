'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import { startNavigationProgress } from '@/components/common/NavigationProgress';

/**
 * Sort control. Writes to the URL so it composes with the filters, which
 * live there too. Values are Mongo sort expressions the products API accepts
 * directly (see backend/utils/pagination.js).
 */
const SORT_OPTIONS = [
  { label: 'Recommended', value: '' },
  { label: 'Newest', value: '-createdAt' },
  { label: 'Price: Low to High', value: 'price' },
  { label: 'Price: High to Low', value: '-price' },
  { label: 'Name: A to Z', value: 'name' },
];

export default function SortSelect() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get('sort') ?? '';

  const handleChange = (value: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set('sort', value);
    else next.delete('sort');
    // Re-sorting invalidates the current page.
    next.delete('page');
    const qs = next.toString();
    startNavigationProgress();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  return (
    // Native <select> kept for accessibility and mobile pickers; restyled.
    <label className="relative inline-flex items-center">
      <span className="sr-only">Sort products</span>
      <span className="pointer-events-none absolute left-4 text-xs text-brand-muted">Sort:</span>
      <select
        value={current}
        onChange={(e) => handleChange(e.target.value)}
        className="h-10 appearance-none rounded-full border border-brand-line bg-white pl-12 pr-10 text-sm font-medium text-brand-ink shadow-xs outline-none transition-[border-color,box-shadow] duration-base ease-premium hover:border-brand-gold focus:border-brand-gold focus:ring-4 focus:ring-brand-gold/15 cursor-pointer"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown size={16} className="pointer-events-none absolute right-4 text-brand-muted" />
    </label>
  );
}
