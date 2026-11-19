'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * Slim gold progress bar along the top edge during navigation.
 *
 * The App Router has no route-change events, so the bar starts when:
 *   - an internal <a> is clicked (covers every <Link>), or
 *   - code calls `startNavigationProgress()` before router.push (filters,
 *     sort, pagination).
 * It completes when the pathname or query string actually changes.
 */
const START_EVENT = 'aurelia:navigation-start';

export function startNavigationProgress() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(START_EVENT));
}

function ProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeKey = `${pathname}?${searchParams.toString()}`;

  const [active, setActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const trickle = useRef<ReturnType<typeof setInterval> | null>(null);
  const safety = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstRender = useRef(true);

  const clearTimers = () => {
    if (trickle.current) clearInterval(trickle.current);
    if (safety.current) clearTimeout(safety.current);
    trickle.current = null;
    safety.current = null;
  };

  useEffect(() => {
    const start = () => {
      clearTimers();
      setActive(true);
      setProgress(0.12);
      // Ease towards 90% and wait there for the route to resolve.
      trickle.current = setInterval(() => {
        setProgress((p) => (p < 0.9 ? p + (0.9 - p) * 0.12 : p));
      }, 180);
      // Never leave the bar stuck if navigation is cancelled.
      safety.current = setTimeout(() => {
        clearTimers();
        setActive(false);
      }, 10000);
    };

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = (e.target as HTMLElement | null)?.closest('a');
      if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return;
      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      // Same page (incl. hash-only changes) won't trigger a route change.
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      start();
    };

    document.addEventListener('click', onClick, true);
    window.addEventListener(START_EVENT, start);
    return () => {
      document.removeEventListener('click', onClick, true);
      window.removeEventListener(START_EVENT, start);
      clearTimers();
    };
  }, []);

  // Route resolved → fill and fade out.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    clearTimers();
    setProgress(1);
    const t = setTimeout(() => setActive(false), 220);
    return () => clearTimeout(t);
  }, [routeKey]);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key="nav-progress"
          aria-hidden="true"
          className="pointer-events-none fixed inset-x-0 top-0 z-[200] h-[2px]"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.2 } }}
        >
          <motion.div
            className="h-full origin-left bg-gradient-to-r from-brand-gold-dark via-brand-gold to-brand-gold-light shadow-[0_0_8px_rgba(213,170,114,0.7)]"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: progress }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function NavigationProgress() {
  // useSearchParams needs a Suspense boundary to keep pages statically renderable.
  return (
    <Suspense fallback={null}>
      <ProgressBar />
    </Suspense>
  );
}
