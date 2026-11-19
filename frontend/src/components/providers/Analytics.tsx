'use client';

import { useEffect } from 'react';
import Script from 'next/script';
import { GA_ID, track } from '@/lib/analytics';

/**
 * Loads GA4 only when NEXT_PUBLIC_GA_MEASUREMENT_ID is set, after the page is
 * interactive (never blocks rendering). Also records clicks from blog
 * articles to products and collections via one delegated listener on links
 * marked with data-blog-link (see components/blog/BlogArticle.tsx).
 */
export default function Analytics() {
  useEffect(() => {
    if (!GA_ID) return;
    const onClick = (e: MouseEvent) => {
      const link = (e.target as HTMLElement | null)?.closest('a');
      if (!link) return;
      const article = link.closest('article');
      const marker = link.closest('[data-blog-link]')?.getAttribute('data-blog-link');
      const inBody = !!link.closest('.article-body');
      if (!article || !(marker || inBody)) return;
      const href = link.getAttribute('href') || '';
      const isProduct = href.startsWith('/product/');
      const isCollection = /^\/(shop|rings|earrings|gemstone|daily-wear|wedding|gifting)(\/|$|\?)/.test(href);
      if (!isProduct && !isCollection) return;
      track('select_content', {
        content_type: isProduct ? 'blog_to_product' : 'blog_to_collection',
        item_id: href,
        source_article: window.location.pathname,
      });
    };
    document.addEventListener('click', onClick, { capture: true });
    return () => document.removeEventListener('click', onClick, { capture: true });
  }, []);

  if (!GA_ID) return null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');`}
      </Script>
    </>
  );
}
