import Link from 'next/link';
import Image from 'next/image';

interface Props {
  scriptTitle: string;
  subtitle?: string;
  body: string;
  ctaLabel?: string;
  ctaHref?: string;
  bgImage?: string;
}

export default function CollectionStory({
  scriptTitle,
  subtitle,
  body,
  ctaLabel = 'Book An Appointment',
  ctaHref = '/store-locator',
  bgImage = 'https://images.unsplash.com/photo-1591437694631-c2d04bb8b9c5?w=1800&auto=format&fit=crop',
}: Props) {
  return (
    <section className="container-custom py-16">
      <div className="relative rounded-2xl border-2 border-brand-maroon/40 overflow-hidden">
        <Image src={bgImage} alt="" fill className="object-cover opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/95 via-white/90 to-white/95" />

        <div className="relative px-6 md:px-12 py-16 md:py-20 text-center max-w-2xl mx-auto">
          <p className="font-display italic text-5xl md:text-6xl text-brand-maroon">{scriptTitle}</p>
          {subtitle && <p className="text-[10px] tracking-[0.4em] uppercase text-brand-gold-dark mt-2">{subtitle}</p>}
          <p className="text-sm text-brand-ink/80 mt-6 leading-relaxed italic">{body}</p>

          <Link
            href={ctaHref}
            className="inline-block mt-8 px-8 py-3 bg-brand-maroon text-white text-xs font-semibold tracking-widest uppercase rounded-sm hover:bg-brand-maroon-dark transition-colors"
          >
            {ctaLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}
