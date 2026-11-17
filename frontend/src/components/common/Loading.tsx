'use client';

import LogoLoader from './LogoLoader';

/**
 * Shared loading/empty/error UI matching Aurelia's existing card style.
 * Skeletons use the same border, rounded corners, and cream palette as
 * ProductCard so swapping between loading and loaded states feels seamless.
 */

/* ────────── Product card skeleton ────────── */
export function ProductCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-square bg-brand-cream rounded-lg" />
      <div className="mt-3 h-4 bg-brand-cream rounded w-3/4" />
      <div className="mt-2 h-4 bg-brand-cream rounded w-1/2" />
    </div>
  );
}

/* ────────── Product grid skeleton ────────── */
export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

/* ────────── Inline loader ──────────
   Kept named `Spinner` so existing imports keep working, but it now renders
   the Aurelia mark rather than a generic ring. */
export function Spinner({ size = 24 }: { size?: number }) {
  return <LogoLoader size={size} />;
}

/* ────────── Full-section loader ────────── */
export function SectionLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="py-16 grid place-items-center">
      <LogoLoader size={52} />
      <p className="mt-4 text-sm text-brand-muted tracking-wide">{label}</p>
    </div>
  );
}

/* ────────── Empty state ────────── */
export function EmptyState({
  icon = '✦',
  title,
  description,
  action,
}: {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="py-16 text-center">
      <div className="w-20 h-20 mx-auto rounded-full bg-brand-cream grid place-items-center text-3xl text-brand-gold-dark mb-4">
        {icon}
      </div>
      <p className="font-display text-2xl text-brand-ink">{title}</p>
      {description && <p className="text-sm text-brand-muted mt-2 max-w-md mx-auto">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

/* ────────── Error state ────────── */
export function ErrorState({
  title = 'Something went wrong',
  description,
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="py-16 text-center">
      <div className="w-20 h-20 mx-auto rounded-full bg-red-50 grid place-items-center text-3xl text-red-600 mb-4">
        !
      </div>
      <p className="font-display text-2xl text-brand-ink">{title}</p>
      {description && <p className="text-sm text-brand-muted mt-2 max-w-md mx-auto">{description}</p>}
      {onRetry && (
        <button onClick={onRetry} className="btn-outline mt-6">
          Try Again
        </button>
      )}
    </div>
  );
}
