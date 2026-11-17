'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Package, MapPin, CalendarDays } from 'lucide-react';
import { useOrder } from '@/hooks/useOrders';
import { formatPrice } from '@/lib/utils';
import { SectionLoader } from '@/components/common/Loading';

const formatDate = (value?: string) =>
  value
    ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '5-7 business days';

function Confirmation() {
  // Checkout redirects here with ?order=<orderNumber>; the API accepts either
  // the order number or the Mongo id.
  const orderNumber = useSearchParams().get('order') || undefined;
  const { data: order, isLoading } = useOrder(orderNumber);

  if (orderNumber && isLoading) return <SectionLoader label="Loading your order..." />;

  const address = order?.shippingAddress;

  return (
    <div className="container-custom py-16">
      <div className="max-w-2xl mx-auto text-center">
        <div className="w-20 h-20 mx-auto rounded-full bg-green-50 grid place-items-center mb-6">
          <CheckCircle2 size={42} className="text-green-600" />
        </div>
        <h1 className="font-display text-4xl text-brand-ink">Thank You for Your Order!</h1>
        <p className="text-brand-muted mt-3">
          {order?.paymentMethod === 'cod'
            ? "Your order is confirmed. You'll pay when it arrives."
            : "We're crafting your order with care."}
        </p>

        <div className="bg-white border border-brand-cream-dark rounded-lg p-6 mt-8 text-left">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-xs text-brand-muted">Order ID</p>
              <p className="font-display text-xl">
                {order ? `#${order.orderNumber}` : orderNumber ? `#${orderNumber}` : '—'}
              </p>
            </div>
            <Link href="/account" className="btn-outline text-sm py-2">Track Order</Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-brand-cream-dark">
            <div className="flex items-start gap-3">
              <Package size={18} className="text-brand-gold-dark mt-0.5" />
              <div>
                <p className="text-xs text-brand-muted">Status</p>
                <p className="text-sm font-medium capitalize">{order?.status || 'Confirmed'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CalendarDays size={18} className="text-brand-gold-dark mt-0.5" />
              <div>
                <p className="text-xs text-brand-muted">Estimated Delivery</p>
                <p className="text-sm font-medium">{formatDate(order?.estimatedDelivery)}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin size={18} className="text-brand-gold-dark mt-0.5" />
              <div>
                <p className="text-xs text-brand-muted">Shipping to</p>
                <p className="text-sm font-medium">
                  {address ? `${address.city}, ${address.state} — ${address.pincode}` : 'Your saved address'}
                </p>
              </div>
            </div>
          </div>

          {order && (
            <div className="mt-6 pt-6 border-t border-brand-cream-dark">
              <div className="space-y-2">
                {order.items.map((item) => (
                  <div key={item._id} className="flex justify-between text-sm">
                    <span className="text-brand-muted">
                      {item.name} × {item.quantity}
                    </span>
                    <span>{formatPrice(item.subtotal)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between pt-3 mt-3 border-t border-brand-cream-dark font-semibold">
                <span>Total paid</span>
                <span>{formatPrice(order.total)}</span>
              </div>
              {order.paymentStatus !== 'paid' && order.paymentMethod !== 'cod' && (
                <p className="text-xs text-brand-maroon mt-3">
                  Payment is still {order.paymentStatus}. You can retry it from your account.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-center mt-8">
          <Link href="/" className="btn-outline">Continue Shopping</Link>
          <Link href="/account" className="btn-primary">View My Account</Link>
        </div>
      </div>
    </div>
  );
}

export default function OrderConfirmationPage() {
  // useSearchParams requires a Suspense boundary in the app router.
  return (
    <Suspense fallback={<SectionLoader label="Loading your order..." />}>
      <Confirmation />
    </Suspense>
  );
}
