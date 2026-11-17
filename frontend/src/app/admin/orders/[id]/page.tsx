'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAdminOrder, useUpdateOrderStatus } from '@/hooks/useAdmin';
import { SectionLoader, ErrorState } from '@/components/common/Loading';

const statuses = ['confirmed', 'processing', 'shipped', 'out-for-delivery', 'delivered', 'cancelled', 'returned'];

export default function AdminOrderDetailPage() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const [status, setStatus] = useState('');
  const [note, setNote] = useState('');
  const { data: order, isLoading, error, refetch } = useAdminOrder(id);
  const updateStatus = useUpdateOrderStatus();

  const orderStatus = useMemo(() => status || order?.status || '', [order, status]);

  const handleUpdate = async () => {
    if (!id || !orderStatus) return;
    await updateStatus.mutateAsync({ id, status: orderStatus as any, note: note || undefined });
    setNote('');
    refetch();
  };

  if (isLoading) return <SectionLoader label="Loading order details…" />;
  if (error || !order) return <ErrorState title="Unable to load order" description="Please go back and try another order." />;

  return (
    <div>
      <header className="mb-6">
        <p className="text-sm uppercase tracking-[0.4em] text-brand-muted">Order details</p>
        <h1 className="font-display text-3xl text-brand-ink mt-2">{order.orderNumber}</h1>
        <p className="text-sm text-brand-muted mt-2">Current status: <strong>{order.status.replace(/-/g, ' ')}</strong></p>
      </header>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="rounded-3xl border border-brand-cream-dark bg-white p-6 shadow-sm">
          <h2 className="font-display text-2xl text-brand-ink mb-4">Shipping address</h2>
          <div className="space-y-2 text-sm text-brand-muted">
            <p>{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
            <p>{order.shippingAddress.line1}</p>
            {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
            <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}</p>
            <p>{order.shippingAddress.country}</p>
            <p>Phone: {order.shippingAddress.phone}</p>
          </div>

          <h3 className="font-display text-xl text-brand-ink mt-8 mb-4">Items</h3>
          <div className="space-y-4">
            {order.items.map((item) => (
              <div key={item._id} className="rounded-3xl border border-brand-cream border-opacity-60 p-4">
                <p className="font-semibold text-brand-ink">{item.name}</p>
                <p className="text-sm text-brand-muted">Qty: {item.quantity} • ₹{item.subtotal.toLocaleString('en-IN')}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-brand-cream-dark bg-white p-6 shadow-sm">
            <h2 className="font-display text-2xl text-brand-ink mb-4">Order summary</h2>
            <div className="space-y-3 text-sm text-brand-muted">
              <p>Subtotal: ₹{order.subtotal.toLocaleString('en-IN')}</p>
              <p>Shipping: ₹{order.shippingFee.toLocaleString('en-IN')}</p>
              <p>Tax: ₹{order.tax.toLocaleString('en-IN')}</p>
              <p>Discount: ₹{order.discount.toLocaleString('en-IN')}</p>
              <p className="font-semibold">Total: ₹{order.total.toLocaleString('en-IN')}</p>
            </div>
          </div>

          <div className="rounded-3xl border border-brand-cream-dark bg-white p-6 shadow-sm">
            <h2 className="font-display text-2xl text-brand-ink mb-4">Update status</h2>
            <div className="space-y-4">
              <label className="text-sm text-brand-muted block">
                New status
                <select
                  value={orderStatus}
                  onChange={(e) => setStatus(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-brand-cream-dark bg-brand-cream px-4 py-3 text-sm outline-none focus:border-brand-gold"
                >
                  <option value="">Select status</option>
                  {statuses.map((option) => (
                    <option key={option} value={option}>{option.replace(/-/g, ' ')}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm text-brand-muted block">
                Note (optional)
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  className="mt-2 w-full rounded-2xl border border-brand-cream-dark bg-brand-cream px-4 py-3 text-sm outline-none focus:border-brand-gold"
                />
              </label>
              <button
                type="button"
                onClick={handleUpdate}
                disabled={updateStatus.isPending || !orderStatus}
                className="w-full rounded-full bg-brand-maroon px-5 py-3 text-sm font-semibold text-white hover:bg-brand-maroon-dark disabled:cursor-not-allowed disabled:opacity-50"
              >
                {updateStatus.isPending ? 'Updating…' : 'Update order status'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
