import { Outlet } from 'react-router-dom';
import { AppTopBar } from './AppTopBar';

/** Chrome for authenticated, profile-complete pages. */
export function AppLayout() {
  return (
    <div className="min-h-screen">
      <AppTopBar />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <Outlet />
      </main>
    </div>
  );
}
