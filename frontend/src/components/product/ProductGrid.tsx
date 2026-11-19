'use client';

import { AnimatePresence, motion } from 'framer-motion';
import ProductCard, { type AnyProduct } from './ProductCard';
import { cn } from '@/lib/utils';
import { DURATION, EASE_IN, EASE_PREMIUM } from '@/lib/motion';

/**
 * Product grid with smooth transitions between result sets.
 *
 * Pass a `animationKey` that changes whenever the result set changes (filter,
 * sort, page). The old grid fades out quickly, the new one staggers in. The
 * stagger is capped at ~12 cards so a 24-item page still settles in ~300ms
 * after the first card, never feeling slow.
 *
 * `mode="popLayout"` keeps the outgoing grid out of flow so the page height
 * doesn't jump while both are briefly mounted.
 */
export default function ProductGrid({
  products,
  animationKey = 'grid',
  columns = 'default',
  className,
}: {
  products: AnyProduct[];
  animationKey?: string;
  columns?: 'default' | 'sidebar';
  className?: string;
}) {
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.div
        key={animationKey}
        className={cn(
          'grid grid-cols-2 gap-x-4 gap-y-8 md:gap-x-6 md:gap-y-10',
          columns === 'sidebar' ? 'md:grid-cols-2 xl:grid-cols-3' : 'md:grid-cols-3 lg:grid-cols-4',
          className
        )}
        initial="hidden"
        animate="show"
        exit={{ opacity: 0, transition: { duration: DURATION.fast, ease: EASE_IN } }}
        variants={{ hidden: {}, show: {} }}
      >
        {products.map((p, i) => (
          <motion.div
            key={p._id || p.id || p.slug}
            variants={{
              hidden: { opacity: 0, y: 14 },
              show: {
                opacity: 1,
                y: 0,
                transition: {
                  duration: DURATION.slow,
                  ease: EASE_PREMIUM,
                  delay: Math.min(i, 12) * 0.03,
                },
              },
            }}
          >
            <ProductCard product={p} />
          </motion.div>
        ))}
      </motion.div>
    </AnimatePresence>
  );
}
