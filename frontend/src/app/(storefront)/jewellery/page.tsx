'use client';

import type { Metadata } from 'next';
import { useState } from 'react';
import Breadcrumb from '@/components/common/Breadcrumb';
import PageHeroBanner from '@/components/shop/PageHeroBanner';
import QuickFilters from '@/components/shop/QuickFilters';
import ProductCard from '@/components/product/ProductCard';
import ShopByOccasion from '@/components/shop/ShopByOccasion';
import { useProducts } from '@/hooks/useProducts';
import { ProductGridSkeleton } from '@/components/common/Loading';
import { hero } from '@/lib/imagery';

const occasions = [
  {
    key: 'extraordinary',
    label: 'Extraordinary Hues',
    title: 'Extraordinary Hues',
    copy: 'For the women whose presence is its own colour. The stones she wears — bold, radiant, unforgettable.',
    modelImage: 'https://res.cloudinary.com/dnsulnx1r/image/upload/v1795009707/ratnapankh/library/photo-1611591437281-460bfbe1220a.jpg',
    productImages: [
      'https://res.cloudinary.com/dnsulnx1r/image/upload/v1795009727/ratnapankh/library/photo-1535632787350-4e68ef0ac584.jpg',
      'https://res.cloudinary.com/dnsulnx1r/image/upload/v1795009721/ratnapankh/library/photo-1611652022419-a9419f74343d.jpg',
      'https://res.cloudinary.com/dnsulnx1r/image/upload/v1795009705/ratnapankh/library/photo-1605100804763-247f67b3557e.jpg',
    ],
  },
  {
    key: 'office',
    label: 'Office Elegance',
    title: 'Office Elegance',
    copy: 'Refined pieces that speak softly but command attention through every meeting and milestone.',
    modelImage: 'https://res.cloudinary.com/dnsulnx1r/image/upload/v1795009725/ratnapankh/library/photo-1573408301185-9146fe634ad0.jpg',
    productImages: [
      'https://res.cloudinary.com/dnsulnx1r/image/upload/v1795009723/ratnapankh/library/photo-1599643478518-a784e5dc4c8f.jpg',
      'https://res.cloudinary.com/dnsulnx1r/image/upload/v1795007344/ratnapankh/heroes/earrings-sapphire-drops.jpg',
      'https://res.cloudinary.com/dnsulnx1r/image/upload/v1795009721/ratnapankh/library/photo-1611652022419-a9419f74343d.jpg',
    ],
  },
  {
    key: 'festive',
    label: 'Festive Glow',
    title: 'Festive Glow',
    copy: 'Heritage motifs and golden warmth for every celebration that defines your year.',
    modelImage: 'https://res.cloudinary.com/dnsulnx1r/image/upload/v1795009705/ratnapankh/library/photo-1605100804763-247f67b3557e.jpg',
    productImages: [
      'https://res.cloudinary.com/dnsulnx1r/image/upload/v1795009707/ratnapankh/library/photo-1611591437281-460bfbe1220a.jpg',
      'https://res.cloudinary.com/dnsulnx1r/image/upload/v1795009724/ratnapankh/library/photo-1602173574767-37ac01994b2a.jpg',
      'https://res.cloudinary.com/dnsulnx1r/image/upload/v1795009728/ratnapankh/library/photo-1583292650898-7d22cd27ca6f.jpg',
    ],
  },
];

