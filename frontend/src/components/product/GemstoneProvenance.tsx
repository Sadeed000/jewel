'use client';

import { ShieldCheck, ExternalLink, Info } from 'lucide-react';
import type { Product } from '@/lib/types';

/**
 * Provenance and certification panel for stone-set pieces.
 *
 * For coloured stones this is the purchase decision, not a detail: origin and
 * treatment move price far more than design does, and buyers who can't verify
 * either usually don't buy at all. Everything shown is optional — the panel
 * renders only the fields that are actually filled in, so a half-catalogued
 * product degrades gracefully instead of showing blanks.
 */

/**
 * Plain-language treatment notes. Disclosure is a selling point: "untreated"
 * commands a premium, and stating "heated" openly signals expertise rather
 * than hiding something a lab report would reveal anyway.
 */
const TREATMENT_COPY: Record<string, { label: string; note: string; premium?: boolean }> = {
  none: {
    label: 'Untreated',
    note: 'Completely natural — no heat or enhancement. The rarest and most valuable grade.',
    premium: true,
  },
  heated: {
    label: 'Heat treated',
    note: 'Traditional heat treatment to deepen colour. Permanent, stable, and accepted worldwide.',
  },
  oiled: {
    label: 'Oiled',
    note: 'Standard cedar-oil treatment used on almost all emeralds to soften surface inclusions.',
  },
  diffused: {
    label: 'Diffusion treated',
    note: 'Colour enhanced by diffusion. Priced accordingly and fully disclosed.',
  },
  irradiated: {
    label: 'Irradiated',
    note: 'Colour altered by irradiation. Safe to wear and fully disclosed.',
  },
  undisclosed: {
    label: 'Not specified',
    note: 'Treatment information is not yet available for this stone.',
  },
};

export default function GemstoneProvenance({ product }: { product: Product }) {
  const details = product.gemstoneDetails;
  const cert = product.certification;

  const hasDetails =
    details &&
    (details.caratWeight || details.origin || details.treatment || details.clarity || details.cut);
  const hasCert = cert && (cert.lab || cert.certificateNumber);

  // Nothing catalogued for this piece — render nothing rather than an empty shell.
  if (!hasDetails && !hasCert) return null;

  const treatment = details?.treatment ? TREATMENT_COPY[details.treatment] : null;

  const rows = [
    details?.caratWeight ? { label: 'Stone weight', value: `${details.caratWeight} carat` } : null,
    details?.origin ? { label: 'Origin', value: details.origin } : null,
    details?.cut ? { label: 'Cut', value: details.cut } : null,
    details?.clarity ? { label: 'Clarity', value: details.clarity } : null,
    details?.stoneCount && details.stoneCount > 1
      ? { label: 'Stones', value: String(details.stoneCount) }
      : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  return (
    <section className="mt-8 border border-brand-cream-dark rounded-xl overflow-hidden">
      <header className="flex items-center gap-2 px-5 py-4 bg-brand-cream border-b border-brand-cream-dark">
        <ShieldCheck size={17} className="text-brand-gold-dark" strokeWidth={1.75} />
        <h2 className="font-display text-lg text-brand-ink">Stone &amp; Certification</h2>
      </header>

      <div className="p-5 space-y-5">
        {rows.length > 0 && (
          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-4">
            {rows.map((row) => (
              <div key={row.label}>
                <dt className="text-[10px] uppercase tracking-wider text-brand-muted">{row.label}</dt>
                <dd className="text-sm text-brand-ink font-medium mt-1">{row.value}</dd>
              </div>
            ))}
          </dl>
        )}

        {treatment && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-lg bg-brand-cream/60">
            <Info size={15} className="text-brand-gold-dark flex-none mt-0.5" />
            <div>
              <p className="text-sm font-medium text-brand-ink">
                {treatment.label}
                {treatment.premium && (
                  <span className="ml-2 text-[10px] uppercase tracking-wider bg-brand-gold-dark text-white px-2 py-0.5 rounded">
                    Premium
                  </span>
                )}
              </p>
              <p className="text-xs text-brand-muted mt-1 leading-relaxed">{treatment.note}</p>
            </div>
          </div>
        )}

        {hasCert && (
          <div className="pt-4 border-t border-brand-cream-dark">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-brand-ink">
                  Certified by {cert!.lab}
                </p>
                {cert!.certificateNumber && (
                  <p className="text-xs text-brand-muted mt-1">
                    Report no.{' '}
                    <span className="font-mono text-brand-ink">{cert!.certificateNumber}</span>
                  </p>
                )}
                <p className="text-xs text-brand-muted mt-1.5 max-w-md leading-relaxed">
                  Check this number on the lab&apos;s own website — we never hold your
                  certificate hostage.
                </p>
              </div>

              <div className="flex gap-2">
                {cert!.certificateUrl && (
                  <a
                    href={cert!.certificateUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-brand-maroon border border-brand-maroon rounded-full px-3.5 py-2 hover:bg-brand-maroon hover:text-white transition-colors inline-flex items-center gap-1.5"
                  >
                    View report
                  </a>
                )}
                {cert!.verifyUrl && (
                  <a
                    href={cert!.verifyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-brand-muted hover:text-brand-maroon transition-colors inline-flex items-center gap-1.5"
                  >
                    Verify <ExternalLink size={12} />
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
