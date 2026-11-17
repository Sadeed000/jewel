import type { Metadata } from 'next';
import Breadcrumb from '@/components/common/Breadcrumb';
import RingSizer from './RingSizer';

export const metadata: Metadata = {
  title: 'Ring Size Finder — Measure Your Ring Size at Home',
  description:
    'Find your exact Indian ring size at home in under a minute. Measure a ring you already own, or use our conversion chart for Indian, US and UK sizes. Every Aurelia ring includes one free resize.',
};

export default function RingSizeFinderPage() {
  return (
    <div>
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Ring Size Finder' }]} />

      <section className="bg-brand-cream border-y border-brand-cream-dark">
        <div className="container-custom py-12 text-center">
          <p className="text-[11px] uppercase tracking-[0.25em] text-brand-gold-dark font-semibold">
            Get the fit right
          </p>
          <h1 className="font-display text-4xl md:text-5xl text-brand-ink mt-3">
            Ring Size Finder
          </h1>
          <p className="text-sm text-brand-muted mt-3 max-w-lg mx-auto leading-relaxed">
            Measure at home in under a minute — no sizer required. And if it still isn&apos;t
            perfect, your first resize is free.
          </p>
        </div>
      </section>

      <RingSizer />
    </div>
  );
}
