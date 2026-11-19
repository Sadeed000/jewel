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
import { AnimatePresence, motion } from 'framer-motion';
import { Check, X, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { transition } from '@/lib/motion';

/**
 * Toast notifications.
 *
 * Self-contained; mounted once in the root layout.
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
    iconWrap: string;
    bar: string;
  }
> = {
  success: { icon: Check, iconWrap: 'bg-emerald-100 text-emerald-700', bar: 'bg-emerald-500' },
  error: { icon: X, iconWrap: 'bg-red-100 text-brand-maroon', bar: 'bg-brand-maroon' },
  warning: { icon: AlertTriangle, iconWrap: 'bg-amber-100 text-amber-700', bar: 'bg-amber-500' },
  info: { icon: Info, iconWrap: 'bg-brand-cream-dark text-brand-gold-ink', bar: 'bg-brand-gold' },
};

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: number) => void;
}) {
  const style = VARIANT_STYLE[toast.variant];
  const Icon = style.icon;
  const [paused, setPaused] = useState(false);
  const remaining = useRef(toast.duration);
  const startedAt = useRef(Date.now());

  // Auto-dismiss, pausing while hovered so it can be read.
  useEffect(() => {
    if (toast.duration <= 0 || paused) return;
    startedAt.current = Date.now();
    const timer = window.setTimeout(() => onDismiss(toast.id), remaining.current);
    return () => {
      window.clearTimeout(timer);
      remaining.current -= Date.now() - startedAt.current;
    };
  }, [paused, toast.duration, toast.id, onDismiss]);

  return (
    <motion.div
      layout
      role={toast.variant === 'error' ? 'alert' : 'status'}
      aria-live={toast.variant === 'error' ? 'assertive' : 'polite'}
      aria-atomic="true"
      initial={{ opacity: 0, y: -12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 24, scale: 0.96, transition: { duration: 0.18 } }}
      transition={transition.base}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-card bg-white/95 p-4 shadow-lift ring-1 ring-brand-line backdrop-blur"
    >
      <div className={cn('mt-0.5 grid h-7 w-7 flex-none place-items-center rounded-full', style.iconWrap)}>
        <Icon size={14} strokeWidth={3} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-snug text-brand-ink">{toast.message}</p>
        {toast.description && (
          <p className="mt-0.5 text-xs leading-snug text-brand-muted">{toast.description}</p>
        )}
      </div>

      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className="-mr-1 -mt-1 grid h-7 w-7 flex-none place-items-center rounded-full text-brand-muted transition-colors duration-base hover:bg-brand-cream hover:text-brand-ink"
      >
        <X size={14} />
      </button>

      {/* Time-remaining bar */}
      {toast.duration > 0 && (
        <span
          aria-hidden="true"
          className={cn('absolute bottom-0 left-0 h-[2px] w-full origin-left opacity-60', style.bar)}
          style={{
            animation: `toast-progress ${toast.duration}ms linear forwards`,
            animationPlayState: paused ? 'paused' : 'running',
          }}
        />
      )}
    </motion.div>
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

      setToasts((currentToasts) => [...currentToasts, newToast].slice(-MAX_VISIBLE));

      return id;
    },
    []
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      show,
      success: (message, options) => show('success', message, options),
      error: (message, options) => show('error', message, options),
      info: (message, options) => show('info', message, options),
      warning: (message, options) => show('warning', message, options),
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
            <AnimatePresence initial={false}>
              {toasts.map((toast) => (
                <ToastCard key={toast.id} toast={toast} onDismiss={dismiss} />
              ))}
            </AnimatePresence>
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
