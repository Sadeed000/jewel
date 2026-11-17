import type { Metadata } from 'next';
import Breadcrumb from '@/components/common/Breadcrumb';
import QuickFilters from '@/components/shop/QuickFilters';
import ProductCard from '@/components/product/ProductCard';
import PageHeroBanner from '@/components/shop/PageHeroBanner';
import { fetchProducts } from '@/lib/server-api';

export const metadata: Metadata = {
  title: 'Rings — Engagement, Solitaires, Daily Wear',
  description: 'From engagement solitaires to everyday gold rings — discover designs in 18K and 22K gold, diamond, and gemstones.',
};

export default async function RingsPage() {
  const rings = await fetchProducts({ type: 'rings', limit: 24 });
  const a = rings.slice(0, 3);
  const b = rings.slice(3, 4);
  const c = rings.slice(4, 7);
  const d = rings.slice(7);

  return (
    <div>
      <PageHeroBanner
        image="https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=1800&auto=format&fit=crop"
        eyebrow="The Engagement Edit"
        title={'A Ring for\nForever'}
        highlight="Solitaires from ₹45K"
        ctaLabel="Shop Solitaires"
        ctaHref="/rings?style=solitaire"
        align="left"
      />

      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Rings' }]} />

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
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=900&auto=format&fit=crop')] bg-cover bg-center opacity-50" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900/85 to-transparent" />
            <div className="absolute inset-0 flex items-center px-8 md:px-12">
              <div className="text-white">
                <p className="text-[10px] tracking-[0.4em] uppercase text-brand-gold-light">Solitaire Studio</p>
                <p className="font-display text-3xl md:text-4xl mt-2">A diamond as<br/>singular as you</p>
                <a href="#" className="inline-block mt-4 px-5 py-2 bg-brand-gold text-brand-maroon-dark text-[10px] font-semibold tracking-widest uppercase rounded-sm hover:bg-brand-gold-light transition-colors">
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
                <img src="https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&auto=format&fit=crop" alt="" className="w-full h-full object-cover" />
              </div>
              <div className="flex items-center px-6 md:px-10">
                <div>
                  <p className="text-[10px] tracking-[0.4em] uppercase text-brand-gold-dark">New Tool</p>
                  <h3 className="font-display text-2xl md:text-3xl text-brand-maroon mt-2">Ring Size Finder</h3>
                  <p className="text-sm text-brand-ink/80 mt-2">Get the perfect fit, every time. From the comfort of home.</p>
                  <a href="#" className="inline-block mt-4 px-5 py-2 bg-brand-maroon text-white text-[10px] font-semibold tracking-widest uppercase rounded-sm hover:bg-brand-maroon-dark transition-colors">
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
