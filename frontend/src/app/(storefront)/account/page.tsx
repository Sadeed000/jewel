'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Gift, FileText, CreditCard, MapPin, Heart, Package, Banknote, Ruler, LogOut } from 'lucide-react';
import Breadcrumb from '@/components/common/Breadcrumb';
import { useCurrentUser, useLogout } from '@/hooks/useAuth';
import { useUpdateProfile } from '@/hooks/useOrders';
import { useWishlist } from '@/hooks/useWishlist';
import OrderHistory from '@/components/account/OrderHistory';
import AddressBook from '@/components/account/AddressBook';
import { SectionLoader } from '@/components/common/Loading';
import { useToast } from '@/components/providers/ToastProvider';
import { formatPrice, cn } from '@/lib/utils';

const sections = [
  { key: 'overview', label: 'Overview', icon: User },
  { key: 'digital-gold', label: 'Aurelia Digital Gold', icon: Gift },
  { key: 'profile', label: 'Personal Information', icon: FileText },
  { key: 'payments', label: 'Saved Payments Method', icon: CreditCard },
  { key: 'address', label: 'Address Book', icon: MapPin },
  { key: 'wishlist', label: 'Wishlist', icon: Heart },
  { key: 'orders', label: 'Order History', icon: Package },
  { key: 'gift-card', label: 'Gift Card Balance', icon: Banknote },
  { key: 'ring-size', label: 'Ring Size', icon: Ruler },
];

