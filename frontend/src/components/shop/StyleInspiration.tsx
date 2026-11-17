import Image from 'next/image';

interface Item {
  image: string;
  label?: string;
}

interface Props {
  title?: string;
  subtitle?: string;
  items: Item[];
}

export default function StyleInspiration({ title = 'Style Inspiration', subtitle, items }: Props) {
  return (
    <section className="container-custom py-12">
      <div className="mb-6">
        <h2 className="font-display text-3xl md:text-4xl text-brand-ink">{title}</h2>
        {subtitle && <p className="text-sm text-brand-muted mt-2 max-w-xl">{subtitle}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
        {items.map((it, i) => (
          <div key={i} className="relative aspect-[3/4] rounded-lg overflow-hidden group">
            <Image
              src={it.image}
              alt={it.label ?? 'Style inspiration'}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-700"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
            {it.label && (
              <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-black/60 to-transparent">
                <p className="text-white font-display text-xl">{it.label}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
