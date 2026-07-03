import { Suspense, lazy, type ComponentType } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { FullScreenLoader } from '@/components/FullScreenLoader';
import { RouteError } from '@/components/RouteError';
import { RedirectIfAuthed, RequireAuth, RequireProfile } from '@/features/auth/guards';

/**
 * Wrap a lazily-imported named page in a Suspense boundary. Route-level code
 * splitting keeps the initial bundle small — the interview room, report, and
 * setup wizard (with their charts and voice code) only load when visited.
 */
function lazyPage(factory: () => Promise<Record<string, ComponentType>>, name: string) {
  const Component = lazy(async () => ({ default: (await factory())[name]! }));
  return (
    <Suspense fallback={<FullScreenLoader />}>
      <Component />
    </Suspense>
  );
}

const Landing = () => lazyPage(() => import('@/pages/Landing'), 'Landing');
const Login = () => lazyPage(() => import('@/pages/Login'), 'Login');
const Register = () => lazyPage(() => import('@/pages/Register'), 'Register');
const CompleteProfile = () => lazyPage(() => import('@/pages/CompleteProfile'), 'CompleteProfile');
const Dashboard = () => lazyPage(() => import('@/pages/Dashboard'), 'Dashboard');
const NewInterview = () => lazyPage(() => import('@/pages/NewInterview'), 'NewInterview');
const InterviewDetail = () => lazyPage(() => import('@/pages/InterviewDetail'), 'InterviewDetail');
const InterviewRoom = () => lazyPage(() => import('@/pages/InterviewRoom'), 'InterviewRoom');
const InterviewReport = () => lazyPage(() => import('@/pages/InterviewReport'), 'InterviewReport');
const NotFound = () => lazyPage(() => import('@/pages/NotFound'), 'NotFound');

/**
 * Route table with layered guards:
 *   RedirectIfAuthed — keeps signed-in users out of login/register
 *   RequireAuth      — gates everything private; waits out session bootstrap
 *   RequireProfile   — forces profile completion before the app proper
 */
export const router: ReturnType<typeof createBrowserRouter> = createBrowserRouter([
  { path: '/', element: Landing(), errorElement: <RouteError /> },

  {
    element: <RedirectIfAuthed />,
    errorElement: <RouteError />,
    children: [
      { path: '/login', element: Login() },
      { path: '/register', element: Register() },
    ],
  },

  {
    element: <RequireAuth />,
    errorElement: <RouteError />,
    children: [
      { path: '/profile', element: CompleteProfile() },
      {
        element: <RequireProfile />,
        children: [
          {
            element: <AppLayout />,
            children: [
              { path: '/dashboard', element: Dashboard() },
              { path: '/interviews/new', element: NewInterview() },
              { path: '/interviews/:id', element: InterviewDetail() },
            ],
          },
          { path: '/interviews/:id/room', element: InterviewRoom() },
          { path: '/interviews/:id/report', element: InterviewReport() },
        ],
      },
    ],
  },

  { path: '*', element: NotFound() },
]);
