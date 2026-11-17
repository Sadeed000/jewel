import Image from 'next/image';
import Link from 'next/link';

interface Props {
  image: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  highlight?: string;
  ctaLabel?: string;
  ctaHref?: string;
  align?: 'left' | 'center' | 'right';
  height?: 'sm' | 'md' | 'lg';
}

export default function PageHeroBanner({
  image,
  eyebrow,
  title,
  subtitle,
  highlight,
  ctaLabel,
  ctaHref = '#',
  align = 'right',
  height = 'md',
}: Props) {
  const heights = { sm: 'h-[180px] md:h-[240px]', md: 'h-[220px] md:h-[300px]', lg: 'h-[280px] md:h-[420px]' };
  const alignment = {
    left: 'items-start text-left',
    center: 'items-center text-center',
    right: 'items-end text-right md:pr-12',
  };

  return (
    <section className={`relative w-full overflow-hidden ${heights[height]}`}>
      <Image src={image} alt={title} fill priority className="object-cover" sizes="100vw" />
      <div className={`absolute inset-0 ${align === 'right' ? 'bg-gradient-to-l from-black/40 via-black/15 to-transparent' : 'bg-gradient-to-r from-black/50 via-black/15 to-transparent'}`} />
      <div className="container-custom relative h-full flex">
        <div className={`flex-1 flex flex-col justify-center ${alignment[align]}`}>
          {eyebrow && <p className="text-[10px] tracking-[0.3em] uppercase text-white/90 mb-2">{eyebrow}</p>}
          <h1 className="font-display text-3xl md:text-5xl text-white leading-tight whitespace-pre-line">{title}</h1>
          {highlight && (
            <p className="font-display text-2xl md:text-4xl text-brand-gold-light mt-1 italic">{highlight}</p>
          )}
          {subtitle && <p className="text-xs md:text-sm text-white/85 mt-2 max-w-xs">{subtitle}</p>}
          {ctaLabel && (
            <Link href={ctaHref} className="mt-4 inline-block px-6 py-2.5 bg-brand-gold text-brand-maroon-dark text-xs font-semibold tracking-wider uppercase rounded-sm hover:bg-brand-gold-light transition-colors w-fit">
              {ctaLabel}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
