import Image from 'next/image';
import Breadcrumb from '@/components/common/Breadcrumb';

export default function AboutPage() {
  return (
    <div>
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'About Us' }]} />

      <section className="relative h-[40vh] overflow-hidden">
        <Image src="https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=1800" alt="Aurelia heritage" fill className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/20" />
        <div className="absolute inset-0 grid place-items-center text-white text-center">
          <div>
            <p className="script-italic font-display text-xl text-brand-gold-light">Since 1994</p>
            <h1 className="font-display text-5xl md:text-6xl mt-1">Our Story</h1>
          </div>
        </div>
      </section>

      <div className="container-custom py-16 max-w-3xl">
        <h2 className="font-display text-3xl text-brand-ink">Crafted with care, worn with pride.</h2>
        <p className="text-brand-ink/80 leading-relaxed mt-5">
          Aurelia was born from a simple belief: jewellery should be more than ornament — it should hold memory, mark moments, and outlive the moments it celebrates. From a single workshop in 1994 to over 400 boutiques across India, our master karigars still hand-finish every piece, blending generations-old techniques with modern design sensibility.
        </p>
        <p className="text-brand-ink/80 leading-relaxed mt-4">
          Every gram is BIS hallmarked. Every diamond is conflict-free and certified. Every customer is treated as a custodian of something precious — because that is, in the truest sense, what we make.
        </p>

        <div className="grid grid-cols-3 gap-6 mt-12">
          {[{ n: '400+', l: 'Boutiques' }, { n: '2.8M+', l: 'Families served' }, { n: '30 yrs', l: 'Of trust' }].map((s) => (
            <div key={s.l} className="text-center border border-brand-cream-dark rounded-lg p-5">
              <p className="font-display text-3xl text-brand-maroon">{s.n}</p>
              <p className="text-xs text-brand-muted mt-1">{s.l}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
