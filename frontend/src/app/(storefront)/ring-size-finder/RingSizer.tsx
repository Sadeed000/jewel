'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Ruler, CreditCard, Circle, Printer, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Ring size finder.
 *
 * Two measuring methods, both calibrated against a bank card — every card
 * worldwide is exactly 85.60mm wide (ISO/IEC 7810 ID-1), which makes it the
 * one reliable ruler almost everyone already owns. Without calibration an
 * on-screen circle is meaningless, because CSS pixels don't map to millimetres
 * on an unknown display.
 */

/** Indian ring sizes with their inner diameter, plus US/UK equivalents. */
const SIZE_CHART = [
  { indian: 6, mm: 14.0, us: 3, uk: 'F' },
  { indian: 7, mm: 14.3, us: 3.5, uk: 'G' },
  { indian: 8, mm: 14.7, us: 3.75, uk: 'H' },
  { indian: 9, mm: 15.0, us: 4, uk: 'H½' },
  { indian: 10, mm: 15.3, us: 4.5, uk: 'I' },
  { indian: 11, mm: 15.7, us: 5, uk: 'J½' },
  { indian: 12, mm: 16.1, us: 5.5, uk: 'K½' },
  { indian: 13, mm: 16.5, us: 6, uk: 'L½' },
  { indian: 14, mm: 16.9, us: 6.5, uk: 'M½' },
  { indian: 15, mm: 17.3, us: 7, uk: 'N½' },
  { indian: 16, mm: 17.7, us: 7.5, uk: 'O' },
  { indian: 17, mm: 18.1, us: 8, uk: 'P' },
  { indian: 18, mm: 18.5, us: 8.5, uk: 'Q' },
  { indian: 19, mm: 19.0, us: 9, uk: 'R' },
  { indian: 20, mm: 19.4, us: 9.5, uk: 'S' },
  { indian: 21, mm: 19.8, us: 10, uk: 'T' },
  { indian: 22, mm: 20.2, us: 10.5, uk: 'U' },
  { indian: 23, mm: 20.6, us: 11, uk: 'V' },
  { indian: 24, mm: 21.0, us: 11.5, uk: 'W' },
  { indian: 25, mm: 21.4, us: 12, uk: 'X' },
  { indian: 26, mm: 21.8, us: 12.5, uk: 'Y' },
  { indian: 27, mm: 22.2, us: 13, uk: 'Z' },
  { indian: 28, mm: 22.6, us: 13.5, uk: 'Z+1' },
  { indian: 29, mm: 23.0, us: 14, uk: 'Z+2' },
  { indian: 30, mm: 23.4, us: 14.5, uk: 'Z+3' },
];

/** Standard bank card width in millimetres (ISO/IEC 7810 ID-1). */
const CARD_WIDTH_MM = 85.6;

/** Nearest chart entry to a measured inner diameter. */
const matchSize = (mm: number) =>
  SIZE_CHART.reduce((best, row) =>
    Math.abs(row.mm - mm) < Math.abs(best.mm - mm) ? row : best
  );

