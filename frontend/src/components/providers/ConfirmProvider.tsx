'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Info, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Promise-based confirmation dialog — a modern replacement for
 * `window.confirm`. Mounted once in the root layout.
 *
 *   const confirm = useConfirm();
 *   if (!(await confirm({ title: 'Remove item?', tone: 'danger' }))) return;
 *
 * Accessible: role="alertdialog", focus moves into the dialog (to Cancel for
 * destructive actions, so a stray Enter never deletes), Tab is trapped,
 * Escape / backdrop click cancels, and focus returns to the trigger after.
 */

export type ConfirmTone = 'danger' | 'warning' | 'default';

export interface ConfirmOptions {
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** danger = red destructive styling (default), warning = amber, default = brand. */
  tone?: ConfirmTone;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

const TONE = {
  danger: {
    icon: Trash2,
    iconWrap: 'bg-red-50 text-red-600 ring-red-100',
    confirm: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500 shadow-[0_8px_20px_-8px_rgba(220,38,38,0.6)]',
  },
  warning: {
    icon: AlertTriangle,
    iconWrap: 'bg-amber-50 text-amber-600 ring-amber-100',
    confirm: 'bg-brand-maroon text-white hover:bg-brand-maroon-dark focus-visible:ring-brand-gold',
  },
  default: {
    icon: Info,
    iconWrap: 'bg-brand-cream-dark text-brand-gold-ink ring-brand-line',
    confirm: 'bg-brand-maroon text-white hover:bg-brand-maroon-dark focus-visible:ring-brand-gold',
  },
} as const;

interface PendingConfirm extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

function ConfirmDialog({ pending, onClose }: { pending: PendingConfirm; onClose: (value: boolean) => void }) {
  const tone = pending.tone ?? 'danger';
  const style = TONE[tone];
  const Icon = style.icon;
  const titleId = useId();
  const descId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Destructive: focus Cancel so an accidental Enter is harmless.
    (tone === 'danger' ? cancelRef : confirmRef).current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Capture phase + stop: an underlying modal (e.g. the admin product
        // editor) also closes on Escape and must not receive this one.
        e.preventDefault();
        e.stopImmediatePropagation();
        onClose(false);
        return;
      }
      if (e.key === 'Tab' && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>('button:not([disabled])');
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', onKey, true);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey, true);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose, tone]);

  return (
    <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-4">
      <div
        className="backdrop-in absolute inset-0 bg-brand-ink/45 backdrop-blur-[3px]"
        onClick={() => onClose(false)}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={pending.description ? descId : undefined}
        className="dialog-in relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_-12px_rgba(26,26,26,0.35)] ring-1 ring-black/5"
      >
        {/* Thin brand accent along the top edge. */}
        <div
          aria-hidden="true"
          className={cn(
            'h-1 w-full',
            tone === 'danger'
              ? 'bg-gradient-to-r from-red-400 via-red-600 to-red-400'
              : 'bg-gradient-to-r from-brand-gold via-brand-maroon to-brand-gold'
          )}
        />
        <div className="p-6 sm:p-7">
          <div className="flex items-start gap-4">
            <div className={cn('grid h-12 w-12 flex-none place-items-center rounded-full ring-8', style.iconWrap)}>
              <Icon size={22} strokeWidth={2} />
            </div>
            <div className="min-w-0 pt-1">
              <h2 id={titleId} className="font-display text-2xl leading-tight text-brand-ink">
                {pending.title}
              </h2>
              {pending.description && (
                <div id={descId} className="mt-2 text-sm leading-relaxed text-brand-muted">
                  {pending.description}
                </div>
              )}
            </div>
          </div>

          <div className="mt-7 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
            <button
              ref={cancelRef}
              type="button"
              onClick={() => onClose(false)}
              className="inline-flex h-11 items-center justify-center rounded-full border border-brand-line bg-white px-6 text-sm font-medium text-brand-ink transition-colors duration-base hover:bg-brand-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
            >
              {pending.cancelLabel ?? 'Cancel'}
            </button>
            <button
              ref={confirmRef}
              type="button"
              onClick={() => onClose(true)}
              className={cn(
                'inline-flex h-11 items-center justify-center rounded-full px-6 text-sm font-semibold transition-[background-color,transform] duration-base active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                style.confirm
              )}
            >
              {pending.confirmLabel ?? (tone === 'danger' ? 'Delete' : 'Confirm')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  const [mounted, setMounted] = useState(false);
  const returnFocus = useRef<HTMLElement | null>(null);

  useEffect(() => setMounted(true), []);

  const confirm = useCallback<ConfirmFn>((options) => {
    returnFocus.current = document.activeElement as HTMLElement | null;
    return new Promise<boolean>((resolve) => {
      setPending((prev) => {
        // A second request supersedes an open one; the first resolves false.
        prev?.resolve(false);
        return { ...options, resolve };
      });
    });
  }, []);

  const close = useCallback((value: boolean) => {
    setPending((prev) => {
      prev?.resolve(value);
      return null;
    });
    // Return focus to whatever opened the dialog.
    requestAnimationFrame(() => returnFocus.current?.focus?.());
  }, []);

  const value = useMemo(() => confirm, [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      {mounted && pending && createPortal(<ConfirmDialog pending={pending} onClose={close} />, document.body)}
    </ConfirmContext.Provider>
  );
}

/**
 * Ask the user to confirm an action. Resolves true on confirm, false on
 * cancel. Falls back to the native dialog if the provider is missing so a
 * destructive action is never performed unconfirmed.
 */
export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  return (
    ctx ??
    ((o: ConfirmOptions) =>
      Promise.resolve(typeof window !== 'undefined' && window.confirm(o.title)))
  );
}
