import Link from 'next/link';
import Breadcrumb from '@/components/common/Breadcrumb';
import FilterSidebar from '@/components/product/FilterSidebar';
import ProductCard from '@/components/product/ProductCard';
import { fetchProductPage } from '@/lib/server-api';
import { searchParamsToFilters } from '@/lib/filters';
import SortSelect from '@/components/product/SortSelect';
import Pagination from '@/components/product/Pagination';
import Image from 'next/image';

const PAGE_SIZE = 24;

/**
 * This route serves both metal categories (/shop/gold) and product types
 * (/shop/rings), so map the slug onto whichever filter the API expects.
 */
const CATEGORY_SLUGS = ['gold', 'diamond', 'gemstone', 'platinum', 'silver'];
const TYPE_SLUGS = [
  'rings', 'earrings', 'pendants', 'necklaces', 'chains',
  'bracelets', 'mangalsutra', 'bangles', 'nose-pin',
];

const filtersForSlug = (slug: string) => {
  if (slug === 'jewellery' || slug === 'all') return {};
  if (CATEGORY_SLUGS.includes(slug)) return { category: slug };
  if (TYPE_SLUGS.includes(slug)) return { type: slug };
  // Unknown slug: match nothing so the page shows an honest empty state
  // rather than silently listing the entire catalogue.
  return { category: '__none__' };
};

export async function generateMetadata({ params }: { params: { category: string } }) {
  const cat = params.category.replace(/-/g, ' ');
  return {
    title: `${cat.replace(/\b\w/g, (c) => c.toUpperCase())} Jewellery`,
    description: `Browse our curated collection of ${cat} jewellery — rings, earrings, pendants and more.`,
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: { category: string };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  // Normalise to single values — the filters never emit repeated keys.
  const flatParams = Object.fromEntries(
    Object.entries(searchParams).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])
  ) as Record<string, string | undefined>;

  const page = Math.max(1, Number(flatParams.page) || 1);

  // The route slug sets the base collection; sidebar filters narrow it. User
  // filters win on conflict, so /shop/gold + Category:Diamond shows diamond.
  const { items: list, pagination } = await fetchProductPage({
    ...filtersForSlug(params.category),
    ...searchParamsToFilters(flatParams),
    page,
    limit: PAGE_SIZE,
  });
  const title = params.category.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div>
      {/* Banner */}
      <div className="relative h-32 md:h-48 overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=1800"
          alt={title}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-black/20" />
        <div className="container-custom relative h-full flex items-center text-white">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] opacity-80">Shop</p>
            <h1 className="font-display text-4xl md:text-5xl">{title}</h1>
          </div>
          <div className="ml-auto hidden md:block text-right">
            <p className="font-display text-2xl">10% off*</p>
            <p className="text-sm opacity-80">on making charges</p>
          </div>
        </div>
      </div>

      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: title },
        ]}
      />

      <div className="container-custom flex flex-col md:flex-row gap-8 pb-16">
        <FilterSidebar />

        <div className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-brand-muted">
              <span className="text-brand-ink font-medium">{pagination.total}</span> Products
            </p>
            <SortSelect />
          </div>

          {list.length === 0 ? (
            <div className="text-center py-20">
              <p className="font-display text-2xl text-brand-ink">Nothing here yet</p>
              <p className="text-sm text-brand-muted mt-2">
                No products match these filters. Try removing a few, or browse everything.
              </p>
              <div className="flex gap-3 justify-center mt-6">
                <Link href={`/shop/${params.category}`} className="btn-outline">
                  Clear filters
                </Link>
                <Link href="/jewellery" className="btn-primary">
                  Browse all jewellery
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
              {list.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          )}

          {/* Pagination */}
          <Pagination
            page={pagination.page}
            pages={pagination.pages}
            hasPrev={pagination.hasPrev}
            hasNext={pagination.hasNext}
          />
        </div>
      </div>
    </div>
  );
}
