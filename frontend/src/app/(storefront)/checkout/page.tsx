'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Check, CreditCard, Wallet, Building2, Smartphone, Truck } from 'lucide-react';
import Breadcrumb from '@/components/common/Breadcrumb';
import { useUnifiedCart } from '@/hooks/useUnifiedCart';
import { useCurrentUser, useLogin } from '@/hooks/useAuth';
import {
  useCreateOrder,
  usePaymentConfig,
  useCreatePaymentSession,
  useVerifyPayment,
  useMarkPaymentFailed,
  useAddAddress,
} from '@/hooks/useOrders';
import { calculateTotals } from '@/lib/pricing';
import { formatPrice, cn } from '@/lib/utils';
import { SectionLoader } from '@/components/common/Loading';
import { useToast } from '@/components/providers/ToastProvider';
import type { Address, Order } from '@/lib/types';

const steps = ['Login', 'Address', 'Payment', 'Review'];

const emptyAddress = {
  firstName: '',
  lastName: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  pincode: '',
  country: 'India',
};

type AddressForm = typeof emptyAddress;

/**
 * Mirrors backend/validators/orderValidator.js so problems surface inline
 * instead of as a 400 after the customer presses Place Order.
 */
const validateAddress = (a: AddressForm): Partial<Record<keyof AddressForm, string>> => {
  const errors: Partial<Record<keyof AddressForm, string>> = {};
  if (!a.firstName.trim()) errors.firstName = 'First name is required';
  if (!/^[+\d\s-]{7,20}$/.test(a.phone.trim())) errors.phone = 'Enter a valid phone number';
  if (a.line1.trim().length < 3) errors.line1 = 'Address is required';
  if (a.city.trim().length < 2) errors.city = 'City is required';
  if (a.state.trim().length < 2) errors.state = 'State is required';
  if (!/^\d{6}$/.test(a.pincode.trim())) errors.pincode = 'Enter a 6-digit pincode';
  return errors;
};

/** Load the Razorpay checkout script on demand, once. */
const loadRazorpay = (): Promise<boolean> =>
  new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    if ((window as any).Razorpay) return resolve(true);

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

