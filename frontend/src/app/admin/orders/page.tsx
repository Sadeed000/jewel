'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Package, Search } from 'lucide-react';
import { useAdminOrders } from '@/hooks/useAdmin';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { formatPrice, cn } from '@/lib/utils';
import {
  PageHeader,
  StatusBadge,
  PaymentBadge,
  AdminSkeleton,
  AdminError,
  AdminEmpty,
  ORDER_STATUSES,
  toolbarInput,
  segmentTab,
  formatDate,
} from '@/components/admin/ui';

const PAGE_SIZE = 20;

export default function AdminOrdersPage() {
  const router = useRouter();
  const [orderNumber, setOrderNumber] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const debouncedNumber = useDebouncedValue(orderNumber.trim().toUpperCase(), 300);

  const { data, isLoading, error, refetch, isFetching } = useAdminOrders({
    orderNumber: debouncedNumber || undefined,
    status: status || undefined,
    page,
    limit: PAGE_SIZE,
  });

  // Any filter change starts from the first page.
  useEffect(() => setPage(1), [debouncedNumber, status]);

  const pagination = data?.pagination;

  return (
    <div>
      <PageHeader
        eyebrow="Sales"
        title="Orders"
        description={pagination ? `${pagination.total.toLocaleString('en-IN')} order${pagination.total === 1 ? '' : 's'}${status ? ` · ${status.replace(/-/g, ' ')}` : ''}` : 'Every purchase across the store'}
      />

      {/* Toolbar */}
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-1 overflow-x-auto rounded-xl border border-admin-line bg-admin-surface p-1 shadow-[0_1px_2px_rgba(28,25,23,0.04)]">
          {['', ...ORDER_STATUSES].map((s) => (
            <button
              key={s || 'all'}
              type="button"
              onClick={() => setStatus(s)}
              className={segmentTab(status === s)}
            >
              {s ? s.replace(/-/g, ' ') : 'All'}
            </button>
          ))}
        </div>
        <div className="relative w-full lg:w-72">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-admin-muted" />
          <input
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder="Exact order number, e.g. AUR-…"
            aria-label="Search by order number"
            className={cn(toolbarInput, 'w-full pl-10')}
          />
        </div>
      </div>

      {error ? (
        <AdminError title="Unable to load orders" message={(error as Error).message} onRetry={() => refetch()} />
      ) : isLoading ? (
        <AdminSkeleton rows={6} />
      ) : !data?.items.length ? (
        <div className="rounded-2xl border border-admin-line bg-admin-surface shadow-admin-card">
          <AdminEmpty
            icon={Package}
            title="No orders found"
            description={debouncedNumber || status ? 'Try a different order number or status.' : 'Orders will appear here once customers check out.'}
          />
        </div>
      ) : (
        <div className={cn('overflow-hidden rounded-2xl border border-admin-line bg-admin-surface shadow-admin-card transition-opacity', isFetching && 'opacity-70')}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-admin-line bg-gradient-to-r from-admin-gold-soft to-admin-subtle text-[11px] font-bold uppercase tracking-[0.12em] text-admin-gold-ink">
                  <th className="px-6 py-3.5">Order</th>
                  <th className="px-4 py-3.5">Customer</th>
                  <th className="px-4 py-3.5">Date</th>
                  <th className="px-4 py-3.5">Payment</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-line">
                {data.items.map((order) => (
                  <tr
                    key={order._id}
                    onClick={() => router.push(`/admin/orders/${order._id}`)}
                    className="group cursor-pointer transition-colors hover:bg-admin-subtle"
                  >
                    <td className="px-6 py-4">
                      <p className="font-semibold text-admin-ink group-hover:text-admin-gold-ink">{order.orderNumber}</p>
                      <p className="text-xs text-admin-muted">
                        {order.items.length} item{order.items.length === 1 ? '' : 's'}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-medium text-admin-body">
                        {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                      </p>
                      <p className="text-xs text-admin-muted">{order.shippingAddress.city}</p>
                    </td>
                    <td className="px-4 py-4 text-admin-body">{formatDate(order.createdAt)}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <PaymentBadge status={order.paymentStatus} />
                        <span className="text-[11px] font-medium uppercase text-admin-muted">{order.paymentMethod}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4"><StatusBadge status={order.status} /></td>
                    <td className="px-6 py-4 text-right font-semibold tabular-nums text-admin-ink">{formatPrice(order.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between border-t border-admin-line px-6 py-3.5">
              <p className="text-[13px] text-admin-muted tabular-nums">
                Page {pagination.page} of {pagination.pages}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={!pagination.hasPrev}
                  className="inline-flex h-9 items-center gap-1 rounded-lg border border-admin-line bg-admin-surface px-3 text-[13px] font-medium text-admin-body hover:bg-admin-subtle disabled:opacity-40"
                >
                  <ChevronLeft size={15} /> Prev
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!pagination.hasNext}
                  className="inline-flex h-9 items-center gap-1 rounded-lg border border-admin-line bg-admin-surface px-3 text-[13px] font-medium text-admin-body hover:bg-admin-subtle disabled:opacity-40"
                >
                  Next <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
