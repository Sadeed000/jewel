import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';

// The page itself is a client component, so its metadata lives here.
export const metadata: Metadata = pageMetadata({
  title: 'Digital Gold',
  description: 'Save towards gold jewellery in small amounts with a digital gold plan.',
  path: '/digital-gold',
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}