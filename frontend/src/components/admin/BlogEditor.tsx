'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Eye, ExternalLink, Globe, EyeOff, Plus, Save, Search, Trash2, X } from 'lucide-react';
import { api } from '@/lib/api';
import { BRAND } from '@/lib/brand';
import { cn, resolveImageUrl } from '@/lib/utils';
import { useToast } from '@/components/providers/ToastProvider';
import { useConfirm } from '@/components/providers/ConfirmProvider';
import { useDeleteBlogPost, useSaveBlogPost } from '@/hooks/useAdminBlog';
import ImageUploader from '@/components/admin/ImageUploader';
import RichTextEditor from '@/components/admin/RichTextEditor';
import { Button, Field, Input, Textarea } from '@/components/admin/FormControls';
import { Chip, Panel } from '@/components/admin/ui';
import type { BlogPost, BlogPostInput, Paginated, Product } from '@/lib/types';

const CATEGORY_SUGGESTIONS = ['Ring Guides', 'Jewellery Care', 'Buying Guides', 'Gifting', 'Style Notes'];

const COLLECTION_PRESETS = [
  { label: 'Rings', href: '/rings' },
  { label: 'Earrings', href: '/earrings' },
  { label: 'Silver jewellery', href: '/shop/silver' },
  { label: 'Gemstone jewellery', href: '/shop/gemstone' },
  { label: 'Gold jewellery', href: '/shop/gold' },
  { label: 'Pendants', href: '/shop/pendants' },
  { label: 'All jewellery', href: '/shop/jewellery' },
  { label: 'Ring Size Finder', href: '/ring-size-finder' },
];

const slugify = (s: string) =>
  s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120);

const textLength = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().length;

type Form = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  coverImageAlt: string;
  category: string;
  authorName: string;
  metaTitle: string;
  metaDescription: string;
  targetKeyword: string;
  relatedProducts: { slug: string; name?: string }[];
  relatedCollections: { label: string; href: string }[];
};

const fromPost = (p?: BlogPost): Form => ({
  title: p?.title ?? '',
  slug: p?.slug ?? '',
  excerpt: p?.excerpt ?? '',
  content: p?.content ?? '',
  coverImage: p?.coverImage ?? '',
  coverImageAlt: p?.coverImageAlt ?? '',
  category: p?.category ?? '',
  authorName: p?.author?.name ?? `${BRAND} Editorial`,
  metaTitle: p?.seo?.metaTitle ?? '',
  metaDescription: p?.seo?.metaDescription ?? '',
  targetKeyword: p?.targetKeyword ?? '',
  relatedProducts: (p?.relatedProducts ?? []).map((slug) => ({ slug })),
  relatedCollections: p?.relatedCollections ?? [],
});

const toPayload = (f: Form): Partial<BlogPostInput> => ({
  title: f.title.trim(),
  slug: slugify(f.slug || f.title),
  excerpt: f.excerpt.trim(),
  content: f.content,
  coverImage: f.coverImage.trim(),
  coverImageAlt: f.coverImageAlt.trim(),
  category: f.category.trim(),
  author: { name: f.authorName.trim() || `${BRAND} Editorial` },
  seo: { metaTitle: f.metaTitle.trim(), metaDescription: f.metaDescription.trim() },
  targetKeyword: f.targetKeyword.trim(),
  relatedProducts: f.relatedProducts.map((p) => p.slug),
  relatedCollections: f.relatedCollections.filter((c) => c.label.trim() && c.href.trim()),
});

function Counter({ value, ideal }: { value: number; ideal: number }) {
  return (
    <span className={cn('tabular-nums', value > ideal ? 'text-rose-600' : 'text-admin-muted')}>
      {value}/{ideal}
    </span>
  );
}

