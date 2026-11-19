import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';

// The page itself is a client component, so its metadata lives here.
// Its product grid loads in the browser, so the server-rendered listing at
// /shop/jewellery is the canonical, indexable version of this page.
export const metadata: Metadata = pageMetadata({
  title: 'Shop All Jewellery Online in India',
  description: 'Browse every ring, earring and pendant in the store with prices in INR. Filter by metal, stone, type and price.',
  path: '/shop/jewellery',
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}