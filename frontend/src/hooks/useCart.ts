'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { Cart } from '@/lib/types';
import { useCurrentUser } from './useAuth';

/**
 * Server-side cart hooks. These are only enabled when a user is logged in;
 * for guests the existing Zustand store in lib/store.ts continues to handle
 * the cart locally. This guarantees the UI never breaks for anonymous users.
 *
 * Note: renamed from `useCart` → `useServerCart` so the existing Zustand
 * store keeps its `useCart` name and we don't have to touch every file.
 */

export function useServerCart() {
  const { data: user } = useCurrentUser();
  return useQuery({
    queryKey: queryKeys.cart.all,
    queryFn: () => api.get<{ cart: Cart }>('/cart').then((d) => d.cart),
    enabled: !!user, // only fetch server cart when logged in
  });
}

export function useAddToCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { productId: string; quantity?: number; size?: string }) =>
      api.post<{ cart: Cart }>('/cart/items', payload).then((d) => d.cart),
    onSuccess: (cart) => qc.setQueryData(queryKeys.cart.all, cart),
  });
}

export function useUpdateCartItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      api.patch<{ cart: Cart }>(`/cart/items/${itemId}`, { quantity }).then((d) => d.cart),
    onSuccess: (cart) => qc.setQueryData(queryKeys.cart.all, cart),
  });
}

export function useRemoveCartItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) =>
      api.delete<{ cart: Cart }>(`/cart/items/${itemId}`).then((d) => d.cart),
    onSuccess: (cart) => qc.setQueryData(queryKeys.cart.all, cart),
  });
}

export function useClearCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete<null>('/cart'),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.cart.all }),
  });
}

export function useApplyCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => api.post<{ cart: Cart }>('/cart/coupon', { code }).then((d) => d.cart),
    onSuccess: (cart) => qc.setQueryData(queryKeys.cart.all, cart),
  });
}

export function useRemoveCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete<{ cart: Cart }>('/cart/coupon').then((d) => d.cart),
    onSuccess: (cart) => qc.setQueryData(queryKeys.cart.all, cart),
  });
}
