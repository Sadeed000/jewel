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
      <span className="mb-1.5 block text-sm font-medium text-brand-ink">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-brand-muted">{hint}</span>}
    </label>
  );
}

const control =
  'w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-brand-ink outline-none transition-colors placeholder:text-slate-400 focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/30 disabled:bg-slate-50';

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(control, props.className)} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(control, 'resize-y', props.className)} />;
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
    <select {...props} className={cn(control, 'capitalize', props.className)}>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o} value={o}>
          {o.replace(/-/g, ' ')}
        </option>
      ))}
    </select>
  );
}

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
    <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-slate-300 text-brand-maroon focus:ring-brand-gold"
      />
      <span className="text-sm text-brand-ink">{label}</span>
    </label>
  );
}

export function Button({
  variant = 'primary',
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' }) {
  const styles = {
    primary: 'bg-brand-maroon text-white hover:bg-brand-maroon-light disabled:bg-slate-300',
    ghost: 'border border-slate-300 bg-white text-brand-ink hover:bg-slate-50',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  }[variant];

  return (
    <button
      {...props}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed',
        styles,
        className
      )}
    />
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-xs font-semibold uppercase tracking-[0.15em] text-brand-muted">{children}</h4>
  );
}
