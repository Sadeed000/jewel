import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import UtilityBar from '@/components/layout/UtilityBar';
import CartSync from '@/components/providers/CartSync';
import Analytics from '@/components/providers/Analytics';
import { fetchCategories } from '@/lib/server-api';

/**
 * Chrome for the customer-facing store. The admin area sits outside this
 * group and so renders without the navbar or footer.
 *
 * Nav categories are fetched here rather than inside the Header because the
 * Header is a client component (hover state, cart badges) and so can't await
 * data itself. Fetching in the layout keeps the nav server-rendered — no
 * loading flash, no client request on every page.
 */
export default async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const categories = await fetchCategories({ nav: true });

  return (
    <div className="min-h-screen flex flex-col">
      <CartSync />
      <Analytics />
      <UtilityBar />
      <Header categories={categories} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
