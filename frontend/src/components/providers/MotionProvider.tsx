'use client';

import { MotionConfig } from 'framer-motion';

/**
 * `reducedMotion="user"` makes every framer-motion animation in the tree
 * honour the OS "reduce motion" setting: transforms are skipped and only
 * opacity fades remain. CSS animations are covered in globals.css.
 */
export default function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
