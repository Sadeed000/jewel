'use client';

import Link from 'next/link';
import { ArrowRight, Box, Package, Users, IndianRupee, AlertCircle } from 'lucide-react';
import { useAdminDashboard } from '@/hooks/useAdmin';
import { SectionLoader } from '@/components/common/Loading';
import { formatPrice } from '@/lib/utils';

const STATUSES = ['confirmed', 'processing', 'shipped', 'out-for-delivery', 'delivered', 'cancelled', 'returned'];

const statusTone: Record<string, string> = {
  confirmed: 'bg-blue-50 text-blue-700 ring-blue-200',
  processing: 'bg-amber-50 text-amber-700 ring-amber-200',
  shipped: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  'out-for-delivery': 'bg-purple-50 text-purple-700 ring-purple-200',
  delivered: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  cancelled: 'bg-red-50 text-red-700 ring-red-200',
  returned: 'bg-slate-100 text-slate-700 ring-slate-200',
};

export default function AdminDashboardPage() {
  const { data, isLoading, error } = useAdminDashboard();

  if (isLoading) return <SectionLoader label="Loading dashboard…" />;

  if (error) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5">
        <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-600" />
        <div>
          <p className="font-medium text-red-800">Couldn&apos;t load the dashboard</p>
          <p className="mt-1 text-sm text-red-700">{(error as Error).message}</p>
        </div>
      </div>
    );
  }

  const summary = data?.summary;

  const cards = [
    { label: 'Products', value: summary?.totalProducts ?? 0, icon: Box, href: '/admin/products' },
    { label: 'Orders', value: summary?.totalOrders ?? 0, icon: Package, href: '/admin/orders' },
    { label: 'Customers', value: summary?.totalCustomers ?? 0, icon: Users, href: '/admin/customers' },
    {
      label: 'Revenue',
      value: formatPrice(summary?.totalRevenue ?? 0),
      icon: IndianRupee,
      href: '/admin/orders',
    },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h2 className="font-display text-3xl text-brand-ink">Welcome back</h2>
        <p className="mt-1 text-sm text-brand-muted">
          Manage products, orders, customers and tracking in one place.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.label}
              href={card.href}
              className="group rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:border-brand-gold hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs uppercase tracking-[0.2em] text-brand-muted">{card.label}</p>
                <div className="rounded-xl bg-brand-cream p-2 text-brand-maroon">
                  <Icon size={16} />
                </div>
              </div>
              <p className="mt-4 font-display text-3xl text-brand-ink">{card.value}</p>
              <div className="mt-4 flex items-center gap-1 text-xs text-brand-maroon">
                <span>View details</span>
                <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          );
        })}
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="font-display text-xl text-brand-ink">Order status overview</h3>
        <p className="text-sm text-brand-muted">How many orders sit in each step right now.</p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {STATUSES.map((status) => (
            <div
              key={status}
              className={`rounded-xl p-4 ring-1 ${statusTone[status] ?? 'bg-slate-50 text-slate-700 ring-slate-200'}`}
            >
              <p className="text-[11px] font-medium uppercase tracking-wider">{status.replace(/-/g, ' ')}</p>
              <p className="mt-2 font-display text-2xl">{summary?.statusCounts?.[status] ?? 0}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
