'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { startNavigationProgress } from '@/components/common/NavigationProgress';

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
    startNavigationProgress();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: true });
  };

  // Window of at most 5 page numbers centred on the current page.
  const windowSize = Math.min(5, pages);
  let start = Math.max(1, page - Math.floor(windowSize / 2));
  const end = Math.min(pages, start + windowSize - 1);
  start = Math.max(1, end - windowSize + 1);

  const numbers = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  const numberClass = (current: boolean) =>
    cn(
      'w-10 h-10 rounded-full text-sm tabular-nums transition-[background-color,color,box-shadow,transform] duration-base ease-premium active:scale-90',
      current
        ? 'bg-brand-maroon text-white shadow-btn-primary'
        : 'text-brand-ink hover:bg-white hover:shadow-soft'
    );

  return (
    <nav className="flex items-center justify-center gap-1.5 mt-14 flex-wrap" aria-label="Pagination">
      <button
        onClick={() => goTo(page - 1)}
        disabled={!hasPrev}
        className="btn-outline btn-sm h-10 pl-3 pr-4 mr-2"
      >
        <ChevronLeft size={16} /> Prev
      </button>

      {start > 1 && (
        <>
          <button onClick={() => goTo(1)} className={numberClass(false)} aria-label="Page 1">
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
          aria-label={`Page ${n}`}
          className={numberClass(n === page)}
        >
          {n}
        </button>
      ))}

      {end < pages && (
        <>
          {end < pages - 1 && <span className="text-brand-muted px-1">…</span>}
          <button onClick={() => goTo(pages)} className={numberClass(false)} aria-label={`Page ${pages}`}>
            {pages}
          </button>
        </>
      )}

      <button
        onClick={() => goTo(page + 1)}
        disabled={!hasNext}
        className="btn-outline btn-sm h-10 pl-4 pr-3 ml-2"
      >
        Next <ChevronRight size={16} />
      </button>
    </nav>
  );
}
