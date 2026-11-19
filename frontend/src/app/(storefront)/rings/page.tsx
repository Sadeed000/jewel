import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import { collectionCopy } from '@/lib/collections';
import Breadcrumb from '@/components/common/Breadcrumb';
import QuickFilters from '@/components/shop/QuickFilters';
import ProductCard from '@/components/product/ProductCard';
import PageHeroBanner from '@/components/shop/PageHeroBanner';
import { fetchProducts } from '@/lib/server-api';
import { hero, tile } from '@/lib/imagery';

export const metadata: Metadata = pageMetadata({
  title: "Rings for Women & Men – Shop Rings Online in India",
  description:
    "Shop rings online in India in Indian sizes, with prices in INR. Find your size at home with the Ring Size Finder before you order.",
  path: '/rings',
});

export default async function RingsPage() {
  const copy = collectionCopy('rings');
  const rings = await fetchProducts({ type: 'rings', limit: 24 });
  const a = rings.slice(0, 3);
  const b = rings.slice(3, 4);
  const c = rings.slice(4, 7);
  const d = rings.slice(7);

  return (
    <div>
      <PageHeroBanner
        headingLevel="h2"
        image={hero('ringsBurgundyHalo')}
        eyebrow="The Engagement Edit"
        title={'A Ring for\nForever'}
        highlight="Find your perfect fit"
        ctaLabel="Find Your Ring Size"
        ctaHref="/ring-size-finder"
        align="left"
      />

      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Rings' }]} />

      <div className="container-custom mb-4">
        <h1 className="font-display text-3xl md:text-4xl text-brand-ink">{copy.h1}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-brand-muted">{copy.intro}</p>
      </div>

      <QuickFilters
        filters={[
          { label: 'All Rings', value: 'all' },
          { label: 'Engagement', value: 'engagement' },
          { label: 'Solitaires', value: 'solitaire' },
          { label: 'Casual', value: 'casual' },
          { label: 'Cocktail', value: 'cocktail' },
          { label: 'Couple Bands', value: 'bands' },
          { label: "Men's Rings", value: 'men' },
        ]}
      />

      <div className="container-custom pb-16">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
          {a.map((p) => <ProductCard key={p._id} product={p} />)}
        </div>

        {/* Solitaire banner */}
        <div className="mt-5 grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
          {b.map((p) => <ProductCard key={p._id} product={p} />)}
          <div className="md:col-span-2 relative rounded-lg overflow-hidden min-h-[280px] bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900">
            <div className="absolute inset-0 bg-cover bg-center opacity-50" style={{ backgroundImage: "url('https://res.cloudinary.com/dnsulnx1r/image/upload/c_fill,g_auto,ar_16:9,w_1400,f_auto,q_auto:good/v1795007334/ratnapankh/heroes/diamond-pear-black.jpg')" }} />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900/85 to-transparent" />
            <div className="absolute inset-0 flex items-center px-8 md:px-12">
              <div className="text-white">
                <p className="text-[10px] tracking-[0.4em] uppercase text-brand-gold-light">Solitaire Studio</p>
                <p className="font-display text-3xl md:text-4xl mt-2">A diamond as<br/>singular as you</p>
                <a href="/shop/diamond" className="inline-block mt-4 px-5 py-2 bg-brand-gold text-brand-maroon-dark text-[10px] font-semibold tracking-widest uppercase rounded-sm hover:bg-brand-gold-light transition-colors">
                  Explore Solitaires
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Row */}
        <div className="mt-5 grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
          {c.map((p) => <ProductCard key={p._id} product={p} />)}
        </div>

        {/* Ring Size Finder strip */}
        <div className="mt-5 grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
          {d.slice(0, 1).map((p) => <ProductCard key={p._id} product={p} />)}
          <div className="md:col-span-2 relative rounded-lg overflow-hidden min-h-[280px] bg-gradient-to-br from-rose-50 via-amber-50 to-orange-50 border border-brand-cream-dark">
            <div className="absolute inset-0 grid grid-cols-2">
              <div className="relative">
                <img src={tile('ringsHandDiamond', '3:4', 800)} alt="Hand wearing diamond rings" loading="lazy" className="w-full h-full object-cover" />
              </div>
              <div className="flex items-center px-6 md:px-10">
                <div>
                  <p className="text-[10px] tracking-[0.4em] uppercase text-brand-gold-dark">New Tool</p>
                  <h3 className="font-display text-2xl md:text-3xl text-brand-maroon mt-2">Ring Size Finder</h3>
                  <p className="text-sm text-brand-ink/80 mt-2">Get the perfect fit, every time. From the comfort of home.</p>
                  <a href="/ring-size-finder" className="inline-block mt-4 px-5 py-2 bg-brand-maroon text-white text-[10px] font-semibold tracking-widest uppercase rounded-sm hover:bg-brand-maroon-dark transition-colors">
                    Try Now
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Rest */}
        <div className="mt-5 grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
          {d.slice(1).map((p) => <ProductCard key={p._id} product={p} />)}
        </div>
      </div>
    </div>
  );
}
