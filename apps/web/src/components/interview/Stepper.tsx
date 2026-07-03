interface StepperProps {
  steps: readonly string[];
  current: number; // 0-based
}

/** Horizontal step indicator for the setup wizard. */
export function Stepper({ steps, current }: StepperProps) {
  return (
    <ol className="flex items-center gap-2">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={label} className="flex flex-1 items-center gap-2">
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition
                ${
                  done
                    ? 'bg-accent text-white'
                    : active
                      ? 'bg-white/10 text-white ring-2 ring-accent/60'
                      : 'bg-white/5 text-slate-500'
                }`}
            >
              {done ? '✓' : i + 1}
            </span>
            <span
              className={`hidden text-sm sm:block ${active ? 'text-white' : 'text-slate-500'}`}
            >
              {label}
            </span>
            {i < steps.length - 1 && (
              <span className={`mx-1 h-px flex-1 ${done ? 'bg-accent/60' : 'bg-white/10'}`} />
            )}
          </li>
        );
      })}
    </ol>
  );
}
