import { notFound } from 'next/navigation';
import { isKnownCollection } from '@/lib/collections';

/**
 * Rejects unknown collection slugs with a real HTTP 404. This must happen in
 * the layout: the page renders inside loading.tsx's Suspense boundary, where
 * the 200 status has already been sent by the time notFound() runs.
 */
export default function CollectionLayout({
  params,
  children,
}: {
  params: { category: string };
  children: React.ReactNode;
}) {
  if (!isKnownCollection(params.category)) notFound();
  return children;
}
