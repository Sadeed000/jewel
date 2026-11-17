'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Occasion {
  key: string;
  label: string;
  modelImage: string;
  productImages: string[];
  title: string;
  copy: string;
}

interface Props {
  occasions: Occasion[];
  heading?: string;
}

export default function ShopByOccasion({ occasions, heading = 'Shop by Occasion' }: Props) {
  const [active, setActive] = useState(0);
  const occ = occasions[active];

  return (
    <section className="container-custom py-14">
      <h2 className="text-center font-display text-3xl md:text-4xl text-brand-ink mb-10">{heading}</h2>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-7">
        {/* Model image */}
        <div className="md:col-span-5 relative aspect-[3/4] rounded-lg overflow-hidden">
          <Image src={occ.modelImage} alt={occ.label} fill className="object-cover" sizes="(max-width: 768px) 100vw, 40vw" />
        </div>

        {/* Center content card */}
        <div className="md:col-span-4 bg-white border border-brand-cream-dark rounded-lg p-6 md:p-8 flex flex-col justify-between relative">
          <div>
            <h3 className="font-display text-2xl md:text-3xl text-brand-ink">{occ.title}</h3>
            <p className="text-sm text-brand-muted mt-3 leading-relaxed italic">{occ.copy}</p>

            <p className="mt-6 text-[10px] tracking-widest uppercase text-brand-gold-dark">Explore Pieces</p>
            <div className="flex gap-3 mt-3">
              {occ.productImages.slice(0, 3).map((img, i) => (
                <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden bg-brand-cream border border-brand-cream-dark">
                  <Image src={img} alt="" fill className="object-cover" sizes="64px" />
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between mt-6 pt-6 border-t border-brand-cream-dark">
            <div className="flex flex-wrap gap-1.5">
              {occasions.map((o, i) => (
                <button
                  key={o.key}
                  onClick={() => setActive(i)}
                  className={`text-[10px] px-2.5 py-1 rounded-full transition-colors ${
                    i === active ? 'bg-brand-maroon text-white' : 'bg-brand-cream text-brand-muted hover:text-brand-ink'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={() => setActive((a) => (a - 1 + occasions.length) % occasions.length)}
                className="w-7 h-7 rounded-full border border-brand-cream-dark grid place-items-center hover:border-brand-maroon transition-colors"
                aria-label="Previous"
              >
                <ChevronLeft size={12} />
              </button>
              <button
                onClick={() => setActive((a) => (a + 1) % occasions.length)}
                className="w-7 h-7 rounded-full border border-brand-cream-dark grid place-items-center hover:border-brand-maroon transition-colors"
                aria-label="Next"
              >
                <ChevronRight size={12} />
              </button>
            </div>
          </div>
        </div>

        {/* Right tall image */}
        <div className="md:col-span-3 relative aspect-[3/4] rounded-lg overflow-hidden">
          <Image src={occ.productImages[0] ?? occ.modelImage} alt="" fill className="object-cover" sizes="(max-width: 768px) 100vw, 25vw" />
        </div>
      </div>
    </section>
  );
}
