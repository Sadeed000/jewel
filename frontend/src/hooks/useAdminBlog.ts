'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, tokenStore } from '@/lib/api';
import type { BlogPost, BlogPostInput, Paginated } from '@/lib/types';

/**
 * Admin blog data. Every write is followed by a storefront cache purge
 * (/api/revalidate) so /blog, the article URL and the sitemap reflect a
 * publish or unpublish straight away.
 */
const keys = {
  all: ['admin', 'blog'] as const,
  list: (f: object) => ['admin', 'blog', 'list', f] as const,
  one: (id: string) => ['admin', 'blog', 'post', id] as const,
};

/** Best-effort: a failed purge only means the 5-minute cache applies. */
export async function purgeStorefrontBlog(slugs: (string | undefined)[] = []) {
  try {
    const token = tokenStore.get();
    await fetch('/api/revalidate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ scope: 'blog', slugs: slugs.filter(Boolean) }),
    });
  } catch {
    /* ignore */
  }
}

/**
 * Product edits (price, stock, slug…) purge the cached product pages and
 * sitemap the same way. Accepts the mutation variables of the product
 * hooks, whatever their shape; slug-level purging is covered by the tag.
 */
export function purgeStorefront(scope: 'products', _vars?: unknown) {
  const token = tokenStore.get();
  fetch('/api/revalidate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ scope }),
  }).catch(() => undefined);
}

export function useAdminBlogPosts(filters: { status?: 'published' | 'draft'; q?: string; page?: number } = {}) {
  return useQuery({
    queryKey: keys.list(filters),
    queryFn: () => api.get<Paginated<BlogPost>>('/content/blog/admin/posts', { ...filters, limit: 20 }),
  });
}

export function useAdminBlogPost(id: string | undefined) {
  return useQuery({
    queryKey: keys.one(id ?? ''),
    queryFn: () => api.get<{ post: BlogPost }>(`/content/blog/admin/posts/${id}`).then((d) => d.post),
    enabled: !!id,
  });
}

export function useSaveBlogPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data, previousSlug }: { id?: string; data: Partial<BlogPostInput>; previousSlug?: string }) => {
      const post = id
        ? (await api.patch<{ post: BlogPost }>(`/content/blog/${id}`, data)).post
        : (await api.post<{ post: BlogPost }>('/content/blog', data)).post;
      await purgeStorefrontBlog([post.slug, previousSlug]);
      return post;
    },
    onSuccess: (post) => {
      qc.invalidateQueries({ queryKey: keys.all });
      qc.setQueryData(keys.one(post._id), post);
    },
  });
}

export function useDeleteBlogPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (post: Pick<BlogPost, '_id' | 'slug'>) => {
      await api.delete(`/content/blog/${post._id}`);
      await purgeStorefrontBlog([post.slug]);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  });
}
