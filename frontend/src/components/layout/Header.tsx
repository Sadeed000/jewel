'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, Heart, ShoppingBag, User, Camera, Menu, X, Diamond, Store, ChevronRight, BookOpen } from 'lucide-react';
import VoiceSearchButton from '@/components/search/VoiceSearch';
import Logo from '@/components/common/Logo';
import { useCart } from '@/lib/store';
import { useHydrated } from '@/hooks/useHydrated';
import { useUnifiedCart } from '@/hooks/useUnifiedCart';
import { useCurrentUser } from '@/hooks/useAuth';
import { useWishlist } from '@/hooks/useWishlist';
import { cn } from '@/lib/utils';
import { transition } from '@/lib/motion';
import { MORE_NAV_ITEM, toNavItems } from '@/lib/nav';
import type { ServerCategory } from '@/lib/server-api';

// The mega-menu only appears on hover, so its code is split out of the bundle
// every page downloads. It is prefetched when the browser is idle (below), so
// the first hover still opens instantly.
const loadMegaMenu = () => import('./MegaMenu');
const MegaMenu = dynamic(loadMegaMenu, { ssr: false });

/** Count bubble that pops whenever the number changes (e.g. after add-to-bag). */
function CountBadge({ count }: { count: number }) {
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.span
          key={count}
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.4, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 700, damping: 18 }}
          className="absolute -top-0.5 -right-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-brand-maroon px-1 text-[10px] font-semibold tabular-nums text-white ring-2 ring-white"
          aria-hidden="true"
        >
          {count > 99 ? '99+' : count}
        </motion.span>
      )}
    </AnimatePresence>
  );
}

/**
 * `categories` comes from the storefront layout, which fetches every category
 * flagged "Show in navigation" — so the nav reflects the admin dashboard
 * rather than a list baked into this file.
 */
