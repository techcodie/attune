import { useId, useState, type KeyboardEvent } from 'react';

interface TagInputProps {
  label: string;
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  error?: string | undefined;
  hint?: string;
  max?: number;
}

/**
 * Chip-style multi-value input for focus skills. Enter or comma commits a tag;
 * Backspace on an empty field removes the last one.
 */
export function TagInput({
  label,
  value,
  onChange,
  placeholder = 'Type a skill and press Enter',
  error,
  hint,
  max = 12,
}: TagInputProps) {
  const [draft, setDraft] = useState('');
  const fieldId = useId();

  const addTag = (raw: string) => {
    const tag = raw.trim();
    if (!tag || value.length >= max) return;
    if (value.some((t) => t.toLowerCase() === tag.toLowerCase())) return;
    onChange([...value, tag]);
    setDraft('');
  };

  const removeTag = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(draft);
    } else if (e.key === 'Backspace' && !draft && value.length) {
      removeTag(value.length - 1);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={fieldId} className="text-sm font-medium text-slate-300">
        {label}
      </label>
      <div
        className={`flex flex-wrap items-center gap-2 rounded-xl border bg-white/[0.03] px-3 py-2 transition
          focus-within:ring-2 focus-within:ring-accent/60
          ${error ? 'border-rose-500/60' : 'border-white/10'}`}
      >
        {value.map((tag, i) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent/15 px-2.5 py-1 text-sm text-accent-400"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(i)}
              className="text-accent-400/70 transition hover:text-white"
              aria-label={`Remove ${tag}`}
            >
              ✕
            </button>
          </span>
        ))}
        <input
          id={fieldId}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => addTag(draft)}
          placeholder={value.length ? '' : placeholder}
          className="min-w-[8rem] flex-1 bg-transparent px-1 py-1 text-slate-100 placeholder:text-slate-600 focus:outline-none"
        />
      </div>
      {error ? (
        <p className="text-xs text-rose-400">{error}</p>
      ) : hint ? (
        <p className="text-xs text-slate-500">
          {hint} · {value.length}/{max}
        </p>
      ) : null}
    </div>
  );
}
