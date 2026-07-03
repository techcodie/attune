import { useState, type InputHTMLAttributes } from 'react';
import { TextField } from './TextField';

interface PasswordFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  error?: string | undefined;
  hint?: string;
}

/** Password input with a show/hide toggle layered over the shared TextField. */
export function PasswordField({ label, error, hint, ...rest }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <TextField
        label={label}
        error={error}
        hint={hint}
        type={visible ? 'text' : 'password'}
        className="pr-12"
        {...rest}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        // Offset from the top accounts for the label above the input.
        className="absolute right-3 top-[38px] text-xs font-medium text-slate-500 transition hover:text-slate-200"
        aria-label={visible ? 'Hide password' : 'Show password'}
        tabIndex={-1}
      >
        {visible ? 'Hide' : 'Show'}
      </button>
    </div>
  );
}
