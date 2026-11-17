import type { ServerCategory } from './server-api';

/**
 * Header navigation is driven by the Category collection, so anything an
 * admin adds under Categories → "Show in navigation" appears in the storefront
 * nav, the mega menu and the homepage tiles without a code change.
 *
 * These helpers are the single place that turns a category document into a
 * link, so all three surfaces agree on the destination for a given category.
 */

export interface NavItem {
  label: string;
  slug: string;
  icon: string;
  href: string;
}

/**
 * Rendered only when the API returns nothing — a backend outage or a
 * database that has never been seeded. Without it the header would collapse
 * to an empty strip, which looks broken rather than degraded.
 */
export const FALLBACK_NAV: NavItem[] = [
  { label: 'All Jewellery', slug: 'jewellery', icon: '◈', href: '/jewellery' },
  { label: 'Gold', slug: 'gold', icon: '◉', href: '/shop/gold' },
  { label: 'Diamond', slug: 'diamond', icon: '◆', href: '/shop/diamond' },
  { label: 'Earrings', slug: 'earrings', icon: '◐', href: '/earrings' },
  { label: 'Rings', slug: 'rings', icon: '○', href: '/rings' },
  { label: 'Daily Wear', slug: 'daily-wear', icon: '✦', href: '/daily-wear' },
  { label: 'Gemstone', slug: 'gemstone', icon: '◇', href: '/gemstone' },
  { label: 'Wedding', slug: 'wedding', icon: '❀', href: '/wedding' },
  { label: 'Gifting', slug: 'gifting', icon: '✿', href: '/gifting' },
];

/**
 * "More" is a utility menu, not a category — /shop/more matches no products
 * and it has no tile image — so it stays outside the collection and is
 * appended after whatever the admin has configured.
 */
export const MORE_NAV_ITEM: NavItem = {
  label: 'More',
  slug: 'more',
  icon: '☰',
  href: '/help',
};

/** Icon shown when a category was saved without one. */
const DEFAULT_ICON = '◈';

/** Where a category points. `href` overrides the default /shop/<slug> route. */
export const categoryHref = (category: Pick<ServerCategory, 'slug' | 'href'>): string =>
  category.href?.trim() || `/shop/${category.slug}`;

export const toNavItem = (category: ServerCategory): NavItem => ({
  label: category.name,
  slug: category.slug,
  icon: category.icon?.trim() || DEFAULT_ICON,
  href: categoryHref(category),
});

/** Categories → nav items, falling back to the static list when empty. */
export const toNavItems = (categories: ServerCategory[]): NavItem[] =>
  categories.length ? categories.map(toNavItem) : FALLBACK_NAV;
