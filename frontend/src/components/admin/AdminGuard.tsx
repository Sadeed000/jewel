'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useCurrentUser } from '@/hooks/useAuth';
import { SectionLoader } from '@/components/common/Loading';

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

  if (isLoading || !user) {
    return <SectionLoader label="Checking admin access…" />;
  }

  if (user.role !== 'admin') {
    return <div className="py-16 text-center">You do not have permission to view this section.</div>;
  }

  return <>{children}</>;
}
