import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';

// The page itself is a client component, so its metadata lives here.
export const metadata: Metadata = pageMetadata({
  title: 'Help & FAQs – Delivery, Returns & Payments',
  description: 'Answers about delivery, returns, payment options and orders, plus ways to reach the team.',
  path: '/help',
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}