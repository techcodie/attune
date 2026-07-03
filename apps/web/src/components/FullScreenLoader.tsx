import { Logo } from './ui/Logo';
import { Spinner } from './ui/Spinner';

/** Shown while the session is being restored on a cold load. */
export function FullScreenLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6">
      <Logo />
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Spinner />
        {label}
      </div>
    </div>
  );
}
