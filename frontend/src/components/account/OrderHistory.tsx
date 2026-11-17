'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronDown, X } from 'lucide-react';
import { useMyOrders, useCancelOrder } from '@/hooks/useOrders';
import { formatPrice, cn, resolveImageUrl, IMAGE_PLACEHOLDER } from '@/lib/utils';
import { SectionLoader } from '@/components/common/Loading';
import { useToast } from '@/components/providers/ToastProvider';
import type { Order } from '@/lib/types';

/** Progression a normal order moves through — drives the tracking bar. */
const TRACK_STEPS = ['confirmed', 'processing', 'shipped', 'out-for-delivery', 'delivered'] as const;

const STATUS_LABEL: Record<string, string> = {
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  'out-for-delivery': 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  returned: 'Returned',
};

const formatDate = (v?: string) =>
  v ? new Date(v).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

/** Orders can only be cancelled before they leave the warehouse. */
const isCancellable = (status: Order['status']) =>
  !['shipped', 'out-for-delivery', 'delivered', 'cancelled', 'returned'].includes(status);

function OrderCard({ order }: { order: Order }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const cancelOrder = useCancelOrder();

  const currentStep = TRACK_STEPS.indexOf(order.status as (typeof TRACK_STEPS)[number]);
  const isTerminal = order.status === 'cancelled' || order.status === 'returned';

  const handleCancel = async () => {
    if (reason.trim().length < 3) {
      setError('Please tell us why (at least 3 characters).');
      return;
    }
    setError('');
    try {
      await cancelOrder.mutateAsync({ id: order._id, reason: reason.trim() });
      setCancelling(false);
      setReason('');
      toast.success('Order cancelled', {
        description: `${order.orderNumber} — any stock has been returned.`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not cancel this order.';
      setError(message);
      toast.error(message);
    }
  };

  return (
    <div className="bg-white border border-brand-cream-dark rounded-lg overflow-hidden">
      <div className="p-4 md:p-5 flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-0">
          <p className="font-display text-lg text-brand-ink">#{order.orderNumber}</p>
          <p className="text-xs text-brand-muted mt-0.5">
            Placed {formatDate(order.createdAt)} · {order.items.length} item
            {order.items.length > 1 ? 's' : ''}
          </p>
        </div>

        <div className="text-right">
          <p className="font-medium text-brand-ink">{formatPrice(order.total)}</p>
          <span
            className={cn(
              'inline-block text-[10px] uppercase tracking-wider px-2 py-0.5 rounded mt-1',
              isTerminal
                ? 'bg-brand-cream text-brand-muted'
                : order.status === 'delivered'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-brand-maroon/10 text-brand-maroon'
            )}
          >
            {STATUS_LABEL[order.status] || order.status}
          </span>
        </div>

        <button
          onClick={() => setOpen((o) => !o)}
          className="w-8 h-8 grid place-items-center rounded-full hover:bg-brand-cream transition-colors"
          aria-label={open ? 'Hide order details' : 'Show order details'}
          aria-expanded={open}
        >
          <ChevronDown size={18} className={cn('transition-transform', open && 'rotate-180')} />
        </button>
      </div>

      {open && (
        <div className="border-t border-brand-cream-dark p-4 md:p-5 space-y-5">
          {/* Tracking */}
          {!isTerminal && (
            <div>
              <p className="text-xs font-medium text-brand-ink mb-3">Tracking</p>
              <div className="flex items-center">
                {TRACK_STEPS.map((s, i) => (
                  <div key={s} className="flex items-center flex-1 last:flex-none">
                    <div
                      className={cn(
                        'w-3 h-3 rounded-full flex-none',
                        i <= currentStep ? 'bg-brand-maroon' : 'bg-brand-cream-dark'
                      )}
                      title={STATUS_LABEL[s]}
                    />
                    {i < TRACK_STEPS.length - 1 && (
                      <div
                        className={cn(
                          'h-px flex-1',
                          i < currentStep ? 'bg-brand-maroon' : 'bg-brand-cream-dark'
                        )}
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-2">
                {TRACK_STEPS.map((s, i) => (
                  <span
                    key={s}
                    className={cn(
                      'text-[9px] md:text-[10px] text-center',
                      i <= currentStep ? 'text-brand-maroon font-medium' : 'text-brand-muted'
                    )}
                  >
                    {STATUS_LABEL[s]}
                  </span>
                ))}
              </div>
              <p className="text-xs text-brand-muted mt-3">
                Estimated delivery: {formatDate(order.estimatedDelivery)}
              </p>
            </div>
          )}

          {/* Items */}
          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item._id} className="flex gap-3">
                <div className="relative w-14 h-14 rounded overflow-hidden bg-brand-cream flex-none">
                  <Image
                    src={item.image ? resolveImageUrl(item.image) : IMAGE_PLACEHOLDER}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                </div>
                <div className="flex-1 text-sm min-w-0">
                  <Link
                    href={item.slug ? `/product/${item.slug}` : '/jewellery'}
                    className="font-medium line-clamp-1 hover:text-brand-maroon"
                  >
                    {item.name}
                  </Link>
                  <p className="text-xs text-brand-muted">
                    Qty: {item.quantity}
                    {item.size ? ` · Size ${item.size}` : ''}
                  </p>
                </div>
                <p className="text-sm font-medium">{formatPrice(item.subtotal)}</p>
              </div>
            ))}
          </div>

          {/* Totals + address */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-brand-cream-dark">
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-brand-muted">Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-700">
                  <span>Discount{order.couponCode ? ` (${order.couponCode})` : ''}</span>
                  <span>- {formatPrice(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-brand-muted">Shipping</span>
                <span>{order.shippingFee === 0 ? 'Free' : formatPrice(order.shippingFee)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-muted">Tax</span>
                <span>{formatPrice(order.tax)}</span>
              </div>
              <div className="flex justify-between font-semibold pt-2 border-t border-brand-cream-dark">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
              <p className="text-xs text-brand-muted pt-1">
                Payment: {order.paymentMethod.toUpperCase()} · {order.paymentStatus}
              </p>
            </div>

            <div className="text-sm">
              <p className="font-medium text-brand-ink">Delivery address</p>
              <p className="text-xs text-brand-muted mt-1 leading-relaxed">
                {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                <br />
                {order.shippingAddress.line1}
                {order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ''}
                <br />
                {order.shippingAddress.city}, {order.shippingAddress.state} —{' '}
                {order.shippingAddress.pincode}
                <br />
                {order.shippingAddress.phone}
              </p>
            </div>
          </div>

          {/* Cancellation */}
          {isCancellable(order.status) && (
            <div className="pt-4 border-t border-brand-cream-dark">
              {!cancelling ? (
                <button
                  onClick={() => setCancelling(true)}
                  className="text-xs text-brand-muted hover:text-brand-maroon"
                >
                  Cancel this order
                </button>
              ) : (
                <div>
                  <div className="flex gap-2">
                    <input
                      value={reason}
                      onChange={(e) => {
                        setReason(e.target.value);
                        setError('');
                      }}
                      placeholder="Reason for cancellation"
                      className="flex-1 px-3 py-2 text-sm border border-brand-cream-dark rounded outline-none focus:border-brand-gold"
                    />
                    <button
                      onClick={handleCancel}
                      disabled={cancelOrder.isPending}
                      className="px-4 text-sm text-brand-maroon font-medium hover:underline disabled:opacity-40"
                    >
                      {cancelOrder.isPending ? 'Cancelling...' : 'Confirm'}
                    </button>
                    <button
                      onClick={() => {
                        setCancelling(false);
                        setError('');
                      }}
                      className="w-8 grid place-items-center text-brand-muted hover:text-brand-ink"
                      aria-label="Keep order"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  {error && <p className="text-xs text-brand-maroon mt-1.5">{error}</p>}
                </div>
              )}
            </div>
          )}

          {order.status === 'cancelled' && (
            <p className="text-xs text-brand-muted pt-4 border-t border-brand-cream-dark">
              This order was cancelled. Any stock has been returned to our catalogue.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function OrderHistory() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch } = useMyOrders({ page, limit: 10 });

  if (isLoading) return <SectionLoader label="Loading your orders..." />;

  if (isError) {
    return (
      <div className="bg-white border border-brand-cream-dark rounded-lg p-8 text-center">
        <h2 className="font-display text-2xl text-brand-ink mb-2">Couldn&apos;t load your orders</h2>
        <p className="text-sm text-brand-muted">Something went wrong. Please try again.</p>
        <button onClick={() => refetch()} className="btn-primary mt-6">
          Retry
        </button>
      </div>
    );
  }

  const orders = data?.items ?? [];

  // Preserves the original empty-state design.
  if (orders.length === 0) {
    return (
      <div className="bg-white border border-brand-cream-dark rounded-lg p-8 text-center">
        <h2 className="font-display text-2xl text-brand-ink mb-6">Order History</h2>
        <div className="py-12">
          <div className="w-32 h-32 mx-auto bg-brand-cream rounded-lg grid place-items-center mb-4 text-5xl">
            📦
          </div>
          <p className="font-display text-2xl text-brand-maroon">No Order Details Yet!</p>
          <p className="text-sm text-brand-muted mt-2">Add Aurelia to your jewellery wardrobe</p>
          <Link href="/jewellery" className="btn-primary mt-6 inline-flex">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  const pagination = data?.pagination;

  return (
    <div>
      <h2 className="font-display text-2xl text-brand-ink mb-6">Order History</h2>
      <div className="space-y-4">
        {orders.map((order) => (
          <OrderCard key={order._id} order={order} />
        ))}
      </div>

      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-8">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={!pagination.hasPrev}
            className="btn-outline text-sm py-2 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-brand-muted">
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!pagination.hasNext}
            className="btn-outline text-sm py-2 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
