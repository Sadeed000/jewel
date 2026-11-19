'use client';

import { useId, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { transition } from '@/lib/motion';

export interface ProductTab {
  key: string;
  label: string;
  content: React.ReactNode;
}

/**
 * Accessible tabs (WAI-ARIA tab pattern, arrow-key navigation) with an
 * underline that glides between tabs and a short cross-fade for content.
 */
export default function ProductTabs({ tabs }: { tabs: ProductTab[] }) {
  const [active, setActive] = useState(tabs[0]?.key);
  const id = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const focusTab = (i: number) => {
    const next = (i + tabs.length) % tabs.length;
    setActive(tabs[next].key);
    tabRefs.current[next]?.focus();
  };

  const current = tabs.find((t) => t.key === active) ?? tabs[0];

  return (
    <div>
      <div role="tablist" aria-label="Product information" className="flex gap-1 border-b border-brand-line overflow-x-auto no-scrollbar">
        {tabs.map((tab, i) => {
          const selected = tab.key === active;
          return (
            <button
              key={tab.key}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              role="tab"
              id={`${id}-tab-${tab.key}`}
              aria-selected={selected}
              aria-controls={`${id}-panel`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(tab.key)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight') focusTab(i + 1);
                if (e.key === 'ArrowLeft') focusTab(i - 1);
              }}
              className={cn(
                'relative flex-none px-4 py-3.5 text-sm font-medium tracking-wide transition-colors duration-base',
                selected ? 'text-brand-maroon' : 'text-brand-muted hover:text-brand-ink'
              )}
            >
              {tab.label}
              {selected && (
                <motion.span
                  layoutId={`${id}-tab-underline`}
                  className="absolute inset-x-2 -bottom-px h-[2px] rounded-full bg-brand-maroon"
                  transition={transition.indicator}
                />
              )}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`${id}-panel`}
        aria-labelledby={`${id}-tab-${current.key}`}
        className="relative pt-5"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={current.key}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={transition.base}
            className="text-sm leading-relaxed text-brand-muted"
          >
            {current.content}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
