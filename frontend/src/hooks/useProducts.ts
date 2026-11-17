'use client';

import { useQuery, useMutation, keepPreviousData } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { ImageSearchResult, Paginated, Product, ProductFilters } from '@/lib/types';

/**
 * Paginated product list with full filter support.
 * keepPreviousData keeps the previous page visible while the next page
 * loads — eliminates the "list flicker" when paginating or changing filters.
 */
export function useProducts(
  filters: ProductFilters = {},
  options: { enabled?: boolean } = {}
) {
  return useQuery({
    queryKey: queryKeys.products.list(filters as Record<string, unknown>),
    queryFn: () =>
      api.get<Paginated<Product>>('/products', filters as Record<string, string | number | boolean>),
    placeholderData: keepPreviousData,
    // Lets callers skip the request entirely (e.g. an empty guest wishlist,
    // where an empty `ids` filter would otherwise fetch the whole catalogue).
    enabled: options.enabled ?? true,
  });
}

export function useProduct(slug: string | undefined) {
  return useQuery({
    queryKey: queryKeys.products.bySlug(slug ?? ''),
    queryFn: () => api.get<{
      name: string;
      category: string; product: Product 
}>(`/products/slug/${slug}`),
    enabled: !!slug,
  });
}

export function useRelatedProducts(slug: string | undefined, limit = 8) {
  return useQuery({
    queryKey: queryKeys.products.related(slug ?? ''),
    queryFn: () => api.get<{ items: Product[] }>(`/products/slug/${slug}/related`, { limit }),
    enabled: !!slug,
  });
}

export function useProductFacets(filters: ProductFilters = {}) {
  return useQuery({
    queryKey: queryKeys.products.facets(filters as Record<string, unknown>),
    queryFn: () =>
      api.get<{ facets: any }>('/products/facets', filters as Record<string, string | number | boolean>),
  });
}

/* ───────────── Visual search ─────────────
   A mutation rather than a query: the shopper's photo is the input and it
   isn't a cacheable key, so each upload is an explicit action. */

export function useImageSearch() {
  return useMutation({
    mutationFn: ({
      file,
      category,
      type,
      limit = 24,
    }: {
      file: File | Blob;
      category?: string;
      type?: string;
      limit?: number;
    }) => {
      const form = new FormData();
      // Filename matters: multer/sharp both key off the extension for typing.
      form.append('image', file, (file as File).name || 'photo.jpg');
      return api.upload<ImageSearchResult>('/products/image-search', form, {
        limit,
        ...(category ? { category } : {}),
        ...(type ? { type } : {}),
      });
    },
  });
}

/* ───────────── Convenience hooks for homepage sections ───────────── */

export function useBestsellers(limit = 8) {
  return useProducts({ isBestseller: true, limit });
}


export function useNewArrivals(limit = 8) {
  return useProducts({ isNew: true, limit });
}

export function useFeaturedProducts(limit = 8) {
  // "Featured" = expert choice OR bestseller — using bestseller as a stand-in
  // because expert-choice has fewer entries. Adjust as your catalogue grows.
  return useProducts({ isBestseller: true, limit, sort: '-createdAt' });
}

/* Helper: products by type for category pages */
export function useProductsByType(
  type: ProductFilters['type'],
  extra: Omit<ProductFilters, 'type'> = {}
) {
  return useProducts({ type, ...extra });
}

export function useProductsByOccasion(
  occasion: ProductFilters['occasion'],
  extra: Omit<ProductFilters, 'occasion'> = {}
) {
  return useProducts({ occasion, ...extra });
}

export function useProductsByCategory(
  category: ProductFilters['category'],
  extra: Omit<ProductFilters, 'category'> = {}
) {
  return useProducts({ category, ...extra });
}