export default function CheckoutPage() {
  const router = useRouter();
  const toast = useToast();
  const { data: user, isLoading: userLoading } = useCurrentUser();
  const { items, subtotal, couponCode, couponDiscount, isLoading: cartLoading } = useUnifiedCart();
  const { data: paymentConfig } = usePaymentConfig();

  const login = useLogin();
  const addAddress = useAddAddress();
  const createOrder = useCreateOrder();
  const createSession = useCreatePaymentSession();
  const verifyPayment = useVerifyPayment();
  const markFailed = useMarkPaymentFailed();

  const [step, setStep] = useState(1);
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');

  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [address, setAddress] = useState<AddressForm>(emptyAddress);
  const [addressErrors, setAddressErrors] = useState<Partial<Record<keyof AddressForm, string>>>({});
  const [saveAddress, setSaveAddress] = useState(true);

  const [paymentMethod, setPaymentMethod] = useState<Order['paymentMethod']>('cod');
  const [placeError, setPlaceError] = useState('');
  const [placing, setPlacing] = useState(false);

  const totals = useMemo(
    () => calculateTotals(subtotal, couponDiscount),
    [subtotal, couponDiscount]
  );

  // Skip the login step once we know who the visitor is, and prefill from
  // their default address.
  useEffect(() => {
    if (!user) return;
    setStep((s) => (s === 1 ? 2 : s));

    const saved = user.addresses || [];
    if (saved.length && !selectedAddressId) {
      const preferred = saved.find((a) => a.isDefault) || saved[0];
      setSelectedAddressId(preferred._id);
    } else if (!saved.length) {
      setAddress((a) => ({
        ...a,
        firstName: a.firstName || user.firstName || '',
        lastName: a.lastName || user.lastName || '',
        phone: a.phone || user.phone || '',
      }));
    }
  }, [user, selectedAddressId]);

  // Never offer an online method the server can't actually process.
  const razorpayEnabled = paymentConfig?.razorpayEnabled ?? false;
  useEffect(() => {
    if (!razorpayEnabled && paymentMethod !== 'cod') setPaymentMethod('cod');
  }, [razorpayEnabled, paymentMethod]);

  const savedAddresses: Address[] = user?.addresses || [];
  const usingSaved = Boolean(selectedAddressId);

  const effectiveAddress = useMemo(() => {
    if (usingSaved) {
      const found = savedAddresses.find((a) => a._id === selectedAddressId);
      if (found) {
        const { _id, label, isDefault, ...rest } = found;
        return rest as AddressForm;
      }
    }
    return address;
  }, [usingSaved, savedAddresses, selectedAddressId, address]);

  if (userLoading || cartLoading) return <SectionLoader label="Preparing checkout..." />;

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <div className="w-32 h-32 rounded-full bg-brand-cream grid place-items-center mb-6">
          <span className="text-5xl">🛍️</span>
        </div>
        <h1 className="font-display text-3xl text-brand-ink">Your bag is empty</h1>
        <p className="text-sm text-brand-muted mt-2">Add something you love before checking out.</p>
        <Link href="/jewellery" className="btn-primary mt-6">Continue Shopping</Link>
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      await login.mutateAsync(credentials);
      toast.success('Signed in');
      setStep(2);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not sign in.';
      setLoginError(message);
      toast.error(message);
    }
  };

  const handleAddressContinue = () => {
    if (usingSaved) {
      setStep(3);
      return;
    }
    const errors = validateAddress(address);
    setAddressErrors(errors);
    if (Object.keys(errors).length === 0) setStep(3);
  };

  /**
   * Place the order, then settle payment.
   *
   * The order is created first so there is a durable record before any money
   * moves; the gateway attaches to that order id. A dismissed or failed
   * payment leaves the order `pending` and retryable from order history
   * rather than silently lost.
   */
  const handlePlaceOrder = async () => {
    setPlaceError('');
    setPlacing(true);

    try {
      if (!usingSaved) {
        const errors = validateAddress(address);
        if (Object.keys(errors).length) {
          setAddressErrors(errors);
          setStep(2);
          setPlacing(false);
          return;
        }
        if (saveAddress) {
          // Non-fatal: failing to save the address book entry must not block
          // the purchase itself.
          try {
            await addAddress.mutateAsync({
              ...address,
              label: 'Home',
              isDefault: savedAddresses.length === 0,
            } as never);
          } catch {
            /* ignored */
          }
        }
      }

      const order = await createOrder.mutateAsync({
        shippingAddress: effectiveAddress as never,
        paymentMethod,
      });

      if (paymentMethod === 'cod') {
        toast.success('Order placed', { description: `Order ${order.orderNumber} is confirmed.` });
        router.push(`/order-confirmation?order=${order.orderNumber}`);
        return;
      }

      /* ── Online payment ── */
      const session = await createSession.mutateAsync(order._id);

      const ready = await loadRazorpay();
      if (!ready) {
        await markFailed
          .mutateAsync({ orderId: order._id, reason: 'Gateway script blocked' })
          .catch(() => undefined);
        const message =
          'Could not load the payment window. Your order is saved — retry payment from your order history.';
        setPlaceError(message);
        toast.error(message);
        setPlacing(false);
        return;
      }

      const rzp = new (window as any).Razorpay({
        key: session.keyId,
        amount: session.amount,
        currency: session.currency,
        name: 'Aurelia',
        description: `Order ${session.orderNumber}`,
        order_id: session.razorpayOrderId,
        prefill: {
          name: `${effectiveAddress.firstName} ${effectiveAddress.lastName || ''}`.trim(),
          email: user?.email,
          contact: effectiveAddress.phone,
        },
        theme: { color: '#7B1E3A' },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            await verifyPayment.mutateAsync({
              orderId: order._id,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            });
            toast.success('Payment successful', {
              description: `Order ${order.orderNumber} is confirmed.`,
            });
            router.push(`/order-confirmation?order=${order.orderNumber}`);
          } catch (err) {
            const message =
              err instanceof Error
                ? `Payment could not be verified: ${err.message}`
                : 'Payment could not be verified.';
            setPlaceError(message);
            toast.error(message);
            setPlacing(false);
          }
        },
        modal: {
          ondismiss: async () => {
            await markFailed
              .mutateAsync({ orderId: order._id, reason: 'Cancelled by customer' })
              .catch(() => undefined);
            const message = 'Payment was cancelled. Your order is saved — you can retry it from your orders.';
            setPlaceError(message);
            toast.warning(message);
            setPlacing(false);
          },
        },
      });

      rzp.on('payment.failed', async (resp: { error?: { description?: string } }) => {
        await markFailed
          .mutateAsync({ orderId: order._id, reason: resp?.error?.description })
          .catch(() => undefined);
        const message = resp?.error?.description || 'Payment failed. Please try another method.';
        setPlaceError(message);
        toast.error(message);
        setPlacing(false);
      });

      rzp.open();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not place your order.';
      setPlaceError(message);
      toast.error(message);
      setPlacing(false);
    }
  };

  const field = (key: keyof AddressForm, placeholder: string, className = '') => (
    <div className={className}>
      <input
        value={address[key]}
        onChange={(e) => {
          setAddress((a) => ({ ...a, [key]: e.target.value }));
          setAddressErrors((prev) => ({ ...prev, [key]: undefined }));
        }}
        placeholder={placeholder}
        className={cn(
          'w-full px-4 py-3 border rounded outline-none focus:border-brand-gold text-sm',
          addressErrors[key] ? 'border-brand-maroon' : 'border-brand-cream-dark'
        )}
      />
      {addressErrors[key] && <p className="text-xs text-brand-maroon mt-1">{addressErrors[key]}</p>}
    </div>
  );

  const paymentOptions = [
    { id: 'card' as const, icon: CreditCard, title: 'Credit / Debit Card', subtitle: 'Visa, Mastercard, AMEX, RuPay', online: true },
    { id: 'upi' as const, icon: Smartphone, title: 'UPI', subtitle: 'Google Pay, PhonePe, Paytm & more', online: true },
    { id: 'netbanking' as const, icon: Building2, title: 'Net Banking', subtitle: 'All major Indian banks', online: true },
    { id: 'cod' as const, icon: Wallet, title: 'Cash on Delivery', subtitle: 'Pay when you receive', online: false },
  ].filter((m) => !m.online || razorpayEnabled);

  return (
    <div>
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Cart', href: '/cart' }, { label: 'Checkout' }]} />

      <div className="container-custom pb-16">
        {/* Stepper */}
        <div className="flex items-center justify-center gap-2 md:gap-6 mb-10 flex-wrap">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={cn(
                  'w-8 h-8 rounded-full grid place-items-center text-xs font-semibold',
                  i + 1 < step ? 'bg-green-600 text-white' : i + 1 === step ? 'bg-brand-maroon text-white' : 'bg-brand-cream text-brand-muted'
                )}
              >
                {i + 1 < step ? <Check size={14} /> : i + 1}
              </div>
              <span className={cn('text-sm hidden md:block', i + 1 === step ? 'text-brand-maroon font-medium' : 'text-brand-muted')}>{s}</span>
              {i < steps.length - 1 && <div className="w-8 md:w-16 h-px bg-brand-cream-dark" />}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {/* Step 1: Login */}
            {step === 1 && (
              <div className="bg-white border border-brand-cream-dark rounded-lg p-6 md:p-8">
                <h2 className="font-display text-2xl text-brand-ink mb-6">Sign in to continue</h2>
                {/* Orders are tied to an account so they can be tracked and
                    cancelled later — checkout therefore requires signing in. */}
                <form onSubmit={handleLogin} className="space-y-4">
                  <input
                    type="email"
                    required
                    value={credentials.email}
                    onChange={(e) => setCredentials((c) => ({ ...c, email: e.target.value }))}
                    placeholder="Email"
                    className="w-full px-4 py-3 border border-brand-cream-dark rounded outline-none focus:border-brand-gold text-sm"
                  />
                  <input
                    type="password"
                    required
                    value={credentials.password}
                    onChange={(e) => setCredentials((c) => ({ ...c, password: e.target.value }))}
                    placeholder="Password"
                    className="w-full px-4 py-3 border border-brand-cream-dark rounded outline-none focus:border-brand-gold text-sm"
                  />
                  {loginError && <p className="text-sm text-brand-maroon">{loginError}</p>}
                  <button type="submit" disabled={login.isPending} className="btn-primary w-full disabled:opacity-60">
                    {login.isPending ? 'Signing in...' : 'Sign In & Continue'}
                  </button>
                  <div className="flex items-center gap-3 text-xs text-brand-muted">
                    <div className="flex-1 h-px bg-brand-cream-dark" /> OR <div className="flex-1 h-px bg-brand-cream-dark" />
                  </div>
                  <Link href="/account/register?redirect=/checkout" className="btn-outline w-full block text-center">
                    Create an Account
                  </Link>
                </form>
              </div>
            )}

            {/* Step 2: Address */}
            {step === 2 && (
              <div className="bg-white border border-brand-cream-dark rounded-lg p-6 md:p-8">
                <h2 className="font-display text-2xl text-brand-ink mb-6">Delivery Address</h2>

                {savedAddresses.length > 0 && (
                  <div className="space-y-3 mb-6">
                    {savedAddresses.map((a) => (
                      <label
                        key={a._id}
                        className={cn(
                          'flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors',
                          selectedAddressId === a._id ? 'border-brand-maroon' : 'border-brand-cream-dark hover:border-brand-maroon'
                        )}
                      >
                        <input
                          type="radio"
                          name="address"
                          checked={selectedAddressId === a._id}
                          onChange={() => setSelectedAddressId(a._id)}
                          className="accent-brand-maroon mt-1"
                        />
                        <div className="text-sm">
                          <p className="font-medium">
                            {a.firstName} {a.lastName}{' '}
                            {a.isDefault && <span className="text-xs text-brand-muted">(Default)</span>}
                          </p>
                          <p className="text-xs text-brand-muted mt-0.5">
                            {a.line1}{a.line2 ? `, ${a.line2}` : ''}, {a.city}, {a.state} — {a.pincode}
                          </p>
                          <p className="text-xs text-brand-muted">{a.phone}</p>
                        </div>
                      </label>
                    ))}

                    <label className="flex items-center gap-3 p-4 border border-brand-cream-dark rounded-lg cursor-pointer hover:border-brand-maroon transition-colors">
                      <input
                        type="radio"
                        name="address"
                        checked={!selectedAddressId}
                        onChange={() => setSelectedAddressId('')}
                        className="accent-brand-maroon"
                      />
                      <span className="text-sm font-medium">Use a new address</span>
                    </label>
                  </div>
                )}

                {!usingSaved && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      {field('firstName', 'First Name')}
                      {field('lastName', 'Last Name')}
                      {field('phone', 'Phone Number', 'col-span-2')}
                      {field('line1', 'House / Flat', 'col-span-2')}
                      {field('line2', 'Street / Locality (optional)', 'col-span-2')}
                      {field('city', 'City')}
                      {field('state', 'State')}
                      {field('pincode', 'Pincode', 'col-span-2')}
                    </div>

                    <label className="flex items-center gap-2 mt-4 text-sm text-brand-muted cursor-pointer">
                      <input
                        type="checkbox"
                        checked={saveAddress}
                        onChange={(e) => setSaveAddress(e.target.checked)}
                        className="accent-brand-maroon"
                      />
                      Save this address for next time
                    </label>
                  </>
                )}

                <div className="mt-6 p-4 border border-brand-cream-dark rounded-lg flex items-center gap-3">
                  <Truck className="text-brand-gold-dark" size={20} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Or pickup from our store</p>
                    <p className="text-xs text-brand-muted">Schedule an appointment at your nearest boutique</p>
                  </div>
                  <Link href="/store-locator" className="text-sm text-brand-maroon font-medium hover:underline">
                    Find Store
                  </Link>
                </div>

                <div className="flex justify-between gap-3 mt-6">
                  <button onClick={handleAddressContinue} className="btn-primary flex-1 md:flex-none md:px-12 ml-auto">
                    Save &amp; Continue
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Payment */}
            {step === 3 && (
              <div className="bg-white border border-brand-cream-dark rounded-lg p-6 md:p-8">
                <h2 className="font-display text-2xl text-brand-ink mb-6">Payment Method</h2>

                {!razorpayEnabled && (
                  <p className="text-xs text-brand-muted mb-4">
                    Online payment is currently unavailable. You can complete this order with Cash on Delivery.
                  </p>
                )}

                <div className="space-y-3">
                  {paymentOptions.map((m) => (
                    <label
                      key={m.id}
                      className={cn(
                        'flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-colors',
                        paymentMethod === m.id ? 'border-brand-maroon' : 'border-brand-cream-dark hover:border-brand-maroon'
                      )}
                    >
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === m.id}
                        onChange={() => setPaymentMethod(m.id)}
                        className="accent-brand-maroon"
                      />
                      <m.icon size={22} className="text-brand-gold-dark" />
                      <div>
                        <p className="text-sm font-medium">{m.title}</p>
                        <p className="text-xs text-brand-muted">{m.subtitle}</p>
                      </div>
                    </label>
                  ))}
                </div>

                <div className="flex justify-between gap-3 mt-6">
                  <button onClick={() => setStep(2)} className="btn-outline">Back</button>
                  <button onClick={() => setStep(4)} className="btn-primary flex-1 md:flex-none md:px-12">Review Order</button>
                </div>
              </div>
            )}

            {/* Step 4: Review */}
            {step === 4 && (
              <div className="bg-white border border-brand-cream-dark rounded-lg p-6 md:p-8">
                <h2 className="font-display text-2xl text-brand-ink mb-6">Review Your Order</h2>

                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.key} className="flex gap-3 pb-3 border-b border-brand-cream-dark last:border-0">
                      <div className="relative w-16 h-16 rounded overflow-hidden bg-brand-cream flex-none">
                        <Image src={item.image} alt={item.name} fill className="object-cover" sizes="64px" />
                      </div>
                      <div className="flex-1 text-sm">
                        <p className="font-medium line-clamp-1">{item.name}</p>
                        <p className="text-xs text-brand-muted">
                          Qty: {item.quantity}{item.size ? ` · Size ${item.size}` : ''}
                        </p>
                      </div>
                      <p className="text-sm font-medium">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 text-sm">
                  <p className="font-medium text-brand-ink">Delivering to</p>
                  <p className="text-xs text-brand-muted mt-1">
                    {effectiveAddress.firstName} {effectiveAddress.lastName}, {effectiveAddress.line1}
                    {effectiveAddress.line2 ? `, ${effectiveAddress.line2}` : ''}, {effectiveAddress.city},{' '}
                    {effectiveAddress.state} — {effectiveAddress.pincode}
                  </p>
                  <p className="text-xs text-brand-muted mt-2">
                    Paying by{' '}
                    <span className="font-medium text-brand-ink">
                      {paymentOptions.find((m) => m.id === paymentMethod)?.title}
                    </span>
                  </p>
                </div>

                <p className="text-xs text-brand-muted mt-4">Estimated delivery: 5-7 business days</p>

                {placeError && <p role="alert" className="text-sm text-brand-maroon mt-4">{placeError}</p>}

                <div className="flex justify-between gap-3 mt-6">
                  <button onClick={() => setStep(3)} disabled={placing} className="btn-outline disabled:opacity-50">Back</button>
                  <button
                    onClick={handlePlaceOrder}
                    disabled={placing}
                    className="btn-primary flex-1 md:flex-none md:px-12 text-center disabled:opacity-60"
                  >
                    {placing ? 'Placing order...' : paymentMethod === 'cod' ? 'Place Order' : `Pay ${formatPrice(totals.total)}`}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Summary sidebar */}
          <aside className="lg:sticky lg:top-32 lg:self-start">
            <div className="bg-white border border-brand-cream-dark rounded-lg p-6">
              <h3 className="font-display text-xl mb-4">Order Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-brand-muted">Items ({items.length})</span>
                  <span>{formatPrice(totals.subtotal)}</span>
                </div>
                {totals.discount > 0 && (
                  <div className="flex justify-between text-green-700">
                    <span>Discount{couponCode ? ` (${couponCode})` : ''}</span>
                    <span>- {formatPrice(totals.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-brand-muted">Shipping</span>
                  {totals.shippingFee === 0
                    ? <span className="text-green-700">Free</span>
                    : <span>{formatPrice(totals.shippingFee)}</span>}
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-muted">Taxes (3%)</span>
                  <span>{formatPrice(totals.tax)}</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-brand-cream-dark font-semibold text-base">
                  <span>Total</span>
                  <span>{formatPrice(totals.total)}</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
