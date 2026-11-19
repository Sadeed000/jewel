'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const stones = [
  { key: 'emerald', label: 'Emerald', color: '#0a6e54', image: 'https://res.cloudinary.com/dnsulnx1r/image/upload/v1795009707/ratnapankh/library/photo-1611591437281-460bfbe1220a.jpg' },
  { key: 'ruby', label: 'Ruby', color: '#a01a3a', image: 'https://res.cloudinary.com/dnsulnx1r/image/upload/v1795009705/ratnapankh/library/photo-1605100804763-247f67b3557e.jpg' },
  { key: 'sapphire', label: 'Sapphire', color: '#1e3a8a', image: 'https://res.cloudinary.com/dnsulnx1r/image/upload/v1795009725/ratnapankh/library/photo-1573408301185-9146fe634ad0.jpg' },
  { key: 'tanzanite', label: 'Tanzanite', color: '#5d3fd3', image: 'https://res.cloudinary.com/dnsulnx1r/image/upload/v1795007337/ratnapankh/heroes/gemstone-emerald-necklace-navy.jpg' },
  { key: 'pearl', label: 'Pearl', color: '#e8e2d4', image: 'https://res.cloudinary.com/dnsulnx1r/image/upload/v1795007344/ratnapankh/heroes/earrings-sapphire-drops.jpg' },
  { key: 'coral', label: 'Coral', color: '#e07856', image: 'https://res.cloudinary.com/dnsulnx1r/image/upload/v1795009724/ratnapankh/library/photo-1602173574767-37ac01994b2a.jpg' },
];

export default function GemstonePalette() {
  const [active, setActive] = useState(0);
  const stone = stones[active];

  return (
    <section className="relative py-20 bg-gradient-to-b from-emerald-50/40 via-white to-emerald-50/30 overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 200 200%22><circle cx=%22100%22 cy=%22100%22 r=%2280%22 fill=%22none%22 stroke=%22%23d5aa72%22 stroke-width=%220.5%22 opacity=%220.15%22/></svg>')] bg-[length:300px_300px] opacity-50 pointer-events-none" />

      <div className="container-custom relative">
        <div className="text-center mb-10">
          <h2 className="font-display text-3xl md:text-4xl text-brand-ink">The Gemstone Palette</h2>
        </div>

        {/* Stone selector */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex items-center gap-2 bg-white rounded-full px-3 py-2 shadow-sm border border-brand-cream-dark">
            {stones.map((s, i) => (
              <button
                key={s.key}
                onClick={() => setActive(i)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  active === i ? 'bg-brand-cream text-brand-maroon' : 'text-brand-muted hover:text-brand-ink'
                }`}
              >
                <span className="w-3 h-3 rounded-full ring-1 ring-black/10" style={{ background: s.color }} />
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Showcase */}
        <div className="relative max-w-5xl mx-auto">
          <button
            onClick={() => setActive((a) => (a - 1 + stones.length) % stones.length)}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-md grid place-items-center hover:bg-brand-cream transition-colors"
            aria-label="Previous"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => setActive((a) => (a + 1) % stones.length)}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-md grid place-items-center hover:bg-brand-cream transition-colors"
            aria-label="Next"
          >
            <ChevronRight size={18} />
          </button>

          <div className="grid grid-cols-3 gap-4 md:gap-8 px-12">
            {[(active - 1 + stones.length) % stones.length, active, (active + 1) % stones.length].map((idx, pos) => {
              const s = stones[idx];
              const isCenter = pos === 1;
              return (
                <div
                  key={`${idx}-${pos}`}
                  className={`relative bg-white rounded-2xl overflow-hidden shadow-sm border border-brand-cream-dark transition-all ${
                    isCenter ? 'scale-100 md:scale-110 z-10' : 'scale-90 opacity-80'
                  }`}
                >
                  <div className="relative aspect-[3/4]">
                    <Image src={s.image} alt={s.label} fill className="object-cover" sizes="33vw" />
                  </div>
                  {isCenter && (
                    <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur rounded-md px-3 py-2">
                      <p className="text-[10px] tracking-widest uppercase text-brand-gold-dark">Featured</p>
                      <p className="text-xs font-medium text-brand-ink truncate">Bloom Symphony Gold Necklace</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="text-center mt-10">
          <Link
            href={`/gemstone?stone=${stone.key}`}
            className="inline-block px-8 py-3 border-2 border-brand-maroon text-brand-maroon text-xs font-semibold tracking-widest uppercase rounded-sm hover:bg-brand-maroon hover:text-white transition-colors"
          >
            Explore Gemstone
          </Link>
        </div>
      </div>
    </section>
  );
}
