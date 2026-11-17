'use client';

import { useState } from 'react';
import { TrendingUp, Shield, Coins, Calendar } from 'lucide-react';
import Breadcrumb from '@/components/common/Breadcrumb';
import { formatPrice } from '@/lib/utils';

export default function DigitalGoldPage() {
  const [amount, setAmount] = useState(2000);
  const [months, setMonths] = useState(11);
  const goldRate = 7170;
  const totalSaved = amount * months;
  const bonus = Math.round(totalSaved * 0.075);
  const totalGold = (totalSaved + bonus) / goldRate;

  return (
    <div>
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Digital Gold & Golden Harvest' }]} />

      <section className="container-custom py-12">
        <div className="text-center mb-12">
          <p className="script-italic font-display text-2xl text-brand-gold-dark">Powered by Aurelia</p>
          <h1 className="font-display text-5xl md:text-6xl text-brand-ink mt-1">Digital Gold</h1>
          <p className="text-sm text-brand-muted mt-3 max-w-xl mx-auto">
            Save in pure 24K gold from as little as ₹100. Build your own jewellery one gram at a time.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          {/* Calculator */}
          <div className="bg-white border border-brand-cream-dark rounded-2xl p-8 shadow-sm">
            <h2 className="font-display text-2xl text-brand-ink mb-6">Golden Harvest Calculator</h2>

            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium">Monthly Installment</label>
                  <span className="text-sm font-semibold text-brand-maroon">{formatPrice(amount)}</span>
                </div>
                <input
                  type="range"
                  min={500}
                  max={50000}
                  step={500}
                  value={amount}
                  onChange={(e) => setAmount(+e.target.value)}
                  className="w-full accent-brand-maroon"
                />
                <div className="flex justify-between text-[10px] text-brand-muted mt-1">
                  <span>₹500</span>
                  <span>₹50,000</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium">Tenure</label>
                  <span className="text-sm font-semibold text-brand-maroon">{months} months</span>
                </div>
                <input
                  type="range"
                  min={6}
                  max={11}
                  value={months}
                  onChange={(e) => setMonths(+e.target.value)}
                  className="w-full accent-brand-maroon"
                />
              </div>

              <div className="bg-gradient-to-br from-brand-cream to-white rounded-xl p-5 space-y-3 border border-brand-cream-dark">
                <div className="flex justify-between text-sm"><span className="text-brand-muted">You Pay</span><span>{formatPrice(totalSaved)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-brand-muted">Aurelia Bonus (7.5%)</span><span className="text-green-700">+ {formatPrice(bonus)}</span></div>
                <div className="flex justify-between text-base font-semibold pt-3 border-t border-brand-cream-dark">
                  <span>You Get Gold Worth</span>
                  <span className="font-display">{formatPrice(totalSaved + bonus)}</span>
                </div>
                <p className="text-xs text-brand-gold-dark text-right">≈ {totalGold.toFixed(2)} g of 22K gold</p>
              </div>

              <button className="btn-primary w-full">Enrol Now</button>
            </div>
          </div>

          {/* Benefits */}
          <div>
            <h2 className="font-display text-3xl text-brand-ink mb-6">Why Save with Us?</h2>
            <div className="space-y-5">
              {[
                { icon: TrendingUp, title: 'Aurelia Bonus', desc: 'Get up to 75% off making charges + an additional bonus on every plan.' },
                { icon: Shield, title: '100% Insured', desc: 'Your savings are stored in 999.9 fine gold — fully insured & audited.' },
                { icon: Coins, title: 'Flexible Redemption', desc: 'Redeem against any jewellery in our entire collection at maturity.' },
                { icon: Calendar, title: 'Reminders & Auto-Pay', desc: 'Set instalment reminders and auto-debit to never miss a month.' },
              ].map((b) => (
                <div key={b.title} className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-brand-cream grid place-items-center flex-none">
                    <b.icon size={20} className="text-brand-maroon" />
                  </div>
                  <div>
                    <p className="font-display text-lg text-brand-ink">{b.title}</p>
                    <p className="text-sm text-brand-muted mt-1">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
