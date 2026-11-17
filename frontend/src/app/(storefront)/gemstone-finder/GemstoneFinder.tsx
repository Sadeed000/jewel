'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Sparkles, Info, RefreshCw } from 'lucide-react';
import ProductCard from '@/components/product/ProductCard';
import { useProducts } from '@/hooks/useProducts';
import { ProductGridSkeleton } from '@/components/common/Loading';
import { RASHIS, rashiFromDate, rashiByKey, filtersForRashi, type Rashi } from '@/lib/jyotish';
import { cn } from '@/lib/utils';

/**
 * "Find Your Gemstone" — guided selling built on the jyotish tradition.
 *
 * Two ways in: a date of birth, or picking a rashi directly for anyone who
 * already knows theirs. The result page explains *why* a stone is suggested
 * and then shows what's actually in stock, so the tool ends in a purchase
 * rather than a dead end.
 */
export default function GemstoneFinder() {
  const [dob, setDob] = useState('');
  const [rashi, setRashi] = useState<Rashi | null>(null);
  const [error, setError] = useState('');

  // Only queries once a rashi is chosen.
  const { data, isLoading } = useProducts(
    rashi ? (filtersForRashi(rashi) as never) : {},
    { enabled: !!rashi }
  );
  const matches = data?.items ?? [];

  const handleDobSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const found = rashiFromDate(dob);
    if (!found) {
      setError('Please enter a valid date of birth.');
      return;
    }
    setRashi(found);
  };

  const reset = () => {
    setRashi(null);
    setDob('');
    setError('');
  };

  /* ── Result ── */
  if (rashi) {
    return (
      <div className="container-custom py-12">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-[11px] uppercase tracking-[0.25em] text-brand-gold-dark font-semibold">
            {rashi.name} &middot; {rashi.western}
          </p>
          <h2 className="font-display text-4xl md:text-5xl text-brand-ink mt-3">
            {rashi.stoneName}
          </h2>
          <p className="script-italic font-display text-2xl text-brand-maroon mt-1">
            {rashi.tradeName}
          </p>
          <p className="text-sm text-brand-muted mt-5 max-w-xl mx-auto leading-relaxed">
            {rashi.benefit}
          </p>
        </div>

        {/* How it's traditionally worn */}
        <div className="max-w-3xl mx-auto mt-8 grid grid-cols-1 sm:grid-cols-3 gap-px bg-brand-cream-dark border border-brand-cream-dark rounded-xl overflow-hidden">
          {[
            { label: 'Ruling planet', value: rashi.lord },
            { label: 'Worn on', value: rashi.finger },
            { label: 'Set in', value: rashi.metal },
          ].map((row) => (
            <div key={row.label} className="bg-white px-4 py-5 text-center">
              <p className="text-[10px] uppercase tracking-wider text-brand-muted">{row.label}</p>
              <p className="text-sm text-brand-ink font-medium mt-1.5">{row.value}</p>
            </div>
          ))}
        </div>

        {/* Matching stock */}
        <div className="mt-12">
          <div className="flex items-baseline justify-between mb-6">
            <h3 className="font-display text-2xl text-brand-ink">
              {rashi.stoneName} pieces for you
            </h3>
            <button
              onClick={reset}
              className="text-xs text-brand-maroon hover:underline inline-flex items-center gap-1.5"
            >
              <RefreshCw size={12} /> Start over
            </button>
          </div>

          {isLoading ? (
            <ProductGridSkeleton count={4} />
          ) : matches.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
              {matches.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          ) : (
            /* No stock in this stone — offer the configurator rather than a
               dead end, since a bespoke ring can be made in any stone. */
            <div className="text-center py-12 border border-brand-cream-dark rounded-xl bg-white">
              <p className="font-display text-2xl text-brand-ink">
                We don&apos;t have a {rashi.stoneName} piece in stock right now
              </p>
              <p className="text-sm text-brand-muted mt-2 max-w-md mx-auto">
                We can make one to your specification — choose the carat, metal and setting.
              </p>
              <Link href="/ring-builder" className="btn-primary mt-6 inline-flex">
                Design a {rashi.stoneName} ring
              </Link>
            </div>
          )}
        </div>

        <div className="max-w-3xl mx-auto mt-10 flex items-start gap-2.5 p-4 rounded-lg bg-brand-cream text-xs text-brand-muted leading-relaxed">
          <Info size={14} className="flex-none mt-0.5 text-brand-gold-dark" />
          <p>
            This suggestion follows the traditional rashi–planet–gemstone correspondence and is
            based on your date of birth alone. A full jyotish reading also considers your birth
            time and place. Gemstones are worn as a matter of personal belief and are not a
            substitute for medical or financial advice.
          </p>
        </div>
      </div>
    );
  }

  /* ── Entry ── */
  return (
    <div className="container-custom py-12">
      <div className="max-w-xl mx-auto">
        <form
          onSubmit={handleDobSubmit}
          className="bg-white border border-brand-cream-dark rounded-xl p-6 md:p-8 text-center"
        >
          <Sparkles size={22} className="mx-auto text-brand-gold-dark" />
          <h2 className="font-display text-2xl text-brand-ink mt-3">Enter your date of birth</h2>
          <p className="text-sm text-brand-muted mt-2">
            We&apos;ll find the gemstone traditionally associated with your rashi.
          </p>

          <input
            type="date"
            value={dob}
            onChange={(e) => {
              setDob(e.target.value);
              setError('');
            }}
            max={new Date().toISOString().split('T')[0]}
            required
            className="w-full mt-5 px-4 py-3 border border-brand-cream-dark rounded-lg outline-none focus:border-brand-gold text-sm"
          />
          {error && <p className="text-xs text-brand-maroon mt-2">{error}</p>}

          <button type="submit" className="btn-primary w-full mt-4">
            Find my gemstone
          </button>
        </form>

        <div className="flex items-center gap-3 my-8 text-xs text-brand-muted">
          <div className="flex-1 h-px bg-brand-cream-dark" />
          OR PICK YOUR RASHI
          <div className="flex-1 h-px bg-brand-cream-dark" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {RASHIS.map((r) => (
            <button
              key={r.key}
              onClick={() => setRashi(rashiByKey(r.key))}
              className={cn(
                'px-3 py-3 rounded-lg border border-brand-cream-dark bg-white text-left',
                'hover:border-brand-maroon hover:shadow-sm transition-all'
              )}
            >
              <p className="text-sm font-medium text-brand-ink">{r.name}</p>
              <p className="text-[11px] text-brand-muted mt-0.5">{r.western}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
