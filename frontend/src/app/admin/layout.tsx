import type { Metadata } from 'next';
import AdminGuard from '@/components/admin/AdminGuard';
import AdminShell from '@/components/admin/AdminShell';

export const metadata: Metadata = {
  title: 'Aurelia Admin',
  description: 'Administration area for products, categories, orders, and customers.',
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <AdminShell>{children}</AdminShell>
    </AdminGuard>
  );
}
