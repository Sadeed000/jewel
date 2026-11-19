'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Check, CreditCard, Wallet, Building2, Smartphone, Truck, Lock, Store, MapPin, RotateCcw, Headphones, ShoppingBag,
} from 'lucide-react';
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
import Button from '@/components/ui/Button';
import { transition } from '@/lib/motion';
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

/** Custom radio dot used by the address and payment cards. */
function RadioDot({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'grid h-5 w-5 flex-none place-items-center rounded-full border-2 transition-colors duration-base',
        checked ? 'border-brand-maroon' : 'border-brand-line'
      )}
    >
      <motion.span
        initial={false}
        animate={{ scale: checked ? 1 : 0 }}
        transition={{ type: 'spring', stiffness: 600, damping: 25 }}
        className="h-2.5 w-2.5 rounded-full bg-brand-maroon"
      />
    </span>
  );
}

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
  // +1 forward / -1 back — drives the slide direction between steps.
  const [direction, setDirection] = useState(1);
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
        <div className="w-28 h-28 rounded-full bg-white shadow-card ring-1 ring-brand-line grid place-items-center mb-8">
          <ShoppingBag size={40} strokeWidth={1.25} className="text-brand-gold-dark" />
        </div>
        <h1 className="font-display text-4xl text-brand-ink">Your bag is empty</h1>
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
          setDirection(-1);
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


  const field = (
    key: keyof AddressForm,
    label: string,
    className = '',
    inputProps: React.InputHTMLAttributes<HTMLInputElement> = {}
  ) => (
    <div className={className}>
      <label htmlFor={`addr-${key}`} className="block text-xs font-medium text-brand-ink mb-1.5">
        {label}
      </label>
      <input
        id={`addr-${key}`}
        value={address[key]}
        onChange={(e) => {
          setAddress((a) => ({ ...a, [key]: e.target.value }));
          setAddressErrors((prev) => ({ ...prev, [key]: undefined }));
        }}
        aria-invalid={addressErrors[key] ? true : undefined}
        aria-describedby={addressErrors[key] ? `addr-${key}-error` : undefined}
        className="input-field"
        {...inputProps}
      />
      <AnimatePresence initial={false}>
        {addressErrors[key] && (
          <motion.p
            id={`addr-${key}-error`}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={transition.fast}
            className="text-xs text-brand-maroon mt-1.5"
          >
            {addressErrors[key]}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );

  const paymentOptions = [
    { id: 'card' as const, icon: CreditCard, title: 'Credit / Debit Card', subtitle: 'Visa, Mastercard, AMEX, RuPay', online: true },
    { id: 'upi' as const, icon: Smartphone, title: 'UPI', subtitle: 'Google Pay, PhonePe, Paytm & more', online: true },
    { id: 'netbanking' as const, icon: Building2, title: 'Net Banking', subtitle: 'All major Indian banks', online: true },
    { id: 'cod' as const, icon: Wallet, title: 'Cash on Delivery', subtitle: 'Pay when you receive', online: false },
  ].filter((m) => !m.online || razorpayEnabled);

  // Step content slides in the direction of travel.
  const stepVariants = {
    enter: (d: number) => ({ opacity: 0, x: d * 24 }),
    center: { opacity: 1, x: 0, transition: transition.slow },
    exit: (d: number) => ({ opacity: 0, x: d * -24, transition: { duration: 0.15 } }),
  };
  const goToStep = (next: number) => {
    setDirection(next > step ? 1 : -1);
    setStep(next);
  };

  return (
    <div>
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Bag', href: '/cart' }, { label: 'Checkout' }]} />

      <div className="container-custom pb-16">
        {/* Stepper */}
        <ol className="relative flex items-start justify-between max-w-2xl mx-auto mb-12" aria-label="Checkout progress">
          {/* Track + animated fill sit behind the step markers. */}
          <span className="absolute left-4 right-4 top-4 h-[2px] bg-brand-line" aria-hidden="true" />
          <motion.span
            className="absolute left-4 top-4 h-[2px] bg-gradient-to-r from-brand-gold to-brand-maroon origin-left"
            style={{ right: '1rem' }}
            initial={false}
            animate={{ scaleX: (step - 1) / (steps.length - 1) }}
            transition={transition.slow}
            aria-hidden="true"
          />
          {steps.map((s, i) => {
            const n = i + 1;
            const done = n < step;
            const current = n === step;
            return (
              <li key={s} className="relative flex flex-col items-center gap-2" aria-current={current ? 'step' : undefined}>
                <motion.div
                  initial={false}
                  animate={{ scale: current ? 1.1 : 1 }}
                  transition={transition.base}
                  className={cn(
                    'relative z-10 w-8 h-8 rounded-full grid place-items-center text-xs font-semibold ring-4 ring-brand-cream transition-colors duration-slow',
                    done
                      ? 'bg-emerald-600 text-white'
                      : current
                        ? 'bg-brand-maroon text-white shadow-btn-primary'
                        : 'bg-white text-brand-muted ring-offset-0 border border-brand-line'
                  )}
                >
                  {done ? <Check size={14} strokeWidth={3} /> : n}
                </motion.div>
                <span className={cn('text-xs sm:text-sm transition-colors duration-base', current ? 'text-brand-maroon font-semibold' : 'text-brand-muted')}>
                  {s}
                </span>
              </li>
            );
          })}
        </ol>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
          <div className="lg:col-span-2 overflow-hidden lg:overflow-visible">
            <AnimatePresence mode="wait" custom={direction} initial={false}>
              {/* Step 1: Login */}
              {step === 1 && (
                <motion.section key="step-1" custom={direction} variants={stepVariants} initial="enter" animate="center" exit="exit" className="surface p-6 md:p-8">
                  <h2 className="font-display text-3xl text-brand-ink">Sign in to continue</h2>
                  <p className="text-sm text-brand-muted mt-1.5 mb-6">So you can track, manage and return your order.</p>
                  {/* Orders are tied to an account so they can be tracked and
                      cancelled later — checkout therefore requires signing in. */}
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <label htmlFor="checkout-email" className="block text-xs font-medium text-brand-ink mb-1.5">Email</label>
                      <input
                        id="checkout-email"
                        type="email"
                        required
                        autoComplete="email"
                        value={credentials.email}
                        onChange={(e) => setCredentials((c) => ({ ...c, email: e.target.value }))}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label htmlFor="checkout-password" className="block text-xs font-medium text-brand-ink mb-1.5">Password</label>
                      <input
                        id="checkout-password"
                        type="password"
                        required
                        autoComplete="current-password"
                        value={credentials.password}
                        onChange={(e) => setCredentials((c) => ({ ...c, password: e.target.value }))}
                        aria-invalid={loginError ? true : undefined}
                        className="input-field"
                      />
                    </div>
                    {loginError && <p role="alert" className="text-sm text-brand-maroon">{loginError}</p>}
                    <Button type="submit" size="lg" fullWidth loading={login.isPending} loadingText="Signing in…">
                      Sign In &amp; Continue
                    </Button>
                    <div className="flex items-center gap-3 text-xs text-brand-muted">
                      <div className="flex-1 h-px bg-brand-line" /> OR <div className="flex-1 h-px bg-brand-line" />
                    </div>
                    <Link href="/account/register?redirect=/checkout" className="btn-outline btn-lg w-full">
                      Create an Account
                    </Link>
                  </form>
                </motion.section>
              )}

              {/* Step 2: Address */}
              {step === 2 && (
                <motion.section key="step-2" custom={direction} variants={stepVariants} initial="enter" animate="center" exit="exit" className="surface p-6 md:p-8">
                  <h2 className="font-display text-3xl text-brand-ink mb-6">Delivery Address</h2>

                  {savedAddresses.length > 0 && (
                    <div className="space-y-3 mb-6" role="radiogroup" aria-label="Saved addresses">
                      {savedAddresses.map((a) => (
                        <label key={a._id} className="choice-card items-start">
                          <input
                            type="radio"
                            name="address"
                            checked={selectedAddressId === a._id}
                            onChange={() => setSelectedAddressId(a._id)}
                            className="sr-only"
                          />
                          <span className="mt-0.5"><RadioDot checked={selectedAddressId === a._id} /></span>
                          <div className="text-sm">
                            <p className="font-medium">
                              {a.firstName} {a.lastName}{' '}
                              {a.isDefault && (
                                <span className="ml-1 text-[10px] uppercase tracking-wider bg-brand-cream-dark text-brand-gold-ink rounded-full px-2 py-0.5">Default</span>
                              )}
                            </p>
                            <p className="text-xs text-brand-muted mt-1">
                              {a.line1}{a.line2 ? `, ${a.line2}` : ''}, {a.city}, {a.state} — {a.pincode}
                            </p>
                            <p className="text-xs text-brand-muted">{a.phone}</p>
                          </div>
                        </label>
                      ))}

                      <label className="choice-card">
                        <input
                          type="radio"
                          name="address"
                          checked={!selectedAddressId}
                          onChange={() => setSelectedAddressId('')}
                          className="sr-only"
                        />
                        <RadioDot checked={!selectedAddressId} />
                        <span className="text-sm font-medium">Use a new address</span>
                      </label>
                    </div>
                  )}

                  <AnimatePresence initial={false}>
                    {!usingSaved && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={transition.slow}
                        className="overflow-hidden"
                      >
                        <div className="grid grid-cols-2 gap-4 p-0.5">
                          {field('firstName', 'First name', '', { autoComplete: 'given-name' })}
                          {field('lastName', 'Last name', '', { autoComplete: 'family-name' })}
                          {field('phone', 'Phone number', 'col-span-2', { type: 'tel', autoComplete: 'tel', inputMode: 'tel' })}
                          {field('line1', 'House / Flat', 'col-span-2', { autoComplete: 'address-line1' })}
                          {field('line2', 'Street / Locality (optional)', 'col-span-2', { autoComplete: 'address-line2' })}
                          {field('city', 'City', '', { autoComplete: 'address-level2' })}
                          {field('state', 'State', '', { autoComplete: 'address-level1' })}
                          {field('pincode', 'Pincode', 'col-span-2 sm:col-span-1', { autoComplete: 'postal-code', inputMode: 'numeric', maxLength: 6 })}
                        </div>

                        <label className="flex items-center gap-2 mt-5 text-sm text-brand-muted cursor-pointer">
                          <input
                            type="checkbox"
                            checked={saveAddress}
                            onChange={(e) => setSaveAddress(e.target.checked)}
                            className="accent-brand-maroon w-4 h-4"
                          />
                          Save this address for next time
                        </label>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="mt-6 surface-muted p-4 flex items-center gap-3">
                    <Store className="text-brand-gold-dark flex-none" size={20} strokeWidth={1.75} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Prefer to pick up in store?</p>
                      <p className="text-xs text-brand-muted">Schedule an appointment at your nearest boutique</p>
                    </div>
                    <Link href="/store-locator" className="text-sm text-brand-maroon font-medium link-underline flex-none">
                      Find store
                    </Link>
                  </div>

                  <div className="flex justify-end gap-3 mt-8">
                    <Button size="lg" onClick={handleAddressContinue} className="flex-1 md:flex-none md:px-12">
                      Continue to Payment
                    </Button>
                  </div>
                </motion.section>
              )}

              {/* Step 3: Payment */}
              {step === 3 && (
                <motion.section key="step-3" custom={direction} variants={stepVariants} initial="enter" animate="center" exit="exit" className="surface p-6 md:p-8">
                  <h2 className="font-display text-3xl text-brand-ink mb-6">Payment Method</h2>

                  {!razorpayEnabled && (
                    <p className="text-xs text-brand-muted mb-4 surface-muted p-3">
                      Online payment is currently unavailable. You can complete this order with Cash on Delivery.
                    </p>
                  )}

                  <div className="space-y-3" role="radiogroup" aria-label="Payment method">
                    {paymentOptions.map((m) => (
                      <label key={m.id} className="choice-card">
                        <input
                          type="radio"
                          name="payment"
                          checked={paymentMethod === m.id}
                          onChange={() => setPaymentMethod(m.id)}
                          className="sr-only"
                        />
                        <RadioDot checked={paymentMethod === m.id} />
                        <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-brand-cream ring-1 ring-brand-line">
                          <m.icon size={19} className="text-brand-gold-dark" strokeWidth={1.75} />
                        </span>
                        <div>
                          <p className="text-sm font-medium">{m.title}</p>
                          <p className="text-xs text-brand-muted">{m.subtitle}</p>
                        </div>
                      </label>
                    ))}
                  </div>

                  <div className="flex justify-between gap-3 mt-8">
                    <Button variant="ghost" size="lg" onClick={() => goToStep(2)}>Back</Button>
                    <Button size="lg" onClick={() => goToStep(4)} className="flex-1 md:flex-none md:px-12">Review Order</Button>
                  </div>
                </motion.section>
              )}

              {/* Step 4: Review */}
              {step === 4 && (
                <motion.section key="step-4" custom={direction} variants={stepVariants} initial="enter" animate="center" exit="exit" className="surface p-6 md:p-8">
                  <h2 className="font-display text-3xl text-brand-ink mb-6">Review Your Order</h2>

                  <ul className="divide-y divide-brand-line">
                    {items.map((item) => (
                      <li key={item.key} className="flex items-center gap-4 py-3 first:pt-0">
                        <div className="relative w-16 h-16 rounded-control overflow-hidden bg-brand-cream ring-1 ring-brand-line flex-none">
                          <Image src={item.image} alt="" fill className="object-cover" sizes="64px" />
                        </div>
                        <div className="flex-1 min-w-0 text-sm">
                          <p className="font-medium line-clamp-1">{item.name}</p>
                          <p className="text-xs text-brand-muted mt-0.5">
                            Qty {item.quantity}{item.size ? ` · Size ${item.size}` : ''}
                          </p>
                        </div>
                        <p className="text-sm font-semibold tabular-nums">{formatPrice(item.price * item.quantity)}</p>
                      </li>
                    ))}
                  </ul>

                  <div className="grid sm:grid-cols-2 gap-3 mt-6">
                    <div className="surface-muted p-4 text-sm">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-brand-ink flex items-center gap-2"><MapPin size={15} className="text-brand-gold-dark" /> Delivering to</p>
                        <button onClick={() => goToStep(2)} className="text-xs font-medium text-brand-maroon link-underline" disabled={placing}>Change</button>
                      </div>
                      <p className="text-xs text-brand-muted mt-2 leading-relaxed">
                        {effectiveAddress.firstName} {effectiveAddress.lastName}, {effectiveAddress.line1}
                        {effectiveAddress.line2 ? `, ${effectiveAddress.line2}` : ''}, {effectiveAddress.city},{' '}
                        {effectiveAddress.state} — {effectiveAddress.pincode}
                      </p>
                    </div>
                    <div className="surface-muted p-4 text-sm">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-brand-ink flex items-center gap-2"><CreditCard size={15} className="text-brand-gold-dark" /> Paying by</p>
                        <button onClick={() => goToStep(3)} className="text-xs font-medium text-brand-maroon link-underline" disabled={placing}>Change</button>
                      </div>
                      <p className="text-xs text-brand-muted mt-2">
                        {paymentOptions.find((m) => m.id === paymentMethod)?.title}
                      </p>
                      <p className="text-xs text-brand-muted mt-1 flex items-center gap-1.5">
                        <Truck size={13} /> Estimated delivery: 5–7 business days
                      </p>
                    </div>
                  </div>

                  <AnimatePresence>
                    {placeError && (
                      <motion.p
                        role="alert"
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-sm text-brand-maroon mt-5 rounded-control bg-red-50 border border-brand-maroon/20 p-3"
                      >
                        {placeError}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  <div className="flex justify-between gap-3 mt-8">
                    <Button variant="ghost" size="lg" onClick={() => goToStep(3)} disabled={placing}>Back</Button>
                    <Button
                      size="lg"
                      onClick={handlePlaceOrder}
                      loading={placing}
                      loadingText={paymentMethod === 'cod' ? 'Placing order…' : 'Opening payment…'}
                      className="flex-1 md:flex-none md:px-12"
                      icon={<Lock size={15} />}
                    >
                      {paymentMethod === 'cod' ? 'Place Order' : `Pay ${formatPrice(totals.total)}`}
                    </Button>
                  </div>
                </motion.section>
              )}
            </AnimatePresence>
          </div>

          {/* Summary sidebar */}
          <aside className="lg:sticky lg:top-36 lg:self-start space-y-4">
            <div className="surface p-6">
              <h3 className="font-display text-2xl mb-5">Order Summary</h3>

              <ul className="space-y-3 mb-5 pb-5 border-b border-brand-line max-h-56 overflow-y-auto no-scrollbar">
                {items.map((item) => (
                  <li key={item.key} className="flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-control overflow-hidden bg-brand-cream ring-1 ring-brand-line flex-none">
                      <Image src={item.image} alt="" fill className="object-cover" sizes="48px" />
                      {item.quantity > 1 && (
                        <span className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-brand-maroon px-1 text-[10px] font-semibold text-white">
                          {item.quantity}
                        </span>
                      )}
                    </div>
                    <p className="flex-1 min-w-0 text-xs text-brand-ink line-clamp-2">{item.name}</p>
                    <p className="text-xs font-medium tabular-nums">{formatPrice(item.price * item.quantity)}</p>
                  </li>
                ))}
              </ul>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-brand-muted">Subtotal ({items.length} {items.length === 1 ? 'item' : 'items'})</span>
                  <span className="tabular-nums">{formatPrice(totals.subtotal)}</span>
                </div>
                {totals.discount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount{couponCode ? ` (${couponCode})` : ''}</span>
                    <span className="tabular-nums">− {formatPrice(totals.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-brand-muted">Shipping</span>
                  {totals.shippingFee === 0
                    ? <span className="text-emerald-700 font-medium">Free</span>
                    : <span className="tabular-nums">{formatPrice(totals.shippingFee)}</span>}
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-muted">Taxes (3%)</span>
                  <span className="tabular-nums">{formatPrice(totals.tax)}</span>
                </div>
                <div className="flex justify-between items-baseline pt-4 border-t border-brand-line">
                  <span className="font-medium">Total</span>
                  <span className="font-display text-2xl">{formatPrice(totals.total)}</span>
                </div>
              </div>
            </div>

            <div className="surface-muted p-4 space-y-2.5 text-xs text-brand-muted">
              <p className="flex items-center gap-2"><Lock size={14} className="text-brand-gold-dark" /> Secure checkout{razorpayEnabled ? ' · payments processed by Razorpay' : ''}</p>
              <p className="flex items-center gap-2"><RotateCcw size={14} className="text-brand-gold-dark" /> 30-day returns on unworn pieces</p>
              <p className="flex items-center gap-2">
                <Headphones size={14} className="text-brand-gold-dark" /> Questions? Call{' '}
                <a href="tel:18002966677" className="text-brand-maroon font-medium link-underline">1800-296-6677</a>
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
