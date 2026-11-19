import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import Breadcrumb from '@/components/common/Breadcrumb';
import ProductCard from '@/components/product/ProductCard';
import { resolveImageUrl } from '@/lib/utils';
import type { BlogPost, Product } from '@/lib/types';

/**
 * Article layout shared by the public page (/blog/[slug]) and the admin's
 * private draft preview, so a preview looks exactly like the live article.
 *
 * `html` is the article body. It was sanitised by the API when saved (a
 * fixed allowlist of formatting tags — no scripts, styles or handlers).
 */
export const formatArticleDate = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';

export default function BlogArticle({
  post,
  html,
  products = [],
}: {
  post: BlogPost;
  html: string;
  products?: Product[];
}) {
  const published = post.publishedAt;
  // Only show "Updated" when the edit came well after publication.
  const updated =
    published && post.updatedAt && new Date(post.updatedAt).getTime() - new Date(published).getTime() > 86_400_000
      ? post.updatedAt
      : null;
  const cover = post.coverImage ? resolveImageUrl(post.coverImage) : '';

  return (
    <article>
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Blog', href: '/blog' },
          { label: post.title },
        ]}
      />

      <div className="container-custom pb-16">
        <header className="mx-auto max-w-3xl text-center">
          {post.category && (
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-gold-dark">{post.category}</p>
          )}
          <h1 className="mt-3 font-display text-4xl leading-[1.1] text-brand-ink md:text-5xl text-balance">{post.title}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-brand-muted">{post.excerpt}</p>
          <p className="mt-5 text-xs uppercase tracking-widest text-brand-muted">
            {post.author?.name && <span>By {post.author.name}</span>}
            {published && (
              <>
                <span aria-hidden="true"> · </span>
                <time dateTime={published}>{formatArticleDate(published)}</time>
              </>
            )}
            {updated && (
              <>
                <span aria-hidden="true"> · </span>
                <span>
                  Updated <time dateTime={updated}>{formatArticleDate(updated)}</time>
                </span>
              </>
            )}
            {post.readTime && (
              <>
                <span aria-hidden="true"> · </span>
                <span>{post.readTime}</span>
              </>
            )}
          </p>
        </header>

        {cover && (
          // Plain <img>: article images may come from any host the editor
          // uses. Fixed dimensions + aspect ratio mean no layout shift.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt={post.coverImageAlt || ''}
            width={1600}
            height={900}
            fetchPriority="high"
            decoding="async"
            className="mx-auto mt-10 aspect-[16/9] w-full max-w-5xl rounded-panel object-cover"
          />
        )}

        <div className="article-body mx-auto mt-10 max-w-3xl" dangerouslySetInnerHTML={{ __html: html }} />

        {!!post.relatedCollections?.length && (
          <nav aria-label="Related collections" className="mx-auto mt-12 max-w-3xl border-t border-brand-line pt-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold-dark">Explore</p>
            <ul className="mt-4 flex flex-wrap gap-3">
              {post.relatedCollections.map((c) => (
                <li key={c.href + c.label}>
                  <Link
                    href={c.href}
                    data-blog-link="collection"
                    className="inline-flex items-center gap-2 rounded-full border border-brand-line px-4 py-2 text-sm text-brand-ink transition-colors hover:border-brand-maroon hover:text-brand-maroon"
                  >
                    {c.label} <ArrowRight size={14} />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}

        {products.length > 0 && (
          <section aria-labelledby="shop-the-story" className="mt-14">
            <h2 id="shop-the-story" className="text-center font-display text-3xl text-brand-ink">
              Shop the story
            </h2>
            <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-4" data-blog-link="product">
              {products.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  );
}
