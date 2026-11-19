'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useCurrentUser } from '@/hooks/useAuth';

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: user, isLoading } = useCurrentUser();

  useEffect(() => {
    if (!isLoading && !user) {
      // Remember where they were headed so login can send them back.
      router.replace(`/account/login?redirect=${encodeURIComponent(pathname)}`);
    }
    if (!isLoading && user && user.role !== 'admin') {
      router.replace('/');
    }
  }, [isLoading, user, router, pathname]);

  if (isLoading || !user || user.role !== 'admin') {
    return (
      <div className="admin-silk grid min-h-screen place-items-center">
        <div className="text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-[#f3e2bf] via-admin-gold to-[#b48a4f] shadow-admin-gold ring-1 ring-white/60">
            <span className="text-xl font-bold text-white drop-shadow-[0_1px_1px_rgba(122,82,40,0.45)]">A</span>
          </div>
          <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.24em] text-admin-gold-ink">Atelier console</p>
          <p className="mt-2 text-sm text-admin-body">
            {user && user.role !== 'admin' ? 'You don’t have access to this area. Redirecting…' : 'Checking admin access…'}
          </p>
          <div className="mx-auto mt-5 h-0.5 w-32 overflow-hidden rounded-full bg-admin-gold-light/60">
            <div className="h-full w-1/2 animate-[shimmer_1.4s_ease-in-out_infinite] bg-gradient-to-r from-admin-gold to-admin-maroon" />
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
