'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { Trash2, Plus, Minus, Tag, Shield, Truck, Lock, X, ShoppingBag, ChevronDown, ArrowRight, RotateCcw } from 'lucide-react';
import { useUnifiedCart } from '@/hooks/useUnifiedCart';
import { useApplyCoupon, useRemoveCoupon } from '@/hooks/useCart';
import { formatPrice, cn } from '@/lib/utils';
import { calculateTotals, SHIPPING_FREE_THRESHOLD, TAX_RATE } from '@/lib/pricing';
import { transition } from '@/lib/motion';
import Breadcrumb from '@/components/common/Breadcrumb';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/providers/ToastProvider';
import { useConfirm } from '@/components/providers/ConfirmProvider';

function CartSkeleton() {
  return (
    <div className="container-custom grid grid-cols-1 lg:grid-cols-3 gap-8 py-10" aria-busy="true" aria-label="Loading your bag">
      <div className="lg:col-span-2 space-y-4">
        <div className="skeleton h-9 w-56" />
        {[0, 1].map((i) => (
          <div key={i} className="surface p-4 flex gap-4">
            <div className="skeleton w-28 h-28 md:w-32 md:h-32" />
            <div className="flex-1 space-y-3 pt-1">
              <div className="skeleton h-4 w-3/4" />
              <div className="skeleton h-4 w-1/3" />
              <div className="skeleton h-9 w-32 rounded-full" />
            </div>
          </div>
        ))}
      </div>
      <div className="skeleton h-80 rounded-card" />
    </div>
  );
}

