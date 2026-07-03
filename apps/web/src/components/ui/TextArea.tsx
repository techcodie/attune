import { useId, type TextareaHTMLAttributes } from 'react';

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string | undefined;
  hint?: string;
}

/** Labelled multiline input matching the TextField styling. */
export function TextArea({ label, error, hint, id, className = '', ...rest }: TextAreaProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={fieldId} className="text-sm font-medium text-slate-300">
        {label}
      </label>
      <textarea
        id={fieldId}
        aria-invalid={error ? true : undefined}
        className={`w-full resize-none rounded-xl border bg-white/[0.03] px-4 py-2.5 text-slate-100 placeholder:text-slate-600 transition
          focus:outline-none focus:ring-2 focus:ring-accent/60
          ${error ? 'border-rose-500/60' : 'border-white/10 hover:border-white/20'} ${className}`}
        {...rest}
      />
      {error ? (
        <p className="text-xs text-rose-400">{error}</p>
      ) : hint ? (
        <p className="text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}