export default function BlogEditor({ post }: { post?: BlogPost }) {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const save = useSaveBlogPost();
  const remove = useDeleteBlogPost();

  const [form, setForm] = useState<Form>(() => fromPost(post));
  const [dirty, setDirty] = useState(false);
  // Slug follows the title until the editor types one, or once it has been public.
  const [slugTouched, setSlugTouched] = useState(!!post?.slug);
  const savedSlug = useRef(post?.slug);

  useEffect(() => {
    if (post) {
      setForm(fromPost(post));
      setDirty(false);
      savedSlug.current = post.slug;
    }
  }, [post]);

  // Names for products linked in an earlier session.
  useEffect(() => {
    form.relatedProducts.forEach((p, i) => {
      if (p.name) return;
      api.get<{ product: Product }>(`/products/slug/${p.slug}`)
        .then(({ product }) =>
          setForm((f) => ({
            ...f,
            relatedProducts: f.relatedProducts.map((x, j) => (j === i ? { slug: product.slug, name: product.name } : x)),
          }))
        )
        .catch(() => undefined);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post?._id]);

  // Warn before leaving with unsaved edits.
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => {
    setDirty(true);
    setForm((f) => {
      const next = { ...f, [key]: value };
      if (key === 'title' && !slugTouched) next.slug = slugify(String(value));
      return next;
    });
  };

  const isPublished = !!post?.isPublished;
  const effectiveSlug = slugify(form.slug || form.title);
  const seoTitle = form.metaTitle.trim() || form.title.trim() || 'Article title';
  const seoDescription = form.metaDescription.trim() || form.excerpt.trim() || 'The excerpt is used when no meta description is set.';

  const problems = useMemo(() => {
    const list: string[] = [];
    if (form.title.trim().length < 2) list.push('Add a title.');
    if (form.excerpt.trim().length < 10) list.push('Write an excerpt of at least 10 characters.');
    if (textLength(form.content) < 20) list.push('The article body is too short.');
    if (!effectiveSlug) list.push('The URL slug is empty.');
    return list;
  }, [form, effectiveSlug]);

  const publishProblems = useMemo(() => {
    const list = [...problems];
    if (form.coverImage && !form.coverImageAlt.trim()) list.push('Describe the featured image (alt text).');
    return list;
  }, [problems, form.coverImage, form.coverImageAlt]);

  const persist = async (overrides: Partial<BlogPostInput> = {}, message = 'Saved') => {
    if (problems.length) {
      toast.error(problems[0]);
      return null;
    }
    try {
      const saved = await save.mutateAsync({
        id: post?._id,
        data: { ...toPayload(form), ...overrides },
        previousSlug: savedSlug.current,
      });
      setDirty(false);
      savedSlug.current = saved.slug;
      toast.success(message, { description: saved.title });
      if (!post) router.replace(`/admin/blog/${saved._id}`);
      return saved;
    } catch (err) {
      toast.error((err as Error).message || 'Could not save the article.');
      return null;
    }
  };

  const handlePublish = async () => {
    if (publishProblems.length) return toast.error(publishProblems[0]);
    const ok = await confirm({
      title: 'Publish this article?',
      description: `It will appear on /blog and in the sitemap straight away at /blog/${effectiveSlug}.`,
      confirmLabel: 'Publish',
    });
    if (ok) await persist({ isPublished: true }, 'Published');
  };

  const handleUnpublish = async () => {
    const ok = await confirm({
      title: 'Unpublish this article?',
      description: 'It will be removed from the blog and the sitemap, and its URL will stop working. You can publish it again later.',
      confirmLabel: 'Unpublish',
      tone: 'warning',
    });
    if (ok) await persist({ isPublished: false }, 'Unpublished — now a draft');
  };

  const handlePreview = async () => {
    let id = post?._id;
    if (dirty || !id) id = (await persist({}, 'Saved for preview'))?._id;
    if (id) window.open(`/admin/blog/${id}/preview`, '_blank', 'noopener');
  };

  const handleDelete = async () => {
    if (!post) return;
    const ok = await confirm({
      title: 'Delete this article?',
      description: 'This permanently removes the article. If it was published, its URL will return "not found".',
      confirmLabel: 'Delete',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await remove.mutateAsync(post);
      setDirty(false);
      toast.success('Article deleted');
      router.replace('/admin/blog');
    } catch (err) {
      toast.error((err as Error).message || 'Could not delete the article.');
    }
  };

  return (
    <div>
      {/* Header + actions */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Link href="/admin/blog" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-admin-muted hover:text-admin-maroon">
            <ArrowLeft size={15} /> All articles
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-[26px] font-bold tracking-[-0.03em] text-admin-ink">{post ? 'Edit article' : 'New article'}</h1>
            <Chip tone={isPublished ? 'success' : 'neutral'}>{isPublished ? 'Published' : 'Draft'}</Chip>
            {dirty && <span className="text-xs font-medium text-admin-gold-ink">Unsaved changes</span>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {isPublished && (
            <a href={`/blog/${post?.slug}`} target="_blank" rel="noopener" className="inline-flex h-10 items-center gap-2 rounded-xl border border-admin-line bg-admin-surface px-4 text-sm font-semibold text-admin-ink hover:bg-admin-gold-soft">
              <ExternalLink size={15} /> View live
            </a>
          )}
          <Button variant="ghost" type="button" onClick={handlePreview} disabled={save.isPending}>
            <Eye size={15} /> Preview
          </Button>
          <Button variant="ghost" type="button" onClick={() => persist({}, isPublished ? 'Changes published' : 'Draft saved')} disabled={save.isPending}>
            <Save size={15} /> {isPublished ? 'Save changes' : 'Save draft'}
          </Button>
          {isPublished ? (
            <Button variant="gold" type="button" onClick={handleUnpublish} disabled={save.isPending}>
              <EyeOff size={15} /> Unpublish
            </Button>
          ) : (
            <Button type="button" onClick={handlePublish} disabled={save.isPending}>
              <Globe size={15} /> Publish
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        {/* Main column */}
        <div className="space-y-6">
          <Panel title="Article">
            <div className="space-y-5">
              <Field label="Title" required>
                <Input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="How to measure your ring size at home" maxLength={200} />
              </Field>
              <Field
                label="URL slug"
                required
                hint={
                  isPublished && post && effectiveSlug !== post.slug
                    ? `The old address /blog/${post.slug} will redirect permanently to the new one.`
                    : `Address: /blog/${effectiveSlug || '…'}`
                }
              >
                <Input
                  value={form.slug}
                  onChange={(e) => { setSlugTouched(true); set('slug', e.target.value.toLowerCase().replace(/\s+/g, '-')); }}
                  onBlur={() => setForm((f) => ({ ...f, slug: slugify(f.slug || f.title) }))}
                  placeholder="how-to-measure-ring-size"
                />
              </Field>
              <Field label="Excerpt" required hint="One or two sentences shown on the blog list and used as the search description if none is set below.">
                <Textarea rows={3} value={form.excerpt} onChange={(e) => set('excerpt', e.target.value)} maxLength={500} />
              </Field>
              <div>
                <span className="mb-1.5 block text-[13px] font-medium text-admin-body">
                  Article body <span className="ml-0.5 text-admin-gold-ink">*</span>
                </span>
                <RichTextEditor value={form.content} onChange={(html) => set('content', html)} placeholder="Write the article. Use Heading for sections and the link button to point readers to products and collections." />
                <span className="mt-1.5 block text-xs text-admin-muted">
                  Tip: link to products and collections with site paths like <code>/rings</code> or <code>/product/…</code> — they keep working if the domain changes.
                </span>
              </div>
            </div>
          </Panel>

          <Panel title="Search appearance" description="How the article can appear on Google. Leave blank to use the title and excerpt.">
            <div className="space-y-5">
              <div className="rounded-xl border border-admin-line bg-white p-4">
                <p className="truncate text-xs text-[#4d5156]">{BRAND} › blog › {effectiveSlug || '…'}</p>
                <p className="mt-1 truncate text-lg leading-snug text-[#1a0dab]">{seoTitle} | {BRAND}</p>
                <p className="mt-1 line-clamp-2 text-sm text-[#4d5156]">{seoDescription}</p>
              </div>
              <Field label="SEO title" hint="Aim for under 60 characters. The brand name is added automatically.">
                <div className="relative">
                  <Input value={form.metaTitle} onChange={(e) => set('metaTitle', e.target.value)} placeholder={form.title || 'Defaults to the article title'} maxLength={200} className="pr-16" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs"><Counter value={form.metaTitle.length} ideal={60} /></span>
                </div>
              </Field>
              <Field label="Meta description" hint="Aim for 120–160 characters that answer the reader's question.">
                <div className="relative">
                  <Textarea rows={3} value={form.metaDescription} onChange={(e) => set('metaDescription', e.target.value)} placeholder={form.excerpt || 'Defaults to the excerpt'} maxLength={500} />
                  <span className="absolute bottom-2 right-3 text-xs"><Counter value={form.metaDescription.length} ideal={160} /></span>
                </div>
              </Field>
              <Field label="Target keyword (planning only)" hint="Not shown on the page. Helps you track which search each article is written for.">
                <Input value={form.targetKeyword} onChange={(e) => set('targetKeyword', e.target.value)} placeholder="how to measure ring size at home in india" maxLength={120} />
              </Field>
            </div>
          </Panel>
        </div>

        {/* Side column */}
        <div className="space-y-6">
          <Panel title="Details">
            <div className="space-y-5">
              <Field label="Category">
                <Input list="blog-categories" value={form.category} onChange={(e) => set('category', e.target.value)} placeholder="Ring Guides" maxLength={100} />
                <datalist id="blog-categories">
                  {CATEGORY_SUGGESTIONS.map((c) => <option key={c} value={c} />)}
                </datalist>
              </Field>
              <Field label="Author">
                <Input value={form.authorName} onChange={(e) => set('authorName', e.target.value)} maxLength={100} />
              </Field>
              {post && (
                <dl className="grid grid-cols-2 gap-3 rounded-xl bg-admin-subtle p-3 text-xs">
                  <div>
                    <dt className="text-admin-muted">First published</dt>
                    <dd className="mt-0.5 font-medium text-admin-ink">{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('en-IN') : '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-admin-muted">Last modified</dt>
                    <dd className="mt-0.5 font-medium text-admin-ink">{post.updatedAt ? new Date(post.updatedAt).toLocaleDateString('en-IN') : '—'}</dd>
                  </div>
                </dl>
              )}
            </div>
          </Panel>

          <Panel title="Featured image">
            <div className="space-y-4">
              <ImageUploader
                label="Upload"
                value={form.coverImage ? [form.coverImage] : []}
                onChange={(urls) => set('coverImage', urls[urls.length - 1] ?? '')}
                maxImages={1}
              />
              <Field label="…or image URL">
                <Input value={form.coverImage} onChange={(e) => set('coverImage', e.target.value)} placeholder="https://…" />
              </Field>
              {form.coverImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={resolveImageUrl(form.coverImage)} alt="" className="aspect-[16/9] w-full rounded-xl object-cover ring-1 ring-admin-line" />
              )}
              <Field label="Image alt text" required={!!form.coverImage} hint="Describe what the image shows, for screen readers and image search.">
                <Input value={form.coverImageAlt} onChange={(e) => set('coverImageAlt', e.target.value)} placeholder="Silver ring with an oval opal on a linen cloth" maxLength={200} />
              </Field>
            </div>
          </Panel>

          <ProductPicker
            value={form.relatedProducts}
            onChange={(v) => set('relatedProducts', v)}
          />

          <Panel title="Linked collections" description="Shown as buttons under the article.">
            <div className="space-y-3">
              {form.relatedCollections.map((c, i) => (
                <div key={i} className="flex gap-2">
                  <Input value={c.label} onChange={(e) => set('relatedCollections', form.relatedCollections.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} placeholder="Label" className="flex-1" />
                  <Input value={c.href} onChange={(e) => set('relatedCollections', form.relatedCollections.map((x, j) => (j === i ? { ...x, href: toPath(e.target.value) } : x)))} placeholder="/shop/silver" className="flex-1" />
                  <button type="button" aria-label="Remove collection" onClick={() => set('relatedCollections', form.relatedCollections.filter((_, j) => j !== i))} className="grid h-10 w-10 flex-none place-items-center rounded-xl text-admin-muted hover:bg-rose-50 hover:text-rose-600">
                    <X size={16} />
                  </button>
                </div>
              ))}
              <div className="flex flex-wrap gap-1.5">
                {COLLECTION_PRESETS.filter((p) => !form.relatedCollections.some((c) => c.href === p.href)).map((p) => (
                  <button
                    key={p.href}
                    type="button"
                    onClick={() => set('relatedCollections', [...form.relatedCollections, p].slice(0, 6))}
                    className="inline-flex items-center gap-1 rounded-full border border-admin-line px-2.5 py-1 text-xs font-medium text-admin-body hover:border-admin-gold hover:bg-admin-gold-soft"
                  >
                    <Plus size={12} /> {p.label}
                  </button>
                ))}
              </div>
            </div>
          </Panel>

          {post && (
            <button type="button" onClick={handleDelete} className="inline-flex items-center gap-2 text-sm font-semibold text-rose-600 hover:text-rose-700">
              <Trash2 size={15} /> Delete article
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Accepts a full URL of this site and keeps just the path. */
function toPath(value: string) {
  const v = value.trim();
  if (typeof window === 'undefined' || !/^https?:\/\//i.test(v)) return v;
  try {
    const u = new URL(v);
    return u.origin === window.location.origin ? `${u.pathname}${u.search}` : v;
  } catch {
    return v;
  }
}

function ProductPicker({
  value,
  onChange,
}: {
  value: { slug: string; name?: string }[];
  onChange: (v: { slug: string; name?: string }[]) => void;
}) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) return setResults([]);
    setLoading(true);
    const t = setTimeout(() => {
      api.get<Paginated<Product>>('/products', { q: term, limit: 6 })
        .then((d) => setResults(d.items))
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <Panel title="Linked products" description='Shown as "Shop the story" under the article.'>
      <div className="space-y-3">
        {value.length > 0 && (
          <ul className="space-y-1.5">
            {value.map((p) => (
              <li key={p.slug} className="flex items-center justify-between gap-2 rounded-xl bg-admin-subtle px-3 py-2 text-sm">
                <span className="min-w-0">
                  <span className="block truncate font-medium text-admin-ink">{p.name ?? p.slug}</span>
                  <span className="block truncate text-xs text-admin-muted">/product/{p.slug}</span>
                </span>
                <button type="button" aria-label={`Remove ${p.name ?? p.slug}`} onClick={() => onChange(value.filter((x) => x.slug !== p.slug))} className="grid h-8 w-8 flex-none place-items-center rounded-lg text-admin-muted hover:bg-rose-50 hover:text-rose-600">
                  <X size={15} />
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-muted" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products to link…" className="pl-9" />
        </div>
        {loading && <p className="text-xs text-admin-muted">Searching…</p>}
        {results.length > 0 && (
          <ul className="max-h-64 space-y-1 overflow-y-auto">
            {results.filter((r) => !value.some((v) => v.slug === r.slug)).map((r) => (
              <li key={r._id}>
                <button
                  type="button"
                  onClick={() => { onChange([...value, { slug: r.slug, name: r.name }].slice(0, 12)); setQ(''); setResults([]); }}
                  className="flex w-full items-center gap-3 rounded-xl px-2 py-1.5 text-left text-sm hover:bg-admin-gold-soft"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={resolveImageUrl(r.coverImages?.[0] || r.images?.[0] || '')} alt="" className="h-9 w-9 flex-none rounded-lg object-cover ring-1 ring-admin-line" />
                  <span className="min-w-0 flex-1 truncate">{r.name}</span>
                  <Plus size={14} className="text-admin-gold-ink" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Panel>
  );
}
