import HeroCarousel from '@/components/home/HeroCarousel';
import GoldRateTicker from '@/components/home/GoldRateTicker';
import CategoryTiles from '@/components/home/CategoryTiles';
import CollectionsGrid from '@/components/home/CollectionsGrid';
import { BestsellerCarousel, NewArrivalsCarousel } from '@/components/home/DynamicCarousels';
import TrendingNow from '@/components/home/TrendingNow';
import AureliaWorld from '@/components/home/AureliaWorld';
import Assurance from '@/components/home/Assurance';
import ExchangeNewsletter from '@/components/home/ExchangeNewsletter';

export default function HomePage() {
  return (
    <>
      <GoldRateTicker />
      <HeroCarousel />
      <CollectionsGrid />
      <BestsellerCarousel />
      <CategoryTiles />
      <TrendingNow />
      <AureliaWorld />
      <NewArrivalsCarousel />
      <Assurance />
      <ExchangeNewsletter />
    </>
  );
}
