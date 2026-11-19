'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Tag,
  ListChecks,
  Users,
  Gem,
  Menu,
  X,
  ArrowUpRight,
  LogOut,
  ChevronRight,
  Newspaper,
} from 'lucide-react';
import { BRAND } from '@/lib/brand';
import { cn } from '@/lib/utils';
import { useCurrentUser, useLogout } from '@/hooks/useAuth';
import { useConfirm } from '@/components/providers/ConfirmProvider';
import { Avatar } from './ui';

const navGroups = [
  {
    label: 'Overview',
    items: [{ href: '/admin', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Catalogue',
    items: [
      { href: '/admin/products', label: 'Products', icon: Gem },
      { href: '/admin/categories', label: 'Categories', icon: Tag },
      { href: '/admin/blog', label: 'Blog', icon: Newspaper },
    ],
  },
  {
    label: 'Sales',
    items: [
      { href: '/admin/orders', label: 'Orders', icon: Package },
      { href: '/admin/track-order', label: 'Order tracking', icon: ListChecks },
      { href: '/admin/customers', label: 'Customers', icon: Users },
    ],
  },
];

const allItems = navGroups.flatMap((g) => g.items);

const isActive = (href: string, pathname: string) =>
  href === '/admin' ? pathname === href : pathname.startsWith(href);

/** Gold monogram mark. */
export function Monogram({ size = 40 }: { size?: number }) {
  return (
    <div
      className="relative grid flex-none place-items-center rounded-xl bg-gradient-to-br from-[#f3e2bf] via-admin-gold to-[#b48a4f] shadow-admin-gold ring-1 ring-white/60"
      style={{ width: size, height: size }}
    >
      <span className="font-bold tracking-tight text-white drop-shadow-[0_1px_1px_rgba(122,82,40,0.45)]" style={{ fontSize: size * 0.44 }}>
        {BRAND.charAt(0)}
      </span>
      <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rotate-45 rounded-[2px] bg-admin-maroon" aria-hidden="true" />
    </div>
  );
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: user } = useCurrentUser();
  const logout = useLogout();
  const confirm = useConfirm();

  // Close the drawer on navigation.
  useEffect(() => setMobileOpen(false), [pathname]);

  const current = allItems.find((i) => isActive(i.href, pathname));
  const displayName = user ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email : 'Admin';
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  const handleSignOut = async () => {
    const ok = await confirm({
      title: 'Sign out of the admin console?',
      description: 'You will need to sign in again to manage the store.',
      confirmLabel: 'Sign out',
      tone: 'warning',
    });
    if (ok) logout.mutate();
  };

  const sidebar = (
    <div className="relative flex h-full flex-col overflow-hidden border-r border-admin-line-strong/70 bg-gradient-to-b from-[#f6ecda] via-admin-sidebar to-admin-sidebar-deep">
      {/* Soft decorative glow */}
      <div aria-hidden="true" className="pointer-events-none absolute -left-20 -top-24 h-64 w-64 rounded-full bg-white/50 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-admin-rose/70 blur-3xl" />
      <div aria-hidden="true" className="admin-dots pointer-events-none absolute inset-x-0 bottom-0 h-1/2 opacity-40 [mask-image:linear-gradient(to_top,black,transparent)]" />

      {/* Brand */}
      <div className="relative flex items-center gap-3 px-5 pb-5 pt-6">
        <Monogram />
        <div className="min-w-0">
          <p className="text-[17px] font-bold leading-tight tracking-[-0.02em] text-admin-ink">{BRAND}</p>
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-admin-gold-ink">Atelier console</p>
        </div>
        <button
          className="ml-auto grid h-9 w-9 place-items-center rounded-lg text-admin-muted hover:bg-admin-gold-soft hover:text-admin-ink lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </div>

      <div className="relative mx-5 h-px bg-gradient-to-r from-transparent via-admin-gold/50 to-transparent" aria-hidden="true" />

      {/* Navigation */}
      <nav className="admin-scroll relative flex-1 space-y-6 overflow-y-auto px-3 py-6" aria-label="Admin">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-admin-gold-ink/80">{group.label}</p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href, pathname);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-all duration-base',
                      active
                        ? 'bg-gradient-to-r from-admin-maroon to-[#93323f] font-semibold text-white shadow-admin-maroon'
                        : 'text-admin-body hover:bg-white/60 hover:text-admin-maroon'
                    )}
                  >
                    <span
                      className={cn(
                        'grid h-7 w-7 place-items-center rounded-lg transition-colors',
                        active
                          ? 'bg-white/15 text-admin-gold-light'
                          : 'bg-white/50 text-admin-gold-ink ring-1 ring-admin-line group-hover:bg-white group-hover:text-admin-maroon'
                      )}
                    >
                      <Icon size={16} strokeWidth={active ? 2.2 : 1.9} />
                    </span>
                    <span>{item.label}</span>
                    {active && <ChevronRight size={14} className="ml-auto text-admin-gold-light" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Profile */}
      <div className="relative p-3">
        <div className="rounded-2xl border border-admin-line bg-white/85 p-3 shadow-admin-card backdrop-blur">
          <div className="flex items-center gap-3">
            <Avatar name={displayName} size={36} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-admin-ink">{displayName}</p>
              <p className="truncate text-[11px] text-admin-muted">{user?.email}</p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-1.5">
            <Link
              href="/"
              className="flex items-center justify-center gap-1.5 rounded-lg border border-admin-line bg-admin-subtle px-2 py-2 text-xs font-medium text-admin-body transition-colors hover:border-admin-gold/50 hover:bg-admin-gold-soft hover:text-admin-ink"
            >
              <ArrowUpRight size={13} /> Store
            </Link>
            <button
              onClick={handleSignOut}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-admin-line bg-admin-subtle px-2 py-2 text-xs font-medium text-admin-body transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
            >
              <LogOut size={13} /> Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] lg:block">{sidebar}</aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="backdrop-in absolute inset-0 bg-admin-ink/25 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="dialog-in absolute inset-y-0 left-0 w-[264px] shadow-admin-lift">{sidebar}</aside>
        </div>
      )}

      <div className="lg:pl-[264px]">
        <header className="sticky top-0 z-30 border-b border-admin-line bg-white/75 shadow-[0_1px_0_rgba(191,149,84,0.15)] backdrop-blur-xl backdrop-saturate-150">
          <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-3.5 sm:px-8">
            <button
              className="grid h-10 w-10 place-items-center rounded-xl border border-admin-line bg-admin-surface text-admin-ink hover:bg-admin-gold-soft lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={18} />
            </button>

            <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-sm">
              <span className="hidden text-admin-muted sm:inline">Console</span>
              <ChevronRight size={14} className="hidden text-admin-gold sm:inline" />
              <span className="truncate font-semibold text-admin-ink">{current?.label ?? 'Admin'}</span>
            </nav>

            <div className="ml-auto flex items-center gap-3">
              <p className="hidden text-[13px] text-admin-muted md:block">{today}</p>
              <span className="hidden h-6 w-px bg-admin-line md:block" aria-hidden="true" />
              <Link
                href="/"
                className="hidden items-center gap-1.5 rounded-xl border border-admin-line bg-admin-surface px-3.5 py-2 text-[13px] font-medium text-admin-body shadow-[0_1px_2px_rgba(122,82,40,0.05)] transition-colors hover:border-admin-gold/50 hover:bg-admin-gold-soft hover:text-admin-ink sm:inline-flex"
              >
                View store <ArrowUpRight size={14} />
              </Link>
              <Avatar name={displayName} size={36} />
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1400px] px-4 py-7 sm:px-8 sm:py-9">{children}</main>
      </div>
    </div>
  );
}
