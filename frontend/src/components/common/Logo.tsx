import Link from 'next/link';
import { BRAND } from '@/lib/brand';

export default function Logo({ className = '', light = false }: { className?: string; light?: boolean }) {
  const color = light ? '#fdfbf7' : '#5a1a1a';
  return (
    <Link href="/" aria-label={`${BRAND} home`} className={`inline-flex items-center gap-2 ${className}`}>
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 4 L8 14 L8 36 M20 4 L32 14 L32 36 M14 36 L26 36 M20 4 L20 36" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <circle cx="20" cy="14" r="2.5" fill={color} />
      </svg>
      {/* Longer wordmarks get slightly tighter tracking so the header
          still fits on a 360px phone. */}
      <span
        className={`font-display font-medium ${BRAND.length > 8 ? 'text-xl sm:text-2xl tracking-[0.12em]' : 'text-2xl tracking-[0.2em]'}`}
        style={{ color }}
      >
        {BRAND.toUpperCase()}
      </span>
    </Link>
  );
}
