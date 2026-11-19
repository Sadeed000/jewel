'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    // Stop the page behind the modal from scrolling.
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-3 sm:p-6">
      <div className="backdrop-in fixed inset-0 bg-[#3a2418]/25 backdrop-blur-[4px]" onClick={onClose} />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="dialog-in relative my-4 w-full max-w-4xl overflow-hidden rounded-[20px] bg-admin-surface shadow-[0_32px_80px_-20px_rgba(122,82,40,0.45)] ring-1 ring-admin-gold/25"
      >
        <div className="h-1 w-full bg-gradient-to-r from-admin-gold-light via-admin-gold to-admin-maroon/70" aria-hidden="true" />
        <header className="sticky top-0 z-10 flex items-start gap-4 border-b border-admin-line bg-admin-surface/95 px-6 py-5 backdrop-blur">
          <div>
            <h3 className="text-xl font-bold tracking-[-0.02em] text-admin-ink">{title}</h3>
            {subtitle && <p className="mt-0.5 text-sm text-admin-muted">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="ml-auto grid h-9 w-9 place-items-center rounded-xl text-admin-muted transition-colors hover:bg-admin-gold-soft hover:text-admin-maroon"
          >
            <X size={18} />
          </button>
        </header>

        <div className="px-6 py-6">{children}</div>

        {footer && (
          <footer className="sticky bottom-0 flex justify-end gap-2.5 border-t border-admin-line bg-admin-subtle/95 px-6 py-4 backdrop-blur">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}
