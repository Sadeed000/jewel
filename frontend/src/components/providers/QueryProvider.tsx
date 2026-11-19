'use client';

import { useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

/**
 * Creates one QueryClient per browser session. We instantiate inside
 * useState so HMR / Suspense doesn't accidentally share the client across
 * renders and so SSR-hydration is safe.
 */
export default function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Cache for 5 min, then revalidate in the background.
            staleTime: 5 * 60 * 1000,
            // Keep cached data for 30 min after last subscriber unmounts.
            gcTime: 30 * 60 * 1000,
            // 1 retry on failure (catches flaky network), but no retry on 4xx.
            retry: (failureCount, error: any) => {
              if (error?.status >= 400 && error?.status < 500) return false;
              return failureCount < 1;
            },
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={client}>
      {children}
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />}
    </QueryClientProvider>
  );
}
