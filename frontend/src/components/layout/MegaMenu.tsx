import Link from 'next/link';
import Image from 'next/image';
import { categoryHref } from '@/lib/nav';
import { resolveImageUrl } from '@/lib/utils';
import type { ServerCategory } from '@/lib/server-api';

/**
 * Mega menu contents.
 *
 * Every entry carries an explicit `href`. Links used to be derived as
 * `/shop/<category>/<slugified label>`, which produced two-segment paths like
 * /shop/more/virtual-try-on — a route that doesn't exist, so every link in the
 * menu was dead. Destinations are now real routes, using the product filters
 * (?occasion=, ?gender=, ?price=) and search where no equivalent filter exists.
 *
 * `menuData` below is a curated override, not the source of truth: these
 * panels cross-link occasions, price bands and genders in ways no category
 * document describes. Any category without an entry here — including one an
 * admin just created — gets a panel built from its own subcategories,
 * description and tile image instead. See `entryFromCategory`.
 */

interface MenuItem {
  label: string;
  href: string;
}

interface MenuColumn {
  title: string;
  items: MenuItem[];
}

interface MenuEntry {
  columns: MenuColumn[];
  featured?: { image: string; title: string; subtitle: string; href: string };
}

/** Product-type shortcut, reused across several menus. */
const type = (label: string, slug: string): MenuItem => ({ label, href: `/shop/${slug}` });

