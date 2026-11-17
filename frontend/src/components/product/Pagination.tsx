'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

/**
 * Page navigation driven by the `page` URL param, so it composes with the
 * filters and sort control.
 *
 * Renders a windowed range rather than every page — a 40-page catalogue
 * shouldn't produce 40 buttons.
 */
export default function Pagination({
  page,
  pages,
  hasPrev,
  hasNext,
}: {
  page: number;
  pages: number;
  hasPrev: boolean;
  hasNext: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Nothing to navigate.
  if (pages <= 1) return null;

  const goTo = (target: number) => {
    const next = new URLSearchParams(searchParams.toString());
    if (target <= 1) next.delete('page');
    else next.set('page', String(target));
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: true });
  };

  // Window of at most 5 page numbers centred on the current page.
  const windowSize = Math.min(5, pages);
  let start = Math.max(1, page - Math.floor(windowSize / 2));
  const end = Math.min(pages, start + windowSize - 1);
  start = Math.max(1, end - windowSize + 1);

  const numbers = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  return (
    <nav
      className="flex items-center justify-center gap-2 mt-12 flex-wrap"
      aria-label="Pagination"
    >
      <button
        onClick={() => goTo(page - 1)}
        disabled={!hasPrev}
        className="px-4 h-9 rounded-full border border-brand-cream-dark text-sm hover:bg-brand-cream disabled:opacity-40 disabled:hover:bg-transparent"
      >
        ← Prev
      </button>

      {start > 1 && (
        <>
          <button
            onClick={() => goTo(1)}
            className="w-9 h-9 rounded-full text-sm border border-brand-cream-dark hover:bg-brand-cream"
          >
            1
          </button>
          {start > 2 && <span className="text-brand-muted px-1">…</span>}
        </>
      )}

      {numbers.map((n) => (
        <button
          key={n}
          onClick={() => goTo(n)}
          aria-current={n === page ? 'page' : undefined}
          className={cn(
            'w-9 h-9 rounded-full text-sm transition-colors',
            n === page
              ? 'bg-brand-maroon text-white'
              : 'border border-brand-cream-dark hover:bg-brand-cream'
          )}
        >
          {n}
        </button>
      ))}

      {end < pages && (
        <>
          {end < pages - 1 && <span className="text-brand-muted px-1">…</span>}
          <button
            onClick={() => goTo(pages)}
            className="w-9 h-9 rounded-full text-sm border border-brand-cream-dark hover:bg-brand-cream"
          >
            {pages}
          </button>
        </>
      )}

      <button
        onClick={() => goTo(page + 1)}
        disabled={!hasNext}
        className="px-4 h-9 rounded-full border border-brand-cream-dark text-sm hover:bg-brand-cream disabled:opacity-40 disabled:hover:bg-transparent"
      >
        Next →
      </button>
    </nav>
  );
}
