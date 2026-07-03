import { useNavigate } from 'react-router-dom';
import { useLogin } from './useAuthMutations';
import { toast } from '@/features/toast/useToastStore';

const DEMO_CREDENTIALS = { email: 'demo@cadence.app', password: 'Demo1234!' };

/**
 * One-click sign-in to the shared demo account (seeded on the server). Lets a
 * reviewer explore a populated dashboard without registering.
 */
export function useDemoLogin() {
  const login = useLogin();
  const navigate = useNavigate();

  const demoLogin = async () => {
    try {
      const result = await login.mutateAsync(DEMO_CREDENTIALS);
      toast.success('Signed in as the demo user.');
      navigate(result.user.hasProfile ? '/dashboard' : '/profile', { replace: true });
    } catch {
      toast.error('The demo is warming up — give it a few seconds and try again.');
    }
  };

  return { demoLogin, isPending: login.isPending };
}
