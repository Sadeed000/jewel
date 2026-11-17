'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useBanners } from '@/hooks/useSettings';
import type { Banner } from '@/lib/types';

/**
 * Static fallback used while banners load and as a graceful degradation
 * when the backend is unreachable. Keeps the page visually intact even
 * during cold starts.
 */
const fallbackSlides: Banner[] = [
  {
    _id: 'fallback-1',
    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=1800&h=600&fit=crop',
    eyebrow: 'A TATA Heritage',
    title: "Your old gold,\nIndia's new strength.",
    subtitle: 'Help India reduce gold imports by exchanging your old gold for new jewellery with Aurelia.',
    ctaLabel: 'Explore Now',
    ctaHref: '/exchange',
    placement: 'home-hero',
    align: 'left',
  },
  {
    _id: 'fallback-2',
    image: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=1800&h=600&fit=crop',
    eyebrow: 'New Collection',
    title: 'A Celebration of\nNatural Gemstones',
    subtitle: 'Tanzanite, Pearl, Cabochon and more — discover hues that tell your story.',
    ctaLabel: 'Explore Collection',
    ctaHref: '/gemstone',
    placement: 'home-hero',
    align: 'left',
  },
  {
    _id: 'fallback-3',
    image: 'https://images.unsplash.com/photo-1583292650898-7d22cd27ca6f?w=1800&h=600&fit=crop',
    eyebrow: 'Bridal',
    title: 'Rivaah —\nThe Wedding Edit',
    subtitle: 'Heirlooms in the making for your most precious day.',
    ctaLabel: 'Shop Bridal',
    ctaHref: '/wedding',
    placement: 'home-hero',
    align: 'left',
  },
];

export default function HeroCarousel() {
  const { data: banners } = useBanners('home-hero');
  // Use fetched banners when available; fall back to static otherwise so
  // the carousel always has slides to show. Identical visual output.
  const slides = banners && banners.length > 0 ? banners : fallbackSlides;

  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(() => setCurrent((c) => (c + 1) % slides.length), 6000);
    return () => clearInterval(t);
  }, [slides.length]);

  useEffect(() => {
    if (current >= slides.length) setCurrent(0);
  }, [slides.length, current]);

  return (
    <section className="relative w-full h-[280px] md:h-[420px] lg:h-[520px] overflow-hidden bg-brand-cream-dark">
      {slides.map((slide, i) => (
        <div
          key={slide._id}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            i === current ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <Image
            src={slide.image}
            alt={slide.title}
            fill
            priority={i === 0}
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
          <div className="container-custom relative h-full flex items-center">
            <div className="max-w-xl text-white">
              {slide.eyebrow && (
                <p className="text-xs tracking-[0.3em] uppercase opacity-90 mb-3 script-italic font-display text-base normal-case">
                  {slide.eyebrow}
                </p>
              )}
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl leading-tight whitespace-pre-line">
                {slide.title}
              </h1>
              {slide.subtitle && <p className="mt-4 text-sm md:text-base opacity-90 max-w-md">{slide.subtitle}</p>}
              {slide.ctaLabel && (
                <Link
                  href={slide.ctaHref || '#'}
                  className="inline-block mt-6 px-7 py-3 bg-brand-gold text-brand-maroon-dark text-sm font-semibold rounded-sm tracking-wider uppercase hover:bg-brand-gold-light transition-colors"
                >
                  {slide.ctaLabel}
                </Link>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Controls */}
      <button
        onClick={() => setCurrent((c) => (c - 1 + slides.length) % slides.length)}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur grid place-items-center text-white hover:bg-white/40 transition-colors"
        aria-label="Previous"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        onClick={() => setCurrent((c) => (c + 1) % slides.length)}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur grid place-items-center text-white hover:bg-white/40 transition-colors"
        aria-label="Next"
      >
        <ChevronRight size={20} />
      </button>

      {/* Dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-1.5 rounded-full transition-all ${
              i === current ? 'w-8 bg-brand-gold' : 'w-2 bg-white/60'
            }`}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
