import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';

// The page itself is a client component, so its metadata lives here.
export const metadata: Metadata = pageMetadata({
  title: 'Find a Store',
  description: 'Find a store near you, with addresses, opening hours and directions.',
  path: '/store-locator',
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}