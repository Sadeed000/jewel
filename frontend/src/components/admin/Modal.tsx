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
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-6">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative my-4 w-full max-w-4xl rounded-2xl bg-white shadow-2xl"
      >
        <header className="sticky top-0 z-10 flex items-start gap-4 rounded-t-2xl border-b border-slate-200 bg-white px-6 py-4">
          <div>
            <h3 className="font-display text-2xl text-brand-ink">{title}</h3>
            {subtitle && <p className="mt-0.5 text-sm text-brand-muted">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="ml-auto rounded-lg p-2 text-brand-muted hover:bg-slate-100 hover:text-brand-ink"
          >
            <X size={18} />
          </button>
        </header>

        <div className="px-6 py-5">{children}</div>

        {footer && (
          <footer className="sticky bottom-0 flex justify-end gap-3 rounded-b-2xl border-t border-slate-200 bg-white px-6 py-4">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}
