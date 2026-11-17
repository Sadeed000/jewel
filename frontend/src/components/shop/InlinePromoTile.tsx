import Link from 'next/link';
import Image from 'next/image';

interface Props {
  image: string;
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  href?: string;
  variant?: 'light' | 'dark' | 'gold';
  badge?: string;
}

export default function InlinePromoTile({
  image,
  title,
  subtitle,
  ctaLabel = 'Explore Now',
  href = '#',
  variant = 'light',
  badge,
}: Props) {
  const variants = {
    light: 'from-brand-cream/40 to-transparent text-brand-ink',
    dark: 'from-black/60 to-black/10 text-white',
    gold: 'from-brand-maroon-dark/80 to-transparent text-white',
  };

  return (
    <Link href={href} className="group relative block overflow-hidden rounded-lg aspect-square">
      <Image src={image} alt={title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" sizes="(max-width: 768px) 50vw, 33vw" />
      <div className={`absolute inset-0 bg-gradient-to-r ${variants[variant]}`} />
      {badge && (
        <span className="absolute top-3 left-3 bg-brand-gold-dark text-white text-[10px] uppercase tracking-widest px-2 py-1 rounded">
          ✦ {badge}
        </span>
      )}
      <div className="absolute inset-0 p-6 flex flex-col justify-center">
        <h3 className={`font-display text-2xl md:text-3xl ${variant === 'light' ? 'text-brand-maroon' : ''}`}>{title}</h3>
        {subtitle && <p className={`text-xs md:text-sm mt-2 max-w-[200px] ${variant === 'light' ? 'text-brand-ink/80' : 'opacity-90'}`}>{subtitle}</p>}
        <span className={`mt-4 inline-block px-5 py-2 text-[10px] font-semibold tracking-widest uppercase rounded-sm w-fit ${variant === 'light' ? 'bg-brand-maroon text-white' : 'bg-white text-brand-maroon'}`}>
          {ctaLabel}
        </span>
      </div>
    </Link>
  );
}