export default function CartPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const {
    items,
    updateQuantity,
    removeItem,
    subtotal,
    couponCode,
    couponDiscount,
    isGuest,
    isLoading,
    isMutating,
  } = useUnifiedCart();

  const [couponOpen, setCouponOpen] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [removingKey, setRemovingKey] = useState<string | null>(null);
  const applyCoupon = useApplyCoupon();
  const removeCoupon = useRemoveCoupon();

  // Mobile sticky bar shows only while the summary's checkout button is
  // still below the fold — hidden once it's visible or scrolled past, so it
  // never covers the summary or the footer.
  const summaryCtaRef = useRef<HTMLAnchorElement>(null);
  const [showStickyBar, setShowStickyBar] = useState(true);
  useEffect(() => {
    const el = summaryCtaRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      setShowStickyBar(!entry.isIntersecting && entry.boundingClientRect.top > 0);
    });
    observer.observe(el);
    return () => observer.disconnect();
    // Re-attach when the summary mounts (after loading / first item).
  }, [isLoading, items.length > 0]);

  // Same calculation checkout and the server use, so the total shown here is
  // the total the customer will actually pay.
  const totals = useMemo(() => calculateTotals(subtotal, couponDiscount), [subtotal, couponDiscount]);
  const toFreeShipping = Math.max(0, SHIPPING_FREE_THRESHOLD - (subtotal - couponDiscount));
  const itemCount = items.reduce((n, i) => n + i.quantity, 0);

  const handleApplyCoupon = async () => {
    const code = couponInput.trim();
    if (!code) return;
    setCouponError('');
    try {
      await applyCoupon.mutateAsync(code);
      setCouponInput('');
      setCouponOpen(false);
      toast.success(`Coupon ${code} applied`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not apply this coupon.';
      setCouponError(message);
      toast.error(message);
    }
  };

  const handleRemoveItem = async (key: string, name: string) => {
    const ok = await confirm({
      title: 'Remove from your bag?',
      description: (
        <>
          <span className="font-medium text-brand-ink">{name}</span> will be removed from your shopping bag.
        </>
      ),
      confirmLabel: 'Remove',
      cancelLabel: 'Keep it',
    });
    if (!ok) return;
    setRemovingKey(key);
    try {
      await removeItem(key);
      toast.info('Removed from your bag', { description: name });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not remove this item.');
    } finally {
      setRemovingKey(null);
    }
  };

  const handleQuantityChange = async (key: string, quantity: number) => {
    try {
      await updateQuantity(key, quantity);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update the quantity.');
    }
  };

  const handleRemoveCoupon = async () => {
    const ok = await confirm({
      title: 'Remove coupon?',
      description: couponCode
        ? `The ${couponCode} discount will no longer apply to this order.`
        : 'The discount will no longer apply to this order.',
      confirmLabel: 'Remove coupon',
      tone: 'warning',
    });
    if (!ok) return;
    removeCoupon.mutate(undefined, {
      onSuccess: () => toast.info('Coupon removed'),
      onError: (err) =>
        toast.error(err instanceof Error ? err.message : 'Could not remove the coupon.'),
    });
  };

  // Only the signed-in cart is fetched; guests render instantly from local state.
  if (isLoading) return <CartSkeleton />;

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-16">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={transition.slow}
          className="w-28 h-28 rounded-full bg-white shadow-card ring-1 ring-brand-line grid place-items-center mb-8"
        >
          <ShoppingBag size={40} strokeWidth={1.25} className="text-brand-gold-dark" />
        </motion.div>
        <h1 className="font-display text-4xl text-brand-ink">Your bag is empty</h1>
        <p className="text-sm text-brand-muted mt-3 max-w-sm">
          Discover pieces crafted to be treasured — your favourites will wait for you here.
        </p>
        <div className="flex flex-wrap justify-center gap-3 mt-8">
          <Link href="/jewellery" className="btn-primary">
            Start shopping <ArrowRight size={16} />
          </Link>
          <Link href="/wishlist" className="btn-outline">View wishlist</Link>
        </div>
      </div>
    );
  }

  const summaryRows = (
    <div className="space-y-3 text-sm">
      <div className="flex justify-between">
        <span className="text-brand-muted">Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
        <span className="tabular-nums">{formatPrice(totals.subtotal)}</span>
      </div>
      {totals.discount > 0 && (
        <div className="flex justify-between text-emerald-700">
          <span>Coupon discount</span>
          <span className="tabular-nums">− {formatPrice(totals.discount)}</span>
        </div>
      )}
      <div className="flex justify-between">
        <span className="text-brand-muted">Shipping</span>
        {totals.shippingFee === 0 ? (
          <span className="text-emerald-700 font-medium">Free</span>
        ) : (
          <span className="tabular-nums">{formatPrice(totals.shippingFee)}</span>
        )}
      </div>
      <div className="flex justify-between">
        <span className="text-brand-muted">Taxes ({Math.round(TAX_RATE * 100)}%)</span>
        <span className="tabular-nums">{formatPrice(totals.tax)}</span>
      </div>
      <div className="flex justify-between items-baseline pt-4 border-t border-brand-line">
        <span className="font-medium text-brand-ink">Total</span>
        <motion.span
          key={totals.total}
          initial={{ opacity: 0.4, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={transition.base}
          className="font-display text-2xl text-brand-ink"
        >
          {formatPrice(totals.total)}
        </motion.span>
      </div>
    </div>
  );

  return (
    <div className="pb-24 lg:pb-0">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Shopping Bag' }]} />

      <div className="container-custom grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10 pb-16">
        {/* Items */}
        <div className="lg:col-span-2">
          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <h1 className="font-display text-4xl text-brand-ink">Shopping Bag</h1>
              <p className="text-sm text-brand-muted mt-1">
                {itemCount} {itemCount === 1 ? 'piece' : 'pieces'} in your bag
              </p>
            </div>
            <Link href="/jewellery" className="hidden sm:inline-flex text-sm font-medium text-brand-maroon link-underline">
              Continue shopping
            </Link>
          </div>

          {/* Free-shipping progress — only when there's a gap to close. */}
          {toFreeShipping > 0 && (
            <div className="surface-muted p-4 mb-4">
              <p className="text-sm text-brand-ink">
                Add <span className="font-semibold">{formatPrice(toFreeShipping)}</span> more for free insured delivery
              </p>
              <div className="mt-2.5 h-1.5 rounded-full bg-brand-line overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-brand-gold to-brand-maroon"
                  initial={false}
                  animate={{ width: `${Math.min(100, ((subtotal - couponDiscount) / SHIPPING_FREE_THRESHOLD) * 100)}%` }}
                  transition={transition.slow}
                />
              </div>
            </div>
          )}

          {/* Items list — removals collapse smoothly, the rest slide up. */}
          <ul className="space-y-4">
            <AnimatePresence initial={false}>
              {items.map((item) => (
                <motion.li
                  key={item.key}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: removingKey === item.key ? 0.5 : 1, y: 0 }}
                  exit={{ opacity: 0, x: -24, transition: { duration: 0.2 } }}
                  transition={transition.slow}
                  className="surface p-4 flex gap-4 md:gap-5"
                >
                  <Link
                    href={item.slug ? `/product/${item.slug}` : '/jewellery'}
                    className="group relative w-24 h-24 md:w-32 md:h-32 flex-none rounded-control overflow-hidden bg-brand-cream ring-1 ring-brand-line"
                    tabIndex={-1}
                    aria-hidden="true"
                  >
                    <Image
                      src={item.image}
                      alt=""
                      fill
                      className="object-cover transition-transform duration-[400ms] ease-premium group-hover:scale-105"
                      sizes="128px"
                    />
                  </Link>
                  <div className="flex-1 min-w-0 flex flex-col">
                    <div className="flex items-start justify-between gap-3">
                      {/* Product routes are keyed by slug, not id. */}
                      <Link
                        href={item.slug ? `/product/${item.slug}` : '/jewellery'}
                        className="font-medium text-sm md:text-base text-brand-ink hover:text-brand-maroon transition-colors duration-base line-clamp-2"
                      >
                        {item.name}
                      </Link>
                      <button
                        onClick={() => handleRemoveItem(item.key, item.name)}
                        disabled={isMutating}
                        className="btn-icon h-9 w-9 -mr-1 -mt-1 flex-none text-brand-muted hover:text-brand-maroon"
                        aria-label={`Remove ${item.name} from bag`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="text-xs text-brand-muted mt-1 space-y-0.5">
                      {item.size && <p>Size: {item.size}</p>}
                      {!item.inStock && (
                        <p className="text-brand-maroon font-medium">Out of stock — remove to continue</p>
                      )}
                    </div>

                    <div className="flex items-end justify-between gap-4 mt-auto pt-3">
                      <div className="inline-flex items-center rounded-full ring-1 ring-brand-line bg-white" role="group" aria-label={`Quantity for ${item.name}`}>
                        <button
                          onClick={() => handleQuantityChange(item.key, item.quantity - 1)}
                          disabled={item.quantity <= 1 || isMutating}
                          className="btn-icon h-9 w-9 text-brand-ink"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-8 text-center text-sm font-semibold tabular-nums" aria-live="polite">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(item.key, item.quantity + 1)}
                          disabled={item.quantity >= item.maxQty || isMutating}
                          className="btn-icon h-9 w-9 text-brand-ink"
                          aria-label="Increase quantity"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="font-display text-xl text-brand-ink">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                        {item.quantity > 1 && (
                          <p className="text-[11px] text-brand-muted tabular-nums">{formatPrice(item.price)} each</p>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>

          {/* Trust signals */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
            {[
              { icon: Shield, title: 'Purity guaranteed', subtitle: 'BIS hallmarked pieces' },
              { icon: Truck, title: 'Insured delivery', subtitle: `Free above ${formatPrice(SHIPPING_FREE_THRESHOLD)}` },
              { icon: RotateCcw, title: '30-day returns', subtitle: 'On unworn pieces' },
            ].map((it) => (
              <div key={it.title} className="surface-muted p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white ring-1 ring-brand-line grid place-items-center flex-none">
                  <it.icon size={18} className="text-brand-gold-dark" strokeWidth={1.75} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-brand-ink">{it.title}</p>
                  <p className="text-[11px] text-brand-muted">{it.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <aside className="lg:sticky lg:top-36 lg:self-start space-y-4">
          {isGuest && (
            <Link
              href="/account/login?redirect=/cart"
              className="group surface-muted p-5 flex items-center gap-3 transition-[border-color,box-shadow] duration-base hover:border-brand-gold hover:shadow-soft"
            >
              <div className="flex-1">
                <p className="text-sm text-brand-maroon font-semibold">Sign in or create an account</p>
                <p className="text-xs text-brand-muted mt-1">Apply coupons, save your bag and track your orders.</p>
              </div>
              <ArrowRight size={16} className="text-brand-maroon transition-transform duration-base group-hover:translate-x-1" />
            </Link>
          )}

          <div className="surface p-6">
            <h2 className="font-display text-2xl text-brand-ink mb-5">Order Summary</h2>

            {/* Coupons are applied against the server cart, so guests are
                prompted to sign in rather than shown a control that can't work. */}
            {couponCode ? (
              <div className="rounded-control border border-emerald-600/30 bg-emerald-50 p-3 flex items-center gap-2 text-sm mb-5">
                <Tag size={16} className="text-emerald-700" />
                <span className="flex-1 font-medium text-emerald-800">{couponCode} applied</span>
                <button
                  onClick={handleRemoveCoupon}
                  disabled={removeCoupon.isPending}
                  className="btn-icon h-8 w-8 text-emerald-800 hover:text-brand-maroon"
                  aria-label="Remove coupon"
                >
                  <X size={14} />
                </button>
              </div>
            ) : !isGuest ? (
              <div className="mb-5">
                <button
                  onClick={() => setCouponOpen((o) => !o)}
                  aria-expanded={couponOpen}
                  className="w-full rounded-control border border-dashed border-brand-gold/70 p-3 flex items-center gap-2 text-sm transition-colors duration-base hover:bg-brand-cream"
                >
                  <Tag size={16} className="text-brand-gold-dark" />
                  <span className="flex-1 text-left">Have a coupon code?</span>
                  <ChevronDown size={16} className={cn('text-brand-muted transition-transform duration-base', couponOpen && 'rotate-180')} />
                </button>

                <AnimatePresence initial={false}>
                  {couponOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={transition.base}
                      className="overflow-hidden"
                    >
                      <div className="pt-3">
                        <div className="flex gap-2">
                          <input
                            value={couponInput}
                            onChange={(e) => {
                              setCouponInput(e.target.value.toUpperCase());
                              setCouponError('');
                            }}
                            onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                            placeholder="Enter code"
                            aria-label="Coupon code"
                            aria-invalid={couponError ? true : undefined}
                            className="input-field h-11 uppercase"
                          />
                          <Button
                            variant="secondary"
                            className="h-11"
                            onClick={handleApplyCoupon}
                            loading={applyCoupon.isPending}
                            disabled={!couponInput.trim()}
                          >
                            Apply
                          </Button>
                        </div>
                        {couponError && <p className="text-xs text-brand-maroon mt-1.5">{couponError}</p>}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : null}

            {summaryRows}

            <Link ref={summaryCtaRef} href="/checkout" className="btn-primary btn-lg w-full mt-6">
              <Lock size={15} /> Secure Checkout
            </Link>

            {totals.discount > 0 && (
              <p className="text-xs text-brand-muted text-center mt-3">
                You save <span className="text-emerald-700 font-semibold">{formatPrice(totals.discount)}</span> on this order
              </p>
            )}
          </div>
        </aside>
      </div>

      {/* Mobile sticky checkout bar — the summary is far down on small screens. */}
      <div
        aria-hidden={!showStickyBar}
        className={cn(
          'lg:hidden fixed inset-x-0 bottom-0 z-40 border-t border-brand-line bg-white/90 backdrop-blur-xl px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_-12px_rgba(61,15,15,0.18)]',
          'transition-[transform,opacity] duration-slow ease-premium',
          showStickyBar ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none invisible'
        )}
      >
        <div className="flex items-center gap-4 max-w-xl mx-auto">
          <div className="flex-1 min-w-0">
            <p className="text-[11px] uppercase tracking-wider text-brand-muted">Total</p>
            <p className="font-display text-xl text-brand-ink leading-tight">{formatPrice(totals.total)}</p>
          </div>
          <Link href="/checkout" className="btn-primary h-12 px-7" tabIndex={showStickyBar ? 0 : -1}>
            <Lock size={15} /> Checkout
          </Link>
        </div>
      </div>
    </div>
  );
}
