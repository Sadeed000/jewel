'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, PackageSearch } from 'lucide-react';
import { PageHeader } from '@/components/admin/ui';
import { Button } from '@/components/admin/FormControls';

const steps = [
  { n: '01', title: 'Find the order', body: 'Enter the order number from the confirmation email, or the internal order ID.' },
  { n: '02', title: 'Review details', body: 'Check the items, delivery address, payment and full status history.' },
  { n: '03', title: 'Update status', body: 'Move it along — processing, shipped, delivered — with an optional note.' },
];

export default function AdminTrackOrderPage() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/admin/orders/${encodeURIComponent(q)}`);
  };

  return (
    <div>
      <PageHeader eyebrow="Sales" title="Order tracking" description="Look up any order and update its shipment status." />

      <div className="admin-silk relative overflow-hidden rounded-[24px] border border-admin-gold/35 p-6 shadow-admin-card sm:p-10">
        <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-admin-gold/15 blur-3xl" />
        <div className="relative mx-auto max-w-2xl text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-admin-blush via-white to-admin-gold-soft text-admin-maroon shadow-admin-card ring-1 ring-admin-gold/35">
            <PackageSearch size={26} strokeWidth={1.75} />
          </div>
          <h2 className="mt-5 text-2xl font-bold tracking-[-0.02em] text-admin-ink">Which order are you looking for?</h2>
          <p className="mt-2 text-sm text-admin-muted">Order numbers look like AUR-T4K9QZ-1234.</p>

          <form onSubmit={handleSearch} className="mt-7 flex flex-col gap-2.5 rounded-2xl border border-admin-gold/30 bg-white/85 p-2 shadow-admin-card backdrop-blur sm:flex-row">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Order number or ID"
              aria-label="Order number or ID"
              autoFocus
              className="h-12 flex-1 rounded-xl bg-transparent px-4 text-[15px] text-admin-ink outline-none placeholder:text-admin-muted/70"
            />
            <Button type="submit" className="h-12 px-6" disabled={!query.trim()}>
              Find order <ArrowRight size={16} />
            </Button>
          </form>
        </div>

        <div className="relative mt-10 grid gap-4 border-t border-admin-line pt-8 sm:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n}>
              <p className="text-xs font-bold tracking-[0.1em] text-admin-gold">{s.n}</p>
              <p className="mt-1.5 text-sm font-semibold text-admin-ink">{s.title}</p>
              <p className="mt-1 text-[13px] leading-relaxed text-admin-muted">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
