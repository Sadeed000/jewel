import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import { collectionCopy } from '@/lib/collections';
import Breadcrumb from '@/components/common/Breadcrumb';
import PageHeroBanner from '@/components/shop/PageHeroBanner';
import QuickFilters from '@/components/shop/QuickFilters';
import ProductCard from '@/components/product/ProductCard';
import { fetchProducts } from '@/lib/server-api';
import { hero } from '@/lib/imagery';

export const metadata: Metadata = pageMetadata({
  title: "Earrings for Women – Drop, Stud & Gemstone Earrings Online",
  description:
    "Shop drop, stud and gemstone earrings online in India with prices in INR. Metal, finish and stone details on every pair.",
  path: '/earrings',
});

export default async function EarringsPage() {
  const copy = collectionCopy('earrings');
  const earrings = await fetchProducts({ type: 'earrings', limit: 24 });
  const chunkA = earrings.slice(0, 3);
  const chunkB = earrings.slice(3, 5);
  const chunkC = earrings.slice(5, 8);
  const chunkD = earrings.slice(8);

  return (
    <div>
      <PageHeroBanner
        headingLevel="h2"
        image={hero('earringsDiamondStuds')}
        eyebrow="The Earring Edit"
        title={'Made to\nCatch the Light'}
        highlight="Studs, drops & gemstones"
        ctaLabel="Shop All Earrings"
        ctaHref="/shop/earrings"
        align="left"
      />

      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Earrings' }]} />

      <div className="container-custom mb-4">
        <h1 className="font-display text-3xl md:text-4xl text-brand-ink">{copy.h1}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-brand-muted">{copy.intro}</p>
      </div>

      <QuickFilters
        filters={[
          { label: 'All Earrings', value: 'all' },
          { label: 'Studs', value: 'studs' },
          { label: 'Drops', value: 'drops' },
          { label: 'Jhumkas', value: 'jhumkas' },
          { label: 'Hoops', value: 'hoops' },
          { label: 'Chandbalis', value: 'chandbalis' },
          { label: 'For Kids', value: 'kids' },
        ]}
      />

      <div className="container-custom pb-16">
        {/* Row 1 — 3 products */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
          {chunkA.map((p) => <ProductCard key={p._id} product={p} />)}
        </div>

        {/* Row 2 — 1 product + Festival of Diamonds banner */}
        <div className="mt-5 grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
          {chunkB.slice(0, 1).map((p) => <ProductCard key={p._id} product={p} />)}
          <div className="md:col-span-2 relative rounded-lg overflow-hidden bg-gradient-to-r from-cyan-900 via-teal-800 to-emerald-900 min-h-[280px]">
            <div className="absolute inset-0 bg-cover bg-center opacity-40" style={{ backgroundImage: "url('https://res.cloudinary.com/dnsulnx1r/image/upload/c_fill,g_auto,ar_16:9,w_1400,f_auto,q_auto:good/v1795007344/ratnapankh/heroes/earrings-sapphire-drops.jpg')" }} />
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/80 via-teal-800/40 to-transparent" />
            <span className="absolute top-3 left-3 text-[10px] bg-white/15 backdrop-blur text-white uppercase tracking-widest px-2 py-1 rounded">Ratnapankh Exclusive</span>
            <div className="absolute inset-0 flex items-center justify-end pr-6 md:pr-12">
              <div className="text-right text-white">
                <p className="font-display text-3xl md:text-4xl">Festival</p>
                <p className="font-display italic text-2xl md:text-3xl text-brand-gold-light">of Diamonds</p>
                <a href="/shop/diamond" className="inline-block mt-3 px-5 py-2 bg-white text-brand-maroon text-[10px] font-semibold tracking-widest uppercase rounded-sm hover:bg-brand-gold transition-colors">
                  Explore Now
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Row 3 */}
        <div className="mt-5 grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
          {chunkC.map((p) => <ProductCard key={p._id} product={p} />)}
        </div>

        {/* Discovery Studio banner row */}
        <div className="mt-5 grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
          {chunkD.slice(0, 1).map((p) => <ProductCard key={p._id} product={p} />)}
          <div className="md:col-span-2 relative rounded-lg overflow-hidden bg-brand-cream-dark min-h-[280px] flex items-center px-6 md:px-10">
            <div className="absolute inset-0 bg-gradient-to-r from-brand-cream-dark via-orange-50 to-transparent" />
            <div className="relative grid grid-cols-2 items-center gap-6 w-full">
              <div className="aspect-[3/4] rounded-lg bg-gradient-to-br from-orange-100 to-pink-100 overflow-hidden">
                <img src="https://res.cloudinary.com/dnsulnx1r/image/upload/c_fill,g_auto,ar_3:4,w_500,f_auto,q_auto:good/v1795007344/ratnapankh/heroes/earrings-sapphire-drops.jpg" alt="Sapphire drop earrings" loading="lazy" className="w-full h-full object-cover" />
              </div>
              <div>
                <h3 className="font-display text-2xl md:text-3xl text-brand-maroon">Discovery Studio</h3>
                <p className="text-sm text-brand-ink/80 mt-2">Explore what customers are loving right now</p>
                <a href="/shop/earrings" className="inline-block mt-4 px-5 py-2 bg-brand-maroon text-white text-[10px] font-semibold tracking-widest uppercase rounded-sm hover:bg-brand-maroon-dark transition-colors">
                  Explore Now
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Festive earrings strip */}
        <div className="mt-5 grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
          {chunkD.slice(1, 4).map((p) => <ProductCard key={p._id} product={p} />)}
        </div>

        <div className="mt-5 grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
          {chunkD.slice(4, 5).map((p) => <ProductCard key={p._id} product={p} />)}
          <div className="md:col-span-2 relative rounded-lg overflow-hidden bg-gradient-to-br from-amber-900 via-yellow-900 to-amber-950 min-h-[280px]">
            <div className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-overlay" style={{ backgroundImage: "url('https://res.cloudinary.com/dnsulnx1r/image/upload/c_fill,g_auto,ar_16:9,w_1400,f_auto,q_auto:good/v1795009721/ratnapankh/library/photo-1611652022419-a9419f74343d.jpg')" }} />
            <p className="absolute top-5 left-1/2 -translate-x-1/2 text-white font-display text-2xl">Festive Earrings</p>
            <div className="absolute inset-x-4 bottom-4 grid grid-cols-3 gap-3">
              {[
                { label: 'Studs', img: 'https://res.cloudinary.com/dnsulnx1r/image/upload/v1795009723/ratnapankh/library/photo-1599643478518-a784e5dc4c8f.jpg' },
                { label: 'Hoops', img: 'https://res.cloudinary.com/dnsulnx1r/image/upload/v1795007344/ratnapankh/heroes/earrings-sapphire-drops.jpg' },
                { label: 'Jhumkas', img: 'https://res.cloudinary.com/dnsulnx1r/image/upload/v1795009707/ratnapankh/library/photo-1611591437281-460bfbe1220a.jpg' },
              ].map((t) => (
                <a key={t.label} href={`/earrings?style=${t.label.toLowerCase()}`} className="relative aspect-square rounded-md overflow-hidden bg-white hover:scale-105 transition-transform">
                  <img src={t.img} alt={t.label} className="w-full h-full object-cover" />
                  <p className="absolute inset-x-0 bottom-0 bg-white/90 text-brand-ink text-[10px] text-center py-1 font-medium">{t.label}</p>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Found Something You Liked? section */}
        <div className="mt-12 mb-6">
          <h2 className="font-display text-2xl text-brand-ink">Found Something You Liked? Here&apos;s More Like It</h2>
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <button className="px-4 py-1.5 bg-brand-maroon text-white text-xs rounded-full">Quick Picks</button>
            <button className="px-4 py-1.5 border border-brand-cream-dark text-xs rounded-full hover:border-brand-maroon">Under 25K</button>
            <div className="ml-auto flex gap-1.5">
              <button className="w-8 h-8 rounded-full border border-brand-cream-dark grid place-items-center hover:border-brand-maroon">‹</button>
              <button className="w-8 h-8 rounded-full border border-brand-cream-dark grid place-items-center hover:border-brand-maroon">›</button>
            </div>
          </div>
        </div>

        {/* Final grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
          {chunkD.slice(5).map((p) => <ProductCard key={p._id} product={p} />)}
        </div>
      </div>
    </div>
  );
}
