'use client';

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { transition } from '@/lib/motion';

/**
 * The store's single button.
 *
 * Styling comes from the `.btn-*` classes in globals.css, so plain links can
 * share the look without this component. This adds what CSS can't: a loading
 * spinner that keeps the button's width (no layout shift), a brief success
 * tick, and `href` support that renders a Next <Link>.
 *
 *   <Button loading={isPending}>Add to bag</Button>
 *   <Button variant="outline" href="/jewellery">Browse</Button>
 */
export type ButtonVariant = 'primary' | 'outline' | 'secondary' | 'ghost' | 'gold';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  /** Show a tick in place of the label (e.g. right after "Add to bag"). */
  success?: boolean;
  loadingText?: string;
  successText?: string;
  href?: string;
  icon?: ReactNode;
  fullWidth?: boolean;
}

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  outline: 'btn-outline',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  gold: 'btn-gold',
};

const SIZE_CLASS: Record<ButtonSize, string> = {
  sm: 'btn-sm',
  md: 'btn-md',
  lg: 'btn-lg',
};

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-block h-4 w-4 rounded-full border-2 border-current border-r-transparent animate-spin-fast',
        className
      )}
    />
  );
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    success = false,
    loadingText,
    successText,
    href,
    icon,
    fullWidth,
    className,
    children,
    disabled,
    type = 'button',
    ...rest
  },
  ref
) {
  const classes = cn(VARIANT_CLASS[variant], SIZE_CLASS[size], fullWidth && 'w-full', className);

  // The idle label stays in the DOM (invisible) while loading/success so the
  // button never changes width mid-interaction.
  const state: 'idle' | 'loading' | 'success' = loading ? 'loading' : success ? 'success' : 'idle';

  const content = (
    <>
      <span
        className={cn(
          'inline-flex items-center gap-2 transition-opacity duration-fast',
          state !== 'idle' && 'opacity-0'
        )}
      >
        {icon}
        {children}
      </span>
      <AnimatePresence initial={false}>
        {state !== 'idle' && (
          <motion.span
            key={state}
            className="absolute inset-0 inline-flex items-center justify-center gap-2"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={transition.fast}
          >
            {state === 'loading' ? <Spinner /> : <Check size={16} strokeWidth={2.5} />}
            {state === 'loading' ? loadingText : successText}
          </motion.span>
        )}
      </AnimatePresence>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={classes} aria-disabled={disabled || undefined}>
        {content}
      </Link>
    );
  }

  return (
    <button
      ref={ref}
      type={type}
      className={classes}
      disabled={disabled}
      aria-busy={loading || undefined}
      {...rest}
      // Swallow repeat activations (incl. keyboard) while a request is in
      // flight, without using `disabled` — that would dim the button.
      onClick={loading ? (e) => e.preventDefault() : rest.onClick}
    >
      {content}
      {/* Announce state changes to screen readers. */}
      <span className="sr-only" aria-live="polite">
        {loading ? loadingText || 'Loading' : success ? successText || 'Done' : ''}
      </span>
    </button>
  );
});

export default Button;
