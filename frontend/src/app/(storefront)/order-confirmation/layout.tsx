import type { Metadata } from 'next';

// Private / utility page: kept out of search results (also disallowed in
// robots.txt). Links on the page are still followed.
export const metadata: Metadata = {
  title: 'Order Confirmation',
  robots: { index: false, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}