'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Trash2, Plus, Minus, Tag, Shield, Truck, Lock, X } from 'lucide-react';
import { useUnifiedCart } from '@/hooks/useUnifiedCart';
import { useApplyCoupon, useRemoveCoupon } from '@/hooks/useCart';
import { formatPrice } from '@/lib/utils';
import Breadcrumb from '@/components/common/Breadcrumb';
import { SectionLoader } from '@/components/common/Loading';
import { useToast } from '@/components/providers/ToastProvider';

export default function CartPage() {
  const toast = useToast();
  const {
    items,
    updateQuantity,
    removeItem,
    subtotal,
    couponCode,
    couponDiscount,
    total,
    isGuest,
    isLoading,
    isMutating,
  } = useUnifiedCart();

  const [couponOpen, setCouponOpen] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const applyCoupon = useApplyCoupon();
  const removeCoupon = useRemoveCoupon();

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
    try {
      await removeItem(key);
      toast.info('Removed from your bag', { description: name });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not remove this item.');
    }
  };

  const handleQuantityChange = async (key: string, quantity: number) => {
    try {
      await updateQuantity(key, quantity);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update the quantity.');
    }
  };

  const handleRemoveCoupon = () => {
    removeCoupon.mutate(undefined, {
      onSuccess: () => toast.info('Coupon removed'),
      onError: (err) =>
        toast.error(err instanceof Error ? err.message : 'Could not remove the coupon.'),
    });
  };

  // Only the signed-in cart is fetched; guests render instantly from local state.
  if (isLoading) return <SectionLoader label="Loading your bag..." />;

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <div className="w-32 h-32 rounded-full bg-brand-cream grid place-items-center mb-6">
          <span className="text-5xl">🛍️</span>
        </div>
        <h1 className="font-display text-3xl text-brand-ink">Your bag is empty</h1>
        <p className="text-sm text-brand-muted mt-2">Discover beautiful pieces curated for you.</p>
        <Link href="/shop/jewellery" className="btn-primary mt-6">Continue Shopping</Link>
      </div>
    );
  }

  return (
    <div>
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Shopping Bag' }]} />

      <div className="container-custom grid grid-cols-1 lg:grid-cols-3 gap-8 pb-16">
        {/* Items */}
        <div className="lg:col-span-2">
          <h1 className="font-display text-3xl text-brand-ink mb-2">Shopping Bag</h1>
          <p className="text-sm text-brand-muted mb-6">{items.length} item{items.length > 1 ? 's' : ''} in your bag</p>

          {/* Delivery */}
          <div className="bg-white border border-brand-cream-dark rounded-lg p-4 mb-4">
            <h3 className="text-sm font-medium mb-3">Delivery Details</h3>
            <div className="flex gap-3">
              <select className="px-3 py-2 text-sm border border-brand-cream-dark rounded outline-none focus:border-brand-gold w-32">
                <option>🇮🇳 IN</option>
              </select>
              <input
                type="text"
                placeholder="Enter Pincode"
                className="flex-1 px-3 py-2 text-sm border border-brand-cream-dark rounded outline-none focus:border-brand-gold"
              />
              <button className="px-4 text-sm text-brand-maroon font-medium hover:underline">Check</button>
            </div>
          </div>

          {/* Items list */}
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.key} className="bg-white border border-brand-cream-dark rounded-lg p-4 flex gap-4">
                <div className="relative w-24 h-24 md:w-32 md:h-32 flex-none rounded overflow-hidden bg-brand-cream">
                  <Image src={item.image} alt={item.name} fill className="object-cover" sizes="128px" />
                </div>
                <div className="flex-1 min-w-0">
                  {/* Product routes are keyed by slug, not id. */}
                  <Link href={item.slug ? `/product/${item.slug}` : '/jewellery'} className="font-medium text-sm text-brand-ink hover:text-brand-maroon line-clamp-2">
                    {item.name}
                  </Link>
                  <div className="text-xs text-brand-muted mt-1 space-y-0.5">
                    {item.size && <p>Size: {item.size} MM</p>}
                    {!item.inStock && <p className="text-brand-maroon font-medium">Out of stock — remove to continue</p>}
                  </div>
                  <p className="font-display text-lg text-brand-ink mt-2">{formatPrice(item.price)}</p>

                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center border border-brand-cream-dark rounded">
                      <button
                        onClick={() => handleQuantityChange(item.key, item.quantity - 1)}
                        disabled={item.quantity <= 1 || isMutating}
                        className="w-8 h-8 grid place-items-center hover:bg-brand-cream disabled:opacity-40 disabled:hover:bg-transparent"
                        aria-label="Decrease"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-10 text-center text-sm">{item.quantity}</span>
                      <button
                        onClick={() => handleQuantityChange(item.key, item.quantity + 1)}
                        disabled={item.quantity >= item.maxQty || isMutating}
                        className="w-8 h-8 grid place-items-center hover:bg-brand-cream disabled:opacity-40 disabled:hover:bg-transparent"
                        aria-label="Increase"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <button
                      onClick={() => handleRemoveItem(item.key, item.name)}
                      disabled={isMutating}
                      className="text-xs text-brand-muted hover:text-brand-maroon flex items-center gap-1 disabled:opacity-40"
                    >
                      <Trash2 size={14} /> Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Trust signals */}
          <div className="grid grid-cols-3 gap-3 mt-6">
            {[
              { icon: Shield, title: 'Purity Guaranteed', subtitle: 'on every online purchase' },
              { icon: Truck, title: 'Secure Delivery', subtitle: 'by our trusted partners' },
              { icon: Lock, title: 'Easy & Secure Payments', subtitle: 'backed by trust' },
            ].map((it) => (
              <div key={it.title} className="bg-white border border-brand-cream-dark rounded-lg p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-cream grid place-items-center flex-none">
                  <it.icon size={18} className="text-brand-maroon" />
                </div>
                <div>
                  <p className="text-xs font-medium text-brand-ink">{it.title}</p>
                  <p className="text-[10px] text-brand-muted">{it.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <aside className="lg:sticky lg:top-32 lg:self-start">
          <div className="bg-gradient-to-br from-brand-cream to-white border border-brand-cream-dark rounded-lg p-6 mb-4">
            <p className="text-sm text-brand-maroon font-medium">Login/Sign Up</p>
            <p className="text-xs text-brand-muted mt-1">To unlock exclusive rewards with Encircle Points & Neucoins.</p>
          </div>

          <div className="bg-white border border-brand-cream-dark rounded-lg p-6">
            <h2 className="font-display text-xl text-brand-ink mb-4">Order Summary</h2>

            {/* Coupons are applied against the server cart, so guests are
                prompted to sign in rather than shown a control that can't work. */}
            {couponCode ? (
              <div className="border border-green-600/40 bg-green-50 rounded p-3 flex items-center gap-2 text-sm mb-4">
                <Tag size={16} className="text-green-700" />
                <span className="flex-1 font-medium text-green-800">{couponCode} applied</span>
                <button
                  onClick={handleRemoveCoupon}
                  disabled={removeCoupon.isPending}
                  className="text-green-800 hover:text-brand-maroon disabled:opacity-40"
                  aria-label="Remove coupon"
                >
                  <X size={14} />
                </button>
              </div>
            ) : isGuest ? (
              <Link
                href="/account/login?redirect=/cart"
                className="border border-brand-cream-dark rounded p-3 flex items-center gap-2 text-sm hover:border-brand-gold mb-4"
              >
                <Tag size={16} className="text-brand-gold-dark" />
                <span className="flex-1">Sign in to apply a coupon</span>
                <span className="text-brand-muted">›</span>
              </Link>
            ) : (
              <div className="mb-4">
                <button
                  onClick={() => setCouponOpen((o) => !o)}
                  className="w-full border border-brand-cream-dark rounded p-3 flex items-center gap-2 text-sm hover:border-brand-gold"
                >
                  <Tag size={16} className="text-brand-gold-dark" />
                  <span className="flex-1 text-left">Apply Coupon code / Promo Code</span>
                  <span className="text-brand-muted">{couponOpen ? '⌄' : '›'}</span>
                </button>

                {couponOpen && (
                  <div className="mt-2">
                    <div className="flex gap-2">
                      <input
                        value={couponInput}
                        onChange={(e) => {
                          setCouponInput(e.target.value.toUpperCase());
                          setCouponError('');
                        }}
                        onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                        placeholder="Enter code"
                        className="flex-1 px-3 py-2 text-sm border border-brand-cream-dark rounded outline-none focus:border-brand-gold uppercase"
                      />
                      <button
                        onClick={handleApplyCoupon}
                        disabled={applyCoupon.isPending || !couponInput.trim()}
                        className="px-4 text-sm text-brand-maroon font-medium hover:underline disabled:opacity-40"
                      >
                        {applyCoupon.isPending ? 'Applying...' : 'Apply'}
                      </button>
                    </div>
                    {couponError && <p className="text-xs text-brand-maroon mt-1.5">{couponError}</p>}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-brand-muted">Sub Total</span><span>{formatPrice(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-brand-muted">Product Discount</span><span>{couponDiscount > 0 ? `- ${formatPrice(couponDiscount)}` : '- ₹0'}</span></div>
              <div className="flex justify-between"><span className="text-brand-muted">Shipping</span><span className="text-green-700">Free</span></div>
              <div className="flex justify-between pt-3 border-t border-brand-cream-dark text-base font-semibold">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            <Link href="/checkout" className="btn-primary w-full mt-5">Proceed to Checkout</Link>

            <p className="text-xs text-brand-muted text-center mt-3">You Save: <span className="text-green-700 font-medium">+ {formatPrice(couponDiscount)}</span></p>
          </div>
        </aside>
      </div>
    </div>
  );
}
