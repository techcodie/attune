import { Link } from 'react-router-dom';
import { Logo } from '@/components/ui/Logo';

export function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <Logo />
      <div>
        <p className="text-6xl font-extrabold text-white">404</p>
        <p className="mt-2 text-slate-400">This page doesn’t exist.</p>
      </div>
      <Link to="/" className="btn-primary">
        Back to home
      </Link>
    </main>
  );
}
