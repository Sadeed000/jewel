'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart } from 'lucide-react';
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

export default function ProductCard({ product, compact = false }: { product: AnyProduct; compact?: boolean }) {
  const [isHovered, setIsHovered] = useState(false);

  // Always resolve to a single stable id used for wishlist tracking, regardless of source.
  const productId = product._id || product.id || '';

  const toast = useToast();
  const { data: user } = useCurrentUser();
  const { wishlist: localWishlist, toggleWishlist: toggleLocalWishlist } = useCart();
  const { data: serverWishlist } = useWishlist();
  const toggleServerWishlist = useToggleWishlist();

  // When logged in, the source of truth is the server wishlist; otherwise local.
  const isWishlisted = user
    ? serverWishlist?.products.some((p) => p._id === productId) ?? false
    : localWishlist.includes(productId);

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-brand-maroon focus-visible:ring-offset-2"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
      style={{
        transform: isHovered ? 'translateY(-6px)' : 'translateY(0)',
        transition: 'transform 500ms cubic-bezier(0.22, 1, 0.36, 1)',
      }}
    >
      <div
        className="relative bg-white rounded-lg overflow-hidden"
        style={{
          boxShadow: isHovered
            ? '0 16px 38px rgba(66, 35, 24, 0.16)'
            : '0 0 0 rgba(66, 35, 24, 0)',
          transition: 'box-shadow 500ms ease',
        }}
      >
        {product.isBestseller && (
          <span className="absolute top-3 left-0 z-10 bg-brand-maroon text-white text-[10px] font-semibold px-3 py-1 rounded-r tracking-wider uppercase">
            ★ Bestseller
          </span>
        )}
        {product.isNew && !product.isBestseller && (
          <span className="absolute top-3 left-0 z-10 bg-brand-gold-dark text-white text-[10px] font-semibold px-3 py-1 rounded-r tracking-wider uppercase">
            New
          </span>
        )}

        <button
          onClick={handleWishlistToggle}
          disabled={toggleServerWishlist.isPending}
          className="absolute top-3 right-3 z-10 w-8 h-8 bg-white/80 backdrop-blur rounded-full grid place-items-center hover:bg-white transition-colors disabled:opacity-60"
          aria-label="Add to wishlist"
        >
          <Heart
            size={16}
            className={cn(
              'transition-colors',
              isWishlisted ? 'fill-brand-maroon text-brand-maroon' : 'text-brand-ink'
            )}
          />
        </button>

        <div className="relative aspect-square bg-brand-cream overflow-hidden">
          <Image
            src={primaryImage}
            alt={product.name}
            fill
            className="object-cover motion-reduce:transition-none"
            style={{
              opacity: hasSecondaryImage && isHovered ? 0 : 1,
              transform: `scale(${isHovered ? (hasSecondaryImage ? 1.08 : 1.16) : 1})`,
              transition: 'opacity 650ms ease, transform 700ms cubic-bezier(0.22, 1, 0.36, 1)',
            }}
            sizes="(max-width: 768px) 50vw, 25vw"
          />
          {hasSecondaryImage && (
            <Image
              src={secondaryImage}
              alt=""
              aria-hidden="true"
              fill
              className="object-cover motion-reduce:transition-none"
              style={{
                opacity: isHovered ? 1 : 0,
                transform: `scale(${isHovered ? 1 : 1.08})`,
                transition: 'opacity 650ms ease, transform 700ms cubic-bezier(0.22, 1, 0.36, 1)',
              }}
              sizes="(max-width: 768px) 50vw, 25vw"
            />
          )}
        </div>
      </div>

      <div className={cn('px-1 pt-3 pb-2', compact && 'pt-2')}>
        <h3 className={cn('font-body text-brand-ink line-clamp-1', compact ? 'text-xs' : 'text-sm')}>
          {product.name}
        </h3>
        <div className="flex items-baseline gap-2 mt-1.5 flex-wrap">
          <span className={cn('text-brand-ink font-medium', compact ? 'text-sm' : 'text-base')}>
            ₹ {product.price.toLocaleString('en-IN')}
          </span>
          {product.originalPrice && (
            <span className="text-xs text-brand-muted line-through">
              ₹ {product.originalPrice.toLocaleString('en-IN')}
            </span>
          )}
          {!compact && product.onlyOneLeft && (
            <span className="text-[10px] text-brand-muted ml-auto">Only 1 left!</span>
          )}
        </div>
        {discount > 0 && (
          <div className="mt-2 text-[10px] bg-orange-50 text-orange-700 px-2 py-1 rounded inline-block">
            {discount}% off on making charges
          </div>
        )}
      </div>
    </Link>
  );
}
