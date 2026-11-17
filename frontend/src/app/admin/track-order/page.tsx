'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

export default function AdminTrackOrderPage() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSearch = () => {
    if (!query.trim()) return;
    router.push(`/admin/orders/${query.trim()}`);
  };

  return (
    <div>
      <header className="mb-6">
        <p className="text-sm uppercase tracking-[0.4em] text-brand-muted">Order tracking</p>
        <h1 className="font-display text-3xl text-brand-ink">Track order and update status</h1>
      </header>

      <div className="rounded-3xl border border-brand-cream-dark bg-white p-8 shadow-sm">
        <div className="grid gap-5 lg:grid-cols-[1fr_auto] items-end">
          <div>
            <label className="text-sm text-brand-muted block">Order number or ID</label>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="AUR-123456 or 643af.."
              className="mt-2 w-full rounded-2xl border border-brand-cream-dark bg-brand-cream px-4 py-3 text-sm outline-none focus:border-brand-gold"
            />
          </div>
          <button
            type="button"
            onClick={handleSearch}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-maroon px-6 py-3 text-sm font-semibold text-white hover:bg-brand-maroon-dark"
          >
            <Search size={16} /> Search order
          </button>
        </div>
        <p className="mt-6 text-sm text-brand-muted">Enter an order number to inspect the order and update its shipment status.</p>
      </div>
    </div>
  );
}
