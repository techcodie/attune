import { useId, type SelectHTMLAttributes } from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: readonly SelectOption[];
  error?: string | undefined;
  placeholder?: string;
  hint?: string;
}

/** Labelled native select — accessible, themed, with inline error. */
export function Select({
  label,
  options,
  error,
  placeholder,
  hint,
  id,
  className = '',
  ...rest
}: SelectProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={fieldId} className="text-sm font-medium text-slate-300">
        {label}
      </label>
      <select
        id={fieldId}
        aria-invalid={error ? true : undefined}
        className={`w-full rounded-xl border bg-white/[0.03] px-4 py-2.5 text-slate-100 transition
          focus:outline-none focus:ring-2 focus:ring-accent/60
          ${error ? 'border-rose-500/60' : 'border-white/10 hover:border-white/20'} ${className}`}
        {...rest}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-ink-800">
            {o.label}
          </option>
        ))}
      </select>
      {error ? (
        <p className="text-xs text-rose-400">{error}</p>
      ) : hint ? (
        <p className="text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}
