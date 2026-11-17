'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const promises = [
  { icon: '◉', title: '100% Natural Origin', desc: 'Every gem is sourced from its true place of origin, untreated and authentic.' },
  { icon: '✓', title: 'Exceptional Stone Selection', desc: 'Hand-picked by expert gemologists for clarity, colour, and character.' },
  { icon: '✦', title: 'Sourced with Expertise', desc: 'Decades of experience guide every selection we make.' },
  { icon: '◆', title: 'Crafted for Lasting Beauty', desc: 'Master karigars finish each piece with timeless precision.' },
  { icon: '⟳', title: '100% Exchange Value', desc: 'Trade your piece anytime for full credit toward something new.' },
  { icon: '⚙', title: 'Lifetime Maintenance', desc: 'Polish, plating, and care — for as long as you own the piece.' },
];

interface Props {
  title?: string;
}

export default function BrandPromises({ title = 'Aurelia Gemstone Promises' }: Props) {
  const [start, setStart] = useState(0);
  const visible = 4;
  const max = Math.max(0, promises.length - visible);

  return (
    <section className="bg-gradient-to-br from-brand-cream via-white to-brand-cream py-14 my-12">
      <div className="container-custom">
        <h2 className="text-center font-display text-2xl md:text-3xl text-brand-ink mb-10">{title}</h2>

        <div className="relative">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10">
            {promises.slice(start, start + visible).map((p) => (
              <div key={p.title} className="text-center">
                <div className="mx-auto w-14 h-14 rounded-full bg-white border border-brand-gold-light/60 grid place-items-center text-2xl text-brand-maroon shadow-sm mb-3">
                  {p.icon}
                </div>
                <p className="font-medium text-sm text-brand-ink">{p.title}</p>
                <p className="text-xs text-brand-muted mt-1.5 hidden md:block">{p.desc}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-3 mt-8">
            <button
              onClick={() => setStart(Math.max(0, start - 1))}
              disabled={start === 0}
              className="w-9 h-9 rounded-full border border-brand-cream-dark grid place-items-center hover:border-brand-maroon disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous promise"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setStart(Math.min(max, start + 1))}
              disabled={start >= max}
              className="w-9 h-9 rounded-full border border-brand-cream-dark grid place-items-center hover:border-brand-maroon disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Next promise"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