const menuData: Record<string, MenuEntry> = {
  jewellery: {
    columns: [
      {
        title: 'Shop By Category',
        items: [
          { label: 'All Jewellery', href: '/jewellery' },
          type('Earrings', 'earrings'),
          type('Pendants', 'pendants'),
          type('Finger Rings', 'rings'),
          type('Mangalsutra', 'mangalsutra'),
          type('Chains', 'chains'),
          type('Nose Pin', 'nose-pin'),
          type('Necklaces', 'necklaces'),
          type('Bangles', 'bangles'),
          type('Bracelets', 'bracelets'),
        ],
      },
      {
        title: 'Shop By Price',
        items: [
          { label: 'Under ₹25K', href: '/shop/jewellery?price=0-25000' },
          { label: '₹25K - ₹50K', href: '/shop/jewellery?price=25000-50000' },
          { label: '₹50K - ₹1L', href: '/shop/jewellery?price=50000-100000' },
          { label: 'Above ₹1L', href: '/shop/jewellery?price=100000-' },
        ],
      },
      {
        title: 'Shop By Occasion',
        items: [
          { label: 'Wedding', href: '/shop/jewellery?occasion=wedding' },
          { label: 'Daily Wear', href: '/shop/jewellery?occasion=daily-wear' },
          { label: 'Festive', href: '/shop/jewellery?occasion=festive' },
          { label: 'Office', href: '/shop/jewellery?occasion=office' },
          { label: 'Party', href: '/shop/jewellery?occasion=party' },
        ],
      },
      {
        title: 'Shop By Gender',
        items: [
          { label: 'Women', href: '/shop/jewellery?gender=women' },
          { label: 'Men', href: '/shop/jewellery?gender=men' },
          { label: 'Kids', href: '/shop/jewellery?gender=kids' },
        ],
      },
    ],
    featured: {
      image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600',
      title: 'Elan',
      subtitle: 'My World. My Story.',
      href: '/jewellery',
    },
  },

  gold: {
    columns: [
      {
        title: 'Shop By Type',
        items: [
          { label: 'Earrings', href: '/shop/gold?type=earrings' },
          { label: 'Rings', href: '/shop/gold?type=rings' },
          { label: 'Pendants', href: '/shop/gold?type=pendants' },
          { label: 'Mangalsutra', href: '/shop/gold?type=mangalsutra' },
          { label: 'Chains', href: '/shop/gold?type=chains' },
          { label: 'Bangles', href: '/shop/gold?type=bangles' },
          { label: 'Bracelets', href: '/shop/gold?type=bracelets' },
          { label: 'Necklaces', href: '/shop/gold?type=necklaces' },
        ],
      },
      {
        // Purity and colour aren't filterable fields, but search matches the
        // `metal` string, so these still resolve to real result sets.
        title: 'Shop By Purity',
        items: [
          { label: '14K Gold', href: '/search?q=14K' },
          { label: '18K Gold', href: '/search?q=18K' },
          { label: '22K Gold', href: '/search?q=22K' },
        ],
      },
      {
        title: 'Shop By Colour',
        items: [
          { label: 'Yellow Gold', href: '/search?q=Yellow%20Gold' },
          { label: 'Rose Gold', href: '/search?q=Rose%20Gold' },
          { label: 'White Gold', href: '/search?q=White%20Gold' },
        ],
      },
    ],
    featured: {
      image: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=600',
      title: 'Gold Stories',
      subtitle: 'Heritage in every piece',
      href: '/shop/gold',
    },
  },

  diamond: {
    columns: [
      {
        title: 'Shop By Type',
        items: [
          { label: 'Diamond Rings', href: '/shop/diamond?type=rings' },
          { label: 'Diamond Earrings', href: '/shop/diamond?type=earrings' },
          { label: 'Diamond Pendants', href: '/shop/diamond?type=pendants' },
          { label: 'Diamond Necklaces', href: '/shop/diamond?type=necklaces' },
          { label: 'Diamond Mangalsutra', href: '/shop/diamond?type=mangalsutra' },
        ],
      },
      {
        title: 'Shop By Occasion',
        items: [
          { label: 'Engagement', href: '/shop/diamond?occasion=wedding' },
          { label: 'Daily Wear', href: '/shop/diamond?occasion=daily-wear' },
          { label: 'Party', href: '/shop/diamond?occasion=party' },
          { label: 'Festive', href: '/shop/diamond?occasion=festive' },
        ],
      },
    ],
    featured: {
      image: 'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=600',
      title: 'Festival of Diamonds',
      subtitle: 'A brilliance like no other',
      href: '/shop/diamond',
    },
  },

  earrings: {
    columns: [
      {
        title: 'By Occasion',
        items: [
          { label: 'Daily Wear', href: '/shop/earrings?occasion=daily-wear' },
          { label: 'Office', href: '/shop/earrings?occasion=office' },
          { label: 'Festive', href: '/shop/earrings?occasion=festive' },
          { label: 'Wedding', href: '/shop/earrings?occasion=wedding' },
          { label: 'Party', href: '/shop/earrings?occasion=party' },
        ],
      },
      {
        title: 'By Metal',
        items: [
          { label: 'Gold Earrings', href: '/shop/earrings?category=gold' },
          { label: 'Diamond Earrings', href: '/shop/earrings?category=diamond' },
          { label: 'Gemstone Earrings', href: '/shop/earrings?category=gemstone' },
          { label: 'All Earrings', href: '/earrings' },
        ],
      },
    ],
  },

  rings: {
    columns: [
      {
        title: 'By Occasion',
        items: [
          { label: 'Wedding', href: '/shop/rings?occasion=wedding' },
          { label: 'Daily Wear', href: '/shop/rings?occasion=daily-wear' },
          { label: 'Party', href: '/shop/rings?occasion=party' },
          { label: "Men's Rings", href: '/shop/rings?gender=men' },
        ],
      },
      {
        title: 'By Metal',
        items: [
          { label: 'Gold Rings', href: '/shop/rings?category=gold' },
          { label: 'Diamond Rings', href: '/shop/rings?category=diamond' },
          { label: 'Gemstone Rings', href: '/shop/rings?category=gemstone' },
          { label: 'All Rings', href: '/rings' },
        ],
      },
    ],
  },

  'daily-wear': {
    columns: [
      {
        title: 'Daily Wear',
        items: [
          { label: 'Daily Wear Rings', href: '/shop/rings?occasion=daily-wear' },
          { label: 'Daily Wear Earrings', href: '/shop/earrings?occasion=daily-wear' },
          { label: 'Daily Wear Pendants', href: '/shop/pendants?occasion=daily-wear' },
          { label: 'Daily Wear Mangalsutra', href: '/shop/mangalsutra?occasion=daily-wear' },
          { label: 'Daily Wear Chains', href: '/shop/chains?occasion=daily-wear' },
        ],
      },
      {
        title: 'By Price',
        items: [
          { label: 'All Daily Wear', href: '/daily-wear' },
          { label: '₹25K - ₹50K', href: '/shop/jewellery?occasion=daily-wear&price=25000-50000' },
          { label: 'Above ₹50K', href: '/shop/jewellery?occasion=daily-wear&price=50000-100000' },
        ],
      },
    ],
  },

  gemstone: {
    columns: [
      {
        title: 'By Stone',
        items: [
          { label: 'Emerald', href: '/shop/jewellery?gemstone=emerald' },
          { label: 'Ruby', href: '/shop/jewellery?gemstone=ruby' },
          { label: 'Sapphire', href: '/shop/jewellery?gemstone=sapphire' },
          { label: 'Tanzanite', href: '/shop/jewellery?gemstone=tanzanite' },
          { label: 'Pearl', href: '/shop/jewellery?gemstone=pearl' },
        ],
      },
      {
        title: 'By Type',
        items: [
          { label: 'Earrings', href: '/shop/gemstone?type=earrings' },
          { label: 'Rings', href: '/shop/gemstone?type=rings' },
          { label: 'Pendants', href: '/shop/gemstone?type=pendants' },
          { label: 'Necklaces', href: '/shop/gemstone?type=necklaces' },
          { label: 'All Gemstone', href: '/gemstone' },
        ],
      },
    ],
    featured: {
      image: 'https://images.unsplash.com/photo-1591437694631-c2d04bb8b9c5?w=600',
      title: 'A World of Colour',
      subtitle: 'Tanzanite, Pearl & Cabochons',
      href: '/shop/gemstone',
    },
  },

  wedding: {
    columns: [
      {
        title: 'Bridal',
        items: [
          { label: 'Bridal Collection', href: '/wedding' },
          { label: 'Mangalsutras', href: '/shop/mangalsutra' },
          { label: 'Bridal Necklaces', href: '/shop/necklaces?occasion=wedding' },
          { label: 'Bridal Earrings', href: '/shop/earrings?occasion=wedding' },
          { label: 'Bridal Bangles', href: '/shop/bangles?occasion=wedding' },
        ],
      },
      {
        title: 'For The Groom',
        items: [
          { label: "Men's Rings", href: '/shop/rings?gender=men' },
          { label: "Men's Chains", href: '/shop/chains?gender=men' },
          { label: "Men's Bracelets", href: '/shop/bracelets?gender=men' },
        ],
      },
    ],
  },

  gifting: {
    columns: [
      {
        title: 'Gift By Occasion',
        items: [
          { label: 'Festive', href: '/shop/jewellery?occasion=festive' },
          { label: 'Wedding', href: '/shop/jewellery?occasion=wedding' },
          { label: 'Everyday Gifts', href: '/shop/jewellery?occasion=gifting' },
          { label: 'All Gifting', href: '/gifting' },
        ],
      },
      {
        title: 'Gift By Price',
        items: [
          { label: 'Under ₹25K', href: '/shop/jewellery?price=0-25000' },
          { label: '₹25K - ₹50K', href: '/shop/jewellery?price=25000-50000' },
          { label: 'Above ₹50K', href: '/shop/jewellery?price=50000-100000' },
        ],
      },
    ],
  },

  more: {
    columns: [
      {
        title: 'Explore',
        items: [
          { label: 'Virtual Try-On', href: '/virtual-try-on' },
          { label: 'Search With a Pic', href: '/image-search' },
          { label: 'Ring Size Finder', href: '/help' },
          { label: 'Store Locator', href: '/store-locator' },
        ],
      },
      {
        title: 'Schemes',
        items: [
          { label: 'Digital Gold', href: '/digital-gold' },
          { label: 'Gold Coins & Bars', href: '/shop/gold' },
          { label: 'Gold Rate Today', href: '/digital-gold' },
        ],
      },
      {
        title: 'Discover',
        items: [
          { label: 'Our Story', href: '/about' },
          { label: 'Craftsmanship', href: '/about' },
          { label: 'Stories Blog', href: '/blog' },
          { label: 'Help & Support', href: '/help' },
        ],
      },
    ],
  },
};

