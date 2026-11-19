import type { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumb from '@/components/common/Breadcrumb';
import { fetchBlogPosts } from '@/lib/server-api';
import { resolveImageUrl } from '@/lib/utils';
import { JsonLd, breadcrumbLd, pageMetadata } from '@/lib/seo';
import { SITE_NAME } from '@/lib/site';
import { formatArticleDate } from '@/components/blog/BlogArticle';

/**
 * Blog listing — published articles only (the public API never returns
 * drafts). Cached and tagged 'blog': publishing or unpublishing in the admin
 * panel purges the tag, so the list updates immediately.
 *
 * Indexing: /blog and /blog?page=N are indexable and self-canonical;
 * category-filtered views are noindex with /blog as canonical.
 */
export const revalidate = 300;

const PAGE_SIZE = 12;

type Props = { searchParams: Record<string, string | string[] | undefined> };

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const page = Math.max(1, Number(one(searchParams.page)) || 1);
  const category = one(searchParams.category);
  return pageMetadata({
    title: page > 1 ? `Jewellery Buying Guides & Care Tips – Page ${page}` : 'Jewellery Buying Guides, Ring Sizing & Care Tips',
    description: `Practical jewellery guides from ${SITE_NAME}: ring sizing at home, caring for silver and gemstones, and choosing the right piece — written for buyers in India.`,
    path: category ? '/blog' : page > 1 ? `/blog?page=${page}` : '/blog',
    noindex: !!category,
  });
}

export default async function BlogPage({ searchParams }: Props) {
  const page = Math.max(1, Number(one(searchParams.page)) || 1);
  const category = one(searchParams.category);

  const [data, all] = await Promise.all([
    fetchBlogPosts({ page, limit: PAGE_SIZE, category }),
    // Category chips are built from what is actually published.
    fetchBlogPosts({ limit: 100 }),
  ]);
  const posts = data?.items ?? [];
  const pagination = data?.pagination;
  const categories = Array.from(new Set((all?.items ?? []).map((p) => p.category).filter(Boolean))) as string[];

  const pageHref = (n: number) => {
    const q = new URLSearchParams();
    if (category) q.set('category', category);
    if (n > 1) q.set('page', String(n));
    const s = q.toString();
    return s ? `/blog?${s}` : '/blog';
  };

  return (
    <div>
      <JsonLd data={breadcrumbLd([{ name: 'Home', path: '/' }, { name: 'Blog', path: '/blog' }])} />
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Blog' }]} />

      <div className="container-custom pb-16">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <p className="script-italic font-display text-2xl text-brand-gold-dark">The {SITE_NAME} Journal</p>
          <h1 className="mt-1 font-display text-4xl text-brand-ink md:text-5xl">Jewellery Guides &amp; Stories</h1>
          <p className="mt-3 text-sm leading-relaxed text-brand-muted">
            Ring sizing, jewellery care and buying advice — practical answers before you choose.
          </p>
        </div>

        {categories.length > 1 && (
          <nav aria-label="Blog categories" className="mb-10 flex flex-wrap justify-center gap-2">
            {['All', ...categories].map((c) => {
              const active = c === 'All' ? !category : c === category;
              return (
                <Link
                  key={c}
                  href={c === 'All' ? '/blog' : `/blog?category=${encodeURIComponent(c)}`}
                  aria-current={active ? 'page' : undefined}
                  className={`rounded-full border px-4 py-1.5 text-xs transition-colors ${
                    active
                      ? 'border-brand-maroon bg-brand-maroon text-white'
                      : 'border-brand-cream-dark hover:border-brand-maroon hover:text-brand-maroon'
                  }`}
                >
                  {c}
                </Link>
              );
            })}
          </nav>
        )}

        {posts.length === 0 ? (
          <div className="py-16 text-center">
            <p className="font-display text-2xl text-brand-ink">New guides are on their way</p>
            <p className="mt-2 text-sm text-brand-muted">
              Meanwhile, find your size with the{' '}
              <Link href="/ring-size-finder" className="text-brand-maroon underline underline-offset-4">
                Ring Size Finder
              </Link>{' '}
              or browse <Link href="/rings" className="text-brand-maroon underline underline-offset-4">rings</Link>.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
            {posts.map((p, i) => {
              const lead = i === 0 && page === 1 && !category;
              const cover = p.coverImage ? resolveImageUrl(p.coverImage) : '';
              return (
                <Link key={p._id} href={`/blog/${p.slug}`} className={`group ${lead ? 'md:col-span-2' : ''}`}>
                  <div className={`relative overflow-hidden rounded-lg bg-brand-cream-dark ${lead ? 'aspect-[16/8]' : 'aspect-[4/3]'}`}>
                    {cover && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={cover}
                        alt={p.coverImageAlt || ''}
                        width={lead ? 1600 : 800}
                        height={lead ? 800 : 600}
                        loading={lead ? 'eager' : 'lazy'}
                        decoding="async"
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    )}
                    {p.category && (
                      <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs text-brand-maroon backdrop-blur">
                        {p.category}
                      </span>
                    )}
                  </div>
                  <div className="mt-4">
                    <h2 className={`font-display text-brand-ink transition-colors group-hover:text-brand-maroon ${lead ? 'text-3xl' : 'text-xl'}`}>
                      {p.title}
                    </h2>
                    <p className="mt-2 line-clamp-2 text-sm text-brand-muted">{p.excerpt}</p>
                    <p className="mt-3 text-xs uppercase tracking-widest text-brand-gold-dark">
                      {p.publishedAt && <time dateTime={p.publishedAt}>{formatArticleDate(p.publishedAt)}</time>}
                      {p.readTime && ` · ${p.readTime}`}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {pagination && pagination.pages > 1 && (
          <nav aria-label="Blog pages" className="mt-12 flex items-center justify-center gap-3 text-sm">
            {pagination.hasPrev && (
              <Link href={pageHref(page - 1)} rel="prev" className="btn-outline">
                Newer
              </Link>
            )}
            <span className="text-brand-muted">
              Page {pagination.page} of {pagination.pages}
            </span>
            {pagination.hasNext && (
              <Link href={pageHref(page + 1)} rel="next" className="btn-outline">
                Older
              </Link>
            )}
          </nav>
        )}
      </div>
    </div>
  );
}
