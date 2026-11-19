'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { ArrowLeft, Gift, MapPin, Phone, CreditCard, Clock } from 'lucide-react';
import { useAdminOrder, useUpdateOrderStatus } from '@/hooks/useAdmin';
import { formatPrice, resolveImageUrl, cn } from '@/lib/utils';
import { useConfirm } from '@/components/providers/ConfirmProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { Button, Field, Select, Textarea } from '@/components/admin/FormControls';
import {
  Panel,
  StatusBadge,
  PaymentBadge,
  AdminSkeleton,
  AdminError,
  ORDER_STATUSES,
  STATUS_STYLE,
  formatDate,
} from '@/components/admin/ui';
import type { Order } from '@/lib/types';

export default function AdminOrderDetailPage() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const [status, setStatus] = useState('');
  const [note, setNote] = useState('');
  const { data: order, isLoading, error, refetch } = useAdminOrder(id);
  const updateStatus = useUpdateOrderStatus();
  const confirm = useConfirm();
  const toast = useToast();

  const orderStatus = useMemo(() => status || order?.status || '', [order, status]);
  const changed = !!order && orderStatus !== order.status;

  const handleUpdate = async () => {
    if (!id || !orderStatus || !order) return;
    if (orderStatus === 'cancelled' || orderStatus === 'returned') {
      const ok = await confirm({
        title: orderStatus === 'cancelled' ? `Cancel order ${order.orderNumber}?` : `Mark ${order.orderNumber} as returned?`,
        description: 'The customer will see this status on their order immediately.',
        confirmLabel: orderStatus === 'cancelled' ? 'Cancel order' : 'Mark returned',
      });
      if (!ok) return;
    }
    try {
      await updateStatus.mutateAsync({ id, status: orderStatus as Order['status'], note: note || undefined });
      toast.success('Order status updated', { description: orderStatus.replace(/-/g, ' ') });
      setNote('');
      setStatus('');
      refetch();
    } catch (err) {
      toast.error((err as Error).message || 'Could not update the status.');
    }
  };

  if (isLoading) return <AdminSkeleton rows={5} />;
  if (error || !order) {
    return <AdminError title="Unable to load this order" message="It may have been removed, or the order number is wrong." />;
  }

  const a = order.shippingAddress;
  const history = [...(order.statusHistory ?? [])].reverse();

  return (
    <div>
      <Link href="/admin/orders" className="mb-5 inline-flex items-center gap-1.5 text-[13px] font-medium text-admin-muted hover:text-admin-ink">
        <ArrowLeft size={15} /> All orders
      </Link>

      <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-admin-gold-ink">Order</p>
          <h1 className="text-[28px] font-bold tracking-[-0.03em] text-admin-ink">{order.orderNumber}</h1>
          <p className="mt-1.5 text-sm text-admin-muted">Placed {formatDate(order.createdAt, true)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={order.status} />
          <PaymentBadge status={order.paymentStatus} />
          {order.isGift && (
            <span className="inline-flex items-center gap-1 rounded-full bg-admin-gold-soft px-2.5 py-1 text-xs font-medium text-admin-gold-ink ring-1 ring-inset ring-admin-gold/30">
              <Gift size={12} /> Gift
            </span>
          )}
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
        <div className="space-y-6">
          <Panel title={`Items (${order.items.length})`} bodyClassName="p-0 sm:p-0">
            <ul className="divide-y divide-admin-line">
              {order.items.map((item) => (
                <li key={item._id} className="flex items-center gap-4 px-5 py-4 sm:px-6">
                  <div className="relative h-16 w-16 flex-none overflow-hidden rounded-xl border border-admin-line bg-admin-subtle">
                    {item.image && (
                      <Image src={resolveImageUrl(item.image)} alt={item.name} fill sizes="64px" className="object-cover" unoptimized />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-admin-ink">{item.name}</p>
                    <p className="mt-0.5 text-xs text-admin-muted">
                      {formatPrice(item.unitPrice)} × {item.quantity}
                      {item.size ? ` · Size ${item.size}` : ''}
                    </p>
                    {item.customisation?.summary && (
                      <p className="mt-1 text-xs font-medium text-admin-gold-ink">{item.customisation.summary}</p>
                    )}
                  </div>
                  <p className="font-semibold tabular-nums text-admin-ink">{formatPrice(item.subtotal)}</p>
                </li>
              ))}
            </ul>
            <dl className="space-y-2 border-t border-admin-line bg-admin-subtle px-5 py-4 text-sm sm:px-6">
              {[
                ['Subtotal', order.subtotal],
                ['Shipping', order.shippingFee],
                ['Tax', order.tax],
              ].map(([k, v]) => (
                <div key={k as string} className="flex justify-between text-admin-body">
                  <dt>{k}</dt>
                  <dd className="tabular-nums">{formatPrice(v as number)}</dd>
                </div>
              ))}
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <dt>Discount{order.couponCode ? ` (${order.couponCode})` : ''}</dt>
                  <dd className="tabular-nums">−{formatPrice(order.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between border-t border-admin-line pt-2.5 text-base font-bold text-admin-ink">
                <dt>Total</dt>
                <dd className="tabular-nums">{formatPrice(order.total)}</dd>
              </div>
            </dl>
          </Panel>

          <div className="grid gap-6 md:grid-cols-2">
            <Panel title="Delivery address">
              <div className="flex gap-3 text-sm leading-relaxed text-admin-body">
                <MapPin size={17} className="mt-0.5 flex-none text-admin-gold-ink" />
                <div>
                  <p className="font-semibold text-admin-ink">{a.firstName} {a.lastName}</p>
                  <p>{a.line1}</p>
                  {a.line2 && <p>{a.line2}</p>}
                  <p>{a.city}, {a.state} {a.pincode}</p>
                  <p>{a.country}</p>
                </div>
              </div>
              <p className="mt-4 flex items-center gap-3 text-sm text-admin-body">
                <Phone size={16} className="text-admin-gold-ink" /> {a.phone}
              </p>
            </Panel>
            <Panel title="Payment">
              <div className="space-y-3 text-sm">
                <p className="flex items-center gap-3 text-admin-body">
                  <CreditCard size={16} className="text-admin-gold-ink" />
                  <span className="uppercase">{order.paymentMethod}</span>
                  <PaymentBadge status={order.paymentStatus} />
                </p>
                {order.transactionId && <p className="break-all text-xs text-admin-muted">Ref: {order.transactionId}</p>}
                <p className="flex items-center gap-3 text-admin-body">
                  <Clock size={16} className="text-admin-gold-ink" />
                  Est. delivery {formatDate(order.estimatedDelivery)}
                </p>
                {order.giftNote && (
                  <p className="rounded-xl bg-admin-gold-soft p-3 text-xs italic text-admin-gold-ink">“{order.giftNote}”</p>
                )}
              </div>
            </Panel>
          </div>
        </div>

        <div className="space-y-6">
          <Panel title="Update status" description="Customers see changes on their order page">
            <div className="space-y-4">
              <Field label="New status">
                <Select options={ORDER_STATUSES} value={orderStatus} onChange={(e) => setStatus(e.target.value)} />
              </Field>
              <Field label="Note" hint="Optional — e.g. courier and tracking number">
                <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Shipped via BlueDart, AWB 1234…" />
              </Field>
              <Button onClick={handleUpdate} disabled={updateStatus.isPending || !changed} className="w-full">
                {updateStatus.isPending ? 'Updating…' : changed ? `Mark as ${orderStatus.replace(/-/g, ' ')}` : 'Choose a new status'}
              </Button>
            </div>
          </Panel>

          <Panel title="Timeline">
            {history.length === 0 ? (
              <p className="text-sm text-admin-muted">No status changes recorded yet.</p>
            ) : (
              <ol className="relative space-y-5 pl-6">
                <span className="absolute bottom-2 left-[5px] top-2 w-px bg-admin-line" aria-hidden="true" />
                {history.map((h, i) => (
                  <li key={`${h.at}-${i}`} className="relative">
                    <span
                      className={cn(
                        'absolute -left-6 top-1 h-[11px] w-[11px] rounded-full ring-4 ring-admin-surface',
                        STATUS_STYLE[h.status]?.dot ?? 'bg-stone-400',
                        i !== 0 && 'opacity-50'
                      )}
                      aria-hidden="true"
                    />
                    <p className={cn('text-sm font-semibold capitalize', i === 0 ? 'text-admin-ink' : 'text-admin-body')}>
                      {h.status.replace(/-/g, ' ')}
                    </p>
                    {h.note && <p className="mt-0.5 text-[13px] text-admin-body">{h.note}</p>}
                    <p className="mt-0.5 text-xs text-admin-muted">{formatDate(h.at, true)}</p>
                  </li>
                ))}
              </ol>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
