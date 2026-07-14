import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authApi } from './auth.api';
import { useAuthStore } from './useAuthStore';
import { toast } from '@/features/toast/useToastStore';

const DEMO_CREDENTIALS = { email: 'demo@cadence.app', password: 'Demo1234!' };

/**
 * One-click sign-in to the shared demo account (seeded on the server). Lets a
 * reviewer explore a populated dashboard without registering.
 *
 * The free-tier backend can be cold (spun down after idle), so the call gets a
 * 70s timeout to ride out the ~50s wake-up and retries once — by the second
 * attempt the server is warm. The reviewer just waits a beat instead of hitting
 * a "warming up" error.
 */
export function useDemoLogin() {
  const setSession = useAuthStore((s) => s.setSession);
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: () => authApi.login(DEMO_CREDENTIALS, { timeoutMs: 70_000 }),
    // The first attempt wakes a cold backend; a few short retries then land on
    // the now-warm server so a single click succeeds instead of erroring.
    retry: 3,
    retryDelay: 3_000,
    onMutate: () => {
      toast.info('Waking the demo server — this can take up to a minute on the first try…');
    },
    onSuccess: (result) => {
      setSession(result);
      toast.success('Signed in as the demo user.');
      navigate(result.user.hasProfile ? '/dashboard' : '/profile', { replace: true });
    },
    onError: () => {
      toast.error('The demo server is still waking up — give it a few seconds and try again.');
    },
  });

  return { demoLogin: () => mutation.mutate(), isPending: mutation.isPending };
}
