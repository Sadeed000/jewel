'use client';

import { useState } from 'react';

interface Props {
  filters: { label: string; value: string }[];
  defaultActive?: string;
  onChange?: (value: string) => void;
}

export default function QuickFilters({ filters, defaultActive, onChange }: Props) {
  const [active, setActive] = useState(defaultActive ?? filters[0]?.value);

  const handle = (v: string) => {
    setActive(v);
    onChange?.(v);
  };

  return (
    <div className="container-custom py-4">
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => handle(f.value)}
            className={`flex-none px-5 py-2 rounded-full text-xs font-medium tracking-wide transition-all border ${
              active === f.value
                ? 'bg-brand-maroon text-white border-brand-maroon shadow-sm'
                : 'bg-white text-brand-ink border-brand-cream-dark hover:border-brand-maroon hover:text-brand-maroon'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}
