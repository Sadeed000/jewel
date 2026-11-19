'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Heart, Share2, Truck, RotateCcw, Sparkles,
  Star, Plus, Minus, ShieldCheck, ShoppingBag, CreditCard, Headphones, Zap, ArrowRight,
} from 'lucide-react';
import Breadcrumb from '@/components/common/Breadcrumb';
import ProductCarousel from '@/components/home/ProductCarousel';
import ProductGallery from '@/components/product/ProductGallery';
import ProductTabs from '@/components/product/ProductTabs';
import Button from '@/components/ui/Button';
import { useProduct, useRelatedProducts } from '@/hooks/useProducts';
import { useCurrentUser } from '@/hooks/useAuth';
import { useToggleWishlist, useWishlist } from '@/hooks/useWishlist';
import { usePaymentConfig } from '@/hooks/useOrders';
import { useCart } from '@/lib/store';
import { useUnifiedCart } from '@/hooks/useUnifiedCart';
import { formatPrice, cn, calculateDiscount, resolveImageUrl, IMAGE_PLACEHOLDER } from '@/lib/utils';
import { SHIPPING_FREE_THRESHOLD } from '@/lib/pricing';
import { transition } from '@/lib/motion';
import { EmptyState } from '@/components/common/Loading';
import { useToast } from '@/components/providers/ToastProvider';
import { isTryOnSupported, getSizeOptions } from '@/lib/tryOn';
import type { Product } from '@/lib/types';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { trackAddToCart, trackViewItem } from '@/lib/analytics';

// The try-on studio (camera, face tracking, canvas compositing) only opens on
// demand, so its code is loaded on first use instead of with every product page.
const VirtualTryOn = dynamic(() => import('@/components/tryon/VirtualTryOn'), { ssr: false });

