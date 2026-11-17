'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { useCart as useGuestCart, guestItemKey, type CartItem } from '@/lib/store';
import { useCurrentUser } from './useAuth';
import {
  useServerCart,
  useAddToCart,
  useUpdateCartItem,
  useRemoveCartItem,
  useClearCart,
} from './useCart';
import { productImageUrl, resolveImageUrl } from '@/lib/utils';
import type { Cart } from '@/lib/types';

/**
 * One cart interface over two backends.
 *
 * Guests use the persisted Zustand store (survives refresh, works offline);
 * signed-in users use the server cart (survives device changes, and is what
 * checkout actually reads). Components consume this hook and never need to
 * know which is active.
 *
 * Both branches expose the same normalised item shape, so the existing cart
 * markup renders unchanged.
 */

export interface UnifiedCartItem {
  /** Server cart item _id, or `productId::size` for guests. */
  key: string;
  productId: string;
  slug?: string;
  name: string;
  price: number;
  /** Fully resolved, render-ready image URL. */
  image: string;
  size?: string;
  quantity: number;
  /** Upper bound for the quantity stepper. */
  maxQty: number;
  inStock: boolean;
}

const QTY_CAP = 20;

/** Normalise a guest (Zustand) line item. */
const fromGuest = (item: CartItem): UnifiedCartItem => ({
  key: guestItemKey(item),
  productId: item.id,
  slug: item.slug,
  name: item.name,
  price: item.price,
  image: item.image ? resolveImageUrl(item.image) : productImageUrl({}),
  size: item.size,
  quantity: item.quantity,
  // The guest cart has no live stock data; the server re-validates on
  // checkout, so cap at the API's own ceiling rather than guessing.
  maxQty: QTY_CAP,
  inStock: true,
});

/** Normalise a server cart line item. */
const fromServer = (item: Cart['items'][number]): UnifiedCartItem => {
  // `product` is populated, but may be null if the product was deleted after
  // it was added — fall back to the snapshot fields captured at add time.
  const product = item.product as unknown as
    | { _id: string; slug?: string; images?: string[]; inStock?: boolean; stockQty?: number }
    | null;

  return {
    key: item._id,
    productId: product?._id || '',
    slug: product?.slug,
    name: item.nameAtAdd,
    price: item.priceAtAdd,
    image: item.imageAtAdd
      ? resolveImageUrl(item.imageAtAdd)
      : productImageUrl({ images: product?.images }),
    size: item.size,
    quantity: item.quantity,
    maxQty: Math.min(QTY_CAP, product?.stockQty ?? QTY_CAP),
    inStock: product?.inStock !== false,
  };
};

export interface AddToCartInput {
  productId: string;
  name: string;
  price: number;
  image: string;
  slug?: string;
  size?: string;
  quantity?: number;
}

export function useUnifiedCart() {
  const { data: user } = useCurrentUser();
  const isGuest = !user;

  const guest = useGuestCart();
  const { data: serverCart, isLoading: serverLoading } = useServerCart();

  const addMutation = useAddToCart();
  const updateMutation = useUpdateCartItem();
  const removeMutation = useRemoveCartItem();
  const clearMutation = useClearCart();

  const items = useMemo<UnifiedCartItem[]>(
    () =>
      isGuest
        ? guest.items.map(fromGuest)
        : (serverCart?.items || []).map(fromServer),
    [isGuest, guest.items, serverCart]
  );

  const addItem = useCallback(
    async (input: AddToCartInput) => {
      const quantity = input.quantity ?? 1;
      if (isGuest) {
        guest.addItem(
          {
            id: input.productId,
            name: input.name,
            price: input.price,
            image: input.image,
            slug: input.slug,
            size: input.size,
          },
          quantity
        );
        return;
      }
      // Surfaces server-side stock errors ("Only 2 units available") to callers.
      await addMutation.mutateAsync({
        productId: input.productId,
        quantity,
        size: input.size,
      });
    },
    [isGuest, guest, addMutation]
  );

  const updateQuantity = useCallback(
    async (key: string, quantity: number) => {
      if (quantity < 1) return;
      if (isGuest) {
        guest.updateQuantity(key, quantity);
        return;
      }
      await updateMutation.mutateAsync({ itemId: key, quantity });
    },
    [isGuest, guest, updateMutation]
  );

  const removeItem = useCallback(
    async (key: string) => {
      if (isGuest) {
        guest.removeItem(key);
        return;
      }
      await removeMutation.mutateAsync(key);
    },
    [isGuest, guest, removeMutation]
  );

  const clear = useCallback(async () => {
    if (isGuest) {
      guest.clearCart();
      return;
    }
    await clearMutation.mutateAsync();
  }, [isGuest, guest, clearMutation]);

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [items]
  );
  const itemCount = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  );

  const couponDiscount = isGuest ? 0 : serverCart?.couponDiscount || 0;

  return {
    items,
    itemCount,
    subtotal,
    couponCode: isGuest ? undefined : serverCart?.couponCode,
    couponDiscount,
    total: Math.max(0, subtotal - couponDiscount),
    isGuest,
    isLoading: !isGuest && serverLoading,
    isMutating:
      addMutation.isPending ||
      updateMutation.isPending ||
      removeMutation.isPending ||
      clearMutation.isPending,
    addItem,
    updateQuantity,
    removeItem,
    clear,
  };
}

/**
 * Merges a guest cart into the server cart on sign-in, then clears the local
 * copy so the two can't drift.
 *
 * Mounted once in the storefront layout. Items are pushed sequentially rather
 * than in parallel: the server cart is a single document, and concurrent
 * writes to it would race and drop items.
 */
export function useCartMergeOnLogin() {
  const { data: user } = useCurrentUser();
  const qc = useQueryClient();
  const guestItems = useGuestCart((s) => s.items);
  const clearGuestCart = useGuestCart((s) => s.clearCart);
  const mergingRef = useRef(false);

  useEffect(() => {
    if (!user || mergingRef.current || guestItems.length === 0) return;

    mergingRef.current = true;
    const snapshot = [...guestItems];

    (async () => {
      let merged = 0;
      for (const item of snapshot) {
        try {
          await api.post('/cart/items', {
            productId: item.id,
            quantity: Math.min(QTY_CAP, item.quantity),
            size: item.size || undefined,
          });
          merged += 1;
        } catch {
          // Out of stock, deleted product, or a stale guest id from the old
          // static catalogue. Skip it rather than blocking the whole merge.
        }
      }

      // Clear regardless: anything that failed can't be added anyway, and
      // keeping it would re-run this merge on every mount.
      clearGuestCart();
      if (merged > 0) {
        qc.invalidateQueries({ queryKey: queryKeys.cart.all });
      }
      mergingRef.current = false;
    })();
  }, [user, guestItems, clearGuestCart, qc]);
}
