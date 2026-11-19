'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, ExternalLink, Eye, Globe, EyeOff, Newspaper, Plus, Search } from 'lucide-react';
import { useAdminBlogPosts, useSaveBlogPost } from '@/hooks/useAdminBlog';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useToast } from '@/components/providers/ToastProvider';
import { useConfirm } from '@/components/providers/ConfirmProvider';
import { cn } from '@/lib/utils';
import {
  PageHeader, AdminSkeleton, AdminError, AdminEmpty, Chip, toolbarInput, segmentTab, formatDate,
} from '@/components/admin/ui';
import type { BlogPost } from '@/lib/types';

const TABS = [
  { value: '', label: 'All' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Drafts' },
] as const;

export default function AdminBlogPage() {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const save = useSaveBlogPost();
  const [status, setStatus] = useState<'' | 'published' | 'draft'>('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const term = useDebouncedValue(q.trim(), 300);

  const { data, isLoading, error, refetch, isFetching } = useAdminBlogPosts({
    status: status || undefined,
    q: term || undefined,
    page,
  });
  useEffect(() => setPage(1), [status, term]);

  const togglePublish = async (post: BlogPost) => {
    const publishing = !post.isPublished;
    const ok = await confirm({
      title: publishing ? 'Publish this article?' : 'Unpublish this article?',
      description: publishing
        ? `"${post.title}" will appear on /blog and in the sitemap straight away.`
        : `"${post.title}" will be removed from the blog and the sitemap, and its URL will stop working.`,
      confirmLabel: publishing ? 'Publish' : 'Unpublish',
      tone: publishing ? 'default' : 'warning',
    });
    if (!ok) return;
    try {
      await save.mutateAsync({ id: post._id, data: { isPublished: publishing }, previousSlug: post.slug });
      toast.success(publishing ? 'Published' : 'Unpublished — now a draft', { description: post.title });
    } catch (err) {
      toast.error((err as Error).message || 'Could not update the article.');
    }
  };

  const pagination = data?.pagination;

  return (
    <div>
      <PageHeader
        eyebrow="Content"
        title="Blog"
        description="Write, preview and publish articles. Drafts are only visible to admins."
        actions={
          <Link
            href="/admin/blog/new"
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-b from-[#8e2f3d] to-admin-maroon px-4 text-sm font-semibold text-white shadow-admin-maroon hover:brightness-110"
          >
            <Plus size={16} /> New article
          </Link>
        }
      />

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-1 rounded-xl border border-admin-line bg-admin-surface p-1">
          {TABS.map((t) => (
            <button key={t.label} type="button" onClick={() => setStatus(t.value)} className={segmentTab(status === t.value)}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative w-full lg:w-72">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-admin-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title or slug" aria-label="Search articles" className={cn(toolbarInput, 'w-full pl-10')} />
        </div>
      </div>

      {error ? (
        <AdminError title="Unable to load articles" message={(error as Error).message} onRetry={() => refetch()} />
      ) : isLoading ? (
        <AdminSkeleton rows={5} />
      ) : !data?.items.length ? (
        <div className="rounded-2xl border border-admin-line bg-admin-surface shadow-admin-card">
          <AdminEmpty
            icon={Newspaper}
            title={term || status ? 'No matching articles' : 'No articles yet'}
            description={term || status ? 'Try another search or tab.' : 'Write your first buying guide — it stays a private draft until you publish it.'}
            action={
              <Link href="/admin/blog/new" className="text-sm font-semibold text-admin-maroon hover:underline">
                Write an article
              </Link>
            }
          />
        </div>
      ) : (
        <div className={cn('overflow-hidden rounded-2xl border border-admin-line bg-admin-surface shadow-admin-card transition-opacity', isFetching && 'opacity-70')}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-admin-line bg-gradient-to-r from-admin-gold-soft to-admin-subtle text-[11px] font-bold uppercase tracking-[0.12em] text-admin-gold-ink">
                  <th className="px-6 py-3.5">Article</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Published</th>
                  <th className="px-4 py-3.5">Modified</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-line">
                {data.items.map((post) => (
                  <tr key={post._id} className="group cursor-pointer transition-colors hover:bg-admin-subtle" onClick={() => router.push(`/admin/blog/${post._id}`)}>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-admin-ink group-hover:text-admin-gold-ink">{post.title}</p>
                      <p className="text-xs text-admin-muted">
                        /blog/{post.slug}
                        {post.category ? ` · ${post.category}` : ''}
                        {post.targetKeyword ? ` · 🎯 ${post.targetKeyword}` : ''}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <Chip tone={post.isPublished ? 'success' : 'neutral'}>{post.isPublished ? 'Published' : 'Draft'}</Chip>
                    </td>
                    <td className="px-4 py-4 text-admin-body">{post.publishedAt ? formatDate(post.publishedAt) : '—'}</td>
                    <td className="px-4 py-4 text-admin-body">{formatDate(post.updatedAt)}</td>
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1">
                        <a href={`/admin/blog/${post._id}/preview`} target="_blank" rel="noopener" title="Preview" aria-label={`Preview ${post.title}`} className="grid h-9 w-9 place-items-center rounded-lg text-admin-body hover:bg-admin-gold-soft hover:text-admin-maroon">
                          <Eye size={16} />
                        </a>
                        {post.isPublished && (
                          <a href={`/blog/${post.slug}`} target="_blank" rel="noopener" title="View live" aria-label={`View ${post.title} live`} className="grid h-9 w-9 place-items-center rounded-lg text-admin-body hover:bg-admin-gold-soft hover:text-admin-maroon">
                            <ExternalLink size={16} />
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => togglePublish(post)}
                          disabled={save.isPending}
                          className={cn(
                            'inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-colors disabled:opacity-50',
                            post.isPublished ? 'text-admin-gold-ink hover:bg-admin-gold-soft' : 'bg-admin-maroon text-white hover:brightness-110'
                          )}
                        >
                          {post.isPublished ? <><EyeOff size={14} /> Unpublish</> : <><Globe size={14} /> Publish</>}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between border-t border-admin-line px-6 py-3.5">
              <p className="text-[13px] tabular-nums text-admin-muted">Page {pagination.page} of {pagination.pages}</p>
              <div className="flex gap-2">
                <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={!pagination.hasPrev} className="inline-flex h-9 items-center gap-1 rounded-lg border border-admin-line bg-admin-surface px-3 text-[13px] font-medium text-admin-body hover:bg-admin-subtle disabled:opacity-40">
                  <ChevronLeft size={15} /> Prev
                </button>
                <button type="button" onClick={() => setPage((p) => p + 1)} disabled={!pagination.hasNext} className="inline-flex h-9 items-center gap-1 rounded-lg border border-admin-line bg-admin-surface px-3 text-[13px] font-medium text-admin-body hover:bg-admin-subtle disabled:opacity-40">
                  Next <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
