'use client';

import { cn } from '@/lib/utils';

/**
 * Brand loader — the Aurelia mark drawing itself, instead of a generic
 * spinner.
 *
 * The path geometry is identical to components/common/Logo.tsx so the loading
 * state reads as the same mark. Animation is pure CSS (stroke-dashoffset +
 * a pulsing gem), defined in globals.css, so there's no JS timer and no
 * layout shift when it swaps out for real content.
 */
export default function LogoLoader({
  size = 48,
  className = '',
  light = false,
}: {
  size?: number;
  className?: string;
  light?: boolean;
}) {
  const color = light ? '#fdfbf7' : '#5a1a1a';

  return (
    <span
      className={cn('inline-grid place-items-center', className)}
      role="status"
      aria-label="Loading"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Faint full mark so the shape is always legible underneath. */}
        <path
          d="M20 4 L8 14 L8 36 M20 4 L32 14 L32 36 M14 36 L26 36 M20 4 L20 36"
          stroke={color}
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
          opacity="0.15"
        />
        {/* Animated stroke that traces the mark. */}
        <path
          className="aurelia-loader-trace"
          d="M20 4 L8 14 L8 36 M20 4 L32 14 L32 36 M14 36 L26 36 M20 4 L20 36"
          stroke={color}
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
        <circle className="aurelia-loader-gem" cx="20" cy="14" r="2.5" fill={color} />
      </svg>
    </span>
  );
}

/**
 * Full-viewport blocking loader for route-level waits.
 */
export function FullPageLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-brand-cream/80 backdrop-blur-sm">
      <div className="text-center">
        <LogoLoader size={64} />
        <p className="mt-4 text-sm text-brand-muted tracking-wide">{label}</p>
      </div>
    </div>
  );
}
