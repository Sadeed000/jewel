'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { transition } from '@/lib/motion';
import { FILTER_GROUPS, type FilterGroup } from '@/lib/filters';
import { startNavigationProgress } from '@/components/common/NavigationProgress';

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
 *
 * On mobile the panel collapses behind a "Filters" button so products are
 * visible without scrolling past every option.
 */

export default function FilterSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [open, setOpen] = useState<Record<string, boolean>>({
    Price: true,
    Category: true,
  });
  const [mobileOpen, setMobileOpen] = useState(false);

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
      startNavigationProgress();
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
      {/* Mobile toggle */}
      <button
        type="button"
        onClick={() => setMobileOpen((o) => !o)}
        aria-expanded={mobileOpen}
        aria-controls="filter-panel"
        className="md:hidden btn-outline w-full justify-between"
      >
        <span className="inline-flex items-center gap-2">
          <SlidersHorizontal size={16} /> Filters
          {activeCount > 0 && (
            <span className="rounded-full bg-brand-maroon px-2 py-0.5 text-[10px] text-white">{activeCount}</span>
          )}
        </span>
        <ChevronDown size={16} className={cn('transition-transform duration-base', mobileOpen && 'rotate-180')} />
      </button>

      <div
        id="filter-panel"
        className={cn(
          'md:sticky md:top-36 md:block',
          'grid transition-[grid-template-rows,opacity] duration-slow ease-premium md:!grid-rows-[1fr] md:!opacity-100',
          // `invisible` keeps the collapsed options out of the tab order on mobile.
          mobileOpen ? 'grid-rows-[1fr] opacity-100 mt-4 md:mt-0' : 'grid-rows-[0fr] opacity-0 invisible md:visible'
        )}
      >
        <div className="overflow-hidden md:overflow-visible">
          <div className="surface p-5">
            <div className="flex items-center justify-between pb-4 border-b border-brand-line">
              <h2 className="font-display text-xl text-brand-ink flex items-center gap-2">
                Filters
                <AnimatePresence>
                  {activeCount > 0 && (
                    <motion.span
                      key={activeCount}
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.6, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 600, damping: 20 }}
                      className="text-[11px] font-body font-semibold bg-brand-maroon text-white rounded-full px-2 py-0.5"
                    >
                      {activeCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </h2>
              <button
                onClick={clearAll}
                disabled={activeCount === 0}
                className="text-xs font-medium text-brand-maroon link-underline disabled:opacity-40 disabled:pointer-events-none"
              >
                Clear all
              </button>
            </div>

            {/* Scrolls internally so a long filter list can't stretch the page. */}
            <div className="md:max-h-[calc(100vh-16rem)] overflow-y-auto no-scrollbar">
              {FILTER_GROUPS.map((g) => {
                const groupSelected = selected[g.param] || [];
                const isOpen = !!open[g.name];
                return (
                  <div key={g.name} className="border-b border-brand-line last:border-0 py-4">
                    <button
                      onClick={() => setOpen((o) => ({ ...o, [g.name]: !o[g.name] }))}
                      className="w-full flex items-center justify-between text-sm font-medium text-brand-ink hover:text-brand-maroon transition-colors duration-base"
                      aria-expanded={isOpen}
                    >
                      <span>
                        {g.name}
                        {groupSelected.length > 0 && (
                          <span className="ml-2 text-xs text-brand-maroon">({groupSelected.length})</span>
                        )}
                      </span>
                      <ChevronDown
                        size={16}
                        className={cn('text-brand-gold-dark transition-transform duration-slow ease-premium', isOpen && 'rotate-180')}
                      />
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={transition.base}
                          className="overflow-hidden"
                        >
                          <div className="pt-3 space-y-1">
                            {g.options.map((opt) => {
                              const checked = groupSelected.includes(opt.value);
                              return (
                                <label
                                  key={opt.value}
                                  className={cn(
                                    'group flex items-center gap-3 rounded-control px-2 py-1.5 -mx-2 text-sm cursor-pointer',
                                    'transition-colors duration-fast hover:bg-brand-cream',
                                    checked ? 'text-brand-maroon font-medium' : 'text-brand-ink/80'
                                  )}
                                >
                                  <input
                                    type={g.single ? 'radio' : 'checkbox'}
                                    name={g.single ? g.param : undefined}
                                    checked={checked}
                                    onChange={() => toggle(g, opt.value)}
                                    className="peer sr-only"
                                  />
                                  {/* Custom control — the real input stays for a11y. */}
                                  <span
                                    aria-hidden="true"
                                    className={cn(
                                      'grid h-[18px] w-[18px] flex-none place-items-center border transition-[background-color,border-color,box-shadow] duration-fast',
                                      g.single ? 'rounded-full' : 'rounded-[5px]',
                                      'peer-focus-visible:ring-2 peer-focus-visible:ring-brand-gold peer-focus-visible:ring-offset-1',
                                      checked
                                        ? 'border-brand-maroon bg-brand-maroon text-white'
                                        : 'border-brand-line bg-white group-hover:border-brand-gold'
                                    )}
                                  >
                                    {checked &&
                                      (g.single ? (
                                        <span className="h-1.5 w-1.5 rounded-full bg-white" />
                                      ) : (
                                        <Check size={12} strokeWidth={3} />
                                      ))}
                                  </span>
                                  {opt.label}
                                </label>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
