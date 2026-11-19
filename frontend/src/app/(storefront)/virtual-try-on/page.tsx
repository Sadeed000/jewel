import Link from 'next/link';
import Image from 'next/image';
import { Sparkles, Camera, Smartphone, Monitor } from 'lucide-react';
import Breadcrumb from '@/components/common/Breadcrumb';
import TryOnGallery from './TryOnGallery';
import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Virtual Try-On – See Rings & Earrings on You',
  description: 'Try rings, earrings and pendants on with your phone or laptop camera before you buy. Works in the browser, no app needed.',
  path: '/virtual-try-on',
});

export default function VirtualTryOnPage() {
  return (
    <div>
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Virtual Try-On' }]} />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-maroon-dark via-brand-maroon to-brand-maroon-dark" />
        <Image src="https://res.cloudinary.com/dnsulnx1r/image/upload/v1795009707/ratnapankh/library/photo-1611591437281-460bfbe1220a.jpg" alt="" fill className="object-cover opacity-20" />
        <div className="container-custom relative py-20 text-white text-center">
          <Sparkles className="mx-auto text-brand-gold-light" size={36} />
          <h1 className="font-display text-5xl md:text-6xl mt-4">Virtual Try-On</h1>
          <p className="script-italic font-display text-2xl text-brand-gold-light mt-1">See it on you, before you say yes.</p>
          <p className="max-w-xl mx-auto mt-5 text-white/85 text-sm">
            Find your finishing touch with a live jewellery preview, using your own camera.
          </p>
          <a href="#try-on-gallery" className="btn-primary mt-7 bg-brand-gold text-brand-maroon-dark hover:bg-brand-gold-light">Browse Try-On Pieces</a>
        </div>
      </section>

      {/* The actual try-on experience. */}
      <div id="try-on-gallery" className="scroll-mt-32">
        <TryOnGallery />
      </div>

      <div className="container-custom pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: Camera, title: 'Open the camera', desc: 'Allow camera access on the product page.' },
            { icon: Sparkles, title: 'Find your position', desc: 'Keep your face or hand visible in soft, even light.' },
            { icon: Monitor, title: 'See it live', desc: 'Move gently, adjust the fit and capture your favourite look.' },
          ].map((s, i) => (
            <div key={i} className="bg-white border border-brand-cream-dark rounded-lg p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-brand-cream grid place-items-center mx-auto mb-3">
                <s.icon size={22} className="text-brand-maroon" />
              </div>
              <p className="font-display text-xl text-brand-ink">{s.title}</p>
              <p className="text-xs text-brand-muted mt-2">{s.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-brand-cream rounded-2xl p-8 text-center">
          <Smartphone className="mx-auto text-brand-maroon" size={28} />
          <p className="font-display text-2xl mt-3">Supported Devices</p>
          <p className="text-sm text-brand-muted mt-2 max-w-lg mx-auto">
            iOS 14+, Android 10+ with front camera. Chrome, Safari, and Edge browsers on desktops with webcam.
          </p>
        </div>
      </div>
    </div>
  );
}
