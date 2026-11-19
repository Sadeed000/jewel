import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import AdminGuard from '@/components/admin/AdminGuard';
import AdminShell from '@/components/admin/AdminShell';
import AdminBodyTheme from '@/components/admin/AdminBodyTheme';
import { BRAND } from '@/lib/brand';

// A clean, modern geometric sans for the whole admin console. Variable font,
// so every weight comes from a single file. Loaded only on /admin routes.
const adminFont = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-admin',
  display: 'swap',
});

export const metadata: Metadata = {
  title: { absolute: `${BRAND} Admin` },
  description: 'Administration area for products, categories, orders, and customers.',
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${adminFont.variable} admin-theme min-h-screen bg-admin-canvas text-admin-ink`}>
      <AdminBodyTheme fontClassName={adminFont.variable} />
      <AdminGuard>
        <AdminShell>{children}</AdminShell>
      </AdminGuard>
    </div>
  );
}
