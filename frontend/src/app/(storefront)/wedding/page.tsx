
import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import Image from 'next/image';
import Link from 'next/link';
import Breadcrumb from '@/components/common/Breadcrumb';
import PageHeroBanner from '@/components/shop/PageHeroBanner';
import ProductCard from '@/components/product/ProductCard';
import BrandPromises from '@/components/shop/BrandPromises';
import CollectionStory from '@/components/shop/CollectionStory';
import { fetchProducts } from '@/lib/server-api';
import { asset, tile } from '@/lib/imagery';

export const metadata: Metadata = pageMetadata({
  title: "Wedding & Bridal Jewellery Online in India",
  description:
    "Bridal and wedding jewellery for the big day and the celebrations around it, with prices in INR and secure checkout.",
  path: '/wedding',
});

const bridalCategories = [
  { label: 'Bridal Sets', icon: '◈', image: tile('weddingKundanSet', '1:1', 700) },
  { label: 'Mangalsutras', icon: '❀', image: tile('weddingBrideGold', '1:1', 700) },
  { label: 'Vaddanam', icon: '◯', image: tile('weddingBrideRed', '1:1', 700) },
  { label: 'Kalire', icon: '✦', image: tile('weddingMehendiKundan', '1:1', 700) },
  { label: 'Polki', icon: '◆', image: tile('jewelleryRoseEmeraldSet', '1:1', 700) },
  { label: 'For the Groom', icon: '◇', image: tile('silverBandsLeaf', '1:1', 700) },
];

