'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';

/**
 * Sort control. Writes to the URL so it composes with the filters, which
 * live there too. Values are Mongo sort expressions the products API accepts
 * directly (see backend/utils/pagination.js).
 */
const SORT_OPTIONS = [
  { label: 'Sort by: Recommended', value: '' },
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
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  return (
    <select
      value={current}
      onChange={(e) => handleChange(e.target.value)}
      aria-label="Sort products"
      className="text-sm border border-brand-cream-dark rounded-full px-4 py-2 outline-none focus:border-brand-gold bg-white"
    >
      {SORT_OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
