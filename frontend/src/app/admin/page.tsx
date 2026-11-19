'use client';

import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Gem, Package, Users, IndianRupee, Plus, Search, Tag, Sparkles } from 'lucide-react';
import { useAdminDashboard, useAdminOrders } from '@/hooks/useAdmin';
import { useCurrentUser } from '@/hooks/useAuth';
import { formatPrice, cn } from '@/lib/utils';
import {
  Panel,
  StatCard,
  StatusBadge,
  AdminSkeleton,
  AdminError,
  AdminEmpty,
  ORDER_STATUSES,
  STATUS_STYLE,
  formatDate,
} from '@/components/admin/ui';

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

const quickActions = [
  { href: '/admin/products', label: 'Add a product', hint: 'Grow the catalogue', icon: Plus },
  { href: '/admin/categories', label: 'Manage categories', hint: 'Navigation & menus', icon: Tag },
  { href: '/admin/track-order', label: 'Track an order', hint: 'Find & update status', icon: Search },
  { href: '/admin/customers', label: 'View customers', hint: 'Accounts & access', icon: Users },
];

export default function AdminDashboardPage() {
  const { data, isLoading, error, refetch } = useAdminDashboard();
  const { data: recent, isLoading: recentLoading } = useAdminOrders({ limit: 6 });
  const { data: user } = useCurrentUser();

  if (error) {
    return <AdminError title="Couldn't load the dashboard" message={(error as Error).message} onRetry={() => refetch()} />;
  }

  const summary = data?.summary;
  const counts = summary?.statusCounts ?? {};
  const totalInPipeline = ORDER_STATUSES.reduce((n, s) => n + (counts[s] ?? 0), 0);
  const openOrders = (counts.confirmed ?? 0) + (counts.processing ?? 0) + (counts.shipped ?? 0) + (counts['out-for-delivery'] ?? 0);
  const loading = isLoading || !summary;

  return (
    <div className="space-y-7">
      {/* Hero */}
      <section className="admin-silk relative overflow-hidden rounded-[24px] border border-admin-gold/35 px-6 py-8 shadow-admin-card sm:px-9 sm:py-10">
        <div aria-hidden="true" className="admin-dots pointer-events-none absolute inset-y-0 right-0 w-1/2 opacity-60 [mask-image:linear-gradient(to_left,black,transparent)]" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-admin-gold-light/60 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-admin-rose/70 blur-3xl" />
        {/* Facet ornament */}
        <svg aria-hidden="true" viewBox="0 0 120 120" className="pointer-events-none absolute right-8 top-1/2 hidden h-36 w-36 -translate-y-1/2 text-admin-gold/40 xl:block">
          <path d="M60 6 L104 40 L60 114 L16 40 Z M16 40 H104 M60 6 L42 40 L60 114 L78 40 Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between xl:pr-40">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-admin-gold/40 bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-admin-gold-ink backdrop-blur">
              <Sparkles size={12} /> Aurelia atelier
            </p>
            <h1 className="mt-4 text-[30px] font-bold leading-tight tracking-[-0.03em] text-admin-ink sm:text-[38px]">
              {greeting()},{' '}
              <span className="bg-gradient-to-r from-admin-maroon via-[#9b3a45] to-admin-gold-ink bg-clip-text text-transparent">
                {user?.firstName || 'there'}
              </span>
            </h1>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-admin-body">
              {loading
                ? 'Gathering today’s numbers…'
                : openOrders > 0
                  ? `${openOrders} order${openOrders === 1 ? '' : 's'} in progress. Here’s how the store is doing.`
                  : 'All orders are fulfilled. Here’s how the store is doing.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Link
              href="/admin/products"
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-b from-[#8e2f3d] to-admin-maroon px-5 text-sm font-semibold text-white shadow-admin-maroon transition hover:brightness-110"
            >
              <Plus size={16} /> New product
            </Link>
            <Link
              href="/admin/orders"
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-admin-gold/40 bg-white/80 px-5 text-sm font-semibold text-admin-ink backdrop-blur transition hover:bg-white hover:shadow-admin-card"
            >
              View orders <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Link href="/admin/orders" className="block">
          <StatCard accent label="Revenue collected" value={loading ? '—' : formatPrice(summary.totalRevenue)} icon={IndianRupee} hint="From paid orders" />
        </Link>
        <Link href="/admin/orders" className="block">
          <StatCard label="Orders" value={loading ? '—' : summary.totalOrders.toLocaleString('en-IN')} icon={Package} hint={`${openOrders} in progress`} />
        </Link>
        <Link href="/admin/customers" className="block">
          <StatCard label="Customers" value={loading ? '—' : summary.totalCustomers.toLocaleString('en-IN')} icon={Users} hint="Registered accounts" />
        </Link>
        <Link href="/admin/products" className="block">
          <StatCard label="Products" value={loading ? '—' : summary.totalProducts.toLocaleString('en-IN')} icon={Gem} hint="In the catalogue" />
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        {/* Recent orders */}
        <Panel
          title="Recent orders"
          description="The latest purchases across the store"
          bodyClassName="p-0 sm:p-0"
          actions={
            <Link href="/admin/orders" className="inline-flex items-center gap-1 text-[13px] font-semibold text-admin-maroon hover:text-admin-gold-ink">
              View all <ArrowUpRight size={14} />
            </Link>
          }
        >
          {recentLoading ? (
            <div className="p-5"><AdminSkeleton rows={4} /></div>
          ) : !recent?.items.length ? (
            <AdminEmpty icon={Package} title="No orders yet" description="New orders will appear here as soon as they’re placed." />
          ) : (
            <ul className="divide-y divide-admin-line">
              {recent.items.map((order) => (
                <li key={order._id}>
                  <Link
                    href={`/admin/orders/${order._id}`}
                    className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-admin-subtle sm:px-6"
                  >
                    <div className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-gradient-to-br from-admin-blush to-admin-gold-soft text-admin-maroon ring-1 ring-admin-gold/25">
                      <Package size={17} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-admin-ink">{order.orderNumber}</p>
                      <p className="truncate text-xs text-admin-muted">
                        {order.shippingAddress.firstName} {order.shippingAddress.lastName} · {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <div className="hidden sm:block"><StatusBadge status={order.status} /></div>
                    <p className="w-24 text-right text-sm font-semibold tabular-nums text-admin-ink">{formatPrice(order.total)}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <div className="space-y-6">
          {/* Pipeline */}
          <Panel title="Order pipeline" description="Where every order sits right now">
            <div className="flex h-2.5 overflow-hidden rounded-full bg-admin-line/60">
              {totalInPipeline > 0 &&
                ORDER_STATUSES.map((s) =>
                  counts[s] ? (
                    <span
                      key={s}
                      className={cn('h-full', STATUS_STYLE[s].bar)}
                      style={{ width: `${(counts[s] / totalInPipeline) * 100}%` }}
                      title={`${s}: ${counts[s]}`}
                    />
                  ) : null
                )}
            </div>
            <ul className="mt-5 space-y-2.5">
              {ORDER_STATUSES.map((s) => {
                const n = counts[s] ?? 0;
                const pct = totalInPipeline ? Math.round((n / totalInPipeline) * 100) : 0;
                return (
                  <li key={s} className="flex items-center gap-3 text-sm">
                    <span className={cn('h-2 w-2 rounded-full', STATUS_STYLE[s].dot)} aria-hidden="true" />
                    <span className="flex-1 capitalize text-admin-body">{s.replace(/-/g, ' ')}</span>
                    <span className="text-xs tabular-nums text-admin-muted">{pct}%</span>
                    <span className="w-8 text-right font-semibold tabular-nums text-admin-ink">{loading ? '–' : n}</span>
                  </li>
                );
              })}
            </ul>
          </Panel>

          {/* Quick actions */}
          <Panel title="Quick actions">
            <div className="grid grid-cols-2 gap-2.5">
              {quickActions.map((a) => {
                const Icon = a.icon;
                return (
                  <Link
                    key={a.href}
                    href={a.href}
                    className="group rounded-xl border border-admin-line bg-gradient-to-br from-white to-admin-gold-soft/60 p-3.5 transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-admin-gold/50 hover:shadow-admin-card"
                  >
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-white text-admin-maroon shadow-[0_1px_3px_rgba(122,82,40,0.15)] ring-1 ring-admin-gold/30">
                      <Icon size={15} />
                    </span>
                    <p className="mt-2.5 text-[13px] font-semibold text-admin-ink">{a.label}</p>
                    <p className="text-[11px] text-admin-muted">{a.hint}</p>
                  </Link>
                );
              })}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
