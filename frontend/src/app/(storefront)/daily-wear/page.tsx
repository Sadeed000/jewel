import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import Breadcrumb from '@/components/common/Breadcrumb';
import QuickFilters from '@/components/shop/QuickFilters';
import ProductCard from '@/components/product/ProductCard';
import PageHeroBanner from '@/components/shop/PageHeroBanner';
import { fetchProducts } from '@/lib/server-api';
import { hero, tile } from '@/lib/imagery';

export const metadata: Metadata = pageMetadata({
  title: "Daily Wear Jewellery – Lightweight Rings, Earrings & Pendants",
  description:
    "Lightweight everyday jewellery — rings, earrings and pendants for office and daily wear, with prices in INR.",
  path: '/daily-wear',
});

export default async function DailyWearPage() {
  const items = await fetchProducts({ occasion: 'daily-wear', limit: 24 });
  // Pad with a few non-occasion items so the page stays lush
  const filler = [...items];

  return (
    <div>
      <PageHeroBanner
        image={hero('dailyWearDaintyRings')}
        eyebrow="The Daily Edit"
        title={'Light. Lovely.\nLived in.'}
        subtitle="Pieces designed for the rhythm of everyday life."
        ctaLabel="Shop the Edit"
        ctaHref="/daily-wear"
        align="left"
        height="lg"
      />

      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Daily Wear' }]} />

      {/* Sub-categories pill row with icons */}
      <section className="container-custom py-8">
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 md:gap-5">
          {[
            { label: 'Daily Rings', icon: '○', href: '/rings' },
            { label: 'Daily Earrings', icon: '◐', href: '/earrings' },
            { label: 'Daily Pendants', icon: '◇', href: '/jewellery' },
            { label: 'Daily Mangalsutra', icon: '❀', href: '/jewellery' },
            { label: 'Daily Chains', icon: '⌗', href: '/jewellery' },
            { label: 'Daily Bracelets', icon: '⌒', href: '/jewellery' },
          ].map((c) => (
            <a key={c.label} href={c.href} className="group flex flex-col items-center gap-2.5 p-3">
              <div className="aspect-square w-full bg-gradient-to-br from-brand-cream to-brand-cream-dark rounded-full grid place-items-center group-hover:from-brand-gold-light group-hover:to-brand-gold transition-all">
                <span className="text-2xl md:text-3xl text-brand-maroon group-hover:text-white transition-colors">{c.icon}</span>
              </div>
              <span className="text-[10px] md:text-xs font-medium text-brand-ink uppercase tracking-wider text-center">{c.label}</span>
            </a>
          ))}
        </div>
      </section>

      <QuickFilters
        filters={[
          { label: 'All', value: 'all' },
          { label: 'Lightweight', value: 'light' },
          { label: 'Under 50K', value: 'u50' },
          { label: 'Office', value: 'office' },
          { label: 'Casual', value: 'casual' },
          { label: 'Diamond', value: 'diamond' },
          { label: 'Gold', value: 'gold' },
        ]}
      />

      <div className="container-custom pb-16">
        {/* Row 1 */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
          {filler.slice(0, 3).map((p) => <ProductCard key={p._id} product={p} />)}
        </div>

        {/* Lightweight banner */}
        <div className="mt-5 grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
          {filler.slice(3, 4).map((p) => <ProductCard key={p._id} product={p} />)}
          <div className="md:col-span-2 relative rounded-lg overflow-hidden min-h-[280px] bg-gradient-to-r from-amber-50 via-orange-50 to-rose-50">
            <div className="absolute inset-0 grid grid-cols-2">
              <div className="relative">
                <img src={tile('goldOvalPendant', '3:4', 800)} alt="Lightweight gold pendant" loading="lazy" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-rose-50/60" />
              </div>
              <div className="flex items-center px-6 md:px-10">
                <div>
                  <p className="text-[10px] tracking-[0.4em] uppercase text-brand-gold-dark">Featherlight</p>
                  <h3 className="font-display text-2xl md:text-3xl text-brand-maroon mt-2">Under 5 grams</h3>
                  <p className="text-sm text-brand-ink/80 mt-2">Pieces so light, you&apos;ll forget you&apos;re wearing them.</p>
                  <a href="/shop/jewellery?occasion=daily-wear" className="inline-block mt-4 px-5 py-2 bg-brand-maroon text-white text-[10px] font-semibold tracking-widest uppercase rounded-sm hover:bg-brand-maroon-dark transition-colors">
                    Shop Lightweight
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Row 3 */}
        <div className="mt-5 grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
          {filler.slice(4, 7).map((p) => <ProductCard key={p._id} product={p} />)}
        </div>

        {/* Office Edit banner */}
        <div className="mt-5 grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
          {filler.slice(7, 8).map((p) => <ProductCard key={p._id} product={p} />)}
          <div className="md:col-span-2 relative rounded-lg overflow-hidden min-h-[280px] bg-gradient-to-br from-stone-100 to-stone-200">
            <img src={tile('goldModelNecklace', '4:3', 1400)} alt="Gold necklace worn for the office" loading="lazy" className="absolute inset-0 w-full h-full object-cover opacity-90" />
            <div className="absolute inset-0 bg-gradient-to-r from-stone-900/70 to-transparent" />
            <div className="absolute inset-0 flex items-center px-8 md:px-12">
              <div className="text-white">
                <p className="text-[10px] tracking-[0.4em] uppercase text-brand-gold-light">The Office Edit</p>
                <p className="font-display text-3xl md:text-4xl mt-2">Quietly confident</p>
                <p className="text-sm opacity-85 mt-2 max-w-xs">Refined jewellery for boardrooms and beyond.</p>
                <a href="/shop/jewellery?occasion=office" className="inline-block mt-4 px-5 py-2 bg-white text-brand-maroon text-[10px] font-semibold tracking-widest uppercase rounded-sm hover:bg-brand-cream transition-colors">
                  Shop the Edit
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Rest */}
        <div className="mt-5 grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
          {filler.slice(8).map((p) => <ProductCard key={p._id} product={p} />)}
        </div>
      </div>
    </div>
  );
}
