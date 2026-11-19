'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Lock } from 'lucide-react';
import BlogArticle from '@/components/blog/BlogArticle';
import { useAdminBlogPost } from '@/hooks/useAdminBlog';
import { AdminError, AdminSkeleton, Chip } from '@/components/admin/ui';
import { api } from '@/lib/api';
import type { Product } from '@/lib/types';

/**
 * Private draft preview. Lives under /admin, so it is behind the admin guard,
 * reads the post through the admin-only API (drafts included), and is
 * noindex + disallowed in robots.txt. Uses the same <BlogArticle> as the
 * public page, so what you see here is what readers will see.
 */
export default function BlogPreviewPage() {
  const { id } = useParams<{ id: string }>();
  const { data: post, isLoading, error, refetch } = useAdminBlogPost(id);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (!post?.relatedProducts?.length) return setProducts([]);
    Promise.all(
      post.relatedProducts.slice(0, 8).map((slug) =>
        api.get<{ product: Product }>(`/products/slug/${slug}`).then((d) => d.product).catch(() => null)
      )
    ).then((list) => setProducts(list.filter((p): p is Product => !!p)));
  }, [post]);

  if (error) return <AdminError title="Unable to load this article" message={(error as Error).message} onRetry={() => refetch()} />;
  if (isLoading || !post) return <AdminSkeleton rows={8} />;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-admin-gold/40 bg-admin-gold-soft/70 px-5 py-3">
        <p className="flex items-center gap-2 text-sm font-medium text-admin-gold-ink">
          <Lock size={15} /> Private preview — only admins can see this page.
          <Chip tone={post.isPublished ? 'success' : 'neutral'}>{post.isPublished ? 'Published' : 'Draft'}</Chip>
        </p>
        <Link href={`/admin/blog/${post._id}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-admin-maroon hover:underline">
          <ArrowLeft size={15} /> Back to editor
        </Link>
      </div>
      <div className="storefront-preview overflow-hidden rounded-2xl bg-brand-cream shadow-admin-card ring-1 ring-admin-line">
        <BlogArticle post={{ ...post, publishedAt: post.publishedAt ?? new Date().toISOString() }} html={post.content ?? ''} products={products} />
      </div>
    </div>
  );
}
