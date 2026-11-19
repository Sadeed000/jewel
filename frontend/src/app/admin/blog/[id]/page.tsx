'use client';

import { useParams } from 'next/navigation';
import BlogEditor from '@/components/admin/BlogEditor';
import { useAdminBlogPost } from '@/hooks/useAdminBlog';
import { AdminError, AdminSkeleton } from '@/components/admin/ui';

export default function EditBlogPostPage() {
  const { id } = useParams<{ id: string }>();
  const { data: post, isLoading, error, refetch } = useAdminBlogPost(id);

  if (error) return <AdminError title="Unable to load this article" message={(error as Error).message} onRetry={() => refetch()} />;
  if (isLoading || !post) return <AdminSkeleton rows={8} />;
  return <BlogEditor post={post} />;
}
