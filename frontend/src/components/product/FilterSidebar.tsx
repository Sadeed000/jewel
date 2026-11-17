'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FILTER_GROUPS, type FilterGroup } from '@/lib/filters';

// Re-exported for existing importers; the definitions live in lib/filters so
// server components can use them too.
export { FILTER_GROUPS, searchParamsToFilters } from '@/lib/filters';

/**
 * Product filters.
 *
 * State lives in the URL query string rather than component state, so filters
 * survive a refresh, are shareable, and work with the back button. The product
 * list reads the same params, which keeps the two in sync without prop
 * drilling or a context.
 *
 * Every option maps onto a real API parameter (see backend/services/
 * productService.js). Options the API can't filter on are deliberately absent
 * rather than rendered as controls that quietly do nothing.
 */

export default function FilterSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [open, setOpen] = useState<Record<string, boolean>>({
    Price: true,
    Category: true,
  });

  /** Currently-checked values, keyed by param. */
  const selected = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const group of FILTER_GROUPS) {
      const raw = searchParams.get(group.param);
      map[group.param] = raw ? raw.split(',') : [];
    }
    return map;
  }, [searchParams]);

  const activeCount = useMemo(
    () => Object.values(selected).reduce((n, list) => n + list.length, 0),
    [selected]
  );

  const applyParams = useCallback(
    (next: URLSearchParams) => {
      // Any filter change invalidates the current page number.
      next.delete('page');
      const qs = next.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname]
  );

  const toggle = useCallback(
    (group: FilterGroup, value: string) => {
      const next = new URLSearchParams(searchParams.toString());
      const current = selected[group.param] || [];

      if (group.single) {
        // Radio-like, but clicking the active option clears it.
        if (current.includes(value)) next.delete(group.param);
        else next.set(group.param, value);
      } else {
        const updated = current.includes(value)
          ? current.filter((v) => v !== value)
          : [...current, value];
        if (updated.length) next.set(group.param, updated.join(','));
        else next.delete(group.param);
      }

      applyParams(next);
    },
    [searchParams, selected, applyParams]
  );

  const clearAll = useCallback(() => {
    const next = new URLSearchParams(searchParams.toString());
    FILTER_GROUPS.forEach((g) => next.delete(g.param));
    applyParams(next);
  }, [searchParams, applyParams]);

  return (
    <aside className="w-full md:w-64 lg:w-72 flex-none">
      <div className="sticky top-32">
        <div className="flex items-center justify-between pb-4 border-b border-brand-cream-dark">
          <h2 className="font-display text-xl text-brand-ink">
            Filters
            {activeCount > 0 && (
              <span className="ml-2 text-xs align-middle bg-brand-maroon text-white rounded-full px-2 py-0.5">
                {activeCount}
              </span>
            )}
          </h2>
          <button
            onClick={clearAll}
            disabled={activeCount === 0}
            className="text-xs text-brand-maroon hover:underline disabled:opacity-40 disabled:no-underline"
          >
            Clear All
          </button>
        </div>

        {/* Scrolls internally so a long filter list can't stretch the page. */}
        <div className="max-h-[calc(100vh-14rem)] overflow-y-auto no-scrollbar">
          {FILTER_GROUPS.map((g) => {
            const groupSelected = selected[g.param] || [];
            return (
              <div key={g.name} className="border-b border-brand-cream-dark py-4">
                <button
                  onClick={() => setOpen((o) => ({ ...o, [g.name]: !o[g.name] }))}
                  className="w-full flex items-center justify-between text-sm font-medium text-brand-ink"
                  aria-expanded={!!open[g.name]}
                >
                  <span>
                    {g.name}
                    {groupSelected.length > 0 && (
                      <span className="ml-2 text-xs text-brand-maroon">({groupSelected.length})</span>
                    )}
                  </span>
                  <ChevronDown
                    size={16}
                    className={cn('transition-transform', open[g.name] && 'rotate-180')}
                  />
                </button>

                {open[g.name] && (
                  <div className="mt-3 space-y-2">
                    {g.options.map((opt) => {
                      const checked = groupSelected.includes(opt.value);
                      return (
                        <label
                          key={opt.value}
                          className={cn(
                            'flex items-center gap-2 text-sm cursor-pointer transition-colors',
                            checked
                              ? 'text-brand-maroon font-medium'
                              : 'text-brand-ink/80 hover:text-brand-maroon'
                          )}
                        >
                          <input
                            type={g.single ? 'radio' : 'checkbox'}
                            name={g.single ? g.param : undefined}
                            checked={checked}
                            onChange={() => toggle(g, opt.value)}
                            className="accent-brand-maroon w-3.5 h-3.5"
                          />
                          {opt.label}
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
