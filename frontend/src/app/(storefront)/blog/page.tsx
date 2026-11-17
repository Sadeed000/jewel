import Link from 'next/link';
import Image from 'next/image';
import Breadcrumb from '@/components/common/Breadcrumb';

const posts = [
  { slug: 'choosing-bridal-jewellery', title: 'A Modern Guide to Choosing Bridal Jewellery', category: 'Wedding', image: 'https://images.unsplash.com/photo-1583292650898-7d22cd27ca6f?w=900', excerpt: 'From the mangalsutra to the maang tikka — how to build a bridal set that feels timelessly you.', readTime: '6 min read' },
  { slug: 'gold-purity-explained', title: 'Gold Purity Explained: 14K, 18K, 22K & 24K', category: 'Jewellery Guides', image: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=900', excerpt: 'A simple guide to understanding karat, purity, and what to look for at the counter.', readTime: '4 min read' },
  { slug: 'festive-styling-tips', title: 'Festive Styling: Layering Necklaces with Saris', category: 'Festive Styling', image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=900', excerpt: 'Five styling rules our editors swear by for festive evenings.', readTime: '5 min read' },
  { slug: 'caring-for-gemstones', title: 'How to Care for Your Gemstone Jewellery', category: 'Care', image: 'https://images.unsplash.com/photo-1591437694631-c2d04bb8b9c5?w=900', excerpt: 'Soft cloths, gentle soaps, and what to avoid — keep your stones glowing for decades.', readTime: '3 min read' },
];

const categories = ['All', 'Jewellery Guides', 'Wedding', 'Festive Styling', 'Care'];

export default function BlogPage() {
  return (
    <div>
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Stories' }]} />

      <div className="container-custom pb-16">
        <div className="text-center mb-10">
          <p className="script-italic font-display text-2xl text-brand-gold-dark">The Aurelia Journal</p>
          <h1 className="font-display text-4xl md:text-5xl text-brand-ink mt-1">Stories</h1>
        </div>

        <div className="flex flex-wrap gap-2 justify-center mb-10">
          {categories.map((c) => (
            <button key={c} className="px-4 py-1.5 border border-brand-cream-dark rounded-full text-xs hover:border-brand-maroon hover:text-brand-maroon transition-colors">
              {c}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {posts.map((p, i) => (
            <Link key={p.slug} href={`/blog/${p.slug}`} className={`group ${i === 0 ? 'md:col-span-2' : ''}`}>
              <div className={`relative overflow-hidden rounded-lg ${i === 0 ? 'aspect-[16/8]' : 'aspect-[4/3]'}`}>
                <Image src={p.image} alt={p.title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" sizes="(max-width: 768px) 100vw, 50vw" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <span className="absolute top-4 left-4 bg-white/90 backdrop-blur text-xs px-3 py-1 rounded-full text-brand-maroon">{p.category}</span>
              </div>
              <div className="mt-4">
                <h2 className={`font-display text-brand-ink group-hover:text-brand-maroon transition-colors ${i === 0 ? 'text-3xl' : 'text-xl'}`}>{p.title}</h2>
                <p className="text-sm text-brand-muted mt-2 line-clamp-2">{p.excerpt}</p>
                <p className="text-xs text-brand-gold-dark mt-3 uppercase tracking-widest">{p.readTime}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
