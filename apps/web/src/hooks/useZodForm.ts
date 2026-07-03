import { useCallback, useState, type FormEvent } from 'react';
import type { ZodTypeAny, z } from 'zod';

export type FieldErrors<T> = Partial<Record<keyof T, string>>;

interface UseZodFormArgs<S extends ZodTypeAny> {
  schema: S;
  initial: z.infer<S>;
  onSubmit: (values: z.infer<S>) => Promise<void> | void;
}

/**
 * A tiny, dependency-free form engine built on the *shared* Zod schemas.
 * Validates on submit, exposes per-field errors, and manages the submitting
 * flag so buttons can disable themselves. Deliberately not react-hook-form —
 * one small hook we own beats a form framework we'd barely use.
 */
export function useZodForm<S extends ZodTypeAny>({
  schema,
  initial,
  onSubmit,
}: UseZodFormArgs<S>) {
  type Values = z.infer<S>;
  const [values, setValues] = useState<Values>(initial);
  const [errors, setErrors] = useState<FieldErrors<Values>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);

  const setValue = useCallback(<K extends keyof Values>(key: K, value: Values[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    // Clear a field's error as soon as the user edits it.
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  }, []);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setFormError(null);

      const parsed = schema.safeParse(values);
      if (!parsed.success) {
        const fieldErrors: FieldErrors<Values> = {};
        for (const issue of parsed.error.issues) {
          const key = issue.path[0] as keyof Values | undefined;
          if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
        }
        setErrors(fieldErrors);
        return;
      }

      setErrors({});
      setSubmitting(true);
      try {
        await onSubmit(parsed.data as Values);
      } catch (err) {
        setFormError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setSubmitting(false);
      }
    },
    [schema, values, onSubmit],
  );

  return {
    values,
    errors,
    formError,
    isSubmitting,
    setValue,
    setValues,
    setFormError,
    handleSubmit,
  };
}