/** Price bands are useful on any category, so they're generated per base route. */
const priceColumn = (base: string): MenuColumn => {
  const join = base.includes('?') ? '&' : '?';
  return {
    title: 'Shop By Price',
    items: [
      { label: 'Under ₹25K', href: `${base}${join}price=0-25000` },
      { label: '₹25K - ₹50K', href: `${base}${join}price=25000-50000` },
      { label: '₹50K - ₹1L', href: `${base}${join}price=50000-100000` },
      { label: 'Above ₹1L', href: `${base}${join}price=100000-` },
    ],
  };
};

/**
 * Build a panel for a category that has no curated entry above. Subcategories
 * become the first column when present; the tile image and description become
 * the featured card, so the fields the admin fills in are the ones that show.
 */
const entryFromCategory = (cat: ServerCategory): MenuEntry => {
  const base = categoryHref(cat);
  const subs = cat.subCategories ?? [];
  const columns: MenuColumn[] = [];

  if (subs.length) {
    columns.push({
      title: `Shop ${cat.name}`,
      items: subs.map((sub) => ({
        label: sub.name,
        // `productType` maps onto Product.type, which the listing page filters
        // on. Without it the link can only fall back to the category itself.
        href: sub.productType ? `${base}?type=${sub.productType}` : base,
      })),
    });
  }

  columns.push({
    title: 'Browse',
    items: [
      { label: `All ${cat.name}`, href: base },
      // The sort value is a Mongo sort expression, which the API takes
      // directly — see SortSelect and backend/utils/pagination.js.
      { label: 'New Arrivals', href: `${base}${base.includes('?') ? '&' : '?'}sort=-createdAt` },
    ],
  });
  columns.push(priceColumn(base));

  return {
    columns,
    featured: cat.image
      ? {
          // Admin uploads are API-relative paths; resolve to an absolute URL.
          image: resolveImageUrl(cat.image),
          title: cat.name,
          subtitle: cat.description || 'Explore the collection',
          href: base,
        }
      : undefined,
  };
};

