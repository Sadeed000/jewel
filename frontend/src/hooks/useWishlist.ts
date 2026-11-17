'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { Wishlist } from '@/lib/types';
import { useCurrentUser } from './useAuth';

export function useWishlist() {
  const { data: user } = useCurrentUser();
  return useQuery({
    queryKey: queryKeys.wishlist.all,
    queryFn: () => api.get<{ wishlist: Wishlist }>('/wishlist').then((d) => d.wishlist),
    enabled: !!user,
  });
}

/**
 * Toggle product in wishlist. Returns { added: boolean } so the UI can
 * show the right toast ("Added to wishlist" / "Removed from wishlist").
 */
export function useToggleWishlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) =>
      api.post<{ wishlist: Wishlist; added: boolean }>(`/wishlist/toggle/${productId}`),
    onSuccess: ({ wishlist }) => qc.setQueryData(queryKeys.wishlist.all, wishlist),
  });
}

export function useRemoveFromWishlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) =>
      api.delete<{ wishlist: Wishlist }>(`/wishlist/${productId}`).then((d) => d.wishlist),
    onSuccess: (wishlist) => qc.setQueryData(queryKeys.wishlist.all, wishlist),
  });
}

export function useClearWishlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete<null>('/wishlist'),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.wishlist.all }),
  });
}