export default function RingSizer() {
  const [method, setMethod] = useState<'ring' | 'chart'>('ring');
  // Screen pixels per millimetre, derived from the card calibration.
  const [cardPx, setCardPx] = useState(340);
  const [circlePx, setCirclePx] = useState(60);

  const pxPerMm = cardPx / CARD_WIDTH_MM;
  const diameterMm = circlePx / pxPerMm;
  const match = matchSize(diameterMm);

  return (
    <div className="container-custom py-12">
      {/* Method switch */}
      <div className="flex justify-center gap-2 mb-10">
        {[
          { key: 'ring' as const, label: 'Measure a ring you own', icon: Circle },
          { key: 'chart' as const, label: 'Size chart', icon: Ruler },
        ].map((m) => (
          <button
            key={m.key}
            onClick={() => setMethod(m.key)}
            className={cn(
              'px-5 py-2.5 rounded-full text-xs font-medium tracking-wide border transition-all inline-flex items-center gap-2',
              method === m.key
                ? 'bg-brand-maroon text-white border-brand-maroon'
                : 'bg-white text-brand-ink border-brand-cream-dark hover:border-brand-maroon'
            )}
          >
            <m.icon size={14} /> {m.label}
          </button>
        ))}
      </div>

      {method === 'ring' && (
        <div className="max-w-2xl mx-auto">
          {/* Step 1 — calibrate */}
          <div className="bg-white border border-brand-cream-dark rounded-xl p-6">
            <div className="flex items-start gap-3">
              <span className="w-7 h-7 rounded-full bg-brand-maroon text-white grid place-items-center text-xs font-semibold flex-none">
                1
              </span>
              <div className="flex-1">
                <h2 className="font-display text-xl text-brand-ink">Calibrate your screen</h2>
                <p className="text-sm text-brand-muted mt-1.5 leading-relaxed">
                  Hold any debit or credit card against the screen and drag the slider until
                  the outline matches it exactly. Every bank card is the same size worldwide,
                  so this makes the measurement below accurate on any display.
                </p>

                <div
                  className="mt-5 border-2 border-dashed border-brand-gold rounded-lg bg-brand-cream/60"
                  style={{ width: cardPx, height: cardPx / 1.586, maxWidth: '100%' }}
                >
                  <div className="h-full grid place-items-center text-brand-gold-dark">
                    <CreditCard size={26} strokeWidth={1.5} />
                  </div>
                </div>

                <input
                  type="range"
                  min={200}
                  max={640}
                  value={cardPx}
                  onChange={(e) => setCardPx(Number(e.target.value))}
                  className="w-full mt-4 accent-brand-maroon"
                  aria-label="Calibrate card width"
                />
              </div>
            </div>
          </div>

          {/* Step 2 — measure */}
          <div className="bg-white border border-brand-cream-dark rounded-xl p-6 mt-4">
            <div className="flex items-start gap-3">
              <span className="w-7 h-7 rounded-full bg-brand-maroon text-white grid place-items-center text-xs font-semibold flex-none">
                2
              </span>
              <div className="flex-1">
                <h2 className="font-display text-xl text-brand-ink">Match a ring you already wear</h2>
                <p className="text-sm text-brand-muted mt-1.5 leading-relaxed">
                  Place the ring on the circle and adjust until the circle sits just inside
                  the band&apos;s inner edge.
                </p>

                <div className="mt-6 grid place-items-center py-4">
                  <div
                    className="rounded-full border-2 border-brand-maroon bg-brand-cream"
                    style={{ width: circlePx, height: circlePx }}
                  />
                </div>

                <input
                  type="range"
                  min={40}
                  max={110}
                  value={circlePx}
                  onChange={(e) => setCirclePx(Number(e.target.value))}
                  className="w-full accent-brand-maroon"
                  aria-label="Adjust circle to match ring"
                />

                <div className="mt-6 p-5 rounded-lg bg-brand-cream text-center">
                  <p className="text-xs uppercase tracking-wider text-brand-muted">
                    Your size is approximately
                  </p>
                  <p className="font-display text-4xl text-brand-maroon mt-1">
                    Indian {match.indian}
                  </p>
                  <p className="text-xs text-brand-muted mt-2">
                    {diameterMm.toFixed(1)}mm inner diameter &middot; US {match.us} &middot; UK{' '}
                    {match.uk}
                  </p>
                </div>

                <p className="text-xs text-brand-muted mt-4 text-center">
                  Between two sizes? Choose the larger one — and remember every ring comes with
                  one free resize.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {method === 'chart' && (
        <div className="max-w-2xl mx-auto">
          <div className="bg-white border border-brand-cream-dark rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-brand-cream-dark">
              <h2 className="font-display text-xl text-brand-ink">Size conversion chart</h2>
              <button
                onClick={() => window.print()}
                className="text-xs text-brand-maroon hover:underline inline-flex items-center gap-1.5"
              >
                <Printer size={13} /> Print
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-brand-cream text-brand-muted text-xs uppercase tracking-wider">
                    <th className="text-left px-5 py-3 font-medium">Indian</th>
                    <th className="text-left px-5 py-3 font-medium">Diameter</th>
                    <th className="text-left px-5 py-3 font-medium">US</th>
                    <th className="text-left px-5 py-3 font-medium">UK</th>
                  </tr>
                </thead>
                <tbody>
                  {SIZE_CHART.map((row) => (
                    <tr key={row.indian} className="border-t border-brand-cream-dark">
                      <td className="px-5 py-2.5 font-medium text-brand-ink">{row.indian}</td>
                      <td className="px-5 py-2.5 text-brand-muted">{row.mm.toFixed(1)} mm</td>
                      <td className="px-5 py-2.5 text-brand-muted">{row.us}</td>
                      <td className="px-5 py-2.5 text-brand-muted">{row.uk}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 bg-white border border-brand-cream-dark rounded-xl p-6">
            <h3 className="font-display text-lg text-brand-ink">Measuring with a paper strip</h3>
            <ol className="mt-3 space-y-2 text-sm text-brand-muted list-decimal list-inside leading-relaxed">
              <li>Cut a strip of paper about 5mm wide.</li>
              <li>Wrap it around the base of your finger — snug, not tight.</li>
              <li>Mark where the strip overlaps, then lay it flat and measure in millimetres.</li>
              <li>Divide that circumference by 3.14 to get the inner diameter.</li>
              <li>Find the closest diameter in the chart above.</li>
            </ol>
            <p className="text-xs text-brand-muted mt-4">
              Measure at the end of the day, when fingers are at their largest. Avoid measuring
              when your hands are cold.
            </p>
          </div>
        </div>
      )}

      {/* Resize promise */}
      <div className="max-w-2xl mx-auto mt-8 rounded-xl border border-brand-gold bg-gradient-to-r from-brand-cream-dark via-white to-brand-cream-dark p-6 text-center">
        <Check size={22} className="mx-auto text-brand-gold-dark" />
        <p className="font-display text-2xl text-brand-ink mt-2">One free resize on every ring</p>
        <p className="text-sm text-brand-muted mt-2 max-w-md mx-auto leading-relaxed">
          If the fit isn&apos;t right, send it back within 30 days and we&apos;ll resize it at no
          charge. Order with confidence.
        </p>
        <Link href="/shop/rings" className="btn-primary mt-5 inline-flex">
          Browse rings
        </Link>
      </div>
    </div>
  );
}