export default function AccountPage() {
  const router = useRouter();
  const toast = useToast();
  const { data: user, isLoading } = useCurrentUser();
  const logout = useLogout();
  const updateProfile = useUpdateProfile();
  const { data: wishlist } = useWishlist();

  const [active, setActive] = useState('orders');
  const [profile, setProfile] = useState({ firstName: '', lastName: '', phone: '', ringSize: '' });
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Everything here is personal data — send guests to sign in.
  useEffect(() => {
    if (!isLoading && !user) router.replace('/account/login?redirect=/account');
  }, [isLoading, user, router]);

  // Seed the profile form once the user loads.
  useEffect(() => {
    if (!user) return;
    setProfile({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      phone: user.phone || '',
      ringSize: user.ringSize || '',
    });
  }, [user]);

  const handleSaveProfile = async () => {
    setProfileMessage(null);
    if (!profile.firstName.trim()) {
      setProfileMessage({ type: 'error', text: 'First name is required.' });
      return;
    }
    try {
      await updateProfile.mutateAsync({
        firstName: profile.firstName.trim(),
        lastName: profile.lastName.trim(),
        phone: profile.phone.trim() || undefined,
        ringSize: profile.ringSize.trim() || undefined,
      });
      setProfileMessage({ type: 'success', text: 'Your details were saved.' });
      toast.success('Profile updated');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not save your details.';
      setProfileMessage({ type: 'error', text: message });
      toast.error(message);
    }
  };

  const handleSignOut = async () => {
    // Clear the session even if the network call fails — the hook drops the
    // local token either way.
    await logout.mutateAsync().catch(() => undefined);
    toast.info('Signed out');
    router.push('/');
  };

  if (isLoading || !user) return <SectionLoader label="Loading your account..." />;

  const memberSince = user.createdAt ? new Date(user.createdAt).getFullYear() : null;

  return (
    <div>
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'My Account' }, { label: sections.find((s) => s.key === active)?.label ?? '' }]} />

      <div className="container-custom pb-16">
        <h1 className="font-display text-3xl md:text-4xl text-brand-ink mb-8">My Account</h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <aside className="bg-white border border-brand-cream-dark rounded-lg p-2 lg:sticky lg:top-32 lg:self-start">
            {sections.map((s) => (
              <button
                key={s.key}
                onClick={() => setActive(s.key)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 text-sm rounded-md transition-colors',
                  active === s.key ? 'bg-brand-maroon text-white' : 'text-brand-ink hover:bg-brand-cream'
                )}
              >
                <s.icon size={16} />
                <span>{s.label}</span>
                {s.key === 'ring-size' && <span className="ml-auto text-[10px] bg-brand-gold text-brand-maroon-dark px-1.5 py-0.5 rounded">New</span>}
              </button>
            ))}
            <button
              onClick={handleSignOut}
              disabled={logout.isPending}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-brand-muted hover:bg-brand-cream rounded-md mt-2 border-t border-brand-cream-dark disabled:opacity-50"
            >
              <LogOut size={16} /> {logout.isPending ? 'Signing out...' : 'Sign Out'}
            </button>
          </aside>

          {/* Content */}
          <div className="lg:col-span-3">
            {active === 'orders' && <OrderHistory />}

            {active === 'address' && <AddressBook />}

            {active === 'overview' && (
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-brand-maroon to-brand-maroon-dark text-white rounded-lg p-6">
                  <p className="text-xs uppercase tracking-widest opacity-80">Welcome back</p>
                  <h2 className="font-display text-3xl mt-1">Hello, {user.firstName}</h2>
                  {memberSince && <p className="text-sm opacity-80 mt-2">Member since {memberSince}</p>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { label: 'Encircle Points', value: String(user.encirclePoints ?? 0) },
                    { label: 'Digital Gold', value: `${(user.digitalGoldGrams ?? 0).toFixed(2)} g` },
                    { label: 'Gift Card Balance', value: formatPrice(user.giftCardBalance ?? 0) },
                  ].map((s) => (
                    <div key={s.label} className="bg-white border border-brand-cream-dark rounded-lg p-5">
                      <p className="text-xs text-brand-muted">{s.label}</p>
                      <p className="font-display text-2xl text-brand-ink mt-1">{s.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {active === 'profile' && (
              <div className="bg-white border border-brand-cream-dark rounded-lg p-6 md:p-8">
                <h2 className="font-display text-2xl text-brand-ink mb-6">Personal Information</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-brand-muted">First Name</label>
                    <input
                      value={profile.firstName}
                      onChange={(e) => setProfile((p) => ({ ...p, firstName: e.target.value }))}
                      className="w-full mt-1 px-4 py-3 border border-brand-cream-dark rounded outline-none focus:border-brand-gold text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-brand-muted">Last Name</label>
                    <input
                      value={profile.lastName}
                      onChange={(e) => setProfile((p) => ({ ...p, lastName: e.target.value }))}
                      className="w-full mt-1 px-4 py-3 border border-brand-cream-dark rounded outline-none focus:border-brand-gold text-sm"
                    />
                  </div>
                  <div>
                    {/* Email is the login identifier, so it isn't editable here. */}
                    <label className="text-xs text-brand-muted">Email</label>
                    <input
                      type="email"
                      value={user.email}
                      disabled
                      className="w-full mt-1 px-4 py-3 border border-brand-cream-dark rounded outline-none text-sm bg-brand-cream/50 text-brand-muted"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-brand-muted">Phone</label>
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                      className="w-full mt-1 px-4 py-3 border border-brand-cream-dark rounded outline-none focus:border-brand-gold text-sm"
                    />
                  </div>
                </div>

                {profileMessage && (
                  <p
                    role="status"
                    className={cn(
                      'text-sm mt-4',
                      profileMessage.type === 'success' ? 'text-green-700' : 'text-brand-maroon'
                    )}
                  >
                    {profileMessage.text}
                  </p>
                )}

                <button
                  onClick={handleSaveProfile}
                  disabled={updateProfile.isPending}
                  className="btn-primary mt-6 disabled:opacity-60"
                >
                  {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}

            {active === 'wishlist' && (
              <div className="bg-white border border-brand-cream-dark rounded-lg p-8 text-center">
                <h2 className="font-display text-2xl text-brand-ink mb-2">Wishlist</h2>
                <p className="text-sm text-brand-muted">
                  You have {wishlist?.products.length ?? 0} saved item
                  {(wishlist?.products.length ?? 0) === 1 ? '' : 's'}.
                </p>
                <Link href="/wishlist" className="btn-primary mt-6 inline-flex">View Wishlist</Link>
              </div>
            )}

            {active === 'ring-size' && (
              <div className="bg-white border border-brand-cream-dark rounded-lg p-6 md:p-8">
                <h2 className="font-display text-2xl text-brand-ink mb-6">Ring Size</h2>
                <p className="text-sm text-brand-muted mb-4">
                  Save your size so we can recommend the right fit.
                </p>
                <div className="flex gap-3 max-w-sm">
                  <input
                    value={profile.ringSize}
                    onChange={(e) => setProfile((p) => ({ ...p, ringSize: e.target.value }))}
                    placeholder="e.g. 16"
                    className="flex-1 px-4 py-3 border border-brand-cream-dark rounded outline-none focus:border-brand-gold text-sm"
                  />
                  <button
                    onClick={handleSaveProfile}
                    disabled={updateProfile.isPending}
                    className="btn-primary disabled:opacity-60"
                  >
                    Save
                  </button>
                </div>
                {profileMessage && (
                  <p
                    className={cn(
                      'text-sm mt-3',
                      profileMessage.type === 'success' ? 'text-green-700' : 'text-brand-maroon'
                    )}
                  >
                    {profileMessage.text}
                  </p>
                )}
              </div>
            )}

            {active === 'gift-card' && (
              <div className="bg-white border border-brand-cream-dark rounded-lg p-12 text-center">
                <h2 className="font-display text-2xl text-brand-ink">Gift Card Balance</h2>
                <p className="font-display text-4xl text-brand-maroon mt-4">
                  {formatPrice(user.giftCardBalance ?? 0)}
                </p>
              </div>
            )}

            {active === 'digital-gold' && (
              <div className="bg-white border border-brand-cream-dark rounded-lg p-12 text-center">
                <h2 className="font-display text-2xl text-brand-ink">Aurelia Digital Gold</h2>
                <p className="font-display text-4xl text-brand-maroon mt-4">
                  {(user.digitalGoldGrams ?? 0).toFixed(2)} g
                </p>
                <Link href="/digital-gold" className="btn-primary mt-6 inline-flex">Buy Digital Gold</Link>
              </div>
            )}

            {active === 'payments' && (
              <div className="bg-white border border-brand-cream-dark rounded-lg p-12 text-center">
                <h2 className="font-display text-2xl text-brand-ink">Saved Payment Methods</h2>
                <p className="text-sm text-brand-muted mt-2">
                  For your security, card details are held by our payment provider and are never
                  stored on our servers.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
