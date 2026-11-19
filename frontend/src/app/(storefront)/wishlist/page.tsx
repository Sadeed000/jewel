'use client';

import Link from 'next/link';
import Breadcrumb from '@/components/common/Breadcrumb';
import ProductCard from '@/components/product/ProductCard';
import { useCart } from '@/lib/store';
import { useCurrentUser } from '@/hooks/useAuth';
import { useWishlist } from '@/hooks/useWishlist';
import { useProducts } from '@/hooks/useProducts';
import { ProductGridSkeleton } from '@/components/common/Loading';

export default function WishlistPage() {
  const { data: user } = useCurrentUser();

  // Signed in → the server wishlist is authoritative.
  const { data: serverWishlist, isLoading: serverLoading } = useWishlist();

  // Guest → localStorage holds only product ids, so hydrate them in one
  // batched request rather than rendering from a hardcoded catalogue.
  const localIds = useCart((s) => s.wishlist);
  const { data: localProducts, isLoading: localLoading } = useProducts(
    { ids: localIds.join(','), limit: 100 },
    { enabled: !user && localIds.length > 0 }
  );

  const items = user
    ? serverWishlist?.products ?? []
    : localIds.length > 0
      ? localProducts?.items ?? []
      : [];

  const isLoading = user ? serverLoading : localIds.length > 0 && localLoading;

  return (
    <div>
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Wishlist' }]} />

      <div className="container-custom pb-16">
        <h1 className="font-display text-3xl md:text-4xl text-brand-ink">My Wishlist</h1>
        <p className="text-sm text-brand-muted mt-1">
          {isLoading ? 'Loading...' : `${items.length} item${items.length !== 1 ? 's' : ''}`}
        </p>

        {isLoading ? (
          <div className="mt-8">
            <ProductGridSkeleton count={8} />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 rounded-full bg-brand-cream grid place-items-center mx-auto mb-4 text-4xl">♡</div>
            <p className="font-display text-2xl text-brand-ink">Your wishlist is empty</p>
            <p className="text-sm text-brand-muted mt-2">Save your favourite pieces for later.</p>
            <Link href="/shop/jewellery" className="btn-primary mt-6 inline-flex">Explore Jewellery</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5 mt-8">
            {items.map((p) => <ProductCard key={p._id} product={p} confirmWishlistRemoval />)}
          </div>
        )}
      </div>
    </div>
  );
}
