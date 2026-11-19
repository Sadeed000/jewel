import Link from 'next/link';
import Logo from '@/components/common/Logo';
import {
  Instagram, Twitter, Facebook, Youtube, MessageCircle, Mail, Phone,
  Truck, RotateCcw, CreditCard, Headphones,
} from 'lucide-react';
import { SHIPPING_FREE_THRESHOLD } from '@/lib/pricing';
import { BRAND } from '@/lib/brand';

/* Every link points at a page that exists. Several of these used to be
   derived from the label (/delivery-information, /careers …), which 404ed. */
const footerLinks = {
  useful: [
    { label: 'Delivery & Shipping', href: '/help' },
    { label: 'Payment Options', href: '/help' },
    { label: 'Track your Order', href: '/account' },
    { label: 'Returns', href: '/help' },
    { label: 'Ring Size Finder', href: '/ring-size-finder' },
    { label: 'Find a Store', href: '/store-locator' },
  ],
  info: [
    { label: 'Blog', href: '/blog' },
    { label: 'Help & FAQs', href: '/help' },
    { label: `About ${BRAND}`, href: '/about' },
    { label: 'Silver Jewellery', href: '/shop/silver' },
    { label: 'Rings', href: '/rings' },
    { label: 'Earrings', href: '/earrings' },
  ],
};