export default function MegaMenu({
  category,
  data: categoryDoc,
  onNavigate,
}: {
  category: string;
  /**
   * The category document behind this nav item, when one exists. Used to build
   * a panel for any category that has no curated entry in `menuData`.
   */
  data?: ServerCategory;
  /** Lets the header close the panel as soon as a link is chosen. */
  onNavigate?: () => void;
}) {
  const data = menuData[category] ?? (categoryDoc ? entryFromCategory(categoryDoc) : undefined);
  if (!data) return null;

  return (
    <div className="bg-white border-t border-brand-cream-dark shadow-xl animate-fade-in">
      <div className="container-custom py-8">
        <div className="grid grid-cols-12 gap-8">
          <div
            className={
              data.featured
                ? 'col-span-9 grid grid-cols-4 gap-8'
                : 'col-span-12 grid grid-cols-4 gap-8'
            }
          >
            {data.columns.map((col) => (
              <div key={col.title}>
                <h3 className="font-display text-base text-brand-maroon mb-4 pb-2 border-b border-brand-cream-dark">
                  {col.title}
                </h3>
                <ul className="space-y-2.5">
                  {col.items.map((item) => (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        onClick={onNavigate}
                        className="text-sm text-brand-ink/80 hover:text-brand-maroon transition-colors flex items-center gap-2 group"
                      >
                        <span className="w-1 h-1 rounded-full bg-brand-gold opacity-0 group-hover:opacity-100 transition-opacity" />
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {data.featured && (
            <Link
              href={data.featured.href}
              onClick={onNavigate}
              className="col-span-3 relative group overflow-hidden rounded-lg"
            >
              <div className="relative h-full min-h-[280px]">
                <Image
                  src={data.featured.image}
                  alt={data.featured.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                  sizes="320px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                  <p className="font-display text-xl">{data.featured.title}</p>
                  <p className="script-italic text-sm opacity-90">{data.featured.subtitle}</p>
                  <p className="mt-2 text-xs uppercase tracking-widest border-b border-white/60 inline-block pb-0.5">
                    Explore Now →
                  </p>
                </div>
              </div>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
