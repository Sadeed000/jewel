'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Tag,
  ListChecks,
  Users,
  Box,
  Menu,
  X,
  ExternalLink,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCurrentUser, useLogout } from '@/hooks/useAuth';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Products', icon: Box },
  { href: '/admin/categories', label: 'Categories', icon: Tag },
  { href: '/admin/orders', label: 'Orders', icon: Package },
  { href: '/admin/customers', label: 'Customers', icon: Users },
  { href: '/admin/track-order', label: 'Order Tracking', icon: ListChecks },
];

const isActive = (href: string, pathname: string) =>
  href === '/admin' ? pathname === href : pathname.startsWith(href);

function initialsOf(first?: string, last?: string, email?: string) {
  const a = first?.[0] ?? email?.[0] ?? 'A';
  const b = last?.[0] ?? '';
  return (a + b).toUpperCase();
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: user } = useCurrentUser();
  const logout = useLogout();

  const current = navItems.find((i) => isActive(i.href, pathname));

  const sidebar = (
    <div className="flex h-full flex-col bg-brand-maroon-dark text-white">
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="rounded-xl bg-brand-gold/20 p-2 ring-1 ring-brand-gold/30">
          <LayoutDashboard size={18} className="text-brand-gold" />
        </div>
        <div className="min-w-0">
          <p className="font-display text-lg leading-tight tracking-wide">Aurelia</p>
          <p className="text-[10px] uppercase tracking-[0.25em] text-white/50">Admin panel</p>
        </div>
        <button
          className="ml-auto rounded-lg p-1.5 text-white/70 hover:bg-white/10 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {navItems.map((item) => {
          const active = isActive(item.href, pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors',
                active
                  ? 'bg-brand-gold font-semibold text-brand-maroon-dark'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              )}
            >
              <Icon size={17} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="space-y-1 border-t border-white/10 p-3">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          <ExternalLink size={17} />
          <span>View store</span>
        </Link>
        <button
          onClick={() => logout.mutate()}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          <LogOut size={17} />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block">{sidebar}</aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64">{sidebar}</aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/85 backdrop-blur">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
            <button
              className="rounded-lg p-2 text-brand-ink hover:bg-slate-100 lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>

            <h1 className="font-display text-xl text-brand-ink">{current?.label ?? 'Admin'}</h1>

            <div className="ml-auto flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium leading-tight text-brand-ink">
                  {user ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email : '—'}
                </p>
                <p className="text-[11px] uppercase tracking-wider text-brand-muted">{user?.role ?? ''}</p>
              </div>
              <div className="grid h-9 w-9 place-items-center rounded-full bg-brand-maroon text-xs font-semibold text-white">
                {initialsOf(user?.firstName, user?.lastName, user?.email)}
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
