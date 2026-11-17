import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export default function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="container-custom py-4">
      <ol className="flex items-center gap-2 text-xs text-brand-muted flex-wrap">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-2">
            {item.href ? (
              <Link href={item.href} className="hover:text-brand-maroon transition-colors">
                {item.label}
              </Link>
            ) : (
              <span className="text-brand-maroon font-medium">{item.label}</span>
            )}
            {i < items.length - 1 && <ChevronRight size={12} className="text-brand-muted/60" />}
          </li>
        ))}
      </ol>
    </nav>
  );
}
