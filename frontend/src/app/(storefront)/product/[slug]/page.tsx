'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Heart, Share2, Truck, RotateCcw, Sparkles, ChevronDown,
  Star, Plus, Minus, ShieldCheck,
} from 'lucide-react';
import Breadcrumb from '@/components/common/Breadcrumb';
import ProductCarousel from '@/components/home/ProductCarousel';
import { useProduct, useRelatedProducts } from '@/hooks/useProducts';
import { useCurrentUser } from '@/hooks/useAuth';
import { useToggleWishlist, useWishlist } from '@/hooks/useWishlist';
import { useCart } from '@/lib/store';
import { useUnifiedCart } from '@/hooks/useUnifiedCart';
import { formatPrice, cn, calculateDiscount, resolveImageUrl, IMAGE_PLACEHOLDER } from '@/lib/utils';
import { SectionLoader, EmptyState } from '@/components/common/Loading';
import { useToast } from '@/components/providers/ToastProvider';
import VirtualTryOn from '@/components/tryon/VirtualTryOn';
import { isTryOnSupported, getSizeOptions } from '@/lib/tryOn';
import Link from 'next/link';

export default function ProductDetailPage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const toast = useToast();
  const { data: response, isLoading, isError } = useProduct(params.slug);
  const { data: related } = useRelatedProducts(params.slug, 8);
  const { data: user } = useCurrentUser();
  const { data: serverWishlist } = useWishlist();
  const toggleServerWishlist = useToggleWishlist();
  const { toggleWishlist: toggleWishlistLocal, wishlist: localWishlist } = useCart();
  const { addItem: addToCart, isMutating: cartBusy } = useUnifiedCart();

  const [activeImg, setActiveImg] = useState(0);
  // Empty until the buyer picks, or until we default it to the sized
  // product's first option below.
  const [size, setSize] = useState('');
  const [openTab, setOpenTab] = useState<string | null>('description');
  const [quantity, setQuantity] = useState(1);
  const [tryOnOpen, setTryOnOpen] = useState(false);

  if (isLoading) return <SectionLoader label="Loading product..." />;
  
  const product = response?.product;
  
  if (isError || !product) {
    return (
      <EmptyState
        title="Product not found"
        description="This product is no longer available."
        action={<Link href="/jewellery" className="btn-primary">Browse our collection</Link>}
      />
    );
  }

  // Gallery: covers first, then the detailed shots.
  //
  // This used to pick whichever of the two lists was non-empty *first*, so any
  // product with a detailed shot showed only its detailed shots — the primary
  // cover image never appeared in the gallery at all. Covers lead so the image
  // opening here is the same one the listing card showed, and the two lists are
  // deduped because the legacy `images` field is their concatenation.
  //
  // All are run through resolveImageUrl so admin-uploaded products (stored as
  // API-relative "/uploads/…") render against the API origin rather than
  // 404ing against the Next.js host.
  const combinedImages = [...(product?.coverImages ?? []), ...(product?.detailedImages ?? [])];
  const rawImages: string[] = combinedImages.length
    ? Array.from(new Set(combinedImages))
    : product?.images ?? [];

  const productImages: string[] = rawImages.length
    ? rawImages.map(resolveImageUrl)
    : [IMAGE_PLACEHOLDER];

  const activeImage = productImages[activeImg] || productImages[0];

  // A product is buyable only if it's flagged in stock and has units left.
  // stockQty may be absent on older documents, so treat undefined as available
  // and let the server be the final authority.
  const isAvailable = product.inStock !== false && (product.stockQty ?? 1) > 0;

  const canTryOn = isTryOnSupported(product.type) && product.tryOnEnabled !== false;

  // Sized pieces only — a pendant has no size, so it gets no selector and
  // sends no `size` with the order. The product's own `sizes` take priority
  // over the type's standard scale when merchandising has set them.
  const sizeOptions = getSizeOptions(product.type, product.sizes);

  // Fall back to the first option so a sized product always has a valid
  // selection, and resolve to undefined for unsized pieces so no meaningless
  // size is attached to the cart line or the order.
  const selectedSize = sizeOptions
    ? sizeOptions.values.includes(size)
      ? size
      : sizeOptions.values[0]
    : undefined;

  const stockQty = product.stockQty ?? 20;
  const lowStock = isAvailable && stockQty > 0 && stockQty <= 3;
  // 20 is the per-line cap enforced by the cart API.
  const maxQuantity = Math.max(1, Math.min(20, stockQty));

  const discountPercent =
    product.originalPrice && product.originalPrice > product.price
      ? calculateDiscount(product.originalPrice, product.price)
      : 0;
  const savings =
    product.originalPrice && product.originalPrice > product.price
      ? product.originalPrice - product.price
      : 0;

  /** Native share where available, clipboard elsewhere. */
  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    try {
      if (navigator.share) {
        await navigator.share({ title: product.name, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard');
    } catch {
      // User dismissed the share sheet, or the clipboard was blocked.
    }
  };

  // Wishlist logic
  const productId = product._id || '';
  const isWishlisted = user
    ? serverWishlist?.products.some((p) => p._id === productId) ?? false
    : localWishlist.includes(productId);

  const handleWishlistToggle = () => {
    if (user && productId) {
      toggleServerWishlist.mutate(productId, {
        onSuccess: ({ added }) =>
          added
            ? toast.success('Saved to your wishlist')
            : toast.info('Removed from your wishlist'),
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : 'Could not update your wishlist'),
      });
    } else {
      const wasWishlisted = localWishlist.includes(productId);
      toggleWishlistLocal(productId);
      wasWishlisted
        ? toast.info('Removed from your wishlist')
        : toast.success('Saved to your wishlist');
    }
  };

  // Add to cart — routes to the server cart when signed in, the local store
  // otherwise. Surfaces stock errors returned by the API instead of silently
  // reporting success.
  const handleAddToCart = async () => {
    if (!productId) return false;
    try {
      await addToCart({
        productId,
        name: product.name,
        price: product.price,
        image: product.coverImages?.[0] || product.images?.[0] || '',
        slug: product.slug,
        size: selectedSize,
        quantity,
      });
      toast.success('Added to your bag', {
        description: `${product.name}${quantity > 1 ? ` × ${quantity}` : ''}`,
      });
      return true;
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Could not add to bag. Please try again.'
      );
      return false;
    }
  };

  // Buy Now is Add to Cart plus a jump to checkout — but only if the add
  // actually succeeded, so a stock failure doesn't strand the user on an
  // empty checkout.
  const handleBuyNow = async () => {
    if (await handleAddToCart()) router.push('/checkout');
  };

  return (
    <div>
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: product.category, href: `/shop/${product.category}` },
          { label: product.name },
        ]}
      />

      <div className="container-custom grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 pb-16">
        {/* Gallery */}
        <div className="flex gap-4 lg:sticky lg:top-32 lg:self-start">
          <div className="hidden md:flex flex-col gap-3 flex-none">
            {productImages.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveImg(i)}
                aria-label={`View image ${i + 1}`}
                className={cn(
                  'relative w-20 h-20 rounded-lg overflow-hidden border transition-all',
                  activeImg === i
                    ? 'border-brand-maroon ring-1 ring-brand-maroon/30'
                    : 'border-brand-cream-dark opacity-70 hover:opacity-100 hover:border-brand-gold'
                )}
              >
                <Image
                  src={img}
                  alt={`${product.name} — view ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </button>
            ))}
          </div>

          {/* `flex-1 aspect-square` alone made the frame as tall as the column
              is wide (~700px on desktop), which dominated the page. Capping
              the width caps the height with it, so the frame stays square and
              the photo is never stretched or re-cropped. */}
          <div className="flex-1 min-w-0">
            <div className="relative w-full max-w-[520px] aspect-square bg-brand-cream rounded-xl overflow-hidden group ring-1 ring-brand-cream-dark">
              <Image
                src={activeImage}
                alt={product.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                sizes="(max-width: 768px) 100vw, 520px"
                priority
              />

              <div className="absolute top-4 left-4 flex flex-col gap-2 items-start">
                {product.isBestseller && (
                  <span className="bg-brand-maroon text-white px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-[0.15em]">
                    Bestseller
                  </span>
                )}
                {product.isNew && (
                  <span className="bg-brand-gold-dark text-white px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-[0.15em]">
                    New
                  </span>
                )}
                {discountPercent > 0 && (
                  <span className="bg-white/95 backdrop-blur text-brand-maroon px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-[0.15em]">
                    {discountPercent}% off
                  </span>
                )}
              </div>

              <button
                onClick={handleWishlistToggle}
                disabled={toggleServerWishlist.isPending}
                aria-label={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
                className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur rounded-full grid place-items-center shadow-sm hover:bg-white hover:scale-105 active:scale-95 transition-all disabled:opacity-60"
              >
                <Heart
                  size={17}
                  className={cn(
                    'transition-colors',
                    isWishlisted ? 'fill-brand-maroon text-brand-maroon' : 'text-brand-ink'
                  )}
                />
              </button>
            </div>

            {/* Mobile thumbnails — the desktop rail is hidden below md. */}
            {productImages.length > 1 && (
              <div className="flex md:hidden gap-2 mt-3 overflow-x-auto no-scrollbar">
                {productImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    aria-label={`View image ${i + 1}`}
                    className={cn(
                      'relative w-16 h-16 flex-none rounded-lg overflow-hidden border transition-all',
                      activeImg === i
                        ? 'border-brand-maroon'
                        : 'border-brand-cream-dark opacity-70'
                    )}
                  >
                    <Image src={img} alt="" fill className="object-cover" sizes="64px" />
                  </button>
                ))}
              </div>
            )}
            {!!product.videos?.length && (
              <section className="mt-5 space-y-3" aria-label="Product videos">
                <h2 className="font-display text-xl text-brand-ink">See the details in motion</h2>
                {product.videos.map((video, index) => (
                  <video key={video} src={video} controls playsInline preload="metadata"
                    poster={productImages[0]} aria-label={`${product.name} video ${index + 1}`}
                    className="w-full max-w-[520px] rounded-xl bg-brand-ink" />
                ))}
              </section>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="pt-2 lg:pt-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] text-brand-gold-dark uppercase tracking-[0.2em] font-semibold">
                {product.category} &middot; {product.type}
              </p>
              <h1 className="font-display text-4xl lg:text-[2.75rem] leading-tight text-brand-ink mt-3">
                {product.name}
              </h1>
            </div>
            <button
              onClick={handleShare}
              aria-label="Share this product"
              className="flex-none w-10 h-10 grid place-items-center rounded-full text-brand-muted hover:text-brand-ink hover:bg-brand-cream transition-colors"
            >
              <Share2 size={18} />
            </button>
          </div>

          {/* Rating + stock, on one quiet line */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-4">
            {typeof product.rating === 'number' && (
              <span className="inline-flex items-center gap-1.5">
                <span className="flex text-brand-gold-dark" aria-hidden="true">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star
                      key={i}
                      size={13}
                      className={i < Math.round(product.rating!) ? 'fill-current' : 'opacity-30'}
                    />
                  ))}
                </span>
                <span className="text-xs text-brand-muted">
                  {product.rating.toFixed(1)}
                  {product.reviewCount ? ` (${product.reviewCount})` : ''}
                </span>
              </span>
            )}

            <span className="inline-flex items-center gap-1.5 text-xs">
              <span
                className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  isAvailable ? 'bg-green-600' : 'bg-brand-maroon'
                )}
              />
              <span className={isAvailable ? 'text-green-700' : 'text-brand-maroon'}>
                {!isAvailable
                  ? 'Out of stock'
                  : lowStock
                    ? `Only ${product.stockQty} left`
                    : 'In stock'}
              </span>
            </span>

            {product.sku && (
              <span className="text-xs text-brand-muted">SKU {product.sku}</span>
            )}
          </div>

          {/* Price */}
          <div className="mt-6 pb-6 border-b border-brand-cream-dark">
            <div className="flex items-baseline flex-wrap gap-x-3 gap-y-1">
              <span className="font-display text-4xl text-brand-ink">
                {formatPrice(product.price)}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <>
                  <span className="text-lg text-brand-muted line-through">
                    {formatPrice(product.originalPrice)}
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-wider bg-brand-maroon text-white px-2 py-1 rounded">
                    {discountPercent}% off
                  </span>
                </>
              )}
            </div>
            <p className="text-xs text-brand-muted mt-2">
              Inclusive of all taxes
              {savings > 0 && (
                <span className="text-green-700 font-medium"> &middot; You save {formatPrice(savings)}</span>
              )}
            </p>
          </div>

          {/* Craft details — surfaced here rather than buried in an accordion,
              because metal and purity are the first things a buyer checks. */}
          <dl className="grid grid-cols-3 gap-px bg-brand-cream-dark border border-brand-cream-dark rounded-lg overflow-hidden mt-6">
            {[
              { term: 'Metal', value: product.metal },
              { term: 'Purity', value: product.purity },
              { term: 'Weight', value: product.weight },
            ].map((spec) => (
              <div key={spec.term} className="bg-white px-3 py-3 text-center">
                <dt className="text-[10px] uppercase tracking-wider text-brand-muted">{spec.term}</dt>
                <dd className="text-sm text-brand-ink font-medium mt-1 truncate" title={spec.value}>
                  {spec.value}
                </dd>
              </div>
            ))}
          </dl>

          {/* Size selector — only for pieces that are actually sized, and
              scaled to that piece (ring numbers, chain inches). A pendant
              previously showed ring sizes 14-21. */}
          {sizeOptions && (
            <div className="mt-7">
              <div className="flex items-baseline justify-between mb-3">
                <label className="text-sm font-medium text-brand-ink">
                  {sizeOptions.label}
                  {sizeOptions.help && (
                    <span className="text-xs text-brand-muted font-normal ml-2">
                      {sizeOptions.help}
                    </span>
                  )}
                </label>
                {/* Rings have a real sizing tool; everything else falls back
                    to the help centre. */}
                <Link
                  href={product.type === 'rings' ? '/ring-size-finder' : '/help'}
                  className="text-xs text-brand-maroon hover:underline"
                >
                  Size guide
                </Link>
              </div>
              <div className="flex flex-wrap gap-2">
                {sizeOptions.values.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    aria-pressed={selectedSize === s}
                    className={cn(
                      'min-w-[3.25rem] h-11 px-3 rounded-md border text-sm font-medium transition-all',
                      selectedSize === s
                        ? 'border-brand-maroon bg-brand-maroon text-white shadow-sm'
                        : 'border-brand-cream-dark text-brand-ink hover:border-brand-maroon hover:text-brand-maroon'
                    )}
                  >
                    {s}
                    {sizeOptions.unit}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity — the value was already sent to the cart but had no
              control, so every order was capped at one. */}
          <div className="mt-7">
            <label className="block text-sm font-medium text-brand-ink mb-3">Quantity</label>
            <div className="inline-flex items-center border border-brand-cream-dark rounded-md">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                aria-label="Decrease quantity"
                className="w-11 h-11 grid place-items-center hover:bg-brand-cream disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                <Minus size={15} />
              </button>
              <span className="w-12 text-center text-sm font-medium" aria-live="polite">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
                disabled={quantity >= maxQuantity}
                aria-label="Increase quantity"
                className="w-11 h-11 grid place-items-center hover:bg-brand-cream disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                <Plus size={15} />
              </button>
            </div>
            {quantity >= maxQuantity && maxQuantity < 20 && (
              <p className="text-xs text-brand-muted mt-2">
                Only {maxQuantity} available right now.
              </p>
            )}
          </div>

          {/* Add to cart */}
          <div className="mt-7">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleAddToCart}
                disabled={cartBusy || !isAvailable}
                className="flex-1 h-[3.25rem] bg-brand-maroon text-white text-sm font-semibold uppercase tracking-[0.15em] rounded-md hover:bg-brand-maroon-dark active:scale-[0.99] transition-all disabled:opacity-50 disabled:hover:bg-brand-maroon disabled:active:scale-100"
              >
                {!isAvailable ? 'Out of Stock' : cartBusy ? 'Adding…' : 'Add to Cart'}
              </button>
              <button
                onClick={handleBuyNow}
                disabled={cartBusy || !isAvailable}
                className="flex-1 sm:flex-none sm:px-10 h-[3.25rem] border border-brand-maroon text-brand-maroon text-sm font-semibold uppercase tracking-[0.15em] rounded-md hover:bg-brand-maroon hover:text-white active:scale-[0.99] transition-all disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-brand-maroon disabled:active:scale-100"
              >
                Buy Now
              </button>
            </div>

            {/* Offered per product type; merchandising can also opt a piece
                out via tryOnEnabled. Given a gold wash so it reads as a
                feature rather than a disabled control. */}
            {canTryOn && (
              <button
                onClick={() => setTryOnOpen(true)}
                className="mt-3 w-full h-[3.25rem] rounded-md border border-brand-gold bg-gradient-to-r from-brand-cream-dark via-white to-brand-cream-dark text-brand-maroon-dark text-sm font-semibold uppercase tracking-[0.15em] hover:border-brand-gold-dark hover:shadow-sm transition-all inline-flex items-center justify-center gap-2"
              >
                <Sparkles size={16} className="text-brand-gold-dark" />
                Try It On
                <span className="text-[10px] font-normal tracking-normal normal-case text-brand-muted">
                  live camera
                </span>
              </button>
            )}
          </div>

          {/* Delivery reassurance, close to the buy decision */}
          <div className="mt-6 flex items-start gap-3 p-4 rounded-lg bg-brand-cream border border-brand-cream-dark">
            <Truck size={18} className="text-brand-gold-dark flex-none mt-0.5" />
            <div className="text-xs">
              <p className="font-medium text-brand-ink">Free insured delivery</p>
              <p className="text-brand-muted mt-0.5">
                Dispatched in 2 business days &middot; Estimated arrival in 5–7 days
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-8 border-t border-brand-cream-dark">
            {[
              { key: 'description', label: 'Description', content: product.description },
              {
                key: 'specifications',
                label: 'Specifications',
                content: [
                  `Metal: ${product.metal}`,
                  `Purity: ${product.purity}`,
                  `Gross weight: ${product.weight}`,
                  product.gemstone && product.gemstone !== 'none' ? `Stone: ${product.gemstone}` : null,
                  product.collection ? `Collection: ${product.collection}` : null,
                  product.sku ? `SKU: ${product.sku}` : null,
                ]
                  .filter(Boolean)
                  .join('\n'),
              },
              {
                key: 'delivery',
                label: 'Delivery & Returns',
                content:
                  'Free insured delivery on orders above ₹2,000.\n30-day easy returns on unworn pieces in original packaging.\nLifetime polishing and cleaning at any Aurelia boutique.',
              },
            ].map((tab) => (
              <div key={tab.key} className="border-b border-brand-cream-dark">
                <button
                  onClick={() => setOpenTab(openTab === tab.key ? null : tab.key)}
                  aria-expanded={openTab === tab.key}
                  aria-controls={`tab-panel-${tab.key}`}
                  className="w-full flex items-center justify-between py-5 text-left text-sm font-medium tracking-wide text-brand-ink hover:text-brand-maroon transition-colors"
                >
                  {tab.label}
                  <ChevronDown
                    size={18}
                    className={cn(
                      'text-brand-gold-dark transition-transform duration-300 ease-out',
                      openTab === tab.key && 'rotate-180'
                    )}
                  />
                </button>
                {/*
                  The panel stays mounted and animates between grid-rows 0fr
                  and 1fr. Conditional mounting made it pop open with no
                  transition, and animating `height` needs the content measured
                  in JS — the grid track resolves to the content's own height,
                  so it eases open at whatever size the text happens to be.
                */}
                <div
                  id={`tab-panel-${tab.key}`}
                  aria-hidden={openTab !== tab.key}
                  className={cn(
                    'grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none',
                    openTab === tab.key ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                  )}
                >
                  <div className="overflow-hidden">
                    <div className="pb-5 text-sm leading-relaxed text-brand-muted whitespace-pre-line">
                      {tab.content}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-brand-cream-dark border border-brand-cream-dark rounded-lg overflow-hidden mt-8">
            {[
              { icon: ShieldCheck, title: 'BIS Hallmarked', sub: 'Pure & certified' },
              { icon: RotateCcw, title: 'Easy Exchange', sub: 'Swap anytime' },
              { icon: Truck, title: 'Free Delivery', sub: 'Above ₹2,000' },
              { icon: Sparkles, title: 'Lifetime Care', sub: 'Polish & clean' },
            ].map((badge) => (
              <div key={badge.title} className="bg-white px-3 py-5 text-center">
                <badge.icon size={18} className="mx-auto text-brand-gold-dark" strokeWidth={1.5} />
                <p className="text-[11px] font-semibold text-brand-ink mt-2.5">{badge.title}</p>
                <p className="text-[10px] text-brand-muted mt-0.5">{badge.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Related products */}
      {related?.items && related.items.length > 0 && (
        <ProductCarousel
          // Braces inside a string attribute are literal text, not JSX —
          // this was rendering "More in {product.type}" verbatim.
          title={`More in ${product.type}`}
          subtitle="Similar pieces you might like"
          products={related.items}
        />
      )}

      {tryOnOpen && canTryOn && (
        <VirtualTryOn product={product} onClose={() => setTryOnOpen(false)} />
      )}
    </div>
  );
}
