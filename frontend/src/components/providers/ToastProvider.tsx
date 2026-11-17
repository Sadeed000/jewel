'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { Check, X, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Toast notifications.
 *
 * Self-contained with no additional dependency.
 * Mounted once in the root layout.
 *
 * Usage:
 *
 * const toast = useToast();
 *
 * toast.success('Added to your bag');
 * toast.error('Something went wrong');
 * toast.info('Your profile was updated');
 * toast.warning('Please check the entered details');
 */

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: number;
  variant: ToastVariant;
  message: string;
  description?: string;
  duration: number;
}

interface ToastOptions {
  description?: string;
  duration?: number;
}

interface ToastContextValue {
  show: (
    variant: ToastVariant,
    message: string,
    options?: ToastOptions
  ) => number;
  success: (message: string, options?: ToastOptions) => number;
  error: (message: string, options?: ToastOptions) => number;
  info: (message: string, options?: ToastOptions) => number;
  warning: (message: string, options?: ToastOptions) => number;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const MAX_VISIBLE = 4;
const DEFAULT_DURATION = 4000;

const VARIANT_STYLE: Record<
  ToastVariant,
  {
    icon: typeof Check;
    ring: string;
    iconWrap: string;
  }
> = {
  success: {
    icon: Check,
    ring: 'border-l-green-600',
    iconWrap: 'bg-green-100 text-green-700',
  },
  error: {
    icon: X,
    ring: 'border-l-brand-maroon',
    iconWrap: 'bg-red-100 text-brand-maroon',
  },
  warning: {
    icon: AlertTriangle,
    ring: 'border-l-amber-500',
    iconWrap: 'bg-amber-100 text-amber-700',
  },
  info: {
    icon: Info,
    ring: 'border-l-brand-gold-dark',
    iconWrap: 'bg-brand-cream text-brand-gold-dark',
  },
};

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: number) => void;
}) {
  const [leaving, setLeaving] = useState(false);
  const [entered, setEntered] = useState(false);

  const style = VARIANT_STYLE[toast.variant];
  const Icon = style.icon;

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setEntered(true);
    });

    return () => cancelAnimationFrame(frame);
  }, []);

  const dismiss = useCallback(() => {
    if (leaving) return;

    setLeaving(true);

    const timer = window.setTimeout(() => {
      onDismiss(toast.id);
    }, 200);

    return () => window.clearTimeout(timer);
  }, [leaving, onDismiss, toast.id]);

  useEffect(() => {
    if (toast.duration <= 0) return;

    const timer = window.setTimeout(() => {
      setLeaving(true);

      window.setTimeout(() => {
        onDismiss(toast.id);
      }, 200);
    }, toast.duration);

    return () => window.clearTimeout(timer);
  }, [toast.duration, toast.id, onDismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={cn(
        'pointer-events-auto flex w-full items-start gap-3 rounded-lg bg-white p-4 shadow-lg',
        'border border-brand-cream-dark border-l-4',
        'transition-all duration-200 ease-out',
        style.ring,
        entered && !leaving
          ? 'translate-x-0 scale-100 opacity-100'
          : '-translate-x-3 scale-95 opacity-0'
      )}
    >
      <div
        className={cn(
          'mt-0.5 grid h-6 w-6 flex-none place-items-center rounded-full',
          style.iconWrap
        )}
      >
        <Icon size={14} strokeWidth={3} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-snug text-brand-ink">
          {toast.message}
        </p>

        {toast.description && (
          <p className="mt-0.5 text-xs leading-snug text-brand-muted">
            {toast.description}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss notification"
        className="-mr-1 -mt-0.5 flex-none p-1 text-brand-muted transition-colors hover:text-brand-ink"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export default function ToastProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [mounted, setMounted] = useState(false);

  const nextId = useRef(1);

  useEffect(() => {
    setMounted(true);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((currentToasts) =>
      currentToasts.filter((toast) => toast.id !== id)
    );
  }, []);

  const show = useCallback(
    (
      variant: ToastVariant,
      message: string,
      options: ToastOptions = {}
    ) => {
      const id = nextId.current++;

      const newToast: Toast = {
        id,
        variant,
        message,
        description: options.description,
        duration: options.duration ?? DEFAULT_DURATION,
      };

      setToasts((currentToasts) => {
        const updatedToasts = [...currentToasts, newToast];

        return updatedToasts.slice(-MAX_VISIBLE);
      });

      return id;
    },
    []
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      show,

      success: (message, options) => {
        return show('success', message, options);
      },

      error: (message, options) => {
        return show('error', message, options);
      },

      info: (message, options) => {
        return show('info', message, options);
      },

      warning: (message, options) => {
        return show('warning', message, options);
      },

      dismiss,
    }),
    [show, dismiss]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}

      {mounted &&
        createPortal(
          <div
            className={cn(
              'pointer-events-none fixed right-4 top-4 z-[100]',
              'flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2',
              'sm:right-6 sm:top-6'
            )}
          >
            {toasts.map((toast) => (
              <ToastCard
                key={toast.id}
                toast={toast}
                onDismiss={dismiss}
              />
            ))}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
}

/**
 * Access the toast API.
 *
 * A no-operation fallback is returned when ToastProvider is missing,
 * so the application does not crash.
 */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);

  const fallback = useMemo<ToastContextValue>(
    () => ({
      show: () => 0,
      success: () => 0,
      error: () => 0,
      info: () => 0,
      warning: () => 0,
      dismiss: () => undefined,
    }),
    []
  );

  return context ?? fallback;
}