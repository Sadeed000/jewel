import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] grid place-items-center text-center px-4">
      <div>
        <p className="font-display text-9xl text-brand-gold-dark">404</p>
        <h1 className="font-display text-3xl text-brand-ink mt-2">Page Not Found</h1>
        <p className="text-sm text-brand-muted mt-2 max-w-sm">The piece you&apos;re looking for may have been moved or no longer exists.</p>
        <Link href="/" className="btn-primary mt-6 inline-flex">Back to Home</Link>
      </div>
    </div>
  );
}
