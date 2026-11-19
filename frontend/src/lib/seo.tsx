import type { Metadata } from 'next';
import { SITE_NAME, SITE_URL, absoluteUrl } from './site';

/**
 * Metadata builder shared by every indexable page.
 *
 * Next merges metadata shallowly, so a page that sets `openGraph` replaces
 * the layout's object entirely. Building the whole block here keeps the
 * site name, locale and URL consistent on every page.
 *
 * `path` is the canonical path. It is made absolute via `metadataBase`
 * (= SITE_URL, set in the root layout), so changing SITE_URL moves every
 * canonical, og:url and twitter URL at once.
 */
export function pageMetadata({
  title,
  description,
  path,
  image,
  imageAlt,
  noindex = false,
  type = 'website',
  absoluteTitle = false,
  publishedTime,
  modifiedTime,
}: {
  title: string;
  description: string;
  path: string;
  image?: string | null;
  imageAlt?: string;
  noindex?: boolean;
  type?: 'website' | 'article';
  /** Skip the "| Ratnapankh" suffix (already included, or homepage). */
  absoluteTitle?: boolean;
  publishedTime?: string;
  modifiedTime?: string;
}): Metadata {
  const socialTitle = absoluteTitle ? title : `${title} | ${SITE_NAME}`;
  const images = image && /^https?:\/\//.test(image) ? [{ url: image, alt: imageAlt || title }] : undefined;

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    robots: noindex ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: {
      type,
      siteName: SITE_NAME,
      locale: 'en_IN',
      url: path,
      title: socialTitle,
      description,
      images,
      ...(type === 'article' ? { publishedTime, modifiedTime } : {}),
    },
    twitter: {
      card: images ? 'summary_large_image' : 'summary',
      title: socialTitle,
      description,
      images: images?.map((i) => i.url),
    },
  };
}

/** Private / utility pages: never indexed, links still followed. */
export const NOINDEX: Metadata = { robots: { index: false, follow: true } };

/** Shortens text to a meta-description length on a word boundary. */
export function clip(text: string | undefined | null, max = 158): string {
  const clean = String(text ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(' ') > 80 ? cut.lastIndexOf(' ') : cut.length).replace(/[,;:.\s-]+$/, '')}…`;
}

/**
 * Renders schema.org JSON-LD. `<` is escaped so content can't close the
 * script tag early.
 */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  );
}

export function breadcrumbLd(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function organizationLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: `${SITE_URL}/`,
  };
}

export function websiteLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: `${SITE_URL}/`,
    inLanguage: 'en-IN',
    publisher: { '@id': `${SITE_URL}/#organization` },
  };
}