export default async function WeddingPage() {
  const wedding = await fetchProducts({ occasion: 'wedding', limit: 24 });

  return (
    <div>
      {/* Hero — bridal */}
      <section className="relative h-[420px] md:h-[560px] overflow-hidden">
        <Image
          // Background extended with generative fill: the full bride and her
          // jewellery sit on the right, the headline on the dark left. Phones
          // anchor the image right so she stays in view.
          src={asset('weddingBrideRedWide')}
          alt="Bride in a red lehenga wearing a kundan necklace, maang tikka and nath"
          quality={85}
          fill
          priority
          className="object-cover object-[85%_center] md:object-center"
          sizes="100vw"
        />
        {/* Phones: a bottom veil so text reads over the bride. Desktop: the
            left of the photo is already dark; a light gradient deepens it. */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent md:bg-gradient-to-r md:from-black/50 md:via-black/10 md:to-transparent" />
        <div className="container-custom relative h-full flex items-end pb-10 md:items-center md:pb-0">
          <div className="text-white max-w-xl">
            <p className="font-display italic text-2xl md:text-3xl text-brand-gold-light">The Bridal Edit</p>
            <p className="text-[10px] tracking-[0.5em] uppercase opacity-90 mt-1">Ratnapankh Wedding Collection</p>
            <h1 className="font-display text-4xl md:text-6xl mt-4 leading-tight">
              Heirlooms in<br/>
              the making.
            </h1>
            <p className="text-sm md:text-base opacity-90 mt-4 max-w-md">
              Pieces that hold the weight of every promise. Crafted to be passed on, generation after generation.
            </p>
            <div className="flex flex-wrap gap-3 mt-7">
              <Link href="#bridal-categories" className="px-7 py-3 bg-brand-gold text-brand-maroon-dark text-xs font-semibold tracking-widest uppercase rounded-sm hover:bg-brand-gold-light transition-colors">
                Shop The Edit
              </Link>
              <Link href="/store-locator" className="px-7 py-3 border border-white text-white text-xs font-semibold tracking-widest uppercase rounded-sm hover:bg-white hover:text-brand-maroon transition-colors">
                Book a Stylist
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Wedding' }]} />

      {/* Bridal categories */}
      <section id="bridal-categories" className="container-custom py-14">
        <div className="text-center mb-10">
          <p className="text-[10px] tracking-[0.4em] uppercase text-brand-gold-dark">Begin Here</p>
          <h2 className="font-display text-3xl md:text-4xl text-brand-ink mt-2">Shop the Bridal Wardrobe</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-5">
          {bridalCategories.map((c) => (
            <Link key={c.label} href="/shop/jewellery?occasion=wedding" className="group block">
              <div className="relative aspect-square rounded-lg overflow-hidden bg-brand-cream">
                <Image src={c.image} alt={c.label} fill className="object-cover group-hover:scale-105 transition-transform duration-700" sizes="(max-width: 768px) 50vw, 16vw" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                <p className="absolute bottom-3 left-3 right-3 text-white font-display text-lg">{c.label}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Editorial split — Polki */}
      <section className="relative bg-gradient-to-br from-brand-maroon-dark via-brand-maroon to-brand-maroon-dark overflow-hidden">
        <div className="container-custom py-16 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div className="text-white">
            <p className="font-display italic text-2xl text-brand-gold-light">A Heritage Reimagined</p>
            <h2 className="font-display text-4xl md:text-5xl mt-2">Polki Stories</h2>
            <p className="text-sm md:text-base text-white/85 mt-4 leading-relaxed">
              Uncut, unhurried, untouched by time. Polki diamonds have adorned royalty for centuries — now reimagined for the bride who carries her past with pride.
            </p>
            <Link href="/shop/jewellery?occasion=wedding" className="inline-block mt-7 px-7 py-3 bg-brand-gold text-brand-maroon-dark text-xs font-semibold tracking-widest uppercase rounded-sm hover:bg-brand-gold-light transition-colors">
              Explore Polki
            </Link>
          </div>
          <div className="relative aspect-[4/5] rounded-lg overflow-hidden">
            <Image src={tile('weddingKundanSet', '4:5', 1400)} alt="Kundan necklace with matching jhumka earrings" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
          </div>
        </div>
      </section>

      {/* Featured wedding products */}
      <section className="container-custom py-14">
        <div className="text-center mb-10">
          <h2 className="font-display text-3xl md:text-4xl text-brand-ink">Featured for the Bride</h2>
          <p className="text-sm text-brand-muted mt-2 italic">Hand-selected by our bridal stylists</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
          {wedding.slice(0, 8).map((p) => <ProductCard key={p._id} product={p} />)}
        </div>
      </section>

      {/* Stylist appointment + checklist split */}
      <section className="container-custom py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="relative rounded-lg overflow-hidden min-h-[320px] bg-gradient-to-br from-rose-50 to-amber-50 border border-brand-cream-dark p-8 md:p-10 flex flex-col justify-between">
            <div>
              <p className="text-[10px] tracking-[0.4em] uppercase text-brand-gold-dark">Personal Service</p>
              <h3 className="font-display text-3xl md:text-4xl text-brand-maroon mt-2">Bridal Stylist Appointments</h3>
              <p className="text-sm text-brand-ink/80 mt-3 max-w-md leading-relaxed">
                A dedicated stylist will guide you through every piece — from the first ring to the final mangalsutra. In-store or via video call.
              </p>
            </div>
            <Link href="/store-locator" className="self-start mt-6 px-6 py-3 bg-brand-maroon text-white text-xs font-semibold tracking-widest uppercase rounded-sm hover:bg-brand-maroon-dark transition-colors">
              Book Now
            </Link>
          </div>

          <div className="relative rounded-lg overflow-hidden min-h-[320px] border border-brand-cream-dark bg-white p-8 md:p-10">
            <p className="text-[10px] tracking-[0.4em] uppercase text-brand-gold-dark">The Bridal Checklist</p>
            <h3 className="font-display text-3xl md:text-4xl text-brand-maroon mt-2">What every bride needs</h3>
            <ul className="mt-5 space-y-2.5 text-sm text-brand-ink/85">
              {[
                'A statement bridal necklace set',
                'Mangalsutra — heritage or contemporary',
                'Maang tikka & jhumar',
                'Bangles and kalire for the haldi',
                'Vaddanam (waist belt)',
                'Daily-wear ring stack',
              ].map((item, i) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="w-5 h-5 flex-none rounded-full bg-brand-cream text-brand-maroon text-[10px] grid place-items-center font-semibold mt-0.5">{i + 1}</span>
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/blog" className="inline-block mt-6 text-xs font-semibold tracking-widest uppercase text-brand-maroon hover:underline">
              Get the Full Checklist →
            </Link>
          </div>
        </div>
      </section>

      <BrandPromises title="The Aurelia Wedding Promise" />

      <CollectionStory
        scriptTitle="Forever"
        subtitle="A bridal anthology"
        body="The pieces you wear today will outlive every wedding photograph. Crafted with care, blessed with intent — they belong to your story."
        ctaLabel="Visit a Boutique"
        ctaHref="/store-locator"
        bgImage="https://res.cloudinary.com/dnsulnx1r/image/upload/v1795009728/ratnapankh/library/photo-1583292650898-7d22cd27ca6f.jpg"
      />
    </div>
  );
}
