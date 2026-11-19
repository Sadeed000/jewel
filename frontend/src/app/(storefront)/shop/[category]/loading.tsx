import { ProductGridSkeleton } from '@/components/common/Loading';

/**
 * Shown instantly while a collection's products stream in (filters and
 * sorting make this route dynamic), so a click never looks frozen.
 *
 * Deliberately scoped to this route rather than the whole storefront: a
 * loading boundary above a page makes Next send HTTP 200 before notFound()
 * can run, turning real 404s into soft 404s. The unknown-collection check
 * therefore lives in ./layout.tsx, which renders outside this boundary.
 */
export default function CollectionLoading() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="skeleton h-36 md:h-56 w-full rounded-none" />
      <div className="container-custom py-6">
        <div className="skeleton h-3 w-40" />
      </div>
      <div className="container-custom pb-16">
        <div className="skeleton h-8 w-64 mb-8" />
        <ProductGridSkeleton count={8} />
      </div>
    </div>
  );
}
