'use client';

import LogoLoader from './LogoLoader';

/**
 * Shared loading/empty/error UI matching Aurelia's existing card style.
 * Skeletons use the same border, rounded corners, and cream palette as
 * ProductCard so swapping between loading and loaded states feels seamless.
 */

/* ────────── Product card skeleton ────────── */
export function ProductCardSkeleton() {
  // Same aspect ratio and spacing as ProductCard, so loaded cards drop into
  // exactly the same boxes — no layout shift.
  return (
    <div aria-hidden="true">
      <div className="skeleton aspect-square rounded-card" />
      <div className="skeleton mt-3.5 h-4 w-3/4" />
      <div className="skeleton mt-2 h-4 w-1/3" />
    </div>
  );
}

/* ────────── Product grid skeleton ────────── */
export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 md:gap-x-6 md:gap-y-10"
      role="status"
      aria-label="Loading products"
    >
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
      <div className="w-20 h-20 mx-auto rounded-full bg-white shadow-card ring-1 ring-brand-line grid place-items-center text-3xl text-brand-gold-dark mb-6">
        {icon}
      </div>
      <p className="font-display text-3xl text-brand-ink">{title}</p>
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