/** Skeleton shaped like the real page so nothing jumps when data lands. */
function ProductDetailSkeleton() {
  return (
    <div className="container-custom grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 py-8 pb-16" aria-busy="true" aria-label="Loading product">
      <div className="flex gap-4">
        <div className="hidden md:flex flex-col gap-3">
          {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton w-20 h-20" />)}
        </div>
        <div className="skeleton flex-1 max-w-[560px] aspect-square rounded-panel" />
      </div>
      <div className="space-y-4 pt-4">
        <div className="skeleton h-3 w-32" />
        <div className="skeleton h-10 w-4/5" />
        <div className="skeleton h-4 w-48" />
        <div className="skeleton h-10 w-40 mt-6" />
        <div className="skeleton h-20 w-full mt-6" />
        <div className="skeleton h-12 w-full mt-6 rounded-full" />
      </div>
    </div>
  );
}

export default function ProductDetailClient({
  slug,
  initialProduct,
  initialRelated,
}: {
  slug: string;
  /** Fetched by the server page so the product is in the first HTML. */
  initialProduct?: Product;
  initialRelated?: Product[];
}) {
  const params = { slug };
  const router = useRouter();
  const toast = useToast();
  const { data: response, isLoading, isError } = useProduct(params.slug, initialProduct);
  const { data: related } = useRelatedProducts(params.slug, 8, initialRelated);
  const { data: user } = useCurrentUser();
  const { data: serverWishlist } = useWishlist();
  const { data: paymentConfig } = usePaymentConfig();
  const toggleServerWishlist = useToggleWishlist();
  const { toggleWishlist: toggleWishlistLocal, wishlist: localWishlist } = useCart();
  const { addItem: addToCart, isMutating: cartBusy } = useUnifiedCart();

  // Empty until the buyer picks, or until we default it to the sized
  // product's first option below.
  const [size, setSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [tryOnOpen, setTryOnOpen] = useState(false);
  // Brief "Added ✓" confirmation on the button itself.
  const [justAdded, setJustAdded] = useState(false);
  const addedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (addedTimer.current) clearTimeout(addedTimer.current);
  }, []);

  // GA4 view_item — once per product (no-op unless GA is configured).
  const viewed = response?.product;
  useEffect(() => {
    if (!viewed?._id) return;
    trackViewItem({ item_id: viewed._id, item_name: viewed.name, item_category: viewed.type, price: viewed.price });
  }, [viewed?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) return <ProductDetailSkeleton />;

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
    ? Array.from(new Set(rawImages.map(resolveImageUrl)))
    : [IMAGE_PLACEHOLDER];

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

  // Payment methods actually offered at checkout (mirrors the checkout page).
  const paymentSummary = paymentConfig?.razorpayEnabled
    ? 'Cards, UPI, net banking & cash on delivery'
    : 'Cash on delivery';

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
      trackAddToCart({
        item_id: productId,
        item_name: product.name,
        item_category: product.type,
        item_variant: selectedSize,
        price: product.price,
        quantity,
      });
      toast.success('Added to your bag', {
        description: `${product.name}${quantity > 1 ? ` × ${quantity}` : ''}`,
      });
      setJustAdded(true);
      if (addedTimer.current) clearTimeout(addedTimer.current);
      addedTimer.current = setTimeout(() => setJustAdded(false), 1800);
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

  const galleryOverlay = (
    <>
      <div className="absolute top-4 left-4 flex flex-col gap-2 items-start pointer-events-none">
        {product.isBestseller && (
          <span className="bg-brand-maroon/90 backdrop-blur text-white px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-[0.15em]">
            Bestseller
          </span>
        )}
        {product.isNew && (
          <span className="bg-white/90 backdrop-blur text-brand-maroon ring-1 ring-brand-gold/40 px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-[0.15em]">
            New
          </span>
        )}
        {discountPercent > 0 && (
          <span className="bg-white/90 backdrop-blur text-emerald-700 px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-[0.15em]">
            {discountPercent}% off
          </span>
        )}
      </div>

      <motion.button
        onClick={handleWishlistToggle}
        disabled={toggleServerWishlist.isPending}
        whileTap={{ scale: 0.85 }}
        aria-label={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
        aria-pressed={isWishlisted}
        className="absolute top-4 right-4 w-11 h-11 bg-white/90 backdrop-blur rounded-full grid place-items-center shadow-soft hover:bg-white transition-colors duration-base disabled:opacity-60"
      >
        <motion.span
          key={isWishlisted ? 'on' : 'off'}
          initial={{ scale: isWishlisted ? 0.5 : 1 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 600, damping: 14 }}
          className="grid place-items-center"
        >
          <Heart
            size={18}
            className={cn(
              'transition-colors duration-base',
              isWishlisted ? 'fill-brand-maroon text-brand-maroon' : 'text-brand-ink'
            )}
          />
        </motion.span>
      </motion.button>
    </>
  );

  return (
    <div>
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: product.category, href: `/shop/${product.category}` },
          { label: product.name },
        ]}
      />

      <div className="container-custom grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 pb-16">
        {/* Gallery */}
        <div className="lg:sticky lg:top-36 lg:self-start">
          <ProductGallery images={productImages} alt={product.name} overlay={galleryOverlay} />

          {!!product.videos?.length && (
            <section className="mt-6 space-y-3 md:ml-24" aria-label="Product videos">
              <h2 className="font-display text-xl text-brand-ink">See the details in motion</h2>
              {product.videos.map((video, index) => (
                <video key={video} src={video} controls playsInline preload="metadata"
                  poster={productImages[0]} aria-label={`${product.name} video ${index + 1}`}
                  className="w-full max-w-[560px] rounded-panel bg-brand-ink" />
              ))}
            </section>
          )}
        </div>

        {/* Details */}
        <div className="pt-2 lg:pt-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="eyebrow">
                {product.category} &middot; {product.type}
              </p>
              <h1 className="font-display text-4xl lg:text-5xl leading-[1.1] text-brand-ink mt-3 text-balance">
                {product.name}
              </h1>
            </div>
            <button onClick={handleShare} aria-label="Share this product" className="btn-icon flex-none text-brand-muted hover:text-brand-ink">
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
                      size={14}
                      className={i < Math.round(product.rating!) ? 'fill-current' : 'opacity-30'}
                    />
                  ))}
                </span>
                <span className="text-xs text-brand-muted">
                  <span className="sr-only">Rated </span>
                  {product.rating.toFixed(1)}
                  {product.reviewCount ? ` (${product.reviewCount} reviews)` : ''}
                </span>
              </span>
            )}

            <span
              className={cn(
                'inline-flex items-center gap-1.5 text-xs font-medium rounded-full px-2.5 py-1',
                isAvailable ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-brand-maroon'
              )}
            >
              <span className={cn('w-1.5 h-1.5 rounded-full', isAvailable ? 'bg-emerald-600' : 'bg-brand-maroon')} />
              {!isAvailable
                ? 'Out of stock'
                : lowStock
                  ? `Only ${product.stockQty} left`
                  : 'In stock'}
            </span>

            {product.sku && (
              <span className="text-xs text-brand-muted">SKU {product.sku}</span>
            )}
          </div>

          {/* Price */}
          <div className="mt-6 pb-6 border-b border-brand-line">
            <div className="flex items-baseline flex-wrap gap-x-3 gap-y-1">
              <span className="font-display text-[2.5rem] leading-none text-brand-ink">
                {formatPrice(product.price)}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <>
                  <span className="text-lg text-brand-muted line-through tabular-nums">
                    {formatPrice(product.originalPrice)}
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-wider bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full">
                    {discountPercent}% off
                  </span>
                </>
              )}
            </div>
            <p className="text-xs text-brand-muted mt-2.5">
              Inclusive of all taxes
              {savings > 0 && (
                <span className="text-emerald-700 font-medium"> &middot; You save {formatPrice(savings)}</span>
              )}
            </p>
          </div>

          {/* Craft details — surfaced here rather than buried in an accordion,
              because metal and purity are the first things a buyer checks. */}
          <dl className="grid grid-cols-3 gap-px bg-brand-line ring-1 ring-brand-line rounded-card overflow-hidden mt-6">
            {[
              { term: 'Metal', value: product.metal },
              { term: 'Purity', value: product.purity },
              { term: 'Weight', value: product.weight },
            ].map((spec) => (
              <div key={spec.term} className="bg-white px-3 py-3.5 text-center">
                <dt className="text-[10px] uppercase tracking-[0.16em] text-brand-muted">{spec.term}</dt>
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
            <fieldset className="mt-7">
              <div className="flex items-baseline justify-between mb-3">
                <legend className="text-sm font-medium text-brand-ink">
                  {sizeOptions.label}
                  {sizeOptions.help && (
                    <span className="text-xs text-brand-muted font-normal ml-2">
                      {sizeOptions.help}
                    </span>
                  )}
                </legend>
                {/* Rings have a real sizing tool; everything else falls back
                    to the help centre. */}
                <Link
                  href={product.type === 'rings' ? '/ring-size-finder' : '/help'}
                  className="text-xs font-medium text-brand-maroon link-underline"
                >
                  Size guide
                </Link>
              </div>
              <div className="flex flex-wrap gap-2">
                {sizeOptions.values.map((s) => {
                  const isSelected = selectedSize === s;
                  return (
                    <button
                      key={s}
                      onClick={() => setSize(s)}
                      aria-pressed={isSelected}
                      className={cn(
                        'relative min-w-[3.25rem] h-11 px-3 rounded-control text-sm font-medium',
                        'transition-[color,box-shadow,transform] duration-base ease-premium active:scale-95',
                        isSelected
                          ? 'text-white'
                          : 'text-brand-ink bg-white ring-1 ring-inset ring-brand-line hover:ring-brand-maroon hover:text-brand-maroon'
                      )}
                    >
                      {isSelected && (
                        <motion.span
                          layoutId="size-pill"
                          className="absolute inset-0 rounded-control bg-brand-maroon shadow-btn-primary"
                          transition={transition.indicator}
                        />
                      )}
                      <span className="relative">
                        {s}
                        {sizeOptions.unit}
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          )}

          {/* Quantity — the value was already sent to the cart but had no
              control, so every order was capped at one. */}
          <div className="mt-7">
            <p className="block text-sm font-medium text-brand-ink mb-3" id="qty-label">Quantity</p>
            <div className="inline-flex items-center rounded-full bg-white ring-1 ring-brand-line shadow-xs" role="group" aria-labelledby="qty-label">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                aria-label="Decrease quantity"
                className="btn-icon h-11 w-11 text-brand-ink"
              >
                <Minus size={15} />
              </button>
              <span className="w-10 text-center text-sm font-semibold tabular-nums overflow-hidden" aria-live="polite">
                <motion.span
                  key={quantity}
                  initial={{ y: 8, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={transition.fast}
                  className="inline-block"
                >
                  {quantity}
                </motion.span>
              </span>
              <button
                onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
                disabled={quantity >= maxQuantity}
                aria-label="Increase quantity"
                className="btn-icon h-11 w-11 text-brand-ink"
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
          <div className="mt-8">
            {/* Two equal columns, so both actions carry the same visual
                weight and line up exactly with the try-on bar below. */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                size="lg"
                className="w-full px-4 sm:px-6"
                onClick={handleAddToCart}
                disabled={!isAvailable}
                loading={cartBusy}
                loadingText="Adding…"
                success={justAdded}
                successText="Added to bag"
                icon={<ShoppingBag size={17} />}
              >
                {isAvailable ? 'Add to Bag' : 'Out of Stock'}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="group w-full px-4 sm:px-6"
                onClick={handleBuyNow}
                disabled={cartBusy || !isAvailable}
                icon={<Zap size={16} className="transition-transform duration-base group-hover:scale-110" />}
              >
                Buy Now
              </Button>
            </div>

            {/* Offered per product type; merchandising can also opt a piece
                out via tryOnEnabled. A gold-framed feature card rather than a
                third button, so it reads as an experience, not a purchase. */}
            {canTryOn && (
              <button
                type="button"
                onClick={() => setTryOnOpen(true)}
                aria-label="Try it on with your camera"
                className="group relative mt-3 block w-full rounded-full bg-gradient-to-r from-brand-gold-light via-brand-gold to-brand-gold-dark p-[1.5px] shadow-soft transition-shadow duration-base hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
              >
                <span className="relative flex h-[3.25rem] items-center gap-3 overflow-hidden rounded-full bg-gradient-to-r from-[#fffaf1] via-white to-[#fbf1df] pl-1.5 pr-4 sm:pr-5">
                  {/* Soft sheen that sweeps across on hover. */}
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/80 to-transparent opacity-0 transition-all duration-700 ease-premium group-hover:left-full group-hover:opacity-100"
                  />
                  <span className="relative grid h-10 w-10 flex-none place-items-center rounded-full bg-gradient-to-br from-brand-maroon to-brand-maroon-dark text-brand-gold-light shadow-btn-primary transition-transform duration-base ease-premium group-hover:scale-105">
                    <Sparkles size={17} />
                  </span>
                  <span className="relative min-w-0 flex-1 text-left leading-tight">
                    <span className="block text-sm font-semibold uppercase tracking-[0.14em] text-brand-maroon">
                      Try it on
                    </span>
                    <span className="block truncate text-[11px] text-brand-muted">
                      See it on you with your camera — no app needed
                    </span>
                  </span>
                  <span className="relative hidden items-center gap-1.5 rounded-full bg-brand-maroon/[0.06] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-maroon ring-1 ring-brand-maroon/10 sm:inline-flex">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60 motion-reduce:animate-none" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    </span>
                    Live
                  </span>
                  <ArrowRight
                    size={17}
                    aria-hidden="true"
                    className="relative flex-none text-brand-maroon transition-transform duration-base ease-premium group-hover:translate-x-1"
                  />
                </span>
              </button>
            )}
          </div>

          {/* Delivery, returns, payment & support — next to the buy decision.
              All facts below match the checkout and footer. */}
          <ul className="mt-6 surface-muted divide-y divide-brand-line text-xs">
            {[
              {
                icon: Truck,
                title: `Free insured delivery over ${formatPrice(SHIPPING_FREE_THRESHOLD)}`,
                sub: 'Dispatched in 2 business days · Estimated arrival in 5–7 days',
              },
              {
                icon: RotateCcw,
                title: '30-day returns',
                sub: 'On unworn pieces in original packaging',
              },
              { icon: CreditCard, title: 'Payment options', sub: paymentSummary },
              {
                icon: Headphones,
                title: 'Need help choosing?',
                sub: (
                  <>
                    Call <a href="tel:18002966677" className="text-brand-maroon font-medium link-underline">1800-296-6677</a> or{' '}
                    <a href="https://wa.me/918147349242" className="text-brand-maroon font-medium link-underline" target="_blank" rel="noopener noreferrer">chat on WhatsApp</a>
                  </>
                ),
              },
            ].map((row) => (
              <li key={row.title} className="flex items-start gap-3 px-4 py-3.5">
                <row.icon size={18} className="text-brand-gold-dark flex-none mt-0.5" strokeWidth={1.75} />
                <div>
                  <p className="font-medium text-brand-ink">{row.title}</p>
                  <p className="text-brand-muted mt-0.5">{row.sub}</p>
                </div>
              </li>
            ))}
          </ul>

          {/* Tabs */}
          <div className="mt-10">
            <ProductTabs
              tabs={[
                {
                  key: 'description',
                  label: 'Description',
                  content: <p className="whitespace-pre-line">{product.description}</p>,
                },
                {
                  key: 'specifications',
                  label: 'Specifications',
                  content: (
                    <dl className="grid grid-cols-[auto_1fr] gap-x-8 gap-y-2.5">
                      {[
                        ['Metal', product.metal],
                        ['Purity', product.purity],
                        ['Gross weight', product.weight],
                        product.gemstone && product.gemstone !== 'none' ? ['Stone', product.gemstone] : null,
                        product.collection ? ['Collection', product.collection] : null,
                        product.sku ? ['SKU', product.sku] : null,
                      ]
                        .filter((row): row is [string, string] => Boolean(row && row[1]))
                        .map(([term, value]) => (
                          <div key={term} className="contents">
                            <dt className="text-brand-muted">{term}</dt>
                            <dd className="text-brand-ink font-medium capitalize">{value}</dd>
                          </div>
                        ))}
                    </dl>
                  ),
                },
                {
                  key: 'delivery',
                  label: 'Delivery & Returns',
                  content: (
                    <ul className="space-y-2 list-disc pl-4 marker:text-brand-gold-dark">
                      <li>Free insured delivery on orders above {formatPrice(SHIPPING_FREE_THRESHOLD)}.</li>
                      <li>30-day easy returns on unworn pieces in original packaging.</li>
                      <li>Lifetime polishing and cleaning at any Aurelia boutique.</li>
                    </ul>
                  ),
                },
              ]}
            />
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-brand-line ring-1 ring-brand-line rounded-card overflow-hidden mt-10">
            {[
              { icon: ShieldCheck, title: 'BIS Hallmarked', sub: 'Pure & certified' },
              { icon: RotateCcw, title: 'Easy Exchange', sub: 'Swap anytime' },
              { icon: Truck, title: 'Free Delivery', sub: `Above ${formatPrice(SHIPPING_FREE_THRESHOLD)}` },
              { icon: Sparkles, title: 'Lifetime Care', sub: 'Polish & clean' },
            ].map((badge) => (
              <div key={badge.title} className="bg-white px-3 py-5 text-center">
                <badge.icon size={20} className="mx-auto text-brand-gold-dark" strokeWidth={1.5} />
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
