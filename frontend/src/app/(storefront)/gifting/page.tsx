import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import Image from 'next/image';
import Link from 'next/link';
import Breadcrumb from '@/components/common/Breadcrumb';
import ProductCard from '@/components/product/ProductCard';
import QuickFilters from '@/components/shop/QuickFilters';
import BrandPromises from '@/components/shop/BrandPromises';
import CollectionStory from '@/components/shop/CollectionStory';
import { fetchProducts } from '@/lib/server-api';
import { Gift, Mail, MessageCircle, Sparkles } from 'lucide-react';
import { hero } from '@/lib/imagery';

export const metadata: Metadata = pageMetadata({
  title: "Jewellery Gifts for Every Occasion",
  description:
    "Jewellery gift ideas for birthdays, anniversaries and festivals — rings, earrings and pendants with prices in INR.",
  path: '/gifting',
});

const occasions = [
  { label: 'Anniversary', icon: '◈', img: 'https://res.cloudinary.com/dnsulnx1r/image/upload/v1795009707/ratnapankh/library/photo-1611591437281-460bfbe1220a.jpg' },
  { label: 'Birthday', icon: '✦', img: 'https://res.cloudinary.com/dnsulnx1r/image/upload/v1795009727/ratnapankh/library/photo-1535632787350-4e68ef0ac584.jpg' },
  { label: 'Festive', icon: '❀', img: 'https://res.cloudinary.com/dnsulnx1r/image/upload/v1795009721/ratnapankh/library/photo-1611652022419-a9419f74343d.jpg' },
  { label: 'Wedding', icon: '◇', img: 'https://res.cloudinary.com/dnsulnx1r/image/upload/v1795009728/ratnapankh/library/photo-1583292650898-7d22cd27ca6f.jpg' },
  { label: 'Just Because', icon: '◯', img: 'https://res.cloudinary.com/dnsulnx1r/image/upload/v1795009705/ratnapankh/library/photo-1605100804763-247f67b3557e.jpg' },
];

const giftRanges = [
  { label: 'Under ₹15K', value: 15000, img: 'https://res.cloudinary.com/dnsulnx1r/image/upload/v1795009723/ratnapankh/library/photo-1599643478518-a784e5dc4c8f.jpg' },
  { label: 'Under ₹30K', value: 30000, img: 'https://res.cloudinary.com/dnsulnx1r/image/upload/v1795009705/ratnapankh/library/photo-1605100804763-247f67b3557e.jpg' },
  { label: 'Under ₹50K', value: 50000, img: 'https://res.cloudinary.com/dnsulnx1r/image/upload/v1795009707/ratnapankh/library/photo-1611591437281-460bfbe1220a.jpg' },
  { label: 'Above ₹1L', value: 100000, img: 'https://res.cloudinary.com/dnsulnx1r/image/upload/v1795009725/ratnapankh/library/photo-1573408301185-9146fe634ad0.jpg' },
];

