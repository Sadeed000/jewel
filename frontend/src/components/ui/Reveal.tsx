import { cn } from '@/lib/utils';

/**
 * Fades a section up as it scrolls into view, using a CSS scroll-driven
 * animation (see `.reveal` in globals.css). Browsers without support show the
 * section immediately. No JavaScript, so content is never hidden waiting on
 * hydration — and this can be used from server components.
 *
 * `cv-auto` lets the browser skip rendering work for sections far below the
 * fold until the user scrolls near them.
 */
export default function Reveal({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('reveal cv-auto', className)}>{children}</div>;
}
