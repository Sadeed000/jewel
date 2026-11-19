'use client';

import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Admin console building blocks. One visual language for every admin screen:
 * white panels on a warm ivory canvas, onyx text, champagne-gold accents.
 */

/* ───────────── Page header ───────────── */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-admin-gold-ink">
            <span className="h-px w-5 bg-admin-gold" aria-hidden="true" />
            {eyebrow}
          </p>
        )}
        <h1 className="text-[28px] font-bold leading-tight tracking-[-0.03em] text-admin-ink">{title}</h1>
        {description && <p className="mt-1.5 text-sm text-admin-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
    </header>
  );
}

/* ───────────── Panel ───────────── */
export function Panel({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn('rounded-2xl border border-admin-line bg-admin-surface shadow-admin-card', className)}>
      {(title || actions) && (
        <div className="flex items-start justify-between gap-4 rounded-t-2xl border-b border-admin-line bg-gradient-to-r from-admin-gold-soft/80 via-admin-subtle to-white px-5 py-4 sm:px-6">
          <div>
            {title && <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-admin-ink">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-admin-muted">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      <div className={cn('p-5 sm:p-6', bodyClassName)}>{children}</div>
    </section>
  );
}

/* ───────────── Stat card ───────────── */
export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  accent = false,
}: {
  label: string;
  value: React.ReactNode;
  icon: LucideIcon;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        'group relative h-full overflow-hidden rounded-2xl border p-5 transition-[box-shadow,transform,border-color] duration-base ease-premium hover:-translate-y-0.5 hover:shadow-admin-lift',
        accent
          ? 'admin-silk border-admin-gold/40 shadow-admin-card'
          : 'border-admin-line bg-admin-surface shadow-admin-card hover:border-admin-gold/40'
      )}
    >
      {/* Thin gold rule along the top edge. */}
      <span
        aria-hidden="true"
        className={cn(
          'absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-admin-gold-light via-admin-gold to-admin-maroon/70 transition-opacity',
          accent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        )}
      />
      <div className="relative flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium text-admin-muted">{label}</p>
        <div
          className={cn(
            'grid h-10 w-10 place-items-center rounded-xl ring-1',
            accent
              ? 'bg-gradient-to-br from-admin-maroon to-admin-maroon-deep text-admin-gold-light ring-admin-maroon/20 shadow-admin-maroon'
              : 'bg-admin-gold-soft text-admin-gold-ink ring-admin-gold/25'
          )}
        >
          <Icon size={18} strokeWidth={2} />
        </div>
      </div>
      <p className={cn('relative mt-4 text-[30px] font-bold leading-none tracking-[-0.03em] tabular-nums', accent ? 'text-admin-maroon' : 'text-admin-ink')}>
        {value}
      </p>
      {hint && <p className={cn('relative mt-2.5 text-xs', accent ? 'font-medium text-admin-gold-ink' : 'text-admin-muted')}>{hint}</p>}
    </div>
  );
}

/* ───────────── Badges ───────────── */
export const ORDER_STATUSES = [
  'confirmed',
  'processing',
  'shipped',
  'out-for-delivery',
  'delivered',
  'cancelled',
  'returned',
] as const;

export const STATUS_STYLE: Record<string, { badge: string; dot: string; bar: string }> = {
  confirmed: { badge: 'bg-sky-50 text-sky-700 ring-sky-200/70', dot: 'bg-sky-500', bar: 'bg-sky-500' },
  processing: { badge: 'bg-amber-50 text-amber-700 ring-amber-200/70', dot: 'bg-amber-500', bar: 'bg-amber-500' },
  shipped: { badge: 'bg-indigo-50 text-indigo-700 ring-indigo-200/70', dot: 'bg-indigo-500', bar: 'bg-indigo-500' },
  'out-for-delivery': { badge: 'bg-violet-50 text-violet-700 ring-violet-200/70', dot: 'bg-violet-500', bar: 'bg-violet-500' },
  delivered: { badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200/70', dot: 'bg-emerald-500', bar: 'bg-emerald-500' },
  cancelled: { badge: 'bg-rose-50 text-rose-700 ring-rose-200/70', dot: 'bg-rose-500', bar: 'bg-rose-500' },
  returned: { badge: 'bg-stone-100 text-stone-700 ring-stone-200', dot: 'bg-stone-500', bar: 'bg-stone-400' },
};

export function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.returned;
  return (
    <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium capitalize ring-1 ring-inset', s.badge)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', s.dot)} aria-hidden="true" />
      {status.replace(/-/g, ' ')}
    </span>
  );
}

