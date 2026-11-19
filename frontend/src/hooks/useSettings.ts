'use client';

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { Banner, BlogPost, Category, Paginated, SiteSettings, Testimonial } from '@/lib/types';

/* ───────────── Banners ───────────── */

/**
 * `initialData` lets a server component hand over banners it already fetched,
 * so they're in the first HTML instead of arriving after hydration.
 */
export function useBanners(placement?: Banner['placement'], initialData?: Banner[]) {
  return useQuery({
    queryKey: queryKeys.content.banners(placement),
    queryFn: () => api.get<{ banners: Banner[] }>('/content/banners', placement ? { placement } : undefined).then((d) => d.banners),
    staleTime: 10 * 60 * 1000, // banners change infrequently
    initialData,
  });
}

/* ───────────── Testimonials ───────────── */

export function useTestimonials(featured = false) {
  return useQuery({
    queryKey: queryKeys.content.testimonials(featured),
    queryFn: () =>
      api.get<{ testimonials: Testimonial[] }>('/content/testimonials', featured ? { featured: 'true' } : undefined).then((d) => d.testimonials),
    staleTime: 10 * 60 * 1000,
  });
}

/* ───────────── Blog ───────────── */

export function useBlogPosts(filters: { page?: number; limit?: number; category?: string; tag?: string; q?: string } = {}) {
  return useQuery({
    queryKey: queryKeys.content.blog(filters as Record<string, unknown>),
    queryFn: () => api.get<Paginated<BlogPost>>('/content/blog', filters),
    placeholderData: keepPreviousData,
  });
}

export function useBlogPost(slug: string | undefined) {
  return useQuery({
    queryKey: queryKeys.content.blogPost(slug ?? ''),
    queryFn: () => api.get<{ post: BlogPost }>(`/content/blog/${slug}`).then((d) => d.post),
    enabled: !!slug,
  });
}

/* ───────────── Site settings ───────────── */

export function useSiteSettings() {
  return useQuery({
    queryKey: queryKeys.content.settings,
    queryFn: () => api.get<{ settings: SiteSettings }>('/content/settings').then((d) => d.settings),
    staleTime: 30 * 60 * 1000, // settings rarely change — cache aggressively
  });
}

/* ───────────── Categories ───────────── */

export function useCategories(filters: { nav?: boolean; megaMenu?: boolean } = {}) {
  const query: Record<string, string> = {};
  if (filters.nav) query.nav = 'true';
  if (filters.megaMenu) query.megaMenu = 'true';

  return useQuery({
    queryKey: queryKeys.content.categories(filters as Record<string, unknown>),
    queryFn: () => api.get<{ categories: Category[] }>('/content/categories', query).then((d) => d.categories),
    staleTime: 10 * 60 * 1000,
  });
}

export function useCategory(slug: string | undefined) {
  return useQuery({
    queryKey: ['content', 'category', slug],
    queryFn: () => api.get<{ category: Category }>(`/content/categories/${slug}`).then((d) => d.category),
    enabled: !!slug,
  });
}
