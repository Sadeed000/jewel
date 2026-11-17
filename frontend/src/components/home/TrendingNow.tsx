import Link from 'next/link';
import Image from 'next/image';

const trends = [
  { image: 'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=600', title: 'Auspicious Occasion', href: '/shop/auspicious' },
  { image: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=600', title: 'Gifting Jewellery', href: '/shop/gifting' },
  { image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600', title: 'Akshaya Tritiya', href: '/shop/akshaya-tritiya' },
];

export default function TrendingNow() {
  return (
    <section className="container-custom py-12">
      <div className="text-center mb-8">
        <h2 className="font-display text-3xl md:text-4xl text-brand-ink">Trending Now</h2>
        <p className="text-sm text-brand-muted mt-2">Jewellery pieces everyone&apos;s eyeing right now</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {trends.map((t, i) => (
          <Link key={i} href={t.href} className="group relative aspect-[4/3] overflow-hidden rounded-lg">
            <Image src={t.image} alt={t.title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" sizes="33vw" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <span className="absolute bottom-5 left-5 font-display text-white text-2xl md:text-3xl">{t.title}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