const PAYMENT_STYLE: Record<string, string> = {
  paid: 'bg-emerald-50 text-emerald-700 ring-emerald-200/70',
  pending: 'bg-amber-50 text-amber-700 ring-amber-200/70',
  failed: 'bg-rose-50 text-rose-700 ring-rose-200/70',
  refunded: 'bg-stone-100 text-stone-700 ring-stone-200',
};

export function PaymentBadge({ status }: { status: string }) {
  return (
    <span className={cn('inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium capitalize ring-1 ring-inset', PAYMENT_STYLE[status] ?? PAYMENT_STYLE.refunded)}>
      {status}
    </span>
  );
}

export function Chip({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral' | 'gold' | 'success' | 'danger' }) {
  const tones = {
    neutral: 'bg-admin-subtle text-admin-body ring-admin-line',
    gold: 'bg-admin-gold-soft text-admin-gold-ink ring-admin-gold/30',
    success: 'bg-emerald-50 text-emerald-700 ring-emerald-200/70',
    danger: 'bg-rose-50 text-rose-700 ring-rose-200/70',
  };
  return (
    <span className={cn('inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize ring-1 ring-inset', tones[tone])}>
      {children}
    </span>
  );
}

/* ───────────── Avatar ───────────── */
export function Avatar({ name, size = 36, className }: { name: string; size?: number; className?: string }) {
  const initials = name
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
  return (
    <span
      className={cn(
        'grid flex-none place-items-center rounded-full bg-gradient-to-br from-admin-blush via-admin-gold-soft to-admin-gold-light font-semibold text-admin-maroon ring-2 ring-white shadow-[0_2px_6px_-2px_rgba(122,82,40,0.35)]',
        className
      )}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
      aria-hidden="true"
    >
      {initials || 'A'}
    </span>
  );
}

/* ───────────── Empty state ───────────── */
export function AdminEmpty({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-admin-gold-soft text-admin-gold-ink ring-1 ring-admin-gold/25">
        <Icon size={24} strokeWidth={1.75} />
      </div>
      <p className="mt-4 text-[15px] font-semibold text-admin-ink">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-admin-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* ───────────── Loading skeleton ───────────── */
export function AdminSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-xl border border-admin-line bg-admin-surface p-4">
          <div className="h-10 w-10 animate-pulse rounded-xl bg-admin-line" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/3 animate-pulse rounded bg-admin-line" />
            <div className="h-3 w-1/5 animate-pulse rounded bg-admin-line/70" />
          </div>
          <div className="h-6 w-20 animate-pulse rounded-full bg-admin-line/70" />
        </div>
      ))}
    </div>
  );
}

/* ───────────── Error banner ───────────── */
export function AdminError({ title, message, onRetry }: { title: string; message?: string; onRetry?: () => void }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50/70 p-5">
      <div className="grid h-9 w-9 flex-none place-items-center rounded-xl bg-rose-100 text-rose-600">!</div>
      <div className="flex-1">
        <p className="font-semibold text-rose-900">{title}</p>
        {message && <p className="mt-0.5 text-sm text-rose-700">{message}</p>}
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-xl border border-rose-200 bg-white px-3.5 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50"
        >
          Retry
        </button>
      )}
    </div>
  );
}

/** Segmented-control tab (status filters, role switch). */
export const segmentTab = (active: boolean) =>
  cn(
    'whitespace-nowrap rounded-lg px-3.5 py-1.5 text-[13px] font-medium capitalize transition-all duration-base',
    active
      ? 'bg-gradient-to-b from-[#8e2f3d] to-admin-maroon font-semibold text-white shadow-admin-maroon'
      : 'text-admin-body hover:bg-admin-gold-soft hover:text-admin-maroon'
  );

/** Shared toolbar input styling (search boxes, filter selects). */
export const toolbarInput =
  'h-10 rounded-xl border border-admin-line bg-admin-surface px-3.5 text-sm text-admin-ink shadow-[0_1px_2px_rgba(122,82,40,0.05)] outline-none transition-[border-color,box-shadow] placeholder:text-admin-muted/80 hover:border-admin-line-strong focus:border-admin-gold focus:ring-4 focus:ring-admin-gold/15';

export const formatDate = (iso?: string, withTime = false) =>
  iso
    ? new Date(iso).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        ...(withTime ? { hour: 'numeric', minute: '2-digit' } : {}),
      })
    : '—';
