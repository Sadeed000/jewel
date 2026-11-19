import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import BlogArticle from '@/components/blog/BlogArticle';
import { fetchBlogPostResult, fetchProductBySlug } from '@/lib/server-api';
import { resolveImageUrl } from '@/lib/utils';
import { SITE_NAME, SITE_URL, absoluteUrl, relativiseOwnLinks } from '@/lib/site';
import { JsonLd, breadcrumbLd, clip, pageMetadata } from '@/lib/seo';
import type { BlogPost, Product } from '@/lib/types';

/**
 * Public article page.
 *
 *  - Drafts and unpublished posts → 404 (the public API doesn't return them).
 *  - A post's previous slug       → 308 to the current one (src/middleware.ts).
 *  - Cached (ISR) and tagged 'blog'; publish / unpublish / edit in the admin
 *    panel purges the tag so changes show immediately, not after 5 minutes.
 */
export const revalidate = 300;

export function generateStaticParams() {
  return [];
}

type Props = { params: { slug: string } };

const metaTitle = (post: BlogPost) => post.seo?.metaTitle?.trim() || post.title;
const metaDescription = (post: BlogPost) => clip(post.seo?.metaDescription?.trim() || post.excerpt);
const coverUrl = (post: BlogPost) => (post.coverImage ? resolveImageUrl(post.coverImage) : '');

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { post, missing } = await fetchBlogPostResult(params.slug);
  // Real HTTP 404 for drafts / unpublished / unknown slugs. Never add a
  // loading.tsx above this route: it would turn the 404 into a 200.
  if (missing) notFound();
  if (!post) return { title: 'Article', robots: { index: false } };
  return pageMetadata({
    title: metaTitle(post),
    description: metaDescription(post),
    path: `/blog/${post.slug}`,
    image: coverUrl(post),
    imageAlt: post.coverImageAlt,
    type: 'article',
    publishedTime: post.publishedAt ?? undefined,
    modifiedTime: post.updatedAt,
  });
}

function articleJsonLd(post: BlogPost) {
  const url = absoluteUrl(`/blog/${post.slug}`);
  const image = coverUrl(post);
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': `${url}#article`,
    mainEntityOfPage: url,
    url,
    headline: post.title.slice(0, 110),
    description: metaDescription(post),
    ...(image.startsWith('http') ? { image: [image] } : {}),
    datePublished: post.publishedAt,
    dateModified: post.updatedAt || post.publishedAt,
    author: { '@type': post.author?.name && !/editorial|team/i.test(post.author.name) ? 'Person' : 'Organization', name: post.author?.name || SITE_NAME },
    publisher: { '@type': 'Organization', '@id': `${SITE_URL}/#organization`, name: SITE_NAME, url: `${SITE_URL}/` },
    inLanguage: 'en-IN',
    ...(post.category ? { articleSection: post.category } : {}),
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { post, missing } = await fetchBlogPostResult(params.slug);
  if (missing || !post) notFound();
  // Old slugs are 308-redirected by middleware.ts; canonical covers any gap.

  // Linked products, in the order the editor chose; missing ones are skipped.
  const products = (
    await Promise.all((post.relatedProducts ?? []).slice(0, 8).map((slug) => fetchProductBySlug(slug)))
  ).filter((p): p is Product => !!p);

  return (
    <>
      <JsonLd
        data={[
          articleJsonLd(post),
          breadcrumbLd([
            { name: 'Home', path: '/' },
            { name: 'Blog', path: '/blog' },
            { name: post.title, path: `/blog/${post.slug}` },
          ]),
        ]}
      />
      <BlogArticle post={post} html={relativiseOwnLinks(post.content ?? '')} products={products} />
    </>
  );
}
