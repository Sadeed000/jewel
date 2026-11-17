import Link from 'next/link';

export default function Logo({ className = '', light = false }: { className?: string; light?: boolean }) {
  const color = light ? '#fdfbf7' : '#5a1a1a';
  return (
    <Link href="/" aria-label="Aurelia Home" className={`inline-flex items-center gap-2 ${className}`}>
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 4 L8 14 L8 36 M20 4 L32 14 L32 36 M14 36 L26 36 M20 4 L20 36" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <circle cx="20" cy="14" r="2.5" fill={color} />
      </svg>
      <span className="font-display text-2xl tracking-[0.2em] font-medium" style={{ color }}>
        AURELIA
      </span>
    </Link>
  );
}