export default function Header({ categories = [] }: { categories?: ServerCategory[] }) {
  const router = useRouter();
  const pathname = usePathname();

  // "More" is a menu-only entry — /shop/more matches no category and renders
  // an empty results page, so the link falls back to Help.
  const navItems = [...toNavItems(categories), MORE_NAV_ITEM];
  const categoryBySlug = new Map(categories.map((c) => [c.slug, c]));
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [scrolled, setScrolled] = useState(false);

  // Elevate the bar once the page scrolls under it.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close menus whenever the route changes.
  useEffect(() => {
    setMobileOpen(false);
    setActiveMenu(null);
  }, [pathname]);

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

  // Warm the mega-menu chunk once the page is idle.
  useEffect(() => {
    const w = window as Window & { requestIdleCallback?: (cb: () => void) => number; cancelIdleCallback?: (id: number) => void };
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(() => void loadMegaMenu());
      return () => w.cancelIdleCallback?.(id);
    }
    const t = setTimeout(() => void loadMegaMenu(), 2000);
    return () => clearTimeout(t);
  }, []);

  const runSearch = useCallback(
    (raw: string) => {
      const term = raw.trim();
      if (!term) return;
      router.push(`/search?q=${encodeURIComponent(term)}`);
      setMobileOpen(false);
    },
    [router]
  );

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    runSearch(searchTerm);
  };

  // Voice search: show what was heard in the box, then search for it.
  const handleVoiceResult = useCallback(
    (text: string) => {
      setSearchTerm(text);
      runSearch(text);
    },
    [runSearch]
  );
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

  // The underline sits under the hovered item, or the current section.
  const currentSlug = navItems.find((i) => i.href !== '/' && pathname?.startsWith(i.href))?.slug ?? null;
  const underlineSlug = activeMenu ?? currentSlug;

  return (
    <header
      className={cn(
        'sticky top-0 z-50 border-b transition-[background-color,box-shadow,border-color] duration-slow ease-premium',
        scrolled
          ? 'bg-white/85 backdrop-blur-xl backdrop-saturate-150 border-brand-line/80 shadow-soft'
          : 'bg-white border-brand-line'
      )}
    >
      <div className="container-custom">
        {/* Main bar */}
        <div className="flex items-center gap-3 lg:gap-8 py-3 md:py-4">
          <button
            className="md:hidden btn-icon -ml-2 text-brand-ink"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={mobileOpen ? 'x' : 'menu'}
                initial={{ rotate: -45, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 45, opacity: 0 }}
                transition={transition.fast}
                className="grid place-items-center"
              >
                {mobileOpen ? <X size={22} /> : <Menu size={22} />}
              </motion.span>
            </AnimatePresence>
          </button>

          <Logo />

          {/* Search */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-auto">
            <form onSubmit={submitSearch} className="group relative w-full" role="search">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted transition-colors duration-base group-focus-within:text-brand-maroon"
                size={18}
              />
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search rings, earrings, diamonds…"
                className="w-full h-12 pl-12 pr-24 bg-brand-cream rounded-full text-sm border border-brand-line/60 outline-none transition-[background-color,border-color,box-shadow] duration-base ease-premium hover:border-brand-gold/60 focus:border-brand-gold focus:bg-white focus:shadow-soft focus:ring-4 focus:ring-brand-gold/15"
                aria-label="Search jewellery"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <Link href="/image-search" aria-label="Search by image" className="btn-icon h-9 w-9 hover:bg-white">
                  <Camera size={18} />
                </Link>
                <VoiceSearchButton onResult={handleVoiceResult} />
              </div>
            </form>
          </div>

          {/* Icons */}
          <div className="flex items-center gap-0.5 lg:gap-1.5 ml-auto">
            <Link href="/digital-gold" className="hidden lg:inline-grid btn-icon" aria-label="Digital Gold">
              <Diamond size={20} strokeWidth={1.75} />
            </Link>
            <Link href="/store-locator" className="hidden lg:inline-grid btn-icon" aria-label="Store Locator">
              <Store size={20} strokeWidth={1.75} />
            </Link>
            <Link
              href="/wishlist"
              className="btn-icon"
              aria-label={hydrated && wishlistCount > 0 ? `Wishlist, ${wishlistCount} items` : 'Wishlist'}
            >
              <Heart size={20} strokeWidth={1.75} />
              {hydrated && <CountBadge count={wishlistCount} />}
            </Link>
            <Link href="/account" className="btn-icon" aria-label="Account">
              <User size={20} strokeWidth={1.75} />
            </Link>
            <Link
              href="/cart"
              className="btn-icon"
              aria-label={hydrated && totalItems > 0 ? `Shopping bag, ${totalItems} items` : 'Shopping bag'}
            >
              <ShoppingBag size={20} strokeWidth={1.75} />
              {hydrated && <CountBadge count={totalItems} />}
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
              aria-label="Search jewellery"
              className="w-full h-11 pl-12 pr-[5.5rem] bg-brand-cream rounded-full text-sm border border-brand-line/60 outline-none transition-[border-color,box-shadow] duration-base focus:border-brand-gold focus:bg-white focus:ring-4 focus:ring-brand-gold/15"
            />
            <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
              <Link href="/image-search" aria-label="Search by image" className="btn-icon h-9 w-9 hover:bg-white">
                <Camera size={18} />
              </Link>
              <VoiceSearchButton onResult={handleVoiceResult} />
            </div>
          </form>
        </div>

        {/* Nav */}
        <nav
          className="hidden md:flex items-center justify-center gap-1 lg:gap-2 py-1.5 border-t border-brand-line/70 relative"
          onMouseLeave={scheduleClose}
          // Escape closes the panel for keyboard users.
          onKeyDown={(e) => e.key === 'Escape' && closeMenu()}
          aria-label="Main"
        >
          {navItems.map((item) => {
            const highlighted = underlineSlug === item.slug;
            return (
              <div
                key={item.slug}
                onMouseEnter={() => openMenu(item.slug)}
                // Opening on focus makes the menu reachable by keyboard too.
                onFocus={() => openMenu(item.slug)}
                className="relative"
              >
                <Link
                  href={item.href}
                  onClick={closeMenu}
                  aria-expanded={activeMenu === item.slug}
                  aria-current={currentSlug === item.slug ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-1.5 px-3 lg:px-3.5 py-2.5 text-sm transition-colors duration-base',
                    highlighted ? 'text-brand-maroon' : 'text-brand-ink hover:text-brand-maroon'
                  )}
                >
                  <span className="text-brand-gold-dark text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
                {highlighted && (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute inset-x-3 -bottom-[7px] h-[2px] rounded-full bg-gradient-to-r from-brand-gold via-brand-maroon to-brand-gold"
                    transition={transition.indicator}
                  />
                )}
              </div>
            );
          })}

          <AnimatePresence>
            {activeMenu && (
              <motion.div
                key="mega"
                onMouseEnter={cancelClose}
                onMouseLeave={scheduleClose}
                className="absolute left-0 right-0 top-full"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4, transition: { duration: 0.15 } }}
                transition={transition.base}
              >
                <MegaMenu
                  category={activeMenu}
                  data={categoryBySlug.get(activeMenu)}
                  onNavigate={closeMenu}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </nav>
      </div>

      {/* Mobile menu */}
      <AnimatePresence initial={false}>
        {mobileOpen && (
          <motion.div
            id="mobile-menu"
            key="mobile-menu"
            className="md:hidden overflow-hidden border-t border-brand-line bg-white"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={transition.slow}
          >
            <motion.nav
              className="container-custom py-3 flex flex-col"
              aria-label="Mobile"
              initial="hidden"
              animate="show"
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.025 } } }}
            >
              {navItems.map((item) => (
                <motion.div
                  key={item.slug}
                  variants={{ hidden: { opacity: 0, x: -8 }, show: { opacity: 1, x: 0, transition: transition.base } }}
                >
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 min-h-[48px] px-2 text-sm border-b border-brand-line/70 rounded-control transition-colors duration-fast active:bg-brand-cream"
                  >
                    <span className="text-brand-gold-dark">{item.icon}</span>
                    <span className="flex-1">{item.label}</span>
                    <ChevronRight size={16} className="text-brand-muted" />
                  </Link>
                </motion.div>
              ))}
              <div className="grid grid-cols-2 gap-2 pt-4">
                <Link href="/digital-gold" className="btn-secondary btn-sm h-11">
                  <Diamond size={16} /> Digital Gold
                </Link>
                <Link href="/store-locator" className="btn-secondary btn-sm h-11">
                  <Store size={16} /> Find a Store
                </Link>
                <Link href="/blog" className="btn-secondary btn-sm h-11 col-span-2">
                  <BookOpen size={16} /> Blog &amp; Buying Guides
                </Link>
              </div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
