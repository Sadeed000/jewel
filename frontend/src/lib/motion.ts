import type { Transition, Variants } from 'framer-motion';

/**
 * Motion tokens shared by every animated surface in the store.
 *
 * Keep these in sync with the CSS variables in app/globals.css and the
 * `premium` easing in tailwind.config.js so CSS hover states and
 * framer-motion transitions feel like one system.
 *
 * Rule of thumb: 150ms for feedback (press, toggle), 220ms for small
 * surfaces (menus, chips), 300ms for content swaps (pages, galleries).
 */
export const EASE_PREMIUM = [0.22, 1, 0.36, 1] as const;
export const EASE_IN = [0.4, 0, 1, 1] as const;

export const DURATION = {
  fast: 0.15,
  base: 0.22,
  slow: 0.3,
} as const;

export const transition = {
  fast: { duration: DURATION.fast, ease: EASE_PREMIUM } satisfies Transition,
  base: { duration: DURATION.base, ease: EASE_PREMIUM } satisfies Transition,
  slow: { duration: DURATION.slow, ease: EASE_PREMIUM } satisfies Transition,
  /** Snappy spring for sliding indicators (tabs, pills). */
  indicator: { type: 'spring', stiffness: 500, damping: 40, mass: 0.8 } satisfies Transition,
} as const;

/** Fade + short rise. Used for page enters and section reveals. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: transition.slow },
  exit: { opacity: 0, y: -4, transition: { duration: DURATION.fast, ease: EASE_IN } },
};

/** Parent that staggers its children — capped so long grids stay fast. */
export const staggerContainer = (stagger = 0.035, delay = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger, delayChildren: delay } },
});

/** Product-card item: fade, tiny rise and a hint of scale. */
export const gridItem: Variants = {
  hidden: { opacity: 0, y: 12, scale: 0.985 },
  show: { opacity: 1, y: 0, scale: 1, transition: transition.slow },
  exit: { opacity: 0, scale: 0.98, transition: { duration: DURATION.fast, ease: EASE_IN } },
};
