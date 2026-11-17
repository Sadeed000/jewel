import Link from 'next/link';
import Image from 'next/image';

const worldTiles = [
  { image: 'https://images.unsplash.com/photo-1583292650898-7d22cd27ca6f?w=900', title: 'Wedding', href: '/shop/wedding' },
  { image: 'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=900', title: 'Diamond', href: '/shop/diamond' },
  { image: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=900', title: 'Gold', href: '/shop/gold' },
  { image: 'https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?w=900', title: 'Dailywear', href: '/shop/daily-wear' },
];

export default function AureliaWorld() {
  return (
    <section className="container-custom py-12">
      <div className="text-center mb-8">
        <h2 className="font-display text-3xl md:text-4xl text-brand-ink">Aurelia World</h2>
        <p className="text-sm text-brand-muted mt-2">A companion for every occasion</p>
      </div>
      <div className="grid grid-cols-2 gap-4 md:gap-5">
        {worldTiles.map((t) => (
          <Link key={t.title} href={t.href} className="group relative aspect-[16/10] overflow-hidden rounded-lg">
            <Image src={t.image} alt={t.title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" sizes="50vw" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
            <span className="absolute inset-0 flex items-center justify-center font-display text-white text-3xl md:text-5xl tracking-wide">
              {t.title}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
