import Link from 'next/link';
import Image from 'next/image';

const tiles = [
  {
    image: 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=900',
    title: 'Sub 50K',
    href: '/shop/under-50k',
    span: 'col-span-2 row-span-2',
  },
  {
    image: 'https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?w=600',
    title: 'Stunning every Ear',
    script: true,
    href: '/shop/earrings',
  },
  {
    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600',
    title: '18Kt Jewellery',
    href: '/shop/gold/18k',
  },
];

export default function CollectionsGrid() {
  return (
    <section className="container-custom py-16">
      <div className="text-center mb-10">
        <h2 className="font-display text-3xl md:text-4xl text-brand-ink">Aurelia Collections</h2>
        <p className="text-sm text-brand-muted mt-2">Explore our newly launched collection</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 grid-rows-2 gap-4 md:gap-5 h-[400px] md:h-[500px]">
        <Link href={tiles[0].href} className={`group relative overflow-hidden rounded-lg ${tiles[0].span}`}>
          <Image src={tiles[0].image} alt={tiles[0].title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" sizes="50vw" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <span className="absolute bottom-6 left-6 font-display text-white text-4xl md:text-5xl">
            {tiles[0].title}
          </span>
        </Link>
        {tiles.slice(1).map((t, i) => (
          <Link key={i} href={t.href} className="group relative overflow-hidden rounded-lg col-span-2">
            <Image src={t.image} alt={t.title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" sizes="50vw" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />
            <span className={`absolute bottom-5 left-5 text-white ${t.script ? 'script-italic font-display text-3xl md:text-4xl' : 'font-display text-2xl md:text-3xl'}`}>
              {t.title}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
