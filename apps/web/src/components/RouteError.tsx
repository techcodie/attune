import { Link, useRouteError } from 'react-router-dom';
import { Logo } from './ui/Logo';

/**
 * Route-level error boundary. Renders a friendly, recoverable panel — never a
 * stack trace. The technical detail is logged to the console for developers.
 */
export function RouteError() {
  const error = useRouteError();
  // eslint-disable-next-line no-console
  if (error) console.error('Route error:', error);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <Logo />
      <div className="glass max-w-md rounded-2xl p-8">
        <h1 className="text-lg font-semibold text-white">Something went wrong</h1>
        <p className="mt-2 text-sm text-slate-400">
          We hit an unexpected error loading this page. Your data is safe — try again or head back.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button onClick={() => window.location.reload()} className="btn-ghost">
            Reload
          </button>
          <Link to="/dashboard" className="btn-primary">
            Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
