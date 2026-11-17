
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import Breadcrumb from '@/components/common/Breadcrumb';
import GemstonePalette from '@/components/shop/GemstonePalette';
import BrandPromises from '@/components/shop/BrandPromises';
import ShopByOccasion from '@/components/shop/ShopByOccasion';
import StyleInspiration from '@/components/shop/StyleInspiration';
import CollectionStory from '@/components/shop/CollectionStory';

export const metadata: Metadata = {
  title: 'Gemstone Jewellery — Emerald, Ruby, Sapphire, Tanzanite & Pearl',
  description: 'A celebration of natural gemstones. Curated jewellery featuring emerald, ruby, sapphire, tanzanite, pearl, and coral cabochons.',
};

const fiveTruths = [
  { label: 'Natural', image: 'https://images.unsplash.com/photo-1591437694631-c2d04bb8b9c5?w=600&auto=format&fit=crop' },
  { label: 'Rare', image: 'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=600&auto=format&fit=crop' },
  { label: 'Sourced', image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&auto=format&fit=crop' },
  { label: 'Crafted', image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&auto=format&fit=crop' },
  { label: 'Eternal', image: 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=600&auto=format&fit=crop' },
];

const occasions = [
  {
    key: 'extraordinary',
    label: 'Extraordinary Hues',
    title: 'Extraordinary Hues',
    copy: 'For the women whose presence is its own colour. The stones she wears — bold, radiant, unforgettable.',
    modelImage: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=900&auto=format&fit=crop',
    productImages: [
      'https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?w=300&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=300&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=300&auto=format&fit=crop',
    ],
  },
  {
    key: 'understated',
    label: 'Understated Glow',
    title: 'Understated Glow',
    copy: 'A whisper of colour. Stones that lend just enough light, never too much.',
    modelImage: 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=900&auto=format&fit=crop',
    productImages: [
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=300&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1535632066274-36f4c5f29f5f?w=300&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=300&auto=format&fit=crop',
    ],
  },
  {
    key: 'heritage',
    label: 'Heritage Hues',
    title: 'Heritage Hues',
    copy: 'Stones favoured across generations. Pieces that travel through families like stories.',
    modelImage: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=900&auto=format&fit=crop',
    productImages: [
      'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=300&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=300&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1583292650898-7d22cd27ca6f?w=300&auto=format&fit=crop',
    ],
  },
];

export default function GemstonePage() {
  return (
    <div>
      {/* Breadcrumb */}
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Gemstone' }]} />

      {/* HERO — Tanzanite Pear Cabochon */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white to-purple-50/30">
        {/* Decorative scattered florals */}
        <div className="absolute -bottom-8 -left-8 w-48 md:w-64 h-48 md:h-64 pointer-events-none opacity-80">
          <Image src="https://images.unsplash.com/photo-1591437694631-c2d04bb8b9c5?w=300&auto=format&fit=crop" alt="Decorative floral" fill className="object-cover rounded-full blur-md" />
        </div>
        <div className="absolute -bottom-8 -right-8 w-48 md:w-64 h-48 md:h-64 pointer-events-none opacity-70">
          <Image src="https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=300&auto=format&fit=crop" alt="Decorative floral" fill className="object-cover rounded-full blur-md" />
        </div>

        <div className="container-custom relative py-12 md:py-20 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div>
            <p className="font-display italic text-2xl md:text-3xl text-brand-maroon">Tanzanite</p>
            <p className="font-display italic text-xl md:text-2xl text-brand-gold-dark -mt-1">Pear Cabochon</p>
            <h1 className="font-display text-4xl md:text-6xl text-brand-ink mt-4 leading-tight">
              A Celebration of<br />
              <span className="italic">Natural Gemstones</span>
            </h1>
            <p className="text-sm text-brand-muted mt-4 max-w-md">
              Every Aurelia gemstone is mined for its colour, cut for its light, and set with reverence for its rarity.
            </p>
            <div className="flex flex-wrap gap-3 mt-6">
              <Link href="#palette" className="px-7 py-3 bg-brand-maroon text-white text-xs font-semibold tracking-widest uppercase rounded-sm hover:bg-brand-maroon-dark transition-colors">
                Explore Collection
              </Link>
              <Link href="#story" className="px-7 py-3 border border-brand-maroon text-brand-maroon text-xs font-semibold tracking-widest uppercase rounded-sm hover:bg-brand-maroon hover:text-white transition-colors">
                Our Story
              </Link>
            </div>
          </div>

          <div className="relative aspect-square max-w-md mx-auto w-full">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-200/40 via-transparent to-violet-300/30 rounded-full blur-3xl" />
            <Image
              src="https://images.unsplash.com/photo-1591437694631-c2d04bb8b9c5?w=900&auto=format&fit=crop"
              alt="Tanzanite gemstone"
              fill
              className="object-cover rounded-full shadow-xl"
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        </div>
      </section>

      {/* Full-bleed lifestyle banner — A World of Colour Awaits */}
      <section className="relative h-[280px] md:h-[420px] overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=1800&auto=format&fit=crop"
          alt="A world of colour awaits"
          fill
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-rose-900/40 via-transparent to-rose-900/20" />
        <div className="container-custom relative h-full flex items-center">
          <div className="text-white max-w-md">
            <h2 className="font-display text-4xl md:text-5xl">A World of</h2>
            <p className="font-display italic text-3xl md:text-4xl text-brand-gold-light mt-1">Colour Awaits.</p>
            <Link href="#palette" className="inline-block mt-5 px-6 py-2.5 border border-white text-white text-[10px] font-semibold tracking-widest uppercase rounded-sm hover:bg-white hover:text-brand-maroon transition-colors">
              Explore Collection
            </Link>
          </div>
        </div>
      </section>

      {/* Gemstone Palette */}
      <div id="palette">
        <GemstonePalette />
      </div>

      {/* Category icons row */}
      <section className="container-custom py-10 border-y border-brand-cream-dark">
        <div className="flex justify-center gap-8 md:gap-16 overflow-x-auto no-scrollbar">
          {[
            { label: 'All', icon: '◈' },
            { label: 'Earrings', icon: '◐' },
            { label: 'Rings', icon: '○' },
            { label: 'Pendants', icon: '◇' },
            { label: 'Necklaces', icon: '⌣' },
          ].map((c, i) => (
            <Link key={c.label} href="#" className={`flex-none flex flex-col items-center gap-2 group ${i === 0 ? 'border-b-2 border-brand-maroon pb-2 -mb-px' : ''}`}>
              <span className={`text-2xl ${i === 0 ? 'text-brand-maroon' : 'text-brand-muted group-hover:text-brand-maroon'} transition-colors`}>{c.icon}</span>
              <span className={`text-xs uppercase tracking-widest ${i === 0 ? 'text-brand-maroon font-semibold' : 'text-brand-muted group-hover:text-brand-maroon'} transition-colors`}>{c.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Effortlessly Chic / Perfectly Polished / Subtly Striking / Gracefully etc. */}
      <section className="container-custom py-12 grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          { kind: 'Earrings', tag: 'Effortlessly Chic', img: 'https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?w=600&auto=format&fit=crop' },
          { kind: 'Rings', tag: 'Perfectly Poised', img: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&auto=format&fit=crop' },
          { kind: 'Pendants', tag: 'Subtly Striking', img: 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=600&auto=format&fit=crop' },
          { kind: 'Neckwear', tag: 'Gracefully Bold', img: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&auto=format&fit=crop' },
        ].map((c) => (
          <Link key={c.kind} href={`/${c.kind.toLowerCase()}`} className="group relative bg-white border border-brand-cream-dark rounded-lg overflow-hidden flex">
            <div className="relative w-32 md:w-40 flex-none aspect-square bg-brand-cream">
              <Image src={c.img} alt={c.kind} fill className="object-cover group-hover:scale-105 transition-transform duration-700" sizes="160px" />
            </div>
            <div className="flex-1 flex flex-col justify-center px-5 md:px-8">
              <p className="text-xs uppercase tracking-widest text-brand-gold-dark">{c.kind}</p>
              <p className="font-display italic text-2xl md:text-3xl text-brand-ink mt-1">{c.tag}</p>
              <span className="text-[10px] tracking-widest uppercase text-brand-maroon mt-3 group-hover:underline">Explore →</span>
            </div>
          </Link>
        ))}
      </section>

      {/* Five Truths of Aurelia Gemstone */}
      <section id="story" className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-3">
            <h2 className="font-display text-3xl md:text-4xl text-brand-ink leading-tight">The Five Truths of<br />Aurelia Gemstone</h2>
            <p className="text-sm text-brand-muted mt-3 italic">What makes an Aurelia gemstone truly exceptional.</p>
            <div className="flex gap-2 mt-4">
              <button className="w-8 h-8 rounded-full border border-brand-cream-dark grid place-items-center hover:border-brand-maroon transition-colors" aria-label="Previous">‹</button>
              <button className="w-8 h-8 rounded-full border border-brand-cream-dark grid place-items-center hover:border-brand-maroon transition-colors" aria-label="Next">›</button>
            </div>
          </div>
          <div className="md:col-span-9 grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
            {fiveTruths.map((t) => (
              <div key={t.label} className="relative aspect-[3/4] rounded-lg overflow-hidden group">
                <Image src={t.image} alt={t.label} fill className="object-cover group-hover:scale-105 transition-transform duration-700" sizes="(max-width: 768px) 50vw, 20vw" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                  <p className="text-[9px] tracking-[0.3em] uppercase text-white">{t.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Brand Promises */}
      <BrandPromises title="Aurelia Gemstone Promises" />

      {/* Shop by Occasion */}
      <ShopByOccasion occasions={occasions} />

      {/* Style Inspiration */}
      <StyleInspiration
        title="Style Inspiration"
        subtitle="Discover a curated selection of remarkable gemstones, celebrated for their beauty, character, and timeless allure."
        items={[
          { image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&auto=format&fit=crop' },
          { image: 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=600&auto=format&fit=crop' },
          { image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&auto=format&fit=crop' },
        ]}
      />

      {/* Closing editorial card */}
      <CollectionStory
        scriptTitle="Hues"
        subtitle="A natural anthology"
        body="These treasures wait for the moment when they may return and enrich your world. Book a private viewing at the boutique nearest you."
        ctaLabel="Book An Appointment"
        ctaHref="/store-locator"
      />
    </div>
  );
}
