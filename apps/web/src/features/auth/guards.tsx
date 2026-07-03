import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { FullScreenLoader } from '@/components/FullScreenLoader';
import { useAuthStore } from './useAuthStore';

/** True while we still don't know if the user is signed in. */
function isResolving(status: string): boolean {
  return status === 'idle' || status === 'loading';
}

/** Blocks a route until the caller is authenticated. */
export function RequireAuth() {
  const { status } = useAuthStore();
  const location = useLocation();

  if (isResolving(status)) return <FullScreenLoader label="Restoring your session…" />;
  if (status !== 'authenticated') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}

/** Requires a *completed profile* — otherwise routes to the profile flow. */
export function RequireProfile() {
  const user = useAuthStore((s) => s.user);
  if (user && !user.hasProfile) return <Navigate to="/profile" replace />;
  return <Outlet />;
}

/** For login/register: bounce already-authenticated users to the dashboard. */
export function RedirectIfAuthed() {
  const { status } = useAuthStore();
  if (isResolving(status)) return <FullScreenLoader />;
  if (status === 'authenticated') return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
