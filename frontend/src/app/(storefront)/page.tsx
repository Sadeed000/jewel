import dynamic from 'next/dynamic';
import type { Metadata } from 'next';
import { JsonLd, organizationLd, pageMetadata, websiteLd } from '@/lib/seo';
import { SITE_NAME } from '@/lib/site';
import HeroCarousel from '@/components/home/HeroCarousel';
import GoldRateTicker from '@/components/home/GoldRateTicker';
import CategoryTiles from '@/components/home/CategoryTiles';
import CollectionsGrid from '@/components/home/CollectionsGrid';
import { BestsellerCarousel, NewArrivalsCarousel } from '@/components/home/DynamicCarousels';
import TrendingNow from '@/components/home/TrendingNow';
import AureliaWorld from '@/components/home/AureliaWorld';
import Assurance from '@/components/home/Assurance';
import Reveal from '@/components/ui/Reveal';
import { fetchBanners, fetchProductPageOrNull } from '@/lib/server-api';

// The newsletter form sits at the very bottom of the page; its JS is split
// out of the initial bundle (the markup is still server-rendered).
const ExchangeNewsletter = dynamic(() => import('@/components/home/ExchangeNewsletter'));

// Rebuilt in the background at most every 5 minutes (ISR): visitors get a
// pre-rendered page instantly instead of waiting on the API.
export const revalidate = 300;

export const metadata: Metadata = pageMetadata({
  title: `${SITE_NAME} – Silver, Gemstone & Everyday Jewellery Online in India`,
  description:
    'Shop rings, earrings and pendants online in India with prices in INR, Indian ring sizes and secure checkout. Buying guides on the Ratnapankh blog.',
  path: '/',
  absoluteTitle: true,
});

export default async function HomePage() {
  // Fetched in parallel on the server; each fails soft to `null`, in which
  // case the client component fetches for itself as it did before.
  const [banners, bestsellers, newArrivals] = await Promise.all([
    fetchBanners('home-hero'),
    fetchProductPageOrNull({ isBestseller: true, limit: 8 }),
    fetchProductPageOrNull({ isNew: true, limit: 8 }),
  ]);

  return (
    <>
      <JsonLd data={[organizationLd(), websiteLd()]} />
      {/* The homepage has no visible headline (the hero is a carousel), so
          give it one H1 for search engines and screen readers. */}
      <h1 className="sr-only">{SITE_NAME} – jewellery online in India</h1>
      {/* Above the fold — renders immediately, no reveal. */}
      <GoldRateTicker />
      <HeroCarousel initialBanners={banners ?? undefined} />

      <Reveal><CollectionsGrid /></Reveal>
      <Reveal><BestsellerCarousel initial={bestsellers ?? undefined} /></Reveal>
      <Reveal><CategoryTiles /></Reveal>
      <Reveal><TrendingNow /></Reveal>
      <Reveal><AureliaWorld /></Reveal>
      <Reveal><NewArrivalsCarousel initial={newArrivals ?? undefined} /></Reveal>
      <Reveal><Assurance /></Reveal>
      <Reveal><ExchangeNewsletter /></Reveal>
    </>
  );
}
