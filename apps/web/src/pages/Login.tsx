import { Link, useNavigate } from 'react-router-dom';
import { loginSchema } from '@cadence/types';
import { AuthShell } from '@/components/AuthShell';
import { TextField } from '@/components/ui/TextField';
import { PasswordField } from '@/components/ui/PasswordField';
import { Button } from '@/components/ui/Button';
import { useZodForm } from '@/hooks/useZodForm';
import { useLogin } from '@/features/auth/useAuthMutations';
import { useDemoLogin } from '@/features/auth/useDemoLogin';
import { toast } from '@/features/toast/useToastStore';

export function Login() {
  const navigate = useNavigate();
  const login = useLogin();
  const demo = useDemoLogin();

  const form = useZodForm({
    schema: loginSchema,
    initial: { email: '', password: '' },
    onSubmit: async (values) => {
      const result = await login.mutateAsync(values);
      toast.success('Signed in.');
      // Send users straight to profile completion if they never finished it.
      navigate(result.user.hasProfile ? '/dashboard' : '/profile', { replace: true });
    },
  });

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Pick up where you left off."
      footer={
        <>
          New to Attune?{' '}
          <Link to="/register" className="font-medium text-accent-400 hover:text-accent-500">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={form.handleSubmit} className="flex flex-col gap-4" noValidate>
        <TextField
          label="Email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          value={form.values.email}
          onChange={(e) => form.setValue('email', e.target.value)}
          error={form.errors.email}
        />
        <PasswordField
          label="Password"
          placeholder="Your password"
          autoComplete="current-password"
          value={form.values.password}
          onChange={(e) => form.setValue('password', e.target.value)}
          error={form.errors.password}
        />

        {form.formError && <p className="text-sm text-rose-400">{form.formError}</p>}

        <Button type="submit" fullWidth loading={form.isSubmitting} className="mt-2">
          Sign in
        </Button>
      </form>

      <div className="mt-6 flex items-center gap-3 text-xs text-slate-600">
        <span className="h-px flex-1 bg-white/10" />
        or
        <span className="h-px flex-1 bg-white/10" />
      </div>

      <Button
        variant="ghost"
        fullWidth
        className="mt-4"
        loading={demo.isPending}
        onClick={demo.demoLogin}
      >
        Try the demo account →
      </Button>
      <p className="mt-2 text-center text-xs text-slate-600">
        No sign-up — explore a populated dashboard instantly.
      </p>
    </AuthShell>
  );
}
