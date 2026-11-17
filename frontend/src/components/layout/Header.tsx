'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, Heart, ShoppingBag, User, Camera, Mic, Menu, X, Diamond, Store } from 'lucide-react';
import Logo from '@/components/common/Logo';
import { useCart } from '@/lib/store';
import { useHydrated } from '@/hooks/useHydrated';
import { useUnifiedCart } from '@/hooks/useUnifiedCart';
import { useCurrentUser } from '@/hooks/useAuth';
import { useWishlist } from '@/hooks/useWishlist';
import { cn } from '@/lib/utils';
import { MORE_NAV_ITEM, toNavItems } from '@/lib/nav';
import type { ServerCategory } from '@/lib/server-api';
import MegaMenu from './MegaMenu';

/**
 * `categories` comes from the storefront layout, which fetches every category
 * flagged "Show in navigation" — so the nav reflects the admin dashboard
 * rather than a list baked into this file.
 */
export default function Header({ categories = [] }: { categories?: ServerCategory[] }) {
  const router = useRouter();

  // "More" is a menu-only entry — /shop/more matches no category and renders
  // an empty results page, so the link falls back to Help.
  const navItems = [...toNavItems(categories), MORE_NAV_ITEM];
  const categoryBySlug = new Map(categories.map((c) => [c.slug, c]));
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  /**
   * Mega-menu hover intent.
   *
   * Closing on `mouseleave` alone made the panel unreachable: moving the
   * pointer from a nav item down to the panel crosses the nav's padding,
   * where neither element is hovered, so the menu unmounted before the
   * pointer arrived. A short close delay bridges that gap — re-entering
   * either the trigger or the panel cancels the pending close.
   */
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const openMenu = (slug: string) => {
    cancelClose();
    setActiveMenu(slug);
  };

  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setActiveMenu(null), 180);
  };

  const closeMenu = () => {
    cancelClose();
    setActiveMenu(null);
  };

  // Don't leave a timer running after unmount.
  useEffect(() => cancelClose, []);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const term = searchTerm.trim();
    if (!term) return;
    router.push(`/search?q=${encodeURIComponent(term)}`);
    setMobileOpen(false);
  };
  const hydrated = useHydrated();

  // Badges must reflect whichever cart/wishlist is authoritative for this
  // visitor — the local store for guests, the server for signed-in users.
  const { data: user } = useCurrentUser();
  const { itemCount } = useUnifiedCart();
  const { data: serverWishlist } = useWishlist();
  const localWishlistCount = useCart((s) => s.wishlist.length);

  const totalItems = itemCount;
  const wishlistCount = user
    ? serverWishlist?.products.length ?? 0
    : localWishlistCount;

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-brand-cream-dark shadow-sm">
      <div className="container-custom">
        {/* Main bar */}
        <div className="flex items-center gap-4 lg:gap-8 py-4">
          <button
            className="md:hidden p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <Logo />

          {/* Search */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-auto">
            <form onSubmit={submitSearch} className="relative w-full" role="search">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" size={18} />
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search for diamond jewellery"
                className="w-full pl-12 pr-20 py-3 bg-brand-cream rounded-full text-sm border border-transparent focus:border-brand-gold focus:bg-white outline-none transition-all"
                aria-label="Search jewellery"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <Link href="/image-search" aria-label="Search by image" className="p-1.5 hover:bg-white rounded-full transition-colors">
                  <Camera size={18} className="text-brand-maroon" />
                </Link>
                <button type="button" aria-label="Voice search" className="p-1.5 hover:bg-white rounded-full transition-colors">
                  <Mic size={18} className="text-brand-maroon" />
                </button>
              </div>
            </form>
          </div>

          {/* Icons */}
          <div className="flex items-center gap-1 lg:gap-3 ml-auto">
            <Link href="/digital-gold" className="hidden lg:flex items-center justify-center w-10 h-10 hover:bg-brand-cream rounded-full transition-colors" aria-label="Digital Gold">
              <Diamond size={20} className="text-brand-maroon" />
            </Link>
            <Link href="/store-locator" className="hidden lg:flex items-center justify-center w-10 h-10 hover:bg-brand-cream rounded-full transition-colors" aria-label="Store Locator">
              <Store size={20} className="text-brand-maroon" />
            </Link>
            <Link href="/wishlist" className="relative flex items-center justify-center w-10 h-10 hover:bg-brand-cream rounded-full transition-colors" aria-label="Wishlist">
              <Heart size={20} className="text-brand-maroon" />
              {hydrated && wishlistCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-brand-maroon text-white text-[10px] font-semibold w-4 h-4 rounded-full flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </Link>
            <Link href="/account" className="flex items-center justify-center w-10 h-10 hover:bg-brand-cream rounded-full transition-colors" aria-label="Account">
              <User size={20} className="text-brand-maroon" />
            </Link>
            <Link href="/cart" className="relative flex items-center justify-center w-10 h-10 hover:bg-brand-cream rounded-full transition-colors" aria-label="Cart">
              <ShoppingBag size={20} className="text-brand-maroon" />
              {hydrated && totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-brand-maroon text-white text-[10px] font-semibold w-4 h-4 rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Mobile search */}
        <div className="md:hidden pb-3">
          <form onSubmit={submitSearch} className="relative" role="search">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" size={18} />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search jewellery"
              className="w-full pl-12 pr-12 py-2.5 bg-brand-cream rounded-full text-sm border border-transparent focus:border-brand-gold outline-none"
            />
          </form>
        </div>

        {/* Nav */}
        <nav
          className="hidden md:flex items-center justify-center gap-6 lg:gap-8 py-3 border-t border-brand-cream-dark relative"
          onMouseLeave={scheduleClose}
          // Escape closes the panel for keyboard users.
          onKeyDown={(e) => e.key === 'Escape' && closeMenu()}
        >
          {navItems.map((item) => (
            <div
              key={item.slug}
              onMouseEnter={() => openMenu(item.slug)}
              // Opening on focus makes the menu reachable by keyboard too.
              onFocus={() => openMenu(item.slug)}
            >
              <Link
                href={item.href}
                onClick={closeMenu}
                aria-expanded={activeMenu === item.slug}
                className={cn(
                  'group flex items-center gap-1.5 text-sm transition-colors py-1 border-b-2',
                  activeMenu === item.slug
                    ? 'text-brand-maroon border-brand-maroon'
                    : 'text-brand-ink border-transparent hover:text-brand-maroon hover:border-brand-maroon'
                )}
              >
                <span className="text-brand-gold-dark text-base">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            </div>
          ))}

          {activeMenu && (
            <div
              onMouseEnter={cancelClose}
              onMouseLeave={scheduleClose}
              className="absolute left-0 right-0 top-full"
            >
              <MegaMenu
                category={activeMenu}
                data={categoryBySlug.get(activeMenu)}
                onNavigate={closeMenu}
              />
            </div>
          )}
        </nav>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-brand-cream-dark bg-white">
          <nav className="container-custom py-4 flex flex-col gap-1">
            {navItems.map((item) => (
              <Link
                key={item.slug}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 py-3 px-2 text-sm border-b border-brand-cream-dark hover:bg-brand-cream"
              >
                <span className="text-brand-gold-dark">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
