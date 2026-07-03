import { useNavigate } from 'react-router-dom';
import { Logo } from './ui/Logo';
import { useAuthStore } from '@/features/auth/useAuthStore';
import { toast } from '@/features/toast/useToastStore';

/** Initials avatar from a full name (e.g. "Ada Lovelace" → "AL"). */
function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

export function AppTopBar() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const onLogout = async () => {
    await logout();
    toast.info('Signed out.');
    navigate('/login', { replace: true });
  };

  return (
    <header className="sticky top-0 z-30 border-b border-white/5 bg-ink-950/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Logo />
        <div className="flex items-center gap-3">
          {user && (
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-accent to-cyanic text-sm font-semibold text-ink-950">
                {initials(user.fullName)}
              </span>
              <span className="hidden text-sm text-slate-300 sm:block">{user.fullName}</span>
            </div>
          )}
          <button
            onClick={onLogout}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-slate-300 transition hover:bg-white/5"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
