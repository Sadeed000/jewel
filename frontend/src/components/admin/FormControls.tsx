'use client';

import { cn } from '@/lib/utils';

export function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-admin-body">
        {label}
        {required && <span className="ml-0.5 text-admin-gold-ink">*</span>}
      </span>
      {children}
      {hint && <span className="mt-1.5 block text-xs leading-relaxed text-admin-muted">{hint}</span>}
    </label>
  );
}

const control =
  'w-full rounded-xl border border-admin-line bg-admin-surface px-3.5 py-2.5 text-sm text-admin-ink shadow-[0_1px_2px_rgba(122,82,40,0.05)] outline-none transition-[border-color,box-shadow] duration-base placeholder:text-admin-muted/70 hover:border-admin-line-strong focus:border-admin-gold focus:ring-4 focus:ring-admin-gold/15 disabled:bg-admin-subtle disabled:text-admin-muted';

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(control, props.className)} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(control, 'resize-y leading-relaxed', props.className)} />;
}

export function Select({
  options,
  placeholder,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  options: readonly string[];
  /** Label for an empty leading option, for fields that may be left unset. */
  placeholder?: string;
}) {
  return (
    <select {...props} className={cn(control, 'cursor-pointer capitalize', props.className)}>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o} value={o}>
          {o.replace(/-/g, ' ')}
        </option>
      ))}
    </select>
  );
}

/** Switch-style toggle. */
export function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 transition-colors duration-base',
        checked ? 'border-admin-gold/50 bg-admin-gold-soft/60' : 'border-admin-line bg-admin-surface hover:border-admin-line-strong'
      )}
    >
      <span className="text-sm font-medium text-admin-body">{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span
        aria-hidden="true"
        className={cn(
          'relative h-5 w-9 flex-none rounded-full transition-colors duration-base peer-focus-visible:ring-4 peer-focus-visible:ring-admin-gold/25',
          checked ? 'bg-gradient-to-r from-admin-gold to-[#b48a4f]' : 'bg-admin-line-strong'
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-base ease-premium',
            checked ? 'translate-x-[18px]' : 'translate-x-0.5'
          )}
        />
      </span>
    </label>
  );
}

export function Button({
  variant = 'primary',
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'gold' | 'ghost' | 'danger' }) {
  const styles = {
    primary:
      'bg-gradient-to-b from-[#8e2f3d] to-admin-maroon text-white shadow-admin-maroon hover:brightness-110',
    gold: 'bg-gradient-to-b from-admin-gold-light to-admin-gold text-admin-ink shadow-admin-gold hover:brightness-105',
    ghost: 'border border-admin-line bg-admin-surface text-admin-ink shadow-[0_1px_2px_rgba(122,82,40,0.05)] hover:border-admin-gold/50 hover:bg-admin-gold-soft',
    danger: 'bg-rose-600 text-white hover:bg-rose-700',
  }[variant];

  return (
    <button
      {...props}
      className={cn(
        'inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold tracking-[-0.005em] transition-[background-color,border-color,filter,transform] duration-base active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-admin-gold/25 disabled:cursor-not-allowed disabled:opacity-50',
        styles,
        className
      )}
    />
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-admin-gold-ink">
      {children}
      <span className="h-px flex-1 bg-admin-line" aria-hidden="true" />
    </h4>
  );
}
