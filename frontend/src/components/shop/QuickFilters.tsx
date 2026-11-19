'use client';

import { useId, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { transition } from '@/lib/motion';

interface Props {
  filters: { label: string; value: string }[];
  defaultActive?: string;
  onChange?: (value: string) => void;
}

/**
 * Horizontal filter chips. The active background is a single shared element
 * (`layoutId`) that glides between chips instead of each chip snapping on/off.
 */
export default function QuickFilters({ filters, defaultActive, onChange }: Props) {
  const [active, setActive] = useState(defaultActive ?? filters[0]?.value);
  // Unique per instance so two filter rows on one page don't share a pill.
  const pillId = useId();

  const handle = (v: string) => {
    setActive(v);
    onChange?.(v);
  };

  return (
    <div className="container-custom py-5">
      <div
        role="group"
        aria-label="Quick filters"
        className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1"
      >
        {filters.map((f) => {
          const isActive = active === f.value;
          return (
            <button
              key={f.value}
              aria-pressed={isActive}
              onClick={() => handle(f.value)}
              className={cn(
                'relative flex-none h-10 px-5 rounded-full text-xs font-medium tracking-wide',
                'transition-colors duration-base ease-premium active:scale-[0.97]',
                isActive
                  ? 'text-white'
                  : 'text-brand-ink bg-white ring-1 ring-inset ring-brand-line hover:ring-brand-gold hover:text-brand-maroon'
              )}
            >
              {isActive && (
                <motion.span
                  layoutId={`quick-filter-pill-${pillId}`}
                  className="absolute inset-0 rounded-full bg-brand-maroon shadow-btn-primary"
                  transition={transition.indicator}
                />
              )}
              <span className="relative">{f.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
