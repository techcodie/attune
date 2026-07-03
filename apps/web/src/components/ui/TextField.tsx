import { forwardRef, type InputHTMLAttributes, useId } from 'react';

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string | undefined;
  hint?: string;
}

/** Labelled input with inline error + hint. The base of every form field. */
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, error, hint, id, className = '', ...rest },
  ref,
) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const describedBy = error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={fieldId} className="text-sm font-medium text-slate-300">
        {label}
      </label>
      <input
        ref={ref}
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`w-full rounded-xl border bg-white/[0.03] px-4 py-2.5 text-slate-100 placeholder:text-slate-600 transition
          focus:outline-none focus:ring-2 focus:ring-accent/60
          ${error ? 'border-rose-500/60' : 'border-white/10 hover:border-white/20'} ${className}`}
        {...rest}
      />
      {error ? (
        <p id={`${fieldId}-error`} className="text-xs text-rose-400">
          {error}
        </p>
      ) : hint ? (
        <p id={`${fieldId}-hint`} className="text-xs text-slate-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
});
