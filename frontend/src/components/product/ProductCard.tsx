'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Heart } from 'lucide-react';
import { useCart } from '@/lib/store';
import { useCurrentUser } from '@/hooks/useAuth';
import { useToggleWishlist, useWishlist } from '@/hooks/useWishlist';
import {
  IMAGE_PLACEHOLDER,
  calculateDiscount,
  cn,
  productImageUrl,
  resolveImageUrl,
} from '@/lib/utils';
import { useToast } from '@/components/providers/ToastProvider';
import { useConfirm } from '@/components/providers/ConfirmProvider';

/**
 * Accept both shapes so existing pages using the static `data/products`
 * keep working while dynamic pages use the backend payload.
 *
 *   { id, ...static }    ← legacy static data
 *   { _id, ...dynamic }  ← API response
 */
export interface AnyProduct {
  id?: string;
  _id?: string;
  slug: string;
  name: string;
  price: number;
  originalPrice?: number;
  images: string[];
  coverImages?: string[];
  detailedImages?: string[];
  isBestseller?: boolean;
  isNew?: boolean;
  onlyOneLeft?: boolean;
}

export default function ProductCard({
  product,
  compact = false,
  confirmWishlistRemoval = false,
}: {
  product: AnyProduct;
  compact?: boolean;
  /** Ask before un-saving (used on the wishlist page, where the card then disappears). */
  confirmWishlistRemoval?: boolean;
}) {
  // Always resolve to a single stable id used for wishlist tracking, regardless of source.
  const productId = product._id || product.id || '';

  const toast = useToast();
  const confirm = useConfirm();
  const { data: user } = useCurrentUser();
  const { wishlist: localWishlist, toggleWishlist: toggleLocalWishlist } = useCart();
  const { data: serverWishlist } = useWishlist();
  const toggleServerWishlist = useToggleWishlist();

  // When logged in, the source of truth is the server wishlist; otherwise local.
  const isWishlisted = user
    ? serverWishlist?.products.some((p) => p._id === productId) ?? false
    : localWishlist.includes(productId);

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirmWishlistRemoval && isWishlisted) {
      const ok = await confirm({
        title: 'Remove from wishlist?',
        description: (
          <>
            <span className="font-medium text-brand-ink">{product.name}</span> will be removed from your saved pieces.
          </>
        ),
        confirmLabel: 'Remove',
        cancelLabel: 'Keep it',
      });
      if (!ok) return;
    }
    if (user && productId) {
      toggleServerWishlist.mutate(productId, {
        onSuccess: ({ added }) =>
          added ? toast.success('Saved to your wishlist') : toast.info('Removed from your wishlist'),
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : 'Could not update your wishlist'),
      });
    } else {
      const wasWishlisted = localWishlist.includes(productId);
      toggleLocalWishlist(productId);
      wasWishlisted
        ? toast.info('Removed from your wishlist')
        : toast.success('Saved to your wishlist');
    }
  };

  const discount = product.originalPrice ? calculateDiscount(product.originalPrice, product.price) : 0;
  const primaryImage = productImageUrl(product);
  const secondaryImageRaw = [
    ...(product.coverImages ?? []).slice(1),
    ...(product.detailedImages ?? []),
    ...(product.images ?? []).slice(1),
  ].find((image) => image && resolveImageUrl(image) !== primaryImage);
  const secondaryImage = secondaryImageRaw
    ? resolveImageUrl(secondaryImageRaw)
    : IMAGE_PLACEHOLDER;
  const hasSecondaryImage = Boolean(secondaryImageRaw);

  const badge = product.isBestseller ? 'Bestseller' : product.isNew ? 'New' : null;

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group block rounded-card outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-4 focus-visible:ring-offset-brand-cream"
    >
      {/* Image frame — lifts with a warm shadow on hover. Fixed aspect ratio
          reserves the space before the image loads, so there's no shift. */}
      <div
        className={cn(
          'relative overflow-hidden rounded-card bg-white ring-1 ring-brand-line',
          'transition-[transform,box-shadow] duration-slow ease-premium',
          'group-hover:-translate-y-1 group-hover:shadow-card group-focus-visible:-translate-y-1 group-focus-visible:shadow-card'
        )}
      >
        {badge && (
          <span
            className={cn(
              'absolute left-3 top-3 z-10 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] backdrop-blur',
              badge === 'Bestseller'
                ? 'bg-brand-maroon/90 text-white'
                : 'bg-white/90 text-brand-maroon ring-1 ring-brand-gold/40'
            )}
          >
            {badge}
          </span>
        )}

        <motion.button
          type="button"
          onClick={handleWishlistToggle}
          disabled={toggleServerWishlist.isPending}
          whileTap={{ scale: 0.85 }}
          className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/85 shadow-xs backdrop-blur transition-colors duration-base hover:bg-white disabled:opacity-60"
          aria-label={isWishlisted ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
          aria-pressed={isWishlisted}
        >
          <motion.span
            key={isWishlisted ? 'on' : 'off'}
            initial={{ scale: isWishlisted ? 0.6 : 1 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 600, damping: 15 }}
            className="grid place-items-center"
          >
            <Heart
              size={16}
              className={cn(
                'transition-colors duration-base',
                isWishlisted ? 'fill-brand-maroon text-brand-maroon' : 'text-brand-ink'
              )}
            />
          </motion.span>
        </motion.button>

        <div className="relative aspect-square overflow-hidden bg-brand-cream">
          <Image
            src={primaryImage}
            alt={product.name}
            fill
            className={cn(
              'object-cover transition-[opacity,transform] duration-[400ms] ease-premium',
              hasSecondaryImage
                ? 'group-hover:scale-[1.03] group-hover:opacity-0'
                : 'group-hover:scale-[1.06]'
            )}
            sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
          />
          {hasSecondaryImage && (
            <Image
              src={secondaryImage}
              alt=""
              aria-hidden="true"
              fill
              className="scale-[1.04] object-cover opacity-0 transition-[opacity,transform] duration-[400ms] ease-premium group-hover:scale-100 group-hover:opacity-100"
              sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
            />
          )}

          {/* "View" hint slides up on hover (pointer devices only). */}
          {!compact && (
            <div className="pointer-events-none absolute inset-x-3 bottom-3 hidden translate-y-2 opacity-0 transition-[opacity,transform] duration-base ease-premium group-hover:translate-y-0 group-hover:opacity-100 [@media(hover:hover)]:block">
              <span className="flex h-10 items-center justify-center gap-2 rounded-full bg-white/90 text-xs font-medium tracking-wide text-brand-maroon shadow-soft backdrop-blur">
                View details <ArrowRight size={14} />
              </span>
            </div>
          )}
        </div>
      </div>

      <div className={cn('px-1 pt-3.5', compact && 'pt-2.5')}>
        <h3
          className={cn(
            'line-clamp-1 text-brand-ink transition-colors duration-base group-hover:text-brand-maroon',
            compact ? 'text-xs' : 'text-sm'
          )}
        >
          {product.name}
        </h3>
        <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className={cn('font-semibold tabular-nums text-brand-ink', compact ? 'text-sm' : 'text-[15px]')}>
            ₹{product.price.toLocaleString('en-IN')}
          </span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="text-xs tabular-nums text-brand-muted line-through">
              ₹{product.originalPrice.toLocaleString('en-IN')}
            </span>
          )}
          {!compact && product.onlyOneLeft && (
            <span className="ml-auto text-[11px] font-medium text-brand-maroon">Only 1 left</span>
          )}
        </div>
        {discount > 0 && !compact && (
          <p className="mt-1.5 text-[11px] font-medium text-emerald-700">
            {discount}% off on making charges
          </p>
        )}
      </div>
    </Link>
  );
}
