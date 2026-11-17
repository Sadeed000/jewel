'use client';

import { TrendingUp } from 'lucide-react';
import { useGoldRate } from '@/hooks/useMisc';

/**
 * Static fallback rates so the ticker bar never disappears while loading
 * or if the backend is unavailable. The bar height stays constant either way.
 */
const fallbackRates = [
  { karat: '24K', price: '7,820', change: '+0.4%' },
  { karat: '22K', price: '7,170', change: '+0.4%' },
  { karat: '18K', price: '5,865', change: '+0.3%' },
  { karat: 'Silver', price: '94', change: '+1.1%' },
];

export default function GoldRateTicker() {
  const { data } = useGoldRate();

  const rates =
    data?.rates.map((r) => ({
      karat: r.karat,
      price: r.price.toLocaleString('en-IN'),
      change: `${r.change >= 0 ? '+' : ''}${r.change}%`,
    })) ?? fallbackRates;

  return (
    <div className="bg-brand-maroon text-white py-2 overflow-hidden">
      <div className="flex animate-marquee whitespace-nowrap">
        {[...rates, ...rates, ...rates].map((r, i) => (
          <div key={i} className="flex items-center gap-3 px-8 text-xs">
            <TrendingUp size={12} className="text-brand-gold-light" />
            <span className="font-medium">{r.karat} Gold</span>
            <span className="text-brand-gold-light">₹ {r.price}/g</span>
            <span className="text-green-300">{r.change}</span>
            <span className="text-white/40">•</span>
          </div>
        ))}
      </div>
    </div>
  );
}
