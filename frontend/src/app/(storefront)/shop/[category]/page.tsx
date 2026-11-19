import Link from 'next/link';
import Breadcrumb from '@/components/common/Breadcrumb';
import FilterSidebar from '@/components/product/FilterSidebar';
import ProductGrid from '@/components/product/ProductGrid';
import { fetchProductPage } from '@/lib/server-api';
import { searchParamsToFilters } from '@/lib/filters';
import SortSelect from '@/components/product/SortSelect';
import Pagination from '@/components/product/Pagination';
import Image from 'next/image';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { METAL_SLUGS, collectionCopy, collectionIndexing, isKnownCollection } from '@/lib/collections';
import { JsonLd, breadcrumbLd, pageMetadata } from '@/lib/seo';
import { COLLECTION_HERO, hero } from '@/lib/imagery';

const PAGE_SIZE = 24;

/**
 * This route serves both metal categories (/shop/gold) and product types
 * (/shop/rings), so map the slug onto whichever filter the API expects.
 */
const filtersForSlug = (slug: string) => {
  if (slug === 'jewellery' || slug === 'all') return {};
  if ((METAL_SLUGS as readonly string[]).includes(slug)) return { category: slug };
  return { type: slug };
};

type Props = {
  params: { category: string };
  searchParams: Record<string, string | string[] | undefined>;
};

// Normalise to single values — the filters never emit repeated keys.
const flatten = (searchParams: Props['searchParams']) =>
  Object.fromEntries(
    Object.entries(searchParams).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])
  ) as Record<string, string | undefined>;

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  // Thrown from metadata so the response carries a real 404 status.
  if (!isKnownCollection(params.category)) notFound();
  const copy = collectionCopy(params.category);
  const { canonical, noindex, page } = collectionIndexing(params.category, flatten(searchParams));
  return pageMetadata({
    title: page > 1 ? `${copy.title} – Page ${page}` : copy.title,
    description: copy.description,
    path: canonical,
    noindex,
  });
}

export default async function CategoryPage({ params, searchParams }: Props) {
  // Unknown collections are a real 404, not an empty 200 page.
  if (!isKnownCollection(params.category)) notFound();

  const flatParams = flatten(searchParams);
  const copy = collectionCopy(params.category);

  const page = Math.max(1, Number(flatParams.page) || 1);

  // The route slug sets the base collection; sidebar filters narrow it. User
  // filters win on conflict, so /shop/gold + Category:Diamond shows diamond.
  const { items: list, pagination } = await fetchProductPage({
    ...filtersForSlug(params.category),
    ...searchParamsToFilters(flatParams),
    page,
    limit: PAGE_SIZE,
  });
  const title = copy.h1;

  return (
    <div>
      <JsonLd
        data={breadcrumbLd([
          { name: 'Home', path: '/' },
          { name: title, path: `/shop/${params.category === 'all' ? 'jewellery' : params.category}` },
        ])}
      />
      {/* Banner */}
      <div className="relative h-36 md:h-56 overflow-hidden">
        <Image
          src={hero(COLLECTION_HERO[params.category] ?? 'jewelleryRoseEmeraldSet', '3:1')}
          alt=""
          fill
          priority
          quality={85}
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-maroon-dark/80 via-brand-maroon-dark/45 to-transparent" />
        <div className="container-custom relative h-full flex items-center text-white">
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-brand-gold-light">Shop</p>
            <h1 className="font-display text-4xl md:text-6xl mt-1">{title}</h1>
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

      {page === 1 && (
        <p className="container-custom -mt-2 mb-6 max-w-3xl text-sm leading-relaxed text-brand-muted">
          {copy.intro}
        </p>
      )}

      <div className="container-custom flex flex-col md:flex-row gap-8 pb-16">
        <FilterSidebar />

        <div className="flex-1">
          <div className="flex items-center justify-between gap-4 mb-8 pb-4 border-b border-brand-line">
            <p className="text-sm text-brand-muted">
              <span className="text-brand-ink font-semibold tabular-nums">{pagination.total}</span>{' '}
              {pagination.total === 1 ? 'piece' : 'pieces'}
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
            // Keyed on the query string so every filter / sort / page change
            // cross-fades to the new results instead of snapping.
            <ProductGrid
              products={list}
              columns="sidebar"
              animationKey={new URLSearchParams(
                Object.entries(flatParams).filter(([, v]) => v != null) as [string, string][]
              ).toString()}
            />
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