export default async function GiftingPage() {
  const giftPicks = await fetchProducts({ maxPrice: 50000, limit: 8 });

  return (
    <div>
      {/* Hero */}
      <section className="relative h-[360px] md:h-[480px] overflow-hidden">
        <Image
          src={hero('giftingPearlBox')}
          quality={85}
          alt="Gift of Choice"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-rose-900/50 via-rose-900/15 to-transparent" />
        <div className="container-custom relative h-full flex items-center">
          <div className="text-white max-w-xl">
            <p className="font-display italic text-2xl md:text-3xl text-brand-gold-light">#GiftOfChoice</p>
            <h1 className="font-display text-4xl md:text-6xl mt-2 leading-tight">
              Gifting, made<br />
              <span className="italic">effortless.</span>
            </h1>
            <p className="text-sm md:text-base opacity-90 mt-4 max-w-md">
              Thoughtfully curated for every occasion. Beautifully wrapped. Delivered with care.
            </p>
            <div className="flex flex-wrap gap-3 mt-7">
              <Link href="#picks" className="px-7 py-3 bg-brand-gold text-brand-maroon-dark text-xs font-semibold tracking-widest uppercase rounded-sm hover:bg-brand-gold-light transition-colors">
                Explore Now
              </Link>
              <Link href="#concierge" className="px-7 py-3 border border-white text-white text-xs font-semibold tracking-widest uppercase rounded-sm hover:bg-white hover:text-brand-maroon transition-colors">
                Gift Concierge
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Gifting' }]} />

      {/* Shop by Occasion */}
      <section className="container-custom py-14">
        <div className="text-center mb-10">
          <p className="text-[10px] tracking-[0.4em] uppercase text-brand-gold-dark">Gift by Occasion</p>
          <h2 className="font-display text-3xl md:text-4xl text-brand-ink mt-2">Every Moment, Marked</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-5">
          {occasions.map((o) => (
            <Link key={o.label} href="#picks" className="group block">
              <div className="relative aspect-square rounded-lg overflow-hidden bg-brand-cream">
                <Image src={o.img} alt={o.label} fill className="object-cover group-hover:scale-105 transition-transform duration-700" sizes="(max-width: 768px) 50vw, 20vw" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <p className="text-xl mb-0.5">{o.icon}</p>
                  <p className="font-display text-xl">{o.label}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Gift Cards split feature */}
      <section className="container-custom pb-14">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Digital Gift Card */}
          <div className="relative rounded-2xl overflow-hidden min-h-[320px] bg-gradient-to-br from-brand-maroon via-brand-maroon-dark to-brand-maroon-dark p-8 md:p-10 text-white">
            <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-brand-gold/20 blur-3xl" />
            <div className="absolute top-6 right-6 text-6xl font-display text-brand-gold-light/30">Au</div>
            <div className="relative">
              <p className="text-[10px] tracking-[0.4em] uppercase text-brand-gold-light">Digital Gift Card</p>
              <h3 className="font-display text-3xl md:text-4xl mt-2">A gift, instantly delivered.</h3>
              <p className="text-sm text-white/85 mt-3 max-w-md leading-relaxed">
                Choose any value from ₹1,000 to ₹5,00,000. Personalise with a note. Delivered to their inbox in seconds.
              </p>
              <div className="flex flex-wrap gap-2 mt-5">
                {[1000, 5000, 10000, 25000, 50000].map((v) => (
                  <span key={v} className="px-3 py-1.5 bg-white/10 backdrop-blur border border-white/20 rounded-full text-xs">
                    ₹ {v.toLocaleString('en-IN')}
                  </span>
                ))}
              </div>
              <Link href="/help" className="inline-block mt-6 px-6 py-3 bg-brand-gold text-brand-maroon-dark text-xs font-semibold tracking-widest uppercase rounded-sm hover:bg-brand-gold-light transition-colors">
                Send a Gift Card
              </Link>
            </div>
          </div>

          {/* Physical Gift Card */}
          <div className="relative rounded-2xl overflow-hidden min-h-[320px] bg-gradient-to-br from-amber-50 via-rose-50 to-orange-50 p-8 md:p-10 border border-brand-cream-dark">
            <Image src="https://res.cloudinary.com/dnsulnx1r/image/upload/v1795009707/ratnapankh/library/photo-1611591437281-460bfbe1220a.jpg" alt="" fill className="object-cover opacity-30" />
            <div className="relative">
              <p className="text-[10px] tracking-[0.4em] uppercase text-brand-gold-dark">Physical Gift Card</p>
              <h3 className="font-display text-3xl md:text-4xl text-brand-maroon mt-2">A keepsake worth keeping.</h3>
              <p className="text-sm text-brand-ink/80 mt-3 max-w-md leading-relaxed">
                A beautifully crafted card, hand-delivered in our signature gift box — a gift before the gift.
              </p>
              <Link href="/help" className="inline-block mt-6 px-6 py-3 bg-brand-maroon text-white text-xs font-semibold tracking-widest uppercase rounded-sm hover:bg-brand-maroon-dark transition-colors">
                Order Physical Card
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Filter by price quick row */}
      <section id="picks" className="container-custom pb-2">
        <div className="text-center mb-8">
          <h2 className="font-display text-3xl md:text-4xl text-brand-ink">Shop by Budget</h2>
          <p className="text-sm text-brand-muted mt-2 italic">Find the right gift, at every price point.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
          {giftRanges.map((r) => (
            <Link key={r.label} href={`/jewellery?max=${r.value}`} className="group relative rounded-lg overflow-hidden aspect-[4/3]">
              <Image src={r.img} alt={r.label} fill className="object-cover group-hover:scale-105 transition-transform duration-700" sizes="(max-width: 768px) 50vw, 25vw" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                <p className="font-display text-2xl">{r.label}</p>
                <p className="text-[10px] tracking-widest uppercase opacity-80 mt-1 group-hover:opacity-100">Shop now →</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <QuickFilters
        filters={[
          { label: 'All Gifts', value: 'all' },
          { label: 'For Her', value: 'her' },
          { label: 'For Him', value: 'him' },
          { label: 'For Kids', value: 'kids' },
          { label: 'For Parents', value: 'parents' },
          { label: 'Under 15K', value: 'u15' },
          { label: 'Under 50K', value: 'u50' },
        ]}
      />

      <div className="container-custom pb-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
          {giftPicks.map((p) => <ProductCard key={p._id} product={p} />)}
        </div>
      </div>

      {/* Concierge */}
      <section id="concierge" className="container-custom pb-14">
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-brand-cream via-white to-brand-cream border border-brand-cream-dark p-8 md:p-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <Sparkles className="text-brand-gold-dark" size={28} />
              <p className="text-[10px] tracking-[0.4em] uppercase text-brand-gold-dark mt-3">A Personal Service</p>
              <h2 className="font-display text-3xl md:text-4xl text-brand-maroon mt-2">Gift Concierge</h2>
              <p className="text-sm text-brand-ink/80 mt-3 leading-relaxed max-w-md">
                Tell us about them — the occasion, their style, your budget. Our concierge will hand-pick three perfect gifts and send them for your approval.
              </p>

              <div className="grid grid-cols-3 gap-3 mt-6">
                {[
                  { icon: MessageCircle, label: 'Tell us about them' },
                  { icon: Gift, label: 'We curate 3 picks' },
                  { icon: Mail, label: 'Beautifully delivered' },
                ].map((s, i) => (
                  <div key={i} className="text-center">
                    <div className="w-10 h-10 rounded-full bg-white grid place-items-center mx-auto border border-brand-cream-dark">
                      <s.icon size={16} className="text-brand-maroon" />
                    </div>
                    <p className="text-[10px] text-brand-muted mt-2 leading-tight">{s.label}</p>
                  </div>
                ))}
              </div>

              <Link href="/help" className="inline-block mt-7 px-7 py-3 bg-brand-maroon text-white text-xs font-semibold tracking-widest uppercase rounded-sm hover:bg-brand-maroon-dark transition-colors">
                Start a Conversation
              </Link>
            </div>

            <div className="relative aspect-[4/3] rounded-lg overflow-hidden">
              <Image
                src="https://res.cloudinary.com/dnsulnx1r/image/upload/v1795009705/ratnapankh/library/photo-1605100804763-247f67b3557e.jpg"
                alt="Gift Concierge"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Free wrapping & note + delivery promise mini strip */}
      <section className="container-custom pb-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: '🎁', title: 'Complimentary gift wrap', subtitle: 'Every order, beautifully boxed.' },
            { icon: '💌', title: 'Personalised note', subtitle: 'A handwritten message, by request.' },
            { icon: '🚚', title: 'Express delivery', subtitle: 'Same-day in 6 metro cities.' },
          ].map((p) => (
            <div key={p.title} className="bg-white border border-brand-cream-dark rounded-lg p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-brand-cream grid place-items-center text-2xl flex-none">{p.icon}</div>
              <div>
                <p className="font-medium text-sm text-brand-ink">{p.title}</p>
                <p className="text-xs text-brand-muted mt-0.5">{p.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <BrandPromises title="The Aurelia Gifting Promise" />

      <CollectionStory
        scriptTitle="Given"
        subtitle="A note from us"
        body="The best gifts aren't bought — they're chosen with care, wrapped with thought, and given without occasion. We're here to help you give beautifully, every time."
        ctaLabel="Talk to a Concierge"
        ctaHref="/help"
        bgImage="https://res.cloudinary.com/dnsulnx1r/image/upload/v1795009707/ratnapankh/library/photo-1611591437281-460bfbe1220a.jpg"
      />
    </div>
  );
}
