import type { Metadata } from 'next';
import { Cormorant_Garamond, Inter } from 'next/font/google';
import './globals.css';
import QueryProvider from '@/components/providers/QueryProvider';
import ToastProvider from '@/components/providers/ToastProvider';

const display = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
});

const body = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Aurelia — Fine Jewellery, Gold, Diamond & Gemstones',
    template: '%s | Aurelia',
  },
  description:
    'Discover exquisite gold, diamond, platinum, and gemstone jewellery. Shop rings, earrings, pendants, mangalsutras, bridal sets and more — crafted with timeless artistry.',
  keywords: [
    'gold jewellery',
    'diamond rings',
    'gemstone necklace',
    'bridal jewellery',
    'mangalsutra',
    'platinum',
  ],
  openGraph: {
    title: 'Aurelia — Fine Jewellery',
    description: 'Exquisite jewellery for every occasion.',
    type: 'website',
  },
  robots: { index: true, follow: true },
};

/**
 * Root layout holds only the document shell and providers. Storefront chrome
 * lives in the (storefront) group so /admin renders without a navbar.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="min-h-screen">
        <QueryProvider>
          <ToastProvider>{children}</ToastProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