export default function AllJewelleryPage() {
  const [filter, setFilter] = useState<'all' | 'new' | 'best' | 'u25' | 'u50' | 'u100' | 'a100'>('all');

  const getFilters = () => {
    const base = { limit: 24 };
    switch (filter) {
      case 'new':
        return { ...base, isNew: true };
      case 'best':
        return { ...base, isBestseller: true };
      case 'u25':
        return { ...base, maxPrice: 25000 };
      case 'u50':
        return { ...base, minPrice: 25000, maxPrice: 50000 };
      case 'u100':
        return { ...base, minPrice: 50000, maxPrice: 100000 };
      case 'a100':
        return { ...base, minPrice: 100000 };
      default:
        return base;
    }
  };

  const { data, isLoading } = useProducts(getFilters() as any);
  const items = data?.items ?? [];

  const chunk1 = items.slice(0, 3);
  const chunk2 = items.slice(3, 6);
  const chunk3 = items.slice(6, 9);
  const chunk4 = items.slice(9, 24);

  return (
    <div>
      <PageHeroBanner
        image={hero('jewelleryRoseEmeraldSet')}
        eyebrow="The Signature Edit"
        title={'Elevated\nSummer Stack'}
        highlight="10% off*"
        subtitle="on making charges"
        align="right"
      />

      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'All Jewellery' }]} />

      <QuickFilters
        filters={[
          { label: 'All', value: 'all' },
          { label: 'New Arrivals', value: 'new' },
          { label: 'Bestsellers', value: 'best' },
          { label: 'Under 25K', value: 'u25' },
          { label: '25K - 50K', value: 'u50' },
          { label: '50K - 1L', value: 'u100' },
          { label: 'Above 1L', value: 'a100' },
        ]}
        onChange={(val) => setFilter(val as any)}
        defaultActive={filter}
      />

      <div className="container-custom pb-16">
        {isLoading && !items.length ? (
          <ProductGridSkeleton count={24} />
        ) : (
          <>
            {/* Row 1 */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
              {chunk1.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>

            {/* Promo strip — Daily wear collection mosaic */}
            <div className="mt-5 grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
              {chunk2.slice(0, 1).map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
              <div className="md:col-span-2">
                <DailywearMosaic />
              </div>
            </div>

            {/* Row 3 */}
            <div className="mt-5 grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
              {chunk3.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>

            {/* Choose Your Look — multi-image lookbook tile */}
            <div className="mt-5 grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
              {chunk4.slice(0, 1).map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
              <div className="md:col-span-2">
                <ChooseYourLook />
              </div>
            </div>

            {/* More products */}
            <div className="mt-5 grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
              {chunk4.slice(1, 4).map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>

            {/* Filter by Price tile */}
            <div className="mt-5 grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
              {chunk4.slice(4, 5).map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
              <div className="md:col-span-2">
                <FilterByPrice />
              </div>
            </div>

            {/* More products */}
            <div className="mt-5 grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
              {chunk4.slice(5).map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          </>
        )}
      </div>

      <ShopByOccasion occasions={occasions} />
    </div>
  );
}

/* ---------- inline lookbook helpers ---------- */

function DailywearMosaic() {
  const tiles = [
    { label: 'Dailywear Rings', image: 'https://res.cloudinary.com/dnsulnx1r/image/upload/v1795009705/ratnapankh/library/photo-1605100804763-247f67b3557e.jpg' },
    { label: 'Dailywear Earrings', image: 'https://res.cloudinary.com/dnsulnx1r/image/upload/v1795009727/ratnapankh/library/photo-1535632787350-4e68ef0ac584.jpg' },
    { label: 'Dailywear Mangalsutra', image: 'https://res.cloudinary.com/dnsulnx1r/image/upload/v1795009728/ratnapankh/library/photo-1583292650898-7d22cd27ca6f.jpg' },
  ];
  return (
    <div className="relative h-full bg-gradient-to-br from-brand-maroon via-brand-maroon-dark to-brand-maroon-dark rounded-lg p-5 overflow-hidden">
      <p className="text-center text-white font-display text-2xl mb-4">Dailywear Jewellery</p>
      <div className="grid grid-cols-3 gap-2">
        {tiles.map((t) => (
          <div key={t.label} className="relative aspect-square rounded overflow-hidden">
            <img src={t.image} alt={t.label} className="w-full h-full object-cover" />
            <p className="absolute inset-x-0 bottom-0 bg-black/40 text-white text-[9px] text-center py-1">{t.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChooseYourLook() {
  return (
    <div className="relative h-full bg-brand-cream rounded-lg overflow-hidden border border-brand-cream-dark">
      <p className="absolute top-3 left-1/2 -translate-x-1/2 text-brand-ink font-display text-lg z-10">Choose Your Look</p>
      <div className="grid grid-cols-5 h-full">
        {['Casual Look', 'Party Look', 'Evening Look', 'Office Look', 'Modern Look'].map((label, i) => (
          <div key={label} className="relative group cursor-pointer overflow-hidden">
            <div className={`absolute inset-0 ${i === 2 ? 'ring-2 ring-brand-maroon ring-inset z-10' : ''}`} />
            <img
              src={['https://res.cloudinary.com/dnsulnx1r/image/upload/c_fill,g_auto,ar_1:1,w_400,f_auto,q_auto:good/v1795009707/ratnapankh/library/photo-1611591437281-460bfbe1220a.jpg', 'https://res.cloudinary.com/dnsulnx1r/image/upload/c_fill,g_auto,ar_1:1,w_400,f_auto,q_auto:good/v1795009725/ratnapankh/library/photo-1573408301185-9146fe634ad0.jpg', 'https://res.cloudinary.com/dnsulnx1r/image/upload/c_fill,g_auto,ar_1:1,w_400,f_auto,q_auto:good/v1795009707/ratnapankh/library/photo-1611591437281-460bfbe1220a.jpg', 'https://res.cloudinary.com/dnsulnx1r/image/upload/c_fill,g_auto,ar_1:1,w_400,f_auto,q_auto:good/v1795009723/ratnapankh/library/photo-1599643478518-a784e5dc4c8f.jpg', 'https://res.cloudinary.com/dnsulnx1r/image/upload/c_fill,g_auto,ar_1:1,w_400,f_auto,q_auto:good/v1795009705/ratnapankh/library/photo-1605100804763-247f67b3557e.jpg'][i]}
              loading="lazy"
              alt={label}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
            <p className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent text-white text-[10px] text-center py-2">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function FilterByPrice() {
  const tiles = [
    { label: 'Under 25K', image: 'https://res.cloudinary.com/dnsulnx1r/image/upload/v1795009705/ratnapankh/library/photo-1605100804763-247f67b3557e.jpg' },
    { label: '25K - 50K', image: 'https://res.cloudinary.com/dnsulnx1r/image/upload/v1795009723/ratnapankh/library/photo-1599643478518-a784e5dc4c8f.jpg' },
    { label: '50K - 1L', image: 'https://res.cloudinary.com/dnsulnx1r/image/upload/v1795009707/ratnapankh/library/photo-1611591437281-460bfbe1220a.jpg' },
  ];
  return (
    <div className="relative h-full bg-gradient-to-br from-brand-maroon-dark to-brand-maroon rounded-lg p-5 overflow-hidden">
      <p className="text-center text-white font-display text-2xl mb-4">Filter by price</p>
      <div className="grid grid-cols-3 gap-2">
        {tiles.map((t) => (
          <a key={t.label} href={`/jewellery?price=${t.label}`} className="relative aspect-square rounded overflow-hidden hover:scale-105 transition-transform">
            <img src={t.image} alt={t.label} className="w-full h-full object-cover" />
            <p className="absolute inset-x-0 bottom-0 bg-black/40 text-white text-[10px] text-center py-1">{t.label}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
