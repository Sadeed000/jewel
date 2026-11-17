'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { useAdminOrders } from '@/hooks/useAdmin';
import { SectionLoader, ErrorState, EmptyState } from '@/components/common/Loading';

const statuses = ['confirmed', 'processing', 'shipped', 'out-for-delivery', 'delivered', 'cancelled', 'returned'];

export default function AdminOrdersPage() {
  const [orderNumber, setOrderNumber] = useState('');
  const [status, setStatus] = useState('');
  const { data, isLoading, error, refetch } = useAdminOrders({ orderNumber: orderNumber || undefined, status: status || undefined, limit: 20 });

  return (
    <div>
      <header className="mb-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.4em] text-brand-muted">Orders</p>
            <h1 className="font-display text-3xl text-brand-ink">Order management</h1>
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto] items-end">
            <div className="rounded-3xl border border-brand-cream-dark bg-white px-4 py-3 grid gap-3 sm:grid-cols-[1fr_auto]">
              <input
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="Search order number"
                className="w-full bg-transparent text-sm outline-none"
              />
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="rounded-2xl border border-brand-cream-dark bg-brand-cream px-4 py-3 text-sm outline-none"
              >
                <option value="">All statuses</option>
                {statuses.map((statusOption) => (
                  <option key={statusOption} value={statusOption}>{statusOption.replace(/-/g, ' ')}</option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => refetch()}
              className="rounded-full bg-brand-maroon px-5 py-3 text-sm font-semibold text-white hover:bg-brand-maroon-dark"
            >
              Filter
            </button>
          </div>
        </div>
      </header>

      <div className="rounded-3xl border border-brand-cream-dark bg-white p-6 shadow-sm">
        {isLoading ? (
          <SectionLoader label="Loading orders…" />
        ) : error ? (
          <ErrorState title="Unable to load orders" description="Try again in a moment." />
        ) : !data?.items.length ? (
          <EmptyState title="No orders found" description="Try a different filter." />
        ) : (
          <div className="space-y-3">
            {data.items.map((order) => (
              <Link
                key={order._id}
                href={`/admin/orders/${order._id}`}
                className="block rounded-3xl border border-brand-cream-dark p-4 transition hover:border-brand-maroon"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold text-brand-ink">{order.orderNumber}</p>
                    <p className="text-sm text-brand-muted">{order.shippingAddress.firstName} {order.shippingAddress.lastName} • {order.paymentMethod.toUpperCase()}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-brand-muted">
                    <span>Status: <strong className="text-brand-maroon">{order.status.replace(/-/g, ' ')}</strong></span>
                    <span>Items: {order.items.length}</span>
                    <span>Total: ₹{order.total.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
