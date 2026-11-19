import type { Metadata } from 'next';
import { Cormorant_Garamond, Inter } from 'next/font/google';
import './globals.css';
import QueryProvider from '@/components/providers/QueryProvider';
import ToastProvider from '@/components/providers/ToastProvider';
import ConfirmProvider from '@/components/providers/ConfirmProvider';
import MotionProvider from '@/components/providers/MotionProvider';
import NavigationProgress from '@/components/common/NavigationProgress';
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/site';

const display = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
});

// Inter is a variable font: omitting `weight` ships one file covering every
// weight instead of five separate downloads.
const body = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

// Every relative URL in metadata (canonical, og:url, images) is resolved
// against SITE_URL — see lib/site.ts. Canonicals are set per page, never
// here, because a layout canonical would be inherited by every child route.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | Jewellery Online in India`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    locale: 'en_IN',
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

/**
 * Root layout holds only the document shell and providers. Storefront chrome
 * lives in the (storefront) group so /admin renders without a navbar.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${display.variable} ${body.variable}`}>
      <body className="min-h-screen">
        <MotionProvider>
          <QueryProvider>
            <ToastProvider>
              <ConfirmProvider>
                <NavigationProgress />
                {children}
              </ConfirmProvider>
            </ToastProvider>
          </QueryProvider>
        </MotionProvider>
      </body>
    </html>
  );
}
