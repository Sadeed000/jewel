import Link from 'next/link';
import Image from 'next/image';
import { fetchCategories } from '@/lib/server-api';
import { categoryHref } from '@/lib/nav';
import { resolveImageUrl } from '@/lib/utils';
import { ImageOptimizerCache } from 'next/dist/server/image-optimizer';

interface Tile {
  name: string;
  href: string;
  icon?: string;
  image?: string;
}

/**
 * Shown only when the API returns no categories — a backend outage or an
 * unseeded database. `href` is explicit rather than derived from the label,
 * because slugifying the label produced dead routes (/shop/finger-rings,
 * /shop/view-all) that matched no product type.
 */
const FALLBACK_TILES: Tile[] = [
  { name: 'Earrings', icon: '◐', href: '/shop/earrings' },
  { name: 'Finger Rings', icon: '○', href: '/shop/rings' },
  { name: 'Pendants', icon: '◇', href: '/shop/pendants' },
  { name: 'Mangalsutra', icon: '❀', href: '/shop/mangalsutra' },
  { name: 'Bracelets', icon: '⌒', href: '/shop/bracelets' },
  { name: 'Bangles', icon: '◯', href: '/shop/bangles' },
  { name: 'Chains', icon: '⌗', href: '/shop/chains' },
  { name: 'Necklaces', icon: '⌣', href: '/shop/necklaces' },
];

/** The grid is nine columns wide, and the last slot is always "View All". */
const MAX_TILES = 8;

const VIEW_ALL: Tile = { name: 'View All', icon: '+', href: '/jewellery' };

export default async function CategoryTiles() {
  const categories = await fetchCategories();

  const tiles: Tile[] = categories.length
    ? categories.slice(0, MAX_TILES).map((c) => ({
        name: c.name,
        href: categoryHref(c),
        icon: c.icon?.trim() || undefined,
        // Admin uploads are stored as API-relative paths, which would resolve
        // against the Next server without this.
        image: c.image ? resolveImageUrl(c.image) : undefined,
      }))
    : FALLBACK_TILES;

  return (
    <section className="container-custom py-16">
      <div className="text-center mb-10">
        <h2 className="font-display text-3xl md:text-4xl text-brand-ink">Find Your Perfect Match</h2>
        <p className="text-sm text-brand-muted mt-2 script-italic font-display text-lg">Shop By Categories</p>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-3 md:gap-4">
        {[...tiles, VIEW_ALL].map((cat) => (
          <Link
            key={cat.href + cat.name}
            href={cat.href}
            className="group flex flex-col items-center gap-3 p-4 rounded-lg hover:bg-brand-cream transition-colors"
          >
            <div className="relative overflow-hidden aspect-square w-full bg-gradient-to-br from-brand-cream to-brand-cream-dark rounded-full grid place-items-center group-hover:from-brand-gold-light group-hover:to-brand-gold transition-all">
              {/* An icon is optional in the admin form, so fall back to the
                  tile image — which the Category model does require. */}
              {cat.icon || !cat.image ? (
                <span className="text-3xl text-brand-maroon group-hover:text-white transition-colors">
                  {cat.icon ?? '◈'}
                </span>
              ) : (
                <Image
                  src={cat.image}
                  alt={cat.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 768px) 30vw, 120px"
                />
              )}

            </div>
            <span className="text-xs font-medium text-brand-ink uppercase tracking-wider text-center">
              {cat.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
