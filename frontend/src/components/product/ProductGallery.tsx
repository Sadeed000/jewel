'use client';

import { useCallback, useRef, useState, type ReactNode } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion, type PanInfo } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DURATION, EASE_PREMIUM, transition } from '@/lib/motion';

/**
 * Product image gallery.
 *
 * - Images cross-fade with a slight directional slide (300ms).
 * - Desktop: hovering zooms in towards the cursor so buyers can inspect
 *   settings and finish; thumbnails sit in a rail with a gliding indicator.
 * - Mobile: swipe left/right, with dot indicators and a thumbnail strip.
 * - Keyboard: ← / → when the frame is focused.
 *
 * The frame has a fixed aspect ratio, so swapping images never shifts layout.
 */
export default function ProductGallery({
  images,
  alt,
  overlay,
}: {
  images: string[];
  alt: string;
  /** Badges / wishlist button rendered over the main image. */
  overlay?: ReactNode;
}) {
  const [[index, direction], setIndex] = useState<[number, number]>([0, 0]);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const count = images.length;
  const active = images[index] ?? images[0];

  const go = useCallback(
    (next: number) => {
      const wrapped = (next + count) % count;
      setIndex(([current]) => [wrapped, wrapped > current ? 1 : -1]);
    },
    [count]
  );

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const swipe = info.offset.x + info.velocity.x * 0.2;
    if (swipe < -60) go(index + 1);
    else if (swipe > 60) go(index - 1);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // Only zoom with a real hover-capable pointer.
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const rect = frameRef.current?.getBoundingClientRect();
    if (!rect) return;
    setZoom({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  return (
    <div className="flex gap-4">
      {/* Desktop thumbnail rail */}
      {count > 1 && (
        <div className="hidden md:flex flex-col gap-3 flex-none" role="tablist" aria-label="Product images">
          {images.map((img, i) => (
            <button
              key={img + i}
              role="tab"
              aria-selected={index === i}
              onClick={() => setIndex([i, i > index ? 1 : -1])}
              aria-label={`View image ${i + 1} of ${count}`}
              className={cn(
                'relative w-20 h-20 rounded-control overflow-hidden transition-[opacity,transform] duration-base ease-premium',
                index === i ? 'opacity-100' : 'opacity-60 hover:opacity-100 hover:-translate-y-0.5'
              )}
            >
              <Image src={img} alt="" fill className="object-cover" sizes="80px" />
              <span className="absolute inset-0 rounded-control ring-1 ring-inset ring-brand-line" />
              {index === i && (
                <motion.span
                  layoutId="gallery-thumb-ring"
                  className="absolute inset-0 rounded-control ring-2 ring-inset ring-brand-maroon"
                  transition={transition.indicator}
                />
              )}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div
          ref={frameRef}
          tabIndex={0}
          role="region"
          aria-roledescription="carousel"
          aria-label={`${alt} images`}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight') go(index + 1);
            if (e.key === 'ArrowLeft') go(index - 1);
          }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setZoom(null)}
          className="group relative w-full max-w-[560px] aspect-square overflow-hidden rounded-panel bg-white ring-1 ring-brand-line shadow-soft cursor-zoom-in focus-visible:ring-2 focus-visible:ring-brand-gold"
        >
          <AnimatePresence initial={false} custom={direction} mode="popLayout">
            <motion.div
              key={active}
              custom={direction}
              className="absolute inset-0"
              variants={{
                enter: (d: number) => ({ opacity: 0, x: d * 24 }),
                center: { opacity: 1, x: 0 },
                exit: (d: number) => ({ opacity: 0, x: d * -24 }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: DURATION.slow, ease: EASE_PREMIUM }}
              drag={count > 1 ? 'x' : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={handleDragEnd}
            >
              <Image
                src={active}
                alt={`${alt}${count > 1 ? ` — image ${index + 1} of ${count}` : ''}`}
                fill
                priority={index === 0}
                // Higher than the default 75 so settings, facets and
                // engraving survive compression; still served as AVIF/WebP.
                quality={85}
                draggable={false}
                className="object-cover select-none transition-transform duration-slow ease-premium"
                style={
                  zoom
                    ? { transform: 'scale(1.8)', transformOrigin: `${zoom.x}% ${zoom.y}%` }
                    : { transform: 'scale(1)' }
                }
                // Mobile: full width minus the container gutters.
                sizes="(max-width: 768px) calc(100vw - 32px), 560px"
              />
            </motion.div>
          </AnimatePresence>

          {overlay}

          {count > 1 && (
            <>
              <button
                type="button"
                onClick={() => go(index - 1)}
                aria-label="Previous image"
                className="absolute left-3 top-1/2 -translate-y-1/2 btn-icon bg-white/90 text-brand-ink shadow-soft backdrop-blur opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity duration-base hidden md:inline-grid"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={() => go(index + 1)}
                aria-label="Next image"
                className="absolute right-3 top-1/2 -translate-y-1/2 btn-icon bg-white/90 text-brand-ink shadow-soft backdrop-blur opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity duration-base hidden md:inline-grid"
              >
                <ChevronRight size={18} />
              </button>

              {/* Mobile dots */}
              <div className="md:hidden absolute bottom-3 inset-x-0 flex justify-center gap-1.5" aria-hidden="true">
                {images.map((_, i) => (
                  <span
                    key={i}
                    className={cn(
                      'h-1.5 rounded-full transition-all duration-slow ease-premium',
                      i === index ? 'w-5 bg-brand-maroon' : 'w-1.5 bg-white/80 ring-1 ring-black/5'
                    )}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Mobile thumbnails — the desktop rail is hidden below md. */}
        {count > 1 && (
          <div className="flex md:hidden gap-2 mt-3 overflow-x-auto no-scrollbar">
            {images.map((img, i) => (
              <button
                key={img + i}
                onClick={() => setIndex([i, i > index ? 1 : -1])}
                aria-label={`View image ${i + 1} of ${count}`}
                aria-pressed={index === i}
                className={cn(
                  'relative w-16 h-16 flex-none rounded-control overflow-hidden transition-opacity duration-base',
                  index === i ? 'opacity-100' : 'opacity-70'
                )}
              >
                <Image src={img} alt="" fill className="object-cover" sizes="64px" />
                <span
                  className={cn(
                    'absolute inset-0 rounded-control ring-inset transition-[box-shadow] duration-base',
                    index === i ? 'ring-2 ring-brand-maroon' : 'ring-1 ring-brand-line'
                  )}
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