export default function Footer() {
  return (
    <footer className="relative mt-20">
      {/* Service strip — delivery, returns, payment and support, findable
          from every page. Figures match lib/pricing.ts and checkout. */}
      <div className="container-custom mb-16">
        <ul className="grid grid-cols-2 lg:grid-cols-4 gap-px overflow-hidden rounded-panel bg-brand-line ring-1 ring-brand-line">
          {[
            { icon: Truck, title: 'Free insured delivery', sub: `On orders above ₹${SHIPPING_FREE_THRESHOLD.toLocaleString('en-IN')}`, href: '/help' },
            { icon: RotateCcw, title: '30-day returns', sub: 'On unworn pieces', href: '/help' },
            { icon: CreditCard, title: 'Secure payments', sub: 'Cards, UPI, net banking & COD', href: '/help' },
            { icon: Headphones, title: 'Talk to an expert', sub: '1800-296-6677', href: 'tel:18002966677' },
          ].map((s) => (
            <li key={s.title} className="bg-white">
              <Link
                href={s.href}
                className="group flex h-full items-center gap-3 p-5 md:p-6 transition-colors duration-base hover:bg-brand-cream"
              >
                <span className="grid h-11 w-11 flex-none place-items-center rounded-full bg-brand-cream ring-1 ring-brand-line transition-transform duration-slow ease-premium group-hover:scale-105">
                  <s.icon size={19} strokeWidth={1.6} className="text-brand-gold-dark" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-brand-ink">{s.title}</span>
                  <span className="block text-xs text-brand-muted mt-0.5">{s.sub}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Decorative arch top */}
      <svg viewBox="0 0 1440 80" className="w-full -mb-px text-brand-maroon-dark" preserveAspectRatio="none">
        <path d="M0,80 L0,40 Q0,0 60,0 L680,0 Q720,0 720,40 L720,40 Q720,0 760,0 L1380,0 Q1440,0 1440,40 L1440,80 Z" fill="currentColor" />
      </svg>

      <div className="bg-brand-maroon-dark text-white">
        <div className="container-custom py-16">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
            {/* Logo + App */}
            <div className="md:col-span-3">
              <Logo light />
              <p className="mt-6 font-display text-lg">Download the {BRAND} App</p>
              <div className="mt-4 w-40 h-40 bg-white p-3 rounded-md grid place-items-center">
                <div className="w-full h-full bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect width=%22100%22 height=%22100%22 fill=%22white%22/><g fill=%22black%22><rect x=%225%22 y=%225%22 width=%2225%22 height=%2225%22/><rect x=%2270%22 y=%225%22 width=%2225%22 height=%2225%22/><rect x=%225%22 y=%2270%22 width=%2225%22 height=%2225%22/><rect x=%2240%22 y=%2240%22 width=%2210%22 height=%2210%22/><rect x=%2255%22 y=%2255%22 width=%2210%22 height=%2210%22/><rect x=%2275%22 y=%2280%22 width=%2210%22 height=%2210%22/><rect x=%2240%22 y=%2275%22 width=%2210%22 height=%2210%22/><rect x=%2260%22 y=%2275%22 width=%225%22 height=%225%22/></g></svg>')] bg-contain bg-no-repeat bg-center" />
              </div>
              <div className="flex gap-3 mt-4">
                <button className="bg-black/40 border border-white/20 px-3 py-2 rounded text-xs flex items-center gap-2 hover:bg-black/60 transition-colors">
                  <span>▶</span>
                  <span><span className="block text-[9px] opacity-70">Download on the</span>Play Store</span>
                </button>
                <button className="bg-black/40 border border-white/20 px-3 py-2 rounded text-xs flex items-center gap-2 hover:bg-black/60 transition-colors">
                  <span>🍎</span>
                  <span><span className="block text-[9px] opacity-70">Download on the</span>App Store</span>
                </button>
              </div>
            </div>

            {/* Useful Links */}
            <div className="md:col-span-3">
              <h3 className="font-display text-xl mb-5">Useful Links</h3>
              <ul className="space-y-3">
                {footerLinks.useful.map((item) => (
                  <li key={item.label}>
                    <Link href={item.href} className="text-sm text-white/80 hover:text-brand-gold-light transition-colors">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Information */}
            <div className="md:col-span-3">
              <h3 className="font-display text-xl mb-5">Information</h3>
              <ul className="space-y-3">
                {footerLinks.info.map((item) => (
                  <li key={item.label}>
                    <Link href={item.href} className="text-sm text-white/80 hover:text-brand-gold-light transition-colors">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div className="md:col-span-3">
              <h3 className="font-display text-xl mb-5">Contact Us</h3>
              <a href="tel:18002966677" className="flex items-center gap-2 text-sm hover:text-brand-gold-light transition-colors">
                <Phone size={14} /> 1800-296-6677
              </a>
              <p className="font-display text-xl mt-5">Chat With Us</p>
              <a href="tel:+918147349242" className="flex items-center gap-2 text-sm mt-2 hover:text-brand-gold-light transition-colors">
                <Phone size={14} /> +91 8147349242
              </a>
              <div className="flex gap-3 mt-5">
                <a href="https://wa.me/918147349242" aria-label="WhatsApp" className="w-9 h-9 rounded-full border border-white/30 grid place-items-center hover:bg-white hover:text-brand-maroon-dark transition-colors">
                  <MessageCircle size={16} />
                </a>
                <a href="mailto:hello@aurelia.com" aria-label="Email" className="w-9 h-9 rounded-full border border-white/30 grid place-items-center hover:bg-white hover:text-brand-maroon-dark transition-colors">
                  <Mail size={16} />
                </a>
              </div>
            </div>
          </div>

          {/* Social */}
          <div className="mt-12 pt-6 border-t border-white/15 flex flex-wrap items-center gap-6 justify-between">
            <div className="flex items-center gap-5">
              <span className="font-display text-xl">Social</span>
              <div className="flex items-center gap-3">
                {[Instagram, Twitter, Facebook, Youtube].map((Icon, i) => (
                  <a key={i} href="#" aria-label="Social" className="w-9 h-9 rounded-full bg-white/10 grid place-items-center hover:bg-brand-gold hover:text-brand-maroon-dark transition-colors">
                    <Icon size={16} />
                  </a>
                ))}
              </div>
            </div>
            {/* Only methods checkout actually offers. */}
            <div className="flex flex-wrap items-center gap-2 opacity-80 text-[11px] tracking-wide" aria-label="Accepted payment methods">
              {['VISA', 'Mastercard', 'AMEX', 'RuPay', 'UPI', 'Net Banking', 'COD'].map((m) => (
                <span key={m} className="px-2.5 py-1 border border-white/20 rounded-md">{m}</span>
              ))}
            </div>
          </div>

          {/* Legal */}
          <div className="mt-8 pt-6 border-t border-white/15 flex flex-col md:flex-row gap-3 justify-between items-start md:items-center text-xs text-white/70">
            <p>© {new Date().getFullYear()} {BRAND}. All Rights Reserved.</p>
            <div className="flex gap-5">
              {/* Policy pages (terms, privacy) don't exist yet; these links
                  pointed at 404s. Re-add them once the pages are published. */}
              <Link href="/help" className="hover:text-brand-gold-light">Help &amp; Policies</Link>
              <Link href="/blog" className="hover:text-brand-gold-light">Blog</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
